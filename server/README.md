Local AI proxy for development

Usage
- Install dependencies: `npm install` (run inside the `server` folder)
- Start: `npm start` (defaults to port 3001)

Real AI providers
- The proxy can call a real model API when credentials are configured.
- Provider priority: `GitHub Models` -> `Azure OpenAI` -> `OpenAI` -> `LOCAL_MODEL_CMD` -> `mock`.

GitHub Models setup (Copilot ecosystem)
- `GITHUB_MODELS_TOKEN=...`
- Optional: `GITHUB_MODELS_MODEL=gpt-4o-mini`
- Optional: `GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com/chat/completions`

OpenAI setup
- `OPENAI_API_KEY=...`
- Optional: `OPENAI_MODEL=gpt-4o-mini`

Azure OpenAI setup
- `AZURE_OPENAI_API_KEY=...`
- `AZURE_OPENAI_ENDPOINT=https://<resource-name>.openai.azure.com`
- `AZURE_OPENAI_DEPLOYMENT=<deployment-name>`
- Optional: `AZURE_OPENAI_API_VERSION=2024-10-21`

Health check
- `GET /api/ai/health`
- Returns active mode (`github-models`, `azure-openai`, `openai`, `local-cli`, `mock`) and whether a real provider is active.

By default the server returns a simple mock response. To connect to a local model CLI, set the `LOCAL_MODEL_CMD` environment variable to the executable and arguments.

Supported patterns:
- `LOCAL_MODEL_CMD="C:\\path\\to\\gpt4all.exe --model C:\\models\\gpt4all.bin"`
- `LOCAL_MODEL_CMD="C:\\path\\to\\llama.exe --model C:\\models\\mymodel.bin --prompt {{prompt}}"`
- `LOCAL_MODEL_CMD="C:\\path\\to\\llama.exe --model C:\\models\\mymodel.bin --stdin {{stdin}}"`

If `{{prompt}}` appears in the command, it is replaced by the request prompt. If `{{stdin}}` appears, the prompt is sent through stdin. Otherwise the proxy appends `--prompt <prompt>` automatically.


Cache
- The proxy has an in-memory cache. Configure via environment variables:
	- `CACHE_TTL_SECONDS` (default `300`) — TTL for cache entries in seconds.
	- `CACHE_MAX_ENTRIES` (default `200`) — maximum number of cached prompts.

The React app calls `/api/ai/generate` through Vite proxy in development.
