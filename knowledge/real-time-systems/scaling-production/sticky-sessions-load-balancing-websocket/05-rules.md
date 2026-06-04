## Always Use Sticky Sessions for Multi-Server Reverb Deployments
---
## Scalability
---
Always configure sticky sessions (cookie-based or IP hash) on the load balancer when running multiple Reverb instances.
---
WebSocket connections are pinned to the instance that handled the upgrade handshake. Without stickiness, reconnecting clients land on different instances with no subscription state.
---
```nginx
upstream reverb {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080; // Round-robin — clients bounce
}
```
---
```nginx
upstream reverb {
    ip_hash;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
```
---
Single-instance Reverb deployments. No common exceptions for multi-instance.
---
Lost subscriptions; broken private channels; mass reconnections.

## Always Prefer Cookie-Based Affinity Over IP Hash
---
## Scalability
---
Always use cookie-based session affinity instead of IP hash for WebSocket load balancing.
---
IP hash fails for clients behind NAT gateways — thousands of users from a corporate or mobile network appear as a single IP and all route to one server, creating severe load imbalance.
---
```nginx
upstream reverb {
    ip_hash; // Poor distribution with NAT clients
    server ...
}
```
```nginx
# HAProxy cookie-based stickiness
backend reverb_backend
    cookie SERVERID insert indirect nocache
    server reverb1 10.0.0.1:8080 check cookie reverb1
```
---
Single-region deployments serving from known static IP ranges. No common exceptions for global/NAT users.
---
Uneven server load; individual instance overload; capacity waste.

## Always Terminate TLS at the Load Balancer
---
## Performance
---
Always terminate TLS at the load balancer (Nginx, ALB) and forward plain WebSocket traffic to Reverb internally.
---
Reverb's PHP-based TLS handling is less efficient than Nginx or hardware load balancers. Offloading TLS reduces CPU usage on Reverb servers and simplifies certificate management.
---
```bash
# Reverb handles TLS directly — inefficient
```
```nginx
# Nginx terminates TLS, proxies plain WS
listen 443 ssl;
proxy_pass http://reverb:8080; # Plain WS internally
```
---
Local development environments. No common exceptions for production.
---
Higher CPU usage on Reverb servers; complex certificate management.

## Always Set Proxy Timeouts Higher Than Activity Timeout
---
## Reliability
---
Always configure `proxy_read_timeout` higher than Reverb's `activity_timeout` to prevent premature connection termination.
---
Default proxy timeouts (60s) are often shorter than Reverb's activity timeout and heartbeat intervals. The proxy terminates idle connections before Reverb detects any issue, causing unnecessary disconnections.
---
```nginx
proxy_read_timeout 60s; # Default — kills idle WebSocket connections
```
---
```nginx
proxy_read_timeout 3600s; # Matches expected session duration
```
---
Applications with very short-lived WebSocket connections. No common exceptions for long-lived connections.
---
Frequent premature disconnections; poor user experience.

## Always Implement WebSocket-Specific Health Checks
---
## Reliability
---
Always configure health checks that verify Reverb is accepting WebSocket connections, not just TCP.
---
TCP-level health checks pass even if Reverb is crashed but the port is still open (e.g., zombie process). WebSocket-specific checks catch real failures.
---
```nginx
health_check interval=5s; # TCP-only — misses Reverb crash
```
```nginx
# HTTP health check verifying Reverb responds
health_check uri=/apps/123/connections interval=5s;
```
---
No common exceptions; WebSocket-specific health checks are essential for production reliability.
---
Traffic routed to dead Reverb instances; connection failures.
