---
id: ku-05
title: "Scaling Streaming Connections - Rules"
subdomain: "streaming-real-time-ai"
ku-type: "infrastructure"
date-created: "2026-06-02"
---

## Rules for Scaling Streaming Connections

### R1: Always implement connection limits per server with a clear 503 rejection response
- **Category:** Reliability
- **Rule:** Enforce a maximum concurrent streaming connections per server using a Redis counter, and return HTTP 503 with `Retry-After` header when the limit is exceeded.
- **Reason:** Streaming connections hold resources for their entire duration (30-300s). Without connection limits, a traffic spike can exhaust server memory and crash all active connections.
- **Bad Example:** Allowing unlimited streaming connections until the server runs out of memory and the PHP-FPM pool is completely consumed.
- **Good Example:** A middleware that `INCR` a Redis key `stream:connections:{server_id}`, checks against `max_connections`, and returns 503 with `Retry-After: 5` when exceeded.
- **Exceptions:** Internal admin or monitoring connections that should bypass limits.
- **Consequences of Violation:** Cascading server failure under load, all active streaming sessions dropped simultaneously, and a full application outage requiring manual intervention.

### R2: Separate streaming traffic from API traffic onto dedicated servers or worker pools
- **Category:** Architecture
- **Rule:** Route streaming requests to dedicated server instances or separate PHP-FPM pools/RoadRunner workers that are isolated from regular HTTP API traffic.
- **Reason:** Streaming connections hold workers for 30-300 seconds. A single burst of streaming traffic can exhaust shared workers, starving API requests that complete in milliseconds.
- **Bad Example:** One Laravel application handling both REST API requests (50ms average) and SSE streaming (60s average) from the same PHP-FPM pool.
- **Good Example:** Two separate RoadRunner worker groups — one for API (many workers, short requests) and one for streaming (fewer workers, long-lived).
- **Exceptions:** Very low-traffic applications (<10 concurrent streams) where resource contention is not a concern.
- **Consequences of Violation:** Under concurrent stream load, API response times degrade from 50ms to 30s+ as all workers are held by streaming connections.

### R3: Use Redis pub/sub for cross-server WebSocket message routing, never direct server-to-server connections
- **Category:** Architecture
- **Rule:** Implement Redis pub/sub as the shared message bus between WebSocket server instances; each instance subscribes to channels for its connected clients and publishes outbound messages.
- **Reason:** In multi-server deployments, a message generated on Server A must reach a client connected to Server B. Direct connections between servers create a mesh network that doesn't scale.
- **Bad Example:** Each Reverb server holding a list of all other Reverb server IPs and sending messages via direct HTTP calls.
- **Good Example:** Reverb configured with Redis scaling: each instance subscribes to Redis channels and publishes messages that Redis fans out to all subscribers.
- **Exceptions:** Single-server deployments where cross-server routing is unnecessary.
- **Consequences of Violation:** WebSocket messages are delivered only to clients on the same server; users behind a load balancer randomly miss AI stream updates.

### R4: Implement sticky sessions (session affinity) for WebSocket connections at the load balancer
- **Category:** Infrastructure
- **Rule:** Configure the load balancer (nginx, HAProxy, AWS ALB) to route a WebSocket client's requests to the same backend server for the duration of the session.
- **Reason:** WebSocket connections are stateful. Without sticky sessions, the load balancer may route a reconnecting client to a different server that doesn't have the conversation state.
- **Bad Example:** A round-robin load balancer distributing WebSocket connections across servers, causing reconnections to land on random instances.
- **Good Example:** ALB with stickiness enabled using a cookie or nginx `ip_hash` directive for the WebSocket upstream.
- **Exceptions:** When Redis pub/sub fully replicates session state, sticky sessions are a performance optimization rather than a correctness requirement.
- **Consequences of Violation:** Frequent disconnections on rebalance, lost conversation state, and inconsistent AI responses when clients switch servers.

### R5: Monitor active streaming connection count as the primary auto-scaling metric
- **Category:** Operations
- **Rule:** Configure auto-scaling (Kubernetes HPA, AWS Auto Scaling) based on `active_connections` metric, not CPU or memory utilization.
- **Reason:** Streaming connections are long-lived but CPU-light (mostly waiting for provider responses). CPU utilization may stay low while the server approaches its connection capacity. Scaling on CPU would not trigger until connections have already saturated.
- **Bad Example:** Auto-scaling group configured to scale at 70% CPU — streaming connections multiply without hitting the CPU threshold until memory is exhausted.
- **Good Example:** Custom CloudWatch/Prometheus metric `active_streaming_connections` with scaling threshold at 80% of `max_connections_per_server`.
- **Exceptions:** Short-lived streaming connections (<5 seconds) where connection churn more closely resembles standard API traffic.
- **Consequences of Violation:** Servers reach connection capacity without triggering auto-scaling, causing 503 errors for all new streaming requests.
