# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Scaling & Production Architecture
**Knowledge Unit:** Sticky Sessions & Load Balancing for WebSocket
**Generated:** 2026-06-03

---

# Decision Inventory

* Session Affinity Method: Cookie-Based vs IP Hash vs None
* TLS Termination Strategy: At Load Balancer vs At Reverb
* Health Check Strategy: WebSocket-Specific vs TCP-Only

---

# Architecture-Level Decision Trees

---

## Session Affinity Method: Cookie-Based vs IP Hash vs None

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

WebSocket connections are pinned to the Reverb instance that handled the initial upgrade handshake. When a client reconnects, it must return to the same instance or lose subscription state. The engineer must choose a session affinity method for the load balancer.

---

## Decision Criteria

* performance considerations — distribution evenness; overhead of cookie insertion
* architectural considerations — NAT/proxy compatibility; load balancer capabilities
* security considerations — cookie tampering; IP spoofing
* maintainability considerations — configuration complexity per load balancer type

---

## Decision Tree

How should sticky sessions be configured?
↓
Is the application behind a load balancer?
YES → Do users access through NAT gateways, proxies, or mobile networks?
    YES → [Cookie-based affinity: cookie SERVERID insert indirect nocache]
    NO → Is the user base in a single region with known static IPs?
        YES → [IP hash: consistent routing without cookie overhead]
        NO → [Cookie-based affinity for maximum compatibility]
NO → [Single instance — sticky sessions not needed]

---

## Rationale

Cookie-based affinity is preferred for most deployments because it works correctly through NAT gateways, corporate proxies, and mobile carrier networks where client IPs change or are shared. IP hash fails dramatically in these scenarios: thousands of users behind a single NAT gateway all route to one Reverb instance, creating severe load imbalance. Cookie-based affinity adds only ~30-50 bytes per handshake response.

---

## Recommended Default

**Default:** Cookie-based affinity using `cookie SERVERID insert indirect nocache` (HAProxy) or equivalent
**Reason:** Works reliably through NAT, proxies, and mobile networks; distributes load evenly

---

## Risks Of Wrong Choice

IP hash with NAT-heavy user bases causes severe load imbalance—one server handles 90% of traffic. Round-robin without stickiness causes subscription loss on every reconnection.

---

## Related Rules

Always Use Sticky Sessions for Multi-Server Reverb Deployments (05-rules.md)

---

## Related Skills

Set Up Sticky Sessions for Multi-Server Reverb Deployments (06-skills.md)

---

## TLS Termination Strategy: At Load Balancer vs At Reverb

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

TLS encryption for WebSocket connections (WSS) must terminate somewhere. Reverb can handle TLS directly, but termination at the load balancer (Nginx, ALB) is more efficient. The engineer must decide where to terminate TLS.

---

## Decision Criteria

* performance considerations — TLS overhead on PHP/ReactPHP vs Nginx/ALB
* architectural considerations — certificate management; internal traffic security
* security considerations — internal network isolation for plain WS traffic
* maintainability considerations — certificate renewal and rotation

---

## Decision Tree

Where should TLS be terminated?
↓
Is there an Nginx or ALB load balancer in front of Reverb?
YES → [Terminate TLS at load balancer; forward plain WS to Reverb internally]
NO → Is this a single-server deployment with public access?
    YES → [Terminate TLS at Reverb directly (less efficient but no proxy available)]
    NO → [Local development — plain WS acceptable]

---

## Rationale

TLS termination at the load balancer is universally preferred in production because Nginx and ALB handle TLS (AES-NI, session caching, OCSP stapling) far more efficiently than PHP/ReactPHP. This offloads CPU-intensive cryptography from the Reverb server and simplifies certificate management (single cert on the LB). Plain WebSocket traffic internally is acceptable as long as the internal network is isolated.

---

## Recommended Default

**Default:** Terminate TLS at the load balancer (Nginx/ALB); forward plain WS to Reverb on internal port
**Reason:** 2-5x more efficient TLS handling; centralized certificate management; simpler Reverb config

---

## Risks Of Wrong Choice

TLS at Reverb increases CPU usage by 20-40% on the WebSocket server. Plain WS over a public network exposes all real-time traffic to eavesdropping.

---

## Related Rules

Always Terminate TLS at the Load Balancer (05-rules.md)

---

## Related Skills

Set Up Sticky Sessions for Multi-Server Reverb Deployments (06-skills.md)

---

## Health Check Strategy: WebSocket-Specific vs TCP-Only

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Load balancers use health checks to detect failed Reverb instances and remove them from the pool. TCP-only health checks pass even when Reverb is crashed but the port remains open (e.g., zombie process). The engineer must choose a health check strategy that reliably detects real failures.

---

## Decision Criteria

* performance considerations — health check overhead; polling frequency
* architectural considerations — Reverb's HTTP endpoint availability
* security considerations — health check endpoint exposure
* maintainability considerations — configuration per load balancer type

---

## Decision Tree

What type of health check should be configured?
↓
Does the load balancer support HTTP/application-level health checks?
YES → [WebSocket-specific health check: verify Reverb responds to Pusher protocol on /apps/{id}/health]
NO → [TCP port check — accept limited reliability; add external monitoring]
↓
Is the application multi-instance with auto-scaling?
YES → [Frequent health checks every 5s with 2 failure threshold]
NO → [Standard health checks every 15s with 3 failure threshold]

---

## Rationale

WebSocket-specific health checks are critical for production because they catch real application-level failures (process crash, event loop hang, Redis disconnection) that TCP checks miss. A TCP check only verifies the port is open—a Reverb instance that's accepting connections but not processing events will pass TCP checks while silently dropping broadcasts.

---

## Recommended Default

**Default:** HTTP health check hitting Reverb's `/apps/{appId}/health` endpoint every 10s with 2 consecutive failures for removal
**Reason:** Catches application-level failures that TCP checks miss; lightweight enough for frequent polling

---

## Risks Of Wrong Choice

TCP-only health checks allow crashed or hung Reverb instances to remain in the load balancer pool, silently degrading service for connected clients.

---

## Related Rules

Always Implement WebSocket-Specific Health Checks (05-rules.md)

---

## Related Skills

Set Up Sticky Sessions for Multi-Server Reverb Deployments (06-skills.md)
