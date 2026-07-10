Local AI proxy for development

Usage
- Install dependencies: `npm install` (run inside the `server` folder)
- Start: `npm start` (defaults to port 3001)

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

The React app calls `/api/ai/generate` for development when `VITE_USE_LOCAL_MOCK=true`.
