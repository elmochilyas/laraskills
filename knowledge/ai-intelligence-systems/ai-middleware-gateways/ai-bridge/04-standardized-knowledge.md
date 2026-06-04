---
id: KU-028 (AI Middleware)
title: "AI Bridge"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/09-ai-middleware-gateways/ai-bridge/04-standardized-knowledge.md"
---

# AI Bridge

## Overview

AI Bridge (`tetrixdev/laravel-ai-bridge`) is a Laravel package that provides a WebSocket-based bridge between PHP and external AI processes, enabling Bring Your Own Key (BYOK) architectures, CLI-based AI tool integration, and real-time bidirectional communication with AI services. It solves the problem of PHP-to-Python AI process communication without requiring HTTP polling or heavy microservice infrastructure.

## Core Concepts

- **WebSocket bridge**: Persistent bidirectional connection between Laravel and an external AI process (Python, Node.js, Go) via WebSockets
- **BYOK (Bring Your Own Key)**: Allow customers to use their own API keys for AI services within your platform â€” keys are stored encrypted and sent through the bridge, never touching the Laravel application
- **CLI bridge**: Execute AI-related CLI commands (Ollama, llama.cpp, AirLLM) from Laravel with streaming output, timeout control, and process management
- **Process manager**: Spawns, monitors, and kills external AI processes; handles process lifecycle, error output, and resource limits
- **Message protocol**: JSON-based protocol for AI requests/responses over the bridge â€” supports streaming, tool calls, structured output, and error propagation

## When To Use

- Production applications requiring AI Bridge functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Worker pool pattern**: Multiple external processes connect to the bridge, enabling parallel processing
- **BYOK isolation**: User encryption keys scoped per team/project; keys are never logged, never serialized into queues
- **Health check heartbeat**: Bridge sends periodic pings to external processes; stale connections are terminated and respawned
- **Message queue buffering**: If no worker is available, messages queue in Redis and are delivered when a worker connects
- **Process supervisor**: Bridge auto-restarts crashed external processes with configurable backoff (immediate â†’ 1s â†’ 5s â†’ 30s)

- **USB-C Hub for AI**: The bridge is like a USB-C hub â€” it connects Laravel (the laptop) to various AI peripherals (Python scripts, CLI tools, external APIs) through a single standardized port
- **Secure Air Lock**: BYOK mode works like an air lock â€” external API keys enter through the bridge but never reach the Laravel application environment, similar to how an air lock prevents contamination between two environments
- **Operator Switchboard**: The bridge is an operator connecting phone calls (WebSocket messages) between Laravel agents and remote AI workers

## Architecture Guidelines

- **Decision**: WebSocket bridge vs. HTTP polling â†’ WebSocket. Reason: Persistent connection eliminates HTTP overhead per AI call, enables true streaming with sub-10ms message delivery, and maintains state across requests.
- **Decision**: Encrypted key storage in DB vs. external vault â†’ DB with app-level encryption. Reason: Laravel's built-in encryption (AES-256-CBC) is sufficient for most BYOK use cases; external vaults (Vault, KMS) can be added for compliance-required scenarios.
- **Decision**: Ratchet vs. Reverb â†’ Both supported. Reason: Ratchet for custom bridge servers, Reverb for Laravel-native WebSocket â€” developer chooses based on existing infrastructure.

## Performance Considerations

- WebSocket bridge adds ~1-5ms per message within same server â€” negligible
- CLI process spawn takes 50-500ms (PHP process startup) â€” prefer WebSocket for latency-sensitive flows
- BYOK key decryption adds ~0.5ms per request â€” cache decrypted keys in-memory per request lifecycle
- Each external process consumes RAM (typically 100-500MB for Python AI processes) â€” scale worker count to available memory
- Streaming through bridge: 10-50ms end-to-end for token delivery via WebSocket

| Tradeoff | Pro | Con |
|----------|-----|-----|
| WebSocket bridge | Low-latency bidirectional streaming | Requires persistent process management |
| BYOK architecture | Customer key ownership, compliance | Key recovery on user loss â€” must document procedure |
| CLI bridge | Works without Python sidecar | Process management complexity (zombie processes, resource limits) |

## Security Considerations

- Use supervisor (supervisord) to manage the bridge WebSocket server process
- Monitor bridge connection count, message latency, and error rate
- Implement connection authentication â€” external workers must authenticate when connecting to the bridge
- Log bridge messages for audit but scrub API keys from logs (BYOK)
- Graceful shutdown: bridge should finish in-flight requests before terminating
- Configure max message size to prevent DoS via oversized payloads
- For CLI bridge: set process user to non-privileged account, restrict available commands via allowlist

## Common Mistakes

- Storing BYOK decryption keys in same database as encrypted keys â€” defeats encryption purpose; use APP_KEY or a separate KMS
- Not limiting CLI bridge commands â€” an attacker who gains access can execute arbitrary system commands through the bridge
- Forgetting to handle WebSocket reconnection â€” if worker disconnects, bridge should queue messages and replay on reconnect
- Setting process timeouts too short â€” long-running AI tasks (large embeddings, batch processing) get killed prematurely
- Not isolating BYOK tenants â€” Tenant A's worker should not receive requests for Tenant B's AI processing

## Anti-Patterns

- **Worker process crash**: Python AI process segfaults â€” bridge detects disconnect, respawns worker, replays queued messages
- **WebSocket server down**: Bridge server crashes â€” all active connections drop; implement health checks and auto-restart
- **Encrypted key corruption**: DB corruption makes BYOK keys unrecoverable â€” implement key backup with user-initiated re-encryption flow
- **Memory leak in worker**: Python process grows unbounded â€” bridge should monitor RSS and restart workers after configurable threshold (e.g., 500MB)
- **CLI process zombie**: Process completes but child processes remain â€” bridge should use process groups and kill entire group on timeout

## Examples

The following ecosystem packages provide reference implementations:

- **tetrixdev/laravel-ai-bridge**: Primary package â€” WebSocket bridge, BYOK, CLI bridge (Stable, v1.x)
- **Laravel Reverb**: WebSocket server that can serve as the bridge transport
- **goldenpathdigital/laravel-claude**: MCP (Model Context Protocol) connectors that use bridge architecture for Claude desktop integration
- **shamimlaravel/Laravel-Local-LLM-SDK**: Local LLM driver using CLI bridge pattern for AirLLM and LM Studio

## Related Topics

- KU-002: LiteLLM Proxy (alternative gateway approach â€” HTTP proxy vs. WebSocket bridge)
- KU-005: API7 AI Gateway (API gateway alternative)
- KU-001: Laravel AI SDK Architecture (agents sending requests through the bridge)
- KU-034: Local LLM Development (Ollama CLI bridge use case)
- KU-012: Streaming SSE (bridge supports WebSocket streaming)

## AI Agent Notes

- When asked about AI Bridge, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

