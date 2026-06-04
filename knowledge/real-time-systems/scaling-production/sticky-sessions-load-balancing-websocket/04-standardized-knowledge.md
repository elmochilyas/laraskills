# Standardized Knowledge: Sticky Sessions & Load Balancing for WebSocket

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Scaling & Production Architecture |
| Knowledge Unit ID | K14 |
| Title | Sticky Sessions & Load Balancing for WebSocket |
| Difficulty | Advanced |
| Dependencies | K04, K32, K33, K15 |

## Overview
WebSocket connections require session affinity (sticky sessions) when multiple server instances are deployed behind a load balancer. Unlike HTTP, where any server can handle any request, a WebSocket connection is pinned to the specific server instance that handled its initial upgrade handshake. The load balancer must consistently route subsequent WebSocket traffic from the same client to the same server. Sticky sessions are implemented via IP hash balancing, cookie-based affinity, or application-layer routing.

## Core Concepts
- A WebSocket connection is a long-lived TCP socket bound to a specific server process maintaining in-memory state (channel subscriptions, presence membership, auth context)
- If a client reconnects to a different server, that server has no knowledge of the previous connection's state
- Sticky sessions ensure the load balancer sends each client to the same server for the session duration
- For Reverb with Redis pub/sub, sticky sessions are still required because connection subscription state is local to the instance—Redis only handles event fan-out, not subscription migration

## When To Use
- Any multi-server Reverb deployment behind a load balancer
- All production Reverb setups with more than one server instance
- Deployments where WebSocket connections must survive server restarts or scaling events

## When NOT To Use
- Single-server deployments (no load balancer needed)
- Serverless WebSocket solutions (Pusher, Ably, API Gateway manage this automatically)
- Development environments with a single Reverb instance

## Best Practices (Why)
- **Use cookie-based affinity over IP hash**: Cookie-based works through NAT, proxies, and mobile networks where client IPs change; IP hash fails with shared corporate NAT gateways
- **Terminate TLS at the load balancer**: Offloads encryption from Reverb to the more efficient Nginx/ALB, then pass plain WebSocket traffic internally
- **Configure WebSocket-friendly health checks**: Health checks must verify Reverb is accepting WebSocket connections, not just TCP; use an HTTP endpoint that validates the Pusher protocol is responding
- **Align sticky session duration with session length**: Too-short duration causes frequent reconnections; default 1 day on AWS ALB is appropriate

## Architecture Guidelines
- Use a dedicated load balancer (Nginx, HAProxy, AWS ALB, GCP HTTP(S) LB) with WebSocket support
- Set proxy timeouts higher than Reverb's `activity_timeout` (typically 60-120s)
- Implement connection draining for rolling deployments—allow in-flight connections to complete before shutdown
- Consider using a dedicated subdomain (e.g., `ws.example.com`) for WebSocket traffic to separate from HTTP routing

## Performance Considerations
- IP hash distribution: ~1000 clients behind a /24 subnet all route to one server (poor distribution)
- Cookie overhead: insertion cookies add ~30-50 bytes per response; negligible for WebSocket handshake
- Load balancer connection tracking memory scales with active connections
- TLS termination offloads CPU work from Reverb to the load balancer

## Security Considerations
- Use cookie-based affinity with secure attributes (HttpOnly, Secure) to prevent client-side tampering
- TLS termination at the load balancer means Reverb receives plain WS internally—ensure internal network is isolated
- Health check endpoints should not expose sensitive information

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Round-robin for WebSocket | Assuming any server can handle any WebSocket request | HTTP mental model applied to WebSocket | Reconnections break, subscription state lost | Always use sticky sessions |
| IP hash with NAT clients | Users behind large NAT all route to one server | Not understanding IP hash distribution limits | Uneven server load | Use cookie-based affinity |
| No health checks | Load balancer sends traffic to dead Reverb instances | Missing configuration | Users cannot connect | Configure WebSocket-specific health checks |
| Proxy timeout too low | Connections prematurely terminated | Not matching proxy timeout to heartbeat interval | Frequent disconnections | Set `proxy_read_timeout` higher than heartbeat interval |

## Anti-Patterns
- **Using the same load balancer for HTTP and WebSocket without separating concerns**: WebSocket timeouts and health checks differ from HTTP; use separate frontends or locations
- **Assuming round-robin balancing works for WebSocket**: Connection state is per-instance; round-robin breaks on reconnection
- **Not testing sticky session behavior with the specific load balancer**: Each LB (Nginx, HAProxy, ALB) has different configuration semantics and failure modes

## Examples

### Nginx upstream with IP hash
```nginx
upstream reverb {
    ip_hash;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}

server {
    listen 443 ssl;
    server_name ws.example.com;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_pass http://reverb;
        proxy_read_timeout 3600s;
    }
}
```

### HAProxy with cookie-based stickiness
```haproxy
backend reverb_backend
    cookie SERVERID insert indirect nocache
    server reverb1 10.0.0.1:8080 check cookie reverb1
    server reverb2 10.0.0.2:8080 check cookie reverb2
    server reverb3 10.0.0.3:8080 check cookie reverb3
```

## Related Topics
- K04: Reverb Horizontal Scaling via Redis
- K32: Nginx WebSocket Proxy Configuration
- K33: Dedicated Reverb Fleet Architecture
- K15: Reconnection Strategies & Storm Mitigation

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Sticky session configuration varies significantly between load balancer providers
- Laravel Forge supports multiple Reverb instances behind a load balancer with automatic sticky session configuration
- For Reverb with Redis pub/sub, sticky sessions are still required—Redis only handles event fan-out, not subscription migration

## Verification
- [ ] Load balancer configured with sticky sessions (cookie-based preferred)
- [ ] Health checks configured to verify WebSocket acceptance
- [ ] Proxy timeouts aligned with Reverb's `activity_timeout`
- [ ] Cookie-based affinity tested through NAT, proxies, and mobile networks
- [ ] Connection draining implemented for rolling deployments
- [ ] TLS terminated at load balancer; internal traffic plain WS
- [ ] Server connection distribution monitored for uneven balancing
