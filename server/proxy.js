const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const LOCAL_CMD = process.env.LOCAL_MODEL_CMD || '';
const MODEL_TIMEOUT = parseInt(process.env.MODEL_TIMEOUT_SECONDS || '60', 10); // seconds

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
        return res.json({ text: out });
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
  return res.json({ text });
});

app.listen(PORT, () => console.log(`Local AI proxy running on http://localhost:${PORT}`));
