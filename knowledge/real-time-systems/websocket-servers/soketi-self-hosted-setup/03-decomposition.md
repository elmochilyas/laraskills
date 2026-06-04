# Decomposition: Soketi Self Hosted Setup

## Topic Overview
Soketi is an open-source, self-hosted WebSocket server compatible with the Pusher protocol. Written in Node.js, it provides a drop-in replacement for Pusher Channels and a spiritual successor to the deprecated Laravel Echo Server. Installation uses npm (`npm install -g soketi`) or Docker (`docker run quay.io/soketi/soketi`). Soketi supports horizontal scaling via Redis or NATS adapters, built-in Prometheus monitoring, and the Pusher protocol v7 specification. Configuration is via environment ...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K08-soketi-self-hosted-setup/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Soketi Self Hosted Setup
- **Purpose:** Soketi is an open-source, self-hosted WebSocket server compatible with the Pusher protocol. Written in Node.js, it provides a drop-in replacement for Pusher Channels and a spiritual successor to the deprecated Laravel Echo Server. Installation uses npm (`npm install -g soketi`) or Docker (`docker run quay.io/soketi/soketi`). Soketi supports horizontal scaling via Redis or NATS adapters, built-in Prometheus monitoring, and the Pusher protocol v7 specification. Configuration is via environment ...
- **Difficulty:** Intermediate
- **Dependencies:
  - K06: Pusher Channels Integration
  - K03: Reverb Installation & Configuration
  - K04: Reverb Horizontal Scaling via Redis
  - K33: Dedicated Reverb Fleet Architecture

## Dependency Graph
**Depends on:**
  - K06: Pusher Channels Integration
  - K03: Reverb Installation & Configuration
  - K04: Reverb Horizontal Scaling via Redis
  - K33: Dedicated Reverb Fleet Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Pusher protocol compatibility**: Drop-in replacement for Pusher Channels; no client or server code changes**Node.js event loop**: Efficient connection handling via libuv (no PHP process overhead per connection)**Pluggable scaling adapters**: Swap Redis for NATS depending on infrastructure**Docker-first deployment**: Official Docker image with one-command setup for containerized environments**Node.js over PHP**: Different runtime from Laravel; operates as a separate service, not a PHP process**Push protocol v7**: Implements the latest Pusher protocol features including batched subscription handling**In-memory default**: Single-instance deployments need no external dependencies; Redis/NATS only for scaling**Prometheus-native metrics**: Built-in metrics exposition in Prometheus format, unlike Reverb's Pulse-based approach**Separate runtime**: Requires Node.js in the deployment stack alongside PHP (additional infrastructure complexity)**Smaller community than Reverb**: Less ecosystem support, fewer documented production deployments**No first-party Laravel integration**: Not part of the official Laravel ecosystem; relies on Pusher compatibility**Less active development**: Community-maintained with slower release cadence than Reverb**Historical predecessor (Laravel Echo Server) deprecated**: Migration path to Soketi for existing Echo Server usersNode.js event loop handles thousands of concurrent connections efficiently (lower memory per connection than PHP)Single instance handles 10k+ concurrent connections with adequate resourcesRedis adapter for scaling adds publish latency similar to Reverb (1-5ms)NATS adapter provides lower latency than Redis in high-throughput deploymentsPrometheus metrics enable detailed performance monitoring without additional agentsDeploy behind Nginx reverse proxy for TLS termination and domain routingUse Docker with orchestration (Kubernetes, Docker Compose) for production deploymentsConfigure `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` for app credentialsSet `SOKETI_DEBUG=false` in production to reduce log verbosityConfigure `SOKETI_MAX_MESSAGE_SIZE` to prevent oversized payload attacksSet `SOKETI_GLOBAL_RATE_LIMIT` and per-channel rate limits for abuse preventionMonitor with Prometheus + Grafana for connection counts, message rates, and memory usageUpdate Laravel `config/broadcasting.php` with `options.host` pointing to Soketi serverForgetting to update `config/broadcasting.php` to point at Soketi's host (defaults to Pusher's servers)Not configuring `SOKETI_DEFAULT_APP_*` env vars, causing authentication failuresUsing in-memory adapter behind a load balancer without sticky sessions (connections break on scale-out)Not setting `allowed_origins` in CORS configuration (Soketi uses HTTP CORS for auth endpoint)Running Soketi without process manager (similar to Reverb, needs supervisor or systemd)**Memory leak in long-running process**: Undiscovered Node.js leaks accumulate over days/weeks**Event loop blockage**: CPU-intensive operations in the same process block all WebSocket connections**Redis adapter disconnect**: Network partition isolates Soketi instance; events not propagated**Upgrade crash**: Breaking changes in Pusher protocol implementation cause client connection failures**Prometheus endpoint availability**: Metrics endpoint overloaded under high scrape frequencyMigration target for Laravel Echo Server users (Echo Server is deprecated)Self-hosted alternative for teams preferring Node.js infrastructure over PHP WebSocket serversCost-effective alternative to Pusher for teams wanting self-hosted WebSockets during Reverb's early daysContainerized deployments preferring Docker-native WebSocket serversOrganizations already running Node.js for other services wanting consistent runtimeK06: Pusher Channels IntegrationK03: Reverb Installation & ConfigurationK04: Reverb Horizontal Scaling via RedisK33: Dedicated Reverb Fleet Architecture

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization