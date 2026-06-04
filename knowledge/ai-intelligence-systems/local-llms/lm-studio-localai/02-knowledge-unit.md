# Knowledge Unit: LM Studio & LocalAI

## Metadata

- **ID:** KU-051
- **Subdomain:** Local LLM Development
- **Slug:** lm-studio-localai
- **Version:** 1.0.0
- **Maturity:** Emerging
- **Status:** Published

## Executive Summary

LM Studio and LocalAI are alternatives to Ollama for local LLM inference. LM Studio provides a Windows GUI for downloading and running models. LocalAI is a Docker-native solution with OpenAI-compatible API. Both serve as drop-in replacements for cloud providers in development, each with different strengths for different developer workflows.

## Core Concepts

- **LM Studio**: Windows/macOS GUI app — browse, download, and run models with no CLI. Provides OpenAI-compatible API server.
- **LocalAI**: Docker-native, self-hosted AI inference — supports LLMs, embeddings, image generation, TTS, all behind OpenAI-compatible API.
- **OpenAI-compatible API**: Both expose `/v1/chat/completions` endpoint — works with Laravel AI SDK via custom base URL.
- **Model management**: LM Studio: built-in model browser. LocalAI: model YAML configuration files.
- **GPU support**: LM Studio: CUDA, Metal. LocalAI: CUDA, Metal, OpenCL, SYCL.

## Mental Models

- **Windows GUI for local LLMs**: LM Studio is the "app store" for local models — browse, download, run with a click. No terminal needed.
- **Docker AI server**: LocalAI is like running a mini OpenAI server in Docker — same API, local models, zero configuration.

## Internal Mechanics

Both expose OpenAI-compatible API on localhost. The Laravel AI SDK connects via custom base URL:
```php
// config/ai.php
'providers' => [
    'openai' => [
        'driver' => 'openai',
        'key' => env('OPENAI_API_KEY'),
        'url' => env('OPENAI_BASE_URL', 'http://localhost:1234/v1'), // LM Studio
    ],
],
```

LM Studio: Start local inference server (Settings → Local Server → Start). Default port 1234.
LocalAI: Docker Compose with `localai/localai` image. Default port 8080.

Both handle: text generation, chat completions, streaming, embeddings (model-dependent). Tool calling: supported if the loaded model supports it.

## Patterns

- **Custom base URL pattern**: Point OpenRouter-style custom URL to local endpoint for dev
- **Model-specific config**: Different LM Studio instances for different models — switch port per model
- **Docker profile**: LocalAI as one service in Laravel Sail or Docker Compose setup
- **Fallback chain**: LocalAI primary → Ollama fallback → cloud provider fallback

## Architectural Decisions

- **Decision**: LM Studio vs. LocalAI vs. Ollama → LM Studio for Windows developers (GUI). LocalAI for Docker-first teams. Ollama for CLI/macOS users.
- **Decision**: Custom base URL vs. dedicated adapter → Custom base URL with OpenAI driver works for both LM Studio and LocalAI. Dedicated adapters for provider-specific features.

## Tradeoffs

| Tool | Platform | Setup | Features | Performance |
|------|----------|-------|----------|-------------|
| Ollama | macOS/Linux/WSL | CLI | Chat, embeddings, tools | Good |
| LM Studio | Windows/macOS | GUI | Chat, embeddings | Good (CUDA support) |
| LocalAI | Docker (any) | Docker compose | Chat, embeddings, image, TTS, video | Moderate |

## Performance Considerations

- LM Studio: good GPU acceleration on Windows (CUDA), macOS (Metal)
- LocalAI: container overhead adds slight latency vs. native Ollama
- Model loading time: LM Studio loads model on server start; LocalAI loads on first request
- All three: inference speed depends on model size and hardware — same models, similar speed
- Quantization: both support GGUF quantized models (Q4, Q5, Q8)

## Production Considerations

- LocalAI can run in production for self-hosted AI (unlike LM Studio which is dev-only)
- LocalAI in production: Docker orchestration, GPU passthrough, persistent model storage
- LM Studio is strictly development — no production deployment model
- All three: monitor RAM usage — local models consume 2-32GB depending on size

## Common Mistakes

- Installing LM Studio on server for production — it's a desktop GUI app
- Using LM Studio without GPU — CPU-only inference is 10-50x slower
- Expecting OpenAI API compatibility for all features — embeddings and tools depend on model
- Not configuring CORS — LM Studio server blocks cross-origin requests by default
- Running multiple local inference tools simultaneously — port conflicts

## Failure Modes

- **GPU memory exhaustion**: Large model exceeds GPU VRAM — LM Studio/LocalAI crash or swap to CPU (10x slower)
- **API server not started**: LM Studio GUI open but server not started — connection refused
- **Model not loaded**: LocalAI model YAML misconfigured — model fails to initialize
- **CORS error**: Laravel app on different origin blocked by CORS — configure LM Studio CORS settings
- **Port conflict**: Another service already using port 1234/8080 — change port configuration

## Ecosystem Usage

- `shamimlaravel/Laravel-Local-LLM-SDK`: Supports both LM Studio and LocalAI
- Laravel AI SDK: custom base URL pattern for OpenAI-compatible local servers
- Docker Compose for LocalAI: standard service definition in development docker-compose

## Related Knowledge Units

- KU-050: Ollama Integration
- KU-052: Dev-to-Prod Switching Strategy
- KU-053: Docker Sail AI Infrastructure

## Research Notes

- LM Studio: popular Windows GUI for local LLMs, growing Linux support
- LocalAI: Docker-native, supports more than just LLMs (image gen, TTS)
- Both support OpenAI-compatible API, making them easy to integrate with Laravel AI SDK
- Neither has the ecosystem maturity of Ollama for PHP development
- LM Studio is the most accessible option for Windows-only developers
