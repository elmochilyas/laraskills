# Rules: Fly.io Deployment

## FLY-001: Dockerfile Required
**Condition:** Deploying Laravel to Fly.io
**Action:** Provide production-optimized Dockerfile in repository
**Rationale:** Fly.io builds and runs from Dockerfile; no buildpacks
**Consequences:** Violation prevents Fly.io deployment

## FLY-002: Fly Managed Database
**Condition:** Production Laravel on Fly.io
**Action:** Use Fly.io managed PostgreSQL, not in-app SQLite
**Rationale:** In-app storage is ephemeral and not replicated
**Consequences:** Violation causes data loss on app restart

## FLY-003: Auto-scaling Configuration
**Condition:** Production traffic expected
**Action:** Configure Fly.io auto-scaling with minimum 2 instances
**Rationale:** Single instance has no redundancy for zero-downtime deploys
**Consequences:** Violation causes downtime during deployment
