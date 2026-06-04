# Standardized Knowledge: Soketi Self-Hosted Setup

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K08 |
| Title | Soketi Self-Hosted Setup |
| Difficulty | Intermediate |
| Dependencies | K06, K03, K04, K33 |

## Overview
Soketi is an open-source, self-hosted WebSocket server compatible with the Pusher protocol. Written in Node.js, it provides a drop-in replacement for Pusher Channels and a spiritual successor to the deprecated Laravel Echo Server. Installation uses npm (`npm install -g soketi`) or Docker. Soketi supports horizontal scaling via Redis or NATS adapters, built-in Prometheus monitoring, and the Pusher protocol v7 specification.

## Core Concepts
- Soketi is a Node.js WebSocket server implementing the Pusher protocol
- It accepts connections from Laravel Echo (via `pusher-js`) and server-side broadcasts from Laravel's Pusher broadcast driver
- Soketi manages channel subscriptions, presence state, client events, and connection lifecycle
- In-memory adapter by default for single-instance; Redis or NATS adapters for multi-instance scaling
- Configuration via environment variables or JSON/YAML config file

## When To Use
- Self-hosted alternative for teams preferring Node.js infrastructure over PHP WebSocket servers
- Migration target for Laravel Echo Server users (Echo Server is deprecated)
- Cost-effective alternative to Pusher for self-hosted WebSockets
- Containerized deployments preferring Docker-native WebSocket servers
- Organizations already running Node.js wanting a consistent runtime

## When NOT To Use
- Teams already using Reverb (Reverb is first-party and more actively maintained)
- Applications requiring first-party Laravel support and documentation
- Environments where adding Node.js to the deployment stack is undesirable
- New projects where Reverb is the recommended default

## Best Practices (Why)
- **Deploy behind Nginx reverse proxy**: Same as Reverb—Nginx handles TLS termination and domain routing
- **Use Docker with orchestration**: Soketi's Docker image enables one-command setup and easy scaling with Kubernetes or Compose
- **Configure `SOKETI_DEFAULT_APP_*` env vars**: Sets app credentials for authentication; without these, clients cannot connect
- **Set `SOKETI_DEBUG=false` in production**: Reduces log verbosity and prevents sensitive data exposure
- **Configure rate limits**: `SOKETI_GLOBAL_RATE_LIMIT` and per-channel rate limits prevent abuse

## Architecture Guidelines
- Update `config/broadcasting.php` with `options.host` pointing to the Soketi server
- For multi-instance deployments: configure Redis or NATS adapter and sticky sessions on the load balancer
- Soketi's built-in Prometheus endpoint (`/metrics`) provides detailed performance monitoring
- Like Reverb, Soketi needs a process manager (Supervisor, systemd, or container orchestration)

## Performance Considerations
- Node.js event loop handles thousands of concurrent connections efficiently (lower memory per connection than PHP)
- Single instance handles 10k+ concurrent connections with adequate resources
- Redis adapter for scaling adds 1-5ms publish latency (similar to Reverb)
- NATS adapter can provide lower latency than Redis in high-throughput deployments

## Security Considerations
- Soketi uses the same channel authorization as Reverb/Pusher via `/broadcasting/auth`
- CORS must be configured on Soketi's auth endpoint
- `SOKETI_MAX_MESSAGE_SIZE` prevents oversized payload attacks
- Soketi does not handle TLS termination by default—use Nginx reverse proxy for WSS

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Not updating broadcast config | Defaults to Pusher's servers | Forgetting configuration | Events sent to Pusher instead of Soketi | Set `options.host` in broadcasting config |
| Missing DEFAULT_APP_* vars | Authentication failures | Not setting environment variables | Clients cannot connect | Configure SOKETI_DEFAULT_APP_ID, KEY, SECRET |
| In-memory adapter behind LB | Connections break without sticky sessions | Not considering scaling | Subscription state lost | Use Redis adapter + sticky sessions |
| No process manager | Process dies on crash or SSH logout | Running directly | All connections drop | Use Supervisor, systemd, or container orchestration |

## Anti-Patterns
- **Running Soketi without Nginx reverse proxy**: Soketi doesn't handle TLS natively; without Nginx, clients connect over plain WS
- **Using Soketi when Reverb would integrate better**: Soketi requires adding Node.js to the stack; Reverb runs on PHP (same runtime as Laravel)
- **Not configuring `allowed_origins`**: Same CSWSH vulnerability as any Pusher-protocol server

## Examples

### Soketi Docker deployment
```yaml
# docker-compose.yml
version: '3.8'
services:
  soketi:
    image: quay.io/soketi/soketi:latest
    ports:
      - "6001:6001"
    environment:
      SOKETI_DEFAULT_APP_ID: my-app-id
      SOKETI_DEFAULT_APP_KEY: my-app-key
      SOKETI_DEFAULT_APP_SECRET: my-app-secret
      SOKETI_DEBUG: 'false'
      SOKETI_MAX_MESSAGE_SIZE: 10240
```

### Laravel broadcasting config for Soketi
```php
// config/broadcasting.php
'connections' => [
    'pusher' => [
        'driver' => 'pusher',
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'app_id' => env('PUSHER_APP_ID'),
        'options' => [
            'host' => env('PUSHER_HOST', '127.0.0.1'),
            'port' => env('PUSHER_PORT', 6001),
            'scheme' => env('PUSHER_SCHEME', 'http'),
            'useTLS' => env('PUSHER_USE_TLS', false),
        ],
    ],
],
```

## Related Topics
- K06: Pusher Channels Integration
- K03: Reverb Installation & Configuration
- K04: Reverb Horizontal Scaling via Redis
- K33: Dedicated Reverb Fleet Architecture

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Soketi is the spiritual successor to `laravel-websockets` and `laravel-echo-server` (both deprecated)
- As of 2026, Soketi's development activity has slowed compared to Reverb
- Reverb is now the recommended self-hosted option within the Laravel ecosystem

## Verification
- [ ] Soketi installed (npm or Docker)
- [ ] `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` configured
- [ ] `config/broadcasting.php` updated with Soketi host
- [ ] Nginx reverse proxy configured for Soketi
- [ ] Process manager set up (Supervisor or container orchestration)
- [ ] Rate limits configured
- [ ] Prometheus monitoring enabled
- [ ] Redis/NATS adapter configured if multi-instance
