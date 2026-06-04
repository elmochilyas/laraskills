# Skill: Set Up Sticky Sessions for Multi-Server Reverb Deployments

## Purpose
Configure load balancer sticky sessions (cookie-based affinity) for multi-server Reverb deployments to maintain WebSocket connection state across reconnections.

## When To Use
- Any multi-server Reverb deployment behind a load balancer
- All production Reverb setups with more than one server instance
- Deployments where WebSocket connections must survive server restarts or scaling events

## When NOT To Use
- Single-server deployments (no load balancer needed)
- Managed WebSocket solutions (Pusher, Ably, API Gateway)
- Development environments with a single Reverb instance

## Prerequisites
- Load balancer supporting cookie-based affinity (Nginx, HAProxy, AWS ALB)
- Multiple Reverb server instances
- Redis pub/sub configured for cross-instance event fan-out

## Inputs
- Load balancer configuration (Nginx, HAProxy, ALB)
- Reverb server addresses and ports
- Cookie name and duration
- Health check endpoint configuration

## Workflow
1. Configure load balancer with cookie-based stickiness (e.g., HAProxy `cookie SERVERID insert indirect nocache`)
2. Terminate TLS at the load balancer, forward plain WS to Reverb instances
3. Set `proxy_read_timeout` higher than Reverb's `activity_timeout` (e.g., 3600s)
4. Configure WebSocket-specific health checks (verify Reverb responds to Pusher protocol)
5. Implement connection draining for rolling deployments
6. Use a dedicated subdomain (`ws.example.com`) for WebSocket traffic
7. Test sticky session behavior from NAT, proxy, and mobile networks
8. Monitor server connection distribution for uneven balancing

## Validation Checklist
- [ ] Cookie-based affinity configured on load balancer
- [ ] `proxy_read_timeout` higher than `activity_timeout`
- [ ] TLS terminated at load balancer, plain WS internally
- [ ] WebSocket-specific health checks configured
- [ ] Connection draining for rolling deployments implemented
- [ ] Sticky sessions tested through NAT and mobile networks
- [ ] Server connection distribution monitored

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Round-robin routing to Reverb | Sticky sessions not configured | Enable cookie-based or IP hash stickiness |
| All NAT users route to one server | IP hash with shared NAT gateway | Switch to cookie-based affinity |
| Connections dropped after 60s | Default `proxy_read_timeout` too low | Increase to 3600s |
| Traffic sent to dead Reverb | TCP-only health checks | Configure application-level health checks |
| Users can't reconnect after restart | No connection draining configured | Implement drain, set `stopwaitsecs` |

## Decision Points
- **Cookie-based vs IP hash**: Cookie-based is preferred for NAT, proxy, and mobile users
- **TLS at LB vs Reverb**: Terminate at LB for performance (Nginx/ALB handles TLS more efficiently)
- **Dedicated subdomain**: Use `ws.example.com` for cleaner routing and separate proxy config

## Performance/Security Considerations
- Cookie-based affinity adds ~30-50 bytes per response; negligible for WebSocket handshake
- TLS termination offloads CPU from Reverb to the load balancer
- IP hash causes poor distribution for NAT clients (all route to one server)
- Use Secure, HttpOnly cookie attributes to prevent client-side tampering

## Related Rules (from 05-rules.md)
- Always Use Sticky Sessions for Multi-Server Reverb Deployments
- Always Prefer Cookie-Based Affinity Over IP Hash
- Always Terminate TLS at the Load Balancer
- Always Set Proxy Timeouts Higher Than Activity Timeout
- Always Implement WebSocket-Specific Health Checks

## Related Skills
- Deploy and Operate a Dedicated Reverb Fleet
- Configure Nginx as a WebSocket Proxy

## Success Criteria
- Clients consistently route to the same Reverb instance for session duration
- Reconnections after transient failures preserve subscription state
- NAT/mobile users distribute evenly across server instances
- Health checks correctly detect and remove failed Reverb instances
- Rolling deployments do not drop all connections simultaneously
