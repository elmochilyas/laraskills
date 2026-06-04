# Knowledge Unit: AI Bridge

## Metadata

- **ID:** KU-028 (AI Middleware)
- **Subdomain:** AI Middleware & Gateway Architecture
- **Slug:** ai-bridge
- **Version:** 1.0.0
- **Maturity:** Stable (tetrixdev/laravel-ai-bridge, v1.x)
- **Status:** Published

## Executive Summary

AI Bridge (`tetrixdev/laravel-ai-bridge`) is a Laravel package that provides a WebSocket-based bridge between PHP and external AI processes, enabling Bring Your Own Key (BYOK) architectures, CLI-based AI tool integration, and real-time bidirectional communication with AI services. It solves the problem of PHP-to-Python AI process communication without requiring HTTP polling or heavy microservice infrastructure.

## Core Concepts

- **WebSocket bridge**: Persistent bidirectional connection between Laravel and an external AI process (Python, Node.js, Go) via WebSockets
- **BYOK (Bring Your Own Key)**: Allow customers to use their own API keys for AI services within your platform — keys are stored encrypted and sent through the bridge, never touching the Laravel application
- **CLI bridge**: Execute AI-related CLI commands (Ollama, llama.cpp, AirLLM) from Laravel with streaming output, timeout control, and process management
- **Process manager**: Spawns, monitors, and kills external AI processes; handles process lifecycle, error output, and resource limits
- **Message protocol**: JSON-based protocol for AI requests/responses over the bridge — supports streaming, tool calls, structured output, and error propagation

## Mental Models

- **USB-C Hub for AI**: The bridge is like a USB-C hub — it connects Laravel (the laptop) to various AI peripherals (Python scripts, CLI tools, external APIs) through a single standardized port
- **Secure Air Lock**: BYOK mode works like an air lock — external API keys enter through the bridge but never reach the Laravel application environment, similar to how an air lock prevents contamination between two environments
- **Operator Switchboard**: The bridge is an operator connecting phone calls (WebSocket messages) between Laravel agents and remote AI workers

## Internal Mechanics

The bridge operates as a Laravel service that manages WebSocket connections or CLI processes:

1. **WebSocket bridge**: A Laravel command starts a WebSocket server (using Ratchet or Reverb). External AI processes connect as WebSocket clients. Laravel agents send requests via the bridge service, which routes them to the appropriate connected process.
2. **CLI bridge**: The process manager uses Symfony Process component to spawn external CLI commands. Output is streamed via PHP generators. Timeouts, memory limits, and error handling are configured per process type.
3. **BYOK flow**: Encrypted API keys are stored in Laravel's database. When a request needs a user-specific key, the bridge decrypts it in-memory and passes it to the external process — the key never enters Laravel's logs, queue payloads, or error reports.

```php
use TetrixDev\AiBridge\Facades\Bridge;

// WebSocket bridge: send to external Python process
$response = Bridge::send('python-worker', [
    'action' => 'embed',
    'input' => 'The quick brown fox',
    'model' => 'text-embedding-3-small',
]);

// CLI bridge: run Ollama
$stream = Bridge::cli('ollama run llama3.2 "Summarize this text"')
    ->timeout(120)
    ->stream(fn ($chunk) => Broadcast::send('ai.stream', $chunk));
```

## Patterns

- **Worker pool pattern**: Multiple external processes connect to the bridge, enabling parallel processing
- **BYOK isolation**: User encryption keys scoped per team/project; keys are never logged, never serialized into queues
- **Health check heartbeat**: Bridge sends periodic pings to external processes; stale connections are terminated and respawned
- **Message queue buffering**: If no worker is available, messages queue in Redis and are delivered when a worker connects
- **Process supervisor**: Bridge auto-restarts crashed external processes with configurable backoff (immediate → 1s → 5s → 30s)

## Architectural Decisions

