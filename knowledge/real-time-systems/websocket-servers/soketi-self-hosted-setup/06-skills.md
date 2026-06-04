# Skill: Deploy Soketi for Self-Hosted WebSocket Server

## Purpose
Deploy and configure Soketi as a self-hosted, Pusher-protocol-compatible WebSocket server for Laravel broadcasting, using Node.js runtime with Nginx reverse proxy.

## When To Use
- Self-hosted alternative for teams preferring Node.js infrastructure over PHP WebSocket servers
- Migration target for Laravel Echo Server users (Echo Server is deprecated)
- Cost-effective alternative to Pusher for self-hosted WebSockets
- Containerized deployments preferring Docker-native WebSocket servers

## When NOT To Use
- Teams already using Reverb (Reverb is first-party and more actively maintained)
- Applications requiring first-party Laravel support and documentation
- Environments where adding Node.js to the stack is undesirable
- New projects where Reverb is the recommended default

## Prerequisites
- Node.js and npm installed
- Docker (optional, for containerized deployment)
- Nginx installed for TLS termination
- Laravel application with Pusher broadcast driver configured

## Inputs
- Soketi environment variables (`SOKETI_DEFAULT_APP_*`)
- Laravel `config/broadcasting.php` with Soketi host/port
- Nginx configuration for TLS termination
- Supervisor or container orchestration config

## Workflow
1. Install Soketi: `npm install -g soketi` or use Docker: `quay.io/soketi/soketi:latest`
2. Configure `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET`
3. Update `config/broadcasting.php` with Soketi host, port, and scheme
4. Set `SOKETI_DEBUG=false` in production
5. Configure `SOKETI_GLOBAL_RATE_LIMIT` and `SOKETI_RATE_LIMIT` for abuse prevention
6. Deploy behind Nginx reverse proxy with TLS termination and WebSocket upgrade headers
7. Set up process manager (Supervisor for VM, container orchestration for Docker)
8. For multi-instance: configure Redis adapter (`SOKETI_ADAPTER_DRIVER=redis`) and sticky sessions
9. Configure `SOKETI_ALLOWED_ORIGINS` for CSWSH prevention
10. Enable Prometheus monitoring via Soketi's `/metrics` endpoint

## Validation Checklist
- [ ] Soketi installed (npm or Docker)
- [ ] `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` configured
- [ ] `config/broadcasting.php` updated with Soketi host
- [ ] Nginx reverse proxy configured for Soketi
- [ ] Process manager set up (Supervisor or container orchestration)
- [ ] Rate limits configured
- [ ] Soketi debug mode disabled in production
- [ ] Prometheus monitoring enabled (optional)
- [ ] Redis adapter configured if multi-instance
- [ ] `allowed_origins` configured

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Clients cannot connect to Soketi | Missing `SOKETI_DEFAULT_APP_*` env vars | Set app ID, key, and secret |
| Events sent to Pusher instead of Soketi | `config/broadcasting.php` host not updated | Set `options.host` to Soketi server |
| WebSocket traffic unencrypted | No Nginx reverse proxy for TLS | Deploy Soketi behind Nginx with TLS |
| Soketi crashes, no auto-recovery | No process manager | Set up Supervisor or container orchestration |
| Client floods degrade performance | No rate limits configured | Set `SOKETI_GLOBAL_RATE_LIMIT` |
| Lost subscriptions across instances | In-memory adapter without Redis | Configure Redis adapter + sticky sessions |

## Decision Points
- **Soketi vs Reverb**: Soketi for Node.js preference or Echo Server migration; Reverb for first-party PHP WebSocket
- **npm vs Docker**: Docker for containerized/CI deployments; npm for direct server installation
- **Redis vs NATS adapter**: Redis for standard scaling; NATS for higher throughput

## Performance/Security Considerations
- Node.js handles 10k+ concurrent connections efficiently (lower memory per connection than PHP)
- Single instance handles 10k+ concurrent connections with adequate resources
- Redis adapter adds 1-5ms publish latency for cross-instance events
- Soketi does not handle TLS natively — always use Nginx reverse proxy for WSS
- Configure rate limits and allowed origins for abuse prevention

## Related Rules (from 05-rules.md)
- Always Configure `SOKETI_DEFAULT_APP_*` Environment Variables
- Always Deploy Soketi Behind Nginx Reverse Proxy
- Always Update `config/broadcasting.php` with Soketi Host
- Always Configure Rate Limits on Soketi
- Always Use Redis Adapter for Multi-Instance Soketi Deployments
- Always Use a Process Manager for Soketi
- Never Use Soketi Without `allowed_origins` Configuration

## Related Skills
- Integrate Pusher Channels for Managed WebSocket Service
- Install and Configure Laravel Reverb for Broadcasting

## Success Criteria
- Soketi accepts WebSocket connections from Laravel Echo
- Laravel broadcasts events to Soketi via Pusher driver
- TLS termination via Nginx provides WSS connections
- Process manager auto-restarts Soketi on crash
- Rate limits prevent abuse
- Multi-instance deployments have shared state via Redis adapter
