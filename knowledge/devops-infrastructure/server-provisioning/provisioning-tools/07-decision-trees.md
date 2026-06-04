# Decision Trees: Provisioning Tools

## Server Type Decomposition Decision

**Is this a production deployment?**
- No → Single server sufficient for development/staging
- Yes → Proceed

**Is expected traffic > 10k DAU?**
- No → Two servers: App + Database
- Yes → Proceed

**Does the application use queues?**
- No → Skip worker server
- Yes → Add worker server

**Is response time SLA < 200ms?**
- No → App+DB+Worker is sufficient
- Yes → Add Redis cache server

**Is database write volume > 1000 writes/sec?**
- No → Shared database
- Yes → Add read replica

## PHP-FPM pm Mode Decision

**Traffic pattern:**
- Consistent high traffic → pm = static
- Variable peaks and troughs → pm = dynamic
- Low traffic with occasional spikes → pm = ondemand

**Server memory:**
- < 1GB RAM → Use ondemand (memory conservation priority)
- 1-4GB RAM → Use dynamic with calculated max_children
- > 4GB RAM → Use static or dynamic with generous settings

## OPcache Sizing Decision

**Codebase size:**
- Simple Laravel (< 50 files) → 64MB
- Moderate Laravel (50-200 files) → 128MB
- Large Laravel (200-500 files) → 256MB
- Monolith (500+ files) → 512MB

**Monitor:** Check `opcache_get_status()['memory_usage']['free_memory']`. If free < 20%, increase memory.
