const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// Load env vars from server/.env and root/.env when present.
loadEnvFile(path.resolve(__dirname, '.env'));
loadEnvFile(path.resolve(__dirname, '..', '.env'));

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const LOCAL_CMD = process.env.LOCAL_MODEL_CMD || '';
const MODEL_TIMEOUT = parseInt(process.env.MODEL_TIMEOUT_SECONDS || '60', 10); // seconds
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GITHUB_MODELS_TOKEN = process.env.GITHUB_MODELS_TOKEN || '';
const GITHUB_MODELS_MODEL = process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini';
const GITHUB_MODELS_ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || 'https://models.inference.ai.azure.com/chat/completions';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || '';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

// Simple in-memory cache with TTL and max entries
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10); // seconds
const CACHE_MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES || '200', 10);
const cache = new Map(); // key -> { text, expiresAt }
const cacheKeys = [];

function cacheKeyForPrompt(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

function parseCommandString(commandLine) {
  const matches = commandLine.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return matches.map(part => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return part.slice(1, -1);
    }
    return part;
  });
}

function buildLocalModelInvocation(prompt) {
  const parts = parseCommandString(LOCAL_CMD);
  const sendViaStdin = parts.includes('{{stdin}}');
  const processed = parts
    .filter(part => part !== '{{stdin}}')
    .map(part => part === '{{prompt}}' ? prompt : part);
  if (!processed.some(part => part === prompt)) {
    processed.push('--prompt', prompt);
  }
  return {
    cmd: processed[0],
    args: processed.slice(1),
    stdin: sendViaStdin ? prompt : null
  };
}

function getCached(prompt) {
  const key = cacheKeyForPrompt(prompt);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    const idx = cacheKeys.indexOf(key);
    if (idx !== -1) cacheKeys.splice(idx, 1);
    return null;
  }
  return entry.text;
}

function setCached(prompt, text) {
  const key = cacheKeyForPrompt(prompt);
  if (!cache.has(key)) {
    cacheKeys.push(key);
    while (cacheKeys.length > CACHE_MAX_ENTRIES) {
      const old = cacheKeys.shift();
      cache.delete(old);
    }
  }
  cache.set(key, { text, expiresAt: Date.now() + CACHE_TTL * 1000 });
}

function simpleMockResponse(prompt) {
  // intenta extraer un ID y escenario para generar una respuesta plausible
  const idMatch = prompt.match(/ID:\s*(TC[-\w\d]*)/i);
  const baseId = (idMatch && idMatch[1]) || `TC-XX-LOCAL`;
  const suggestedId = baseId.replace(/TC-/, 'TC-').concat('-LOCAL');
  const steps = [
    'Ingresar al sistema con un usuario válido.',
    'Navegar hasta la pantalla principal del módulo y abrir el registro objetivo.',
    'Realizar la acción descrita en el caso (ej. modificar/guardar).',
    'Verificar mensajes y estados resultantes.',
    'Confirmar que el registro quedó actualizado correctamente.'
  ];
  const result = 'El sistema procesa la operación correctamente, el registro queda actualizado y no aparecen errores visibles.';
  return `ID SUGERIDO: ${suggestedId}\nPASOS:\n${steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\nRESULTADO ESPERADO:\n${result}`;
}

