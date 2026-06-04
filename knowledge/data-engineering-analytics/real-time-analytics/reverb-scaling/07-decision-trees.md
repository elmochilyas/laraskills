# Decision Trees: Horizontal Reverb Scaling with Redis Pub/Sub Backbone

## Decision: Single Instance vs Scaled

**Q: How many concurrent WebSocket connections are expected?**
- < 10,000 → Single instance (simpler, fewer components)
- > 10,000 → Scaled deployment with Redis pub/sub backbone

## Decision: Instance Size

**Q: What is the primary resource constraint?**
- CPU (broadcast throughput) → More small instances (2-4 CPU)
- Memory (connection count) → Fewer large instances (8-16 CPU)

**Q: Is high availability required?**
- Yes → N+1 instances with graceful shutdown
- No → N instances (no redundancy overhead)

## Decision: Load Balancer Strategy

**Q: What sticky session method is available?**
- Cookie-based (recommended) → Configure cookie affinity
- Source IP (alternative) → Configure source IP hashing
