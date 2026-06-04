# Rules: Horizontal Reverb Scaling with Redis Pub/Sub Backbone

## Rule RS-01: Dedicated Redis Instance for Pub/Sub
The Redis pub/sub backbone MUST use a dedicated Redis instance (or dedicated cluster node), separate from cache and session stores.

## Rule RS-02: Sticky Sessions Required
Load balancers MUST use sticky sessions (cookie-based affinity) for Reverb WebSocket connections. `REVERB_SCALING_ENABLED` MUST be set to `true` in production.

## Rule RS-03: Set Per-Instance Connection Limit
Each Reverb instance MUST have a configured `REVERB_MAX_CONNECTIONS` limit to prevent memory overload.

## Rule RS-04: Monitor Connection Distribution
Connection distribution across Reverb instances MUST be monitored. Uneven distribution (stddev > 20% of mean) requires investigation.

## Rule RS-05: N+1 Redundancy
Production Reverb deployments MUST have at least N+1 instances (one spare) to handle instance failure without connection loss.

## Rule RS-06: Validate WebSocket Upgrade Routing
Sticky session configuration MUST be validated that WebSocket upgrade requests are routed to the same instance as the initial HTTP handshake.

## Rule RS-07: Monitor Redis Pub/Sub Latency
Redis pub/sub latency MUST be monitored. Latency spikes > 50ms during broadcasts require investigation.

## Rule RS-08: Graceful Instance Shutdown
Reverb instances MUST support graceful shutdown. Connections must be drained before the instance stops processing.

## Rule RS-09: Document Scaling Limits
The maximum supported connections per instance and total cluster limit MUST be documented and tested.

## Rule RS-10: Test Under Connection Storms
Reverb scaling configuration MUST be tested under connection storm scenarios (2x expected peak connections).
