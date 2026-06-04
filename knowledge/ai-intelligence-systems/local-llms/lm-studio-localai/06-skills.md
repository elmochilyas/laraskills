# Skills

## Skill 1: Configure LM Studio and LocalAI as drop-in local LLM providers for Laravel

### Purpose
Set up LM Studio (GUI-based) or LocalAI (Docker-native) as OpenAI-compatible local API endpoints for Laravel AI SDK development, with persistent model storage and cross-container network accessibility for Docker-based development environments.

### When To Use
- Use LM Studio on Windows/macOS when you prefer GUI-based model management
- Use LocalAI when you want Docker-native AI infrastructure integrated with your stack
- Use when you need an OpenAI-compatible API endpoint for local development
- Use as alternatives when Ollama doesn't meet specific requirements (e.g., LocalAI's multi-modal support)
- Use when you need to test with specific model formats (GGUF, GPTQ, EXL2)

### When NOT To Use
- Do NOT use LM Studio for production or server deployments (it's a desktop GUI app)
- Do NOT use LocalAI without persistent volume configuration for model cache
- Do NOT use either when Ollama meets your needs (Ollama is simpler and better supported)
- Do NOT use on CI/CD environments without pre-downloaded models

### Prerequisites
- LM Studio installed (Windows/macOS) or LocalAI Docker image pulled
- Model file downloaded (via LM Studio's model browser or LocalAI YAML config)
- Laravel AI SDK configured to use OpenAI-compatible base URL
- Docker (for LocalAI) or WSL (for LM Studio with Docker-on-Windows)
- Network access between Laravel app and the inference service

### Inputs
- Local API endpoint URL (e.g., `http://localhost:1234` for LM Studio, `http://localhost:8080` for LocalAI)
- Model name to use
- OpenAI-compatible API configuration (base URL replacement)

### Workflow
1. Install and start LM Studio (GUI) or LocalAI (Docker):
   - LM Studio: download from lmstudio.ai, browse and download a model, start API server from UI
   - LocalAI: `docker run -p 8080:8080 localai/localai:latest-ubuntu` or use docker-compose with volume
2. For LocalAI, configure persistent model cache:
   ```yaml
   volumes:
     - localai-models:/tmp/models
   environment:
     - LocalAI_MODELS_PATH=/tmp/models
   ```
3. For LM Studio with Docker-on-WSL, bind to `0.0.0.0` (not `127.0.0.1`):
   - Settings → "Serve on all interfaces" → port 1234
4. Configure Laravel AI SDK to use the OpenAI-compatible local endpoint:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_BASE=http://localhost:1234/v1
   OPENAI_MODEL=your-model-name
   ```
5. Set no API key or a placeholder key (local endpoints don't require authentication)
6. Test that chat completions work through the local endpoint
7. Verify streaming, tool calling, and other features if needed

### Validation Checklist
- [ ] Local endpoint responds on the configured port
- [ ] Laravel AI SDK connects to the local endpoint via OpenAI-compatible API
- [ ] Chat completions return valid responses
- [ ] Streaming works (if needed for development)
- [ ] For LocalAI: model cache persists across container restarts
- [ ] For LM Studio with Docker: Docker containers can reach LM Studio (not blocked by localhost binding)
- [ ] Switching to production OpenAI endpoint works by changing base URL
- [ ] Model downloads are persisted (not re-downloaded on restart)
- [ ] Performance is acceptable for development workflow

### Common Failures
- **Docker can't reach LM Studio**: LM Studio bound to `127.0.0.1`, Docker container on separate network — use `0.0.0.0`
- **LocalAI model re-download**: No persistent volume — container restart triggers 30-minute model download
- **API base mismatch**: Using wrong URL path (`/v1/chat/completions` vs. `/chat/completions`) — check endpoint format
- **Model not found**: Model name in config doesn't match loaded model — check LM Studio/Model list
- **CORS errors**: LM Studio's API may not have CORS headers for browser-based development

### Decision Points
- **LM Studio vs. LocalAI**: LM Studio for GUI-driven local dev (Windows/macOS), LocalAI for Docker-based server infrastructure
- **Model source**: LM Studio model browser (curated list) vs. Hugging Face (full selection)
- **GPU configuration**: LM Studio auto-detects GPU; LocalAI requires explicit CUDA/Metal Docker images
- **API compatibility level**: Basic chat may work but advanced features (vision, embeddings) may differ

### Performance Considerations
- Local inference is 10-100x slower than cloud API — acceptable for development only
- GPU acceleration is critical — CPU-only inference is very slow (>30s per response)
- LM Studio uses GPU by default; LocalAI requires GPU-enabled Docker image
- Model size affects performance significantly — use 7B-8B models for development
- Quantized models (Q4_K_M) offer good speed/quality tradeoff for development

### Security Considerations
- Local endpoints have no authentication — bind to localhost only for LM Studio
- LocalAI API should not be exposed to the internet without authentication
- Local processing keeps data on the machine — privacy benefit for sensitive development
- LM Studio with `0.0.0.0` binding on Windows exposes to local network — ensure trusted network
- Model files are large binaries — verify source integrity when downloading

### Related Rules
- R1: Always configure LocalAI with a persistent model cache volume to avoid re-download on restart
- R2: Never use LM Studio's default HTTP server binding (localhost) for Docker-on-WSL access

### Related Skills
- Integrate Ollama for local LLM inference in Laravel
- Set up Docker Sail AI infrastructure with Ollama and pgvector
- Implement dev-to-prod provider switching strategy
- Select and quantize local models for hardware constraints

### Success Criteria
- Local inference works as an OpenAI-compatible drop-in replacement for development
- Model cache persists across restarts (no re-download for either LM Studio or LocalAI)
- Docker containers can reach the local inference service (for Docker-based dev)
- Switching to cloud OpenAI endpoint requires only changing the base URL
- Development AI features work identically with local and production providers
- Performance is sufficient for development iteration (<30s per response)
