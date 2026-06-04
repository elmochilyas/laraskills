# Decision Trees: Multi-Stage Builds

## Stage Count Decision

**Frontend framework used?**
- No (API-only, Inertia with SSR on different server) → 2 stages vendor+runtime
- Yes (Vue, React, Tailwind) → 3 stages vendor+node+runtime

**Composer dependencies include native extensions?**
- No → Standard vendor stage
- Yes → May need build tools in vendor stage; ensure they're not copied to runtime
