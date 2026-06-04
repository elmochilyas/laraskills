# Skills: Horizontal Reverb Scaling with Redis Pub/Sub Backbone

## Skill: Setting Up Scaled Reverb Deployment
**Purpose:** Configure multiple Reverb instances behind a load balancer with Redis pub/sub backbone.
**When to use:** Scaling beyond a single Reverb instance's capacity.
**Steps:**
1. Set `REVERB_SCALING_ENABLED=true` in environment configuration
2. Configure dedicated Redis instance for pub/sub backbone
3. Set `REVERB_MAX_CONNECTIONS` per instance
4. Configure load balancer with sticky sessions (cookie-based)
5. Validate WebSocket upgrade routing to same instance
6. Test connection distribution under load
7. Monitor per-instance metrics and Redis pub/sub latency
8. Document scaling limits and instance sizing
