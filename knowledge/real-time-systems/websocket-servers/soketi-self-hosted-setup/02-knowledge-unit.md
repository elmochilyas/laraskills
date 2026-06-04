# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Soketi Self-Hosted Setup
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Soketi is an open-source, self-hosted WebSocket server compatible with the Pusher protocol. Written in Node.js, it provides a drop-in replacement for Pusher Channels and a spiritual successor to the deprecated Laravel Echo Server. Installation uses npm (`npm install -g soketi`) or Docker (`docker run quay.io/soketi/soketi`). Soketi supports horizontal scaling via Redis or NATS adapters, built-in Prometheus monitoring, and the Pusher protocol v7 specification. Configuration is via environment variables or a JSON/YAML config file. Soketi is suitable for teams that want self-hosted WebSockets without installing PHP-based Reverb, or that prefer Node.js infrastructure.

## Core Concepts
Soketi is a Node.js WebSocket server that implements the Pusher protocol. It accepts connections from Laravel Echo (via `pusher-js`) and receives server-side broadcasts from Laravel's Pusher broadcast driver. Soketi manages channel subscriptions, presence state, client events, and connection lifecycle. It stores presence channel membership in memory or Redis for horizontal scaling. Soketi uses an in-memory adapter by default for single-instance deployments, and Redis or NATS adapters for multi-instance scaling.

## Mental Models
Soketi is a Node.js reimplementation of the Pusher server protocol. If you know how to use Pusher Channels, you already know how to use Soketi—just point your Laravel app and Echo at your Soketi server instead of Pusher.

## Internal Mechanics
Soketi uses Node.js's event loop (libuv) with the `ws` WebSocket library. Connections are handled asynchronously with non-blocking I/O. The Pusher protocol implementation handles the WebSocket upgrade handshake, JSON-framed messages (`pusher:subscribe`, `pusher:unsubscribe`, `pusher:ping`, `pusher:pong`), channel subscription management, and event broadcasting. The Redis adapter uses `ioredis` for pub/sub fan-out across multiple Soketi instances. The NATS adapter provides an alternative for organizations already running NATS infrastructure. Soketi's built-in HTTP server exposes a health check endpoint and Prometheus metrics.

## Patterns
- **Pusher protocol compatibility**: Drop-in replacement for Pusher Channels; no client or server code changes
- **Node.js event loop**: Efficient connection handling via libuv (no PHP process overhead per connection)
- **Pluggable scaling adapters**: Swap Redis for NATS depending on infrastructure
- **Docker-first deployment**: Official Docker image with one-command setup for containerized environments

## Architectural Decisions
- **Node.js over PHP**: Different runtime from Laravel; operates as a separate service, not a PHP process
- **Push protocol v7**: Implements the latest Pusher protocol features including batched subscription handling
- **In-memory default**: Single-instance deployments need no external dependencies; Redis/NATS only for scaling
- **Prometheus-native metrics**: Built-in metrics exposition in Prometheus format, unlike Reverb's Pulse-based approach

## Tradeoffs
- **Separate runtime**: Requires Node.js in the deployment stack alongside PHP (additional infrastructure complexity)
- **Smaller community than Reverb**: Less ecosystem support, fewer documented production deployments
- **No first-party Laravel integration**: Not part of the official Laravel ecosystem; relies on Pusher compatibility
- **Less active development**: Community-maintained with slower release cadence than Reverb
- **Historical predecessor (Laravel Echo Server) deprecated**: Migration path to Soketi for existing Echo Server users

## Performance Considerations
- Node.js event loop handles thousands of concurrent connections efficiently (lower memory per connection than PHP)
- Single instance handles 10k+ concurrent connections with adequate resources
- Redis adapter for scaling adds publish latency similar to Reverb (1-5ms)
- NATS adapter provides lower latency than Redis in high-throughput deployments
- Prometheus metrics enable detailed performance monitoring without additional agents

## Production Considerations
- Deploy behind Nginx reverse proxy for TLS termination and domain routing
- Use Docker with orchestration (Kubernetes, Docker Compose) for production deployments
- Configure `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` for app credentials
- Set `SOKETI_DEBUG=false` in production to reduce log verbosity
- Configure `SOKETI_MAX_MESSAGE_SIZE` to prevent oversized payload attacks
- Set `SOKETI_GLOBAL_RATE_LIMIT` and per-channel rate limits for abuse prevention
- Monitor with Prometheus + Grafana for connection counts, message rates, and memory usage
- Update Laravel `config/broadcasting.php` with `options.host` pointing to Soketi server

## Common Mistakes
- Forgetting to update `config/broadcasting.php` to point at Soketi's host (defaults to Pusher's servers)
- Not configuring `SOKETI_DEFAULT_APP_*` env vars, causing authentication failures
- Using in-memory adapter behind a load balancer without sticky sessions (connections break on scale-out)
- Not setting `allowed_origins` in CORS configuration (Soketi uses HTTP CORS for auth endpoint)
- Running Soketi without process manager (similar to Reverb, needs supervisor or systemd)

## Failure Modes
- **Memory leak in long-running process**: Undiscovered Node.js leaks accumulate over days/weeks
- **Event loop blockage**: CPU-intensive operations in the same process block all WebSocket connections
- **Redis adapter disconnect**: Network partition isolates Soketi instance; events not propagated
- **Upgrade crash**: Breaking changes in Pusher protocol implementation cause client connection failures
- **Prometheus endpoint availability**: Metrics endpoint overloaded under high scrape frequency

## Ecosystem Usage
- Migration target for Laravel Echo Server users (Echo Server is deprecated)
- Self-hosted alternative for teams preferring Node.js infrastructure over PHP WebSocket servers
- Cost-effective alternative to Pusher for teams wanting self-hosted WebSockets during Reverb's early days
- Containerized deployments preferring Docker-native WebSocket servers
- Organizations already running Node.js for other services wanting consistent runtime

## Related Knowledge Units
- K06: Pusher Channels Integration
- K03: Reverb Installation & Configuration
- K04: Reverb Horizontal Scaling via Redis
- K33: Dedicated Reverb Fleet Architecture

## Research Notes
Soketi is the spiritual successor to `laravel-websockets` (deprecated) and `laravel-echo-server` (deprecated). It was created by the same community ecosystem. Soketi implements Pusher protocol v7, which includes features like batched subscription handling. The NATS adapter is a unique differentiator for teams already running NATS for microservice communication. As of 2026, Soketi's development activity has slowed compared to Reverb, which is now the recommended self-hosted option within the Laravel ecosystem. Comparative benchmarks between Reverb and Soketi at extreme scale are limited.