- **Decision**: WebSocket bridge vs. HTTP polling → WebSocket. Reason: Persistent connection eliminates HTTP overhead per AI call, enables true streaming with sub-10ms message delivery, and maintains state across requests.
- **Decision**: Encrypted key storage in DB vs. external vault → DB with app-level encryption. Reason: Laravel's built-in encryption (AES-256-CBC) is sufficient for most BYOK use cases; external vaults (Vault, KMS) can be added for compliance-required scenarios.
- **Decision**: Ratchet vs. Reverb → Both supported. Reason: Ratchet for custom bridge servers, Reverb for Laravel-native WebSocket — developer chooses based on existing infrastructure.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| WebSocket bridge | Low-latency bidirectional streaming | Requires persistent process management |
| BYOK architecture | Customer key ownership, compliance | Key recovery on user loss — must document procedure |
| CLI bridge | Works without Python sidecar | Process management complexity (zombie processes, resource limits) |

## Performance Considerations

- WebSocket bridge adds ~1-5ms per message within same server — negligible
- CLI process spawn takes 50-500ms (PHP process startup) — prefer WebSocket for latency-sensitive flows
- BYOK key decryption adds ~0.5ms per request — cache decrypted keys in-memory per request lifecycle
- Each external process consumes RAM (typically 100-500MB for Python AI processes) — scale worker count to available memory
- Streaming through bridge: 10-50ms end-to-end for token delivery via WebSocket

## Production Considerations

- Use supervisor (supervisord) to manage the bridge WebSocket server process
- Monitor bridge connection count, message latency, and error rate
- Implement connection authentication — external workers must authenticate when connecting to the bridge
- Log bridge messages for audit but scrub API keys from logs (BYOK)
- Graceful shutdown: bridge should finish in-flight requests before terminating
- Configure max message size to prevent DoS via oversized payloads
- For CLI bridge: set process user to non-privileged account, restrict available commands via allowlist

## Common Mistakes

- Storing BYOK decryption keys in same database as encrypted keys — defeats encryption purpose; use APP_KEY or a separate KMS
- Not limiting CLI bridge commands — an attacker who gains access can execute arbitrary system commands through the bridge
- Forgetting to handle WebSocket reconnection — if worker disconnects, bridge should queue messages and replay on reconnect
- Setting process timeouts too short — long-running AI tasks (large embeddings, batch processing) get killed prematurely
- Not isolating BYOK tenants — Tenant A's worker should not receive requests for Tenant B's AI processing

## Failure Modes

- **Worker process crash**: Python AI process segfaults — bridge detects disconnect, respawns worker, replays queued messages
- **WebSocket server down**: Bridge server crashes — all active connections drop; implement health checks and auto-restart
- **Encrypted key corruption**: DB corruption makes BYOK keys unrecoverable — implement key backup with user-initiated re-encryption flow
- **Memory leak in worker**: Python process grows unbounded — bridge should monitor RSS and restart workers after configurable threshold (e.g., 500MB)
- **CLI process zombie**: Process completes but child processes remain — bridge should use process groups and kill entire group on timeout

## Ecosystem Usage

- **tetrixdev/laravel-ai-bridge**: Primary package — WebSocket bridge, BYOK, CLI bridge (Stable, v1.x)
- **Laravel Reverb**: WebSocket server that can serve as the bridge transport
- **goldenpathdigital/laravel-claude**: MCP (Model Context Protocol) connectors that use bridge architecture for Claude desktop integration
- **shamimlaravel/Laravel-Local-LLM-SDK**: Local LLM driver using CLI bridge pattern for AirLLM and LM Studio

## Related Knowledge Units

- KU-002: LiteLLM Proxy (alternative gateway approach — HTTP proxy vs. WebSocket bridge)
- KU-005: API7 AI Gateway (API gateway alternative)
- KU-001: Laravel AI SDK Architecture (agents sending requests through the bridge)
- KU-034: Local LLM Development (Ollama CLI bridge use case)
- KU-012: Streaming SSE (bridge supports WebSocket streaming)

## Research Notes

- Source: tetrixdev/laravel-ai-bridge GitHub (v1.x, stable) — 50+ stars, active maintenance
- Source: Laravel Reverb documentation for WebSocket server configuration
- The bridge pattern is particularly valuable for multi-tenant SaaS platforms where each tenant supplies their own AI credentials
- BYOK is increasingly demanded by enterprise customers for GDPR/HIPAA compliance — the bridge is currently the most mature Laravel BYOK solution
- Future direction: MCP server integration, allowing the bridge to connect to MCP-compatible AI desktops and tools
- Consider combining with LiteLLM for a complete gateway: LiteLLM handles provider abstraction/rate limiting, bridge handles BYOK and process management
