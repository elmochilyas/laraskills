# Decision Trees: Laravel Cloud

## Platform Selection

**Need managed Laravel hosting?**
- Yes, want latest platform → Laravel Cloud (next-gen)
- Yes, but already on Lambda → Laravel Vapor (migration cost)
- No, prefer self-managed → Forge or K8s

**WebSocket support required?**
- Yes → Cloud (Vapor lacks WebSocket support)
- No → Both Cloud and Vapor work

## Environment Strategy

**Environments needed:**
- Dev + Staging + Production → Cloud supports multiple environments
- Only Production → Single environment saves cost

**Team size:**
- 1-5 developers → Cloud is cost-effective
- 5+ developers → Evaluate total cost vs self-managed alternative