function postJson(url, headers, body, timeoutMs = MODEL_TIMEOUT * 1000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      method: 'POST',
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: `${parsed.pathname}${parsed.search}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
      timeout: timeoutMs,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk.toString());
      res.on('end', () => {
        let parsedBody = null;
        try { parsedBody = raw ? JSON.parse(raw) : null; } catch (e) { parsedBody = { raw }; }
        resolve({ status: res.statusCode || 500, body: parsedBody, raw });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error(`Upstream timeout after ${timeoutMs}ms`)));
    req.write(data);
    req.end();
  });
}

function buildSystemPrompt() {
  return [
    'Actua como experto senior en QA funcional.',
    'Tu tarea es mejorar un caso de prueba para hacerlo reproducible y robusto.',
    'Devuelve SOLO JSON valido con esta forma exacta:',
    '{"suggestedId":"...","steps":["..."],"expectedResult":"..."}',
    'No agregues markdown, ni texto extra, ni comentarios.'
  ].join(' ');
}

function normalizeRealModelOutput(modelText) {
  const text = String(modelText || '').trim();
  if (!text) return simpleMockResponse('');
  try {
    const asJson = JSON.parse(text);
    if (asJson && typeof asJson === 'object') {
      const suggestedId = String(asJson.suggestedId || asJson.id || 'TC-XX-REAL').trim();
      const steps = Array.isArray(asJson.steps) ? asJson.steps.map(s => String(s).trim()).filter(Boolean) : [];
      const expectedResult = String(asJson.expectedResult || asJson.result || '').trim();
      if (suggestedId && steps.length && expectedResult) {
        return JSON.stringify({ suggestedId, steps, expectedResult });
      }
    }
  } catch (e) {
    // Not JSON: return raw text to be parsed by frontend fallback parser.
  }
  return text;
}

async function generateWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) return null;
  const payload = {
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: prompt }
    ]
  };

  const response = await postJson('https://api.openai.com/v1/chat/completions', {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  }, payload);

  if (response.status < 200 || response.status >= 300) {
    const detail = response.body?.error?.message || response.raw || `OpenAI HTTP ${response.status}`;
    throw new Error(detail);
  }

  const text = response.body?.choices?.[0]?.message?.content || '';
  return normalizeRealModelOutput(text);
}

async function generateWithGitHubModels(prompt) {
  if (!GITHUB_MODELS_TOKEN) return null;
  const payload = {
    model: GITHUB_MODELS_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: prompt }
    ]
  };

  const response = await postJson(GITHUB_MODELS_ENDPOINT, {
    Authorization: `Bearer ${GITHUB_MODELS_TOKEN}`,
  }, payload);

  if (response.status < 200 || response.status >= 300) {
    const detail = response.body?.error?.message || response.raw || `GitHub Models HTTP ${response.status}`;
    throw new Error(detail);
  }

  const text = response.body?.choices?.[0]?.message?.content || '';
  return normalizeRealModelOutput(text);
}

async function generateWithAzureOpenAI(prompt) {
  if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT) return null;
  const endpoint = AZURE_OPENAI_ENDPOINT.replace(/\/$/, '');
  const url = `${endpoint}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${encodeURIComponent(AZURE_OPENAI_API_VERSION)}`;
  const payload = {
    temperature: 0.2,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: prompt }
    ]
  };

  const response = await postJson(url, {
    'api-key': AZURE_OPENAI_API_KEY,
  }, payload);

  if (response.status < 200 || response.status >= 300) {
    const detail = response.body?.error?.message || response.raw || `Azure OpenAI HTTP ${response.status}`;
    throw new Error(detail);
  }

  const text = response.body?.choices?.[0]?.message?.content || '';
  return normalizeRealModelOutput(text);
}

function getProviderMode() {
  if (GITHUB_MODELS_TOKEN) return 'github-models';
  if (AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT) return 'azure-openai';
  if (OPENAI_API_KEY) return 'openai';
  if (LOCAL_CMD) return 'local-cli';
  return 'mock';
}

app.get('/api/ai/health', (req, res) => {
  const mode = getProviderMode();
  return res.json({
    ok: true,
    mode,
    hasRealAI: mode === 'github-models' || mode === 'openai' || mode === 'azure-openai',
    model: mode === 'github-models'
      ? GITHUB_MODELS_MODEL
      : (mode === 'openai' ? OPENAI_MODEL : (mode === 'azure-openai' ? AZURE_OPENAI_DEPLOYMENT : null)),
    providersConfigured: {
      githubModels: Boolean(GITHUB_MODELS_TOKEN),
      azureOpenAI: Boolean(AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT),
      openAI: Boolean(OPENAI_API_KEY),
      localCli: Boolean(LOCAL_CMD),
    },
    envSourcesChecked: ['server/.env', '.env (raiz)', 'variables de entorno del proceso'],
  });
});

app.post('/api/ai/generate', async (req, res) => {
  const prompt = String(req.body?.prompt || req.body?.text || '');
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  // Check cache
  try {
    const cached = getCached(prompt);
    if (cached) return res.json({ text: cached, cached: true });
  } catch (e) {
    console.warn('Cache error', e?.message || e);
  }

  // Preferencia: proveedor real por API (GitHub Models / Azure OpenAI / OpenAI), si hay credenciales.
  try {
    const githubText = await generateWithGitHubModels(prompt);
    if (githubText) {
      setCached(prompt, githubText);
      return res.json({ text: githubText, provider: 'github-models' });
    }

    const azureText = await generateWithAzureOpenAI(prompt);
    if (azureText) {
      setCached(prompt, azureText);
      return res.json({ text: azureText, provider: 'azure-openai' });
    }

    const openAiText = await generateWithOpenAI(prompt);
    if (openAiText) {
      setCached(prompt, openAiText);
      return res.json({ text: openAiText, provider: 'openai' });
    }
  } catch (e) {
    console.error('Real AI provider failed:', e?.message || e);
  }

  // Si se configuró un comando local para un modelo (ejecutable CLI), lo usamos
  if (LOCAL_CMD) {
    try {
      const invocation = buildLocalModelInvocation(prompt);
      const child = spawn(invocation.cmd, invocation.args, { stdio: ['pipe', 'pipe', 'pipe'], timeout: MODEL_TIMEOUT * 1000 });
      let out = '';
      let err = '';
      let timedOut = false;

      child.stdout.on('data', d => out += d.toString());
      child.stderr.on('data', d => err += d.toString());
      child.on('error', e => {
        if (!timedOut) res.status(500).json({ error: e.message });
      });
      child.on('close', code => {
        if (timedOut) return;
        if (code !== 0) return res.status(500).json({ error: err || `Model process exited ${code}` });
        setCached(prompt, out);
        return res.json({ text: out, provider: 'local-cli' });
      });
      child.on('exit', (code, signal) => {
        if (signal === 'SIGTERM' || signal === 'SIGKILL') {
          timedOut = true;
          return res.status(500).json({ error: `Model process timed out after ${MODEL_TIMEOUT}s` });
        }
      });

      if (invocation.stdin !== null) {
        child.stdin.write(invocation.stdin);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      return;
    } catch (e) {
      console.error('Error running local model command:', e.message || e);
    }
  }

  // Fallback: respuesta mock simple
  const text = simpleMockResponse(prompt);
  try { setCached(prompt, text); } catch (e) { /* ignore cache errors */ }
  return res.json({ text, provider: 'mock' });
});

app.listen(PORT, () => console.log(`Local AI proxy running on http://localhost:${PORT}`));
