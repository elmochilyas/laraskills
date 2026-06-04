# Rules: Railway Deployment

## RAILWAY-001: Managed Database
**Condition:** Production Laravel on Railway
**Action:** Use Railway managed PostgreSQL, not SQLite
**Rationale:** Railway's ephemeral storage is lost on redeploy
**Consequences:** Violation causes data loss on deployment

## RAILWAY-002: Environment Variables via Dashboard
**Condition:** Railway deployment configured
**Action:** Set environment variables in Railway dashboard, not in repository
**Rationale:** Repository variables are visible to all users with repo access
**Consequences:** Violation exposes production secrets in version control

## RAILWAY-003: Health Check
**Condition:** Production Railway service
**Action:** Configure health check endpoint for routing
**Rationale:** Without health checks, Railway routes traffic to unhealthy instances
**Consequences:** Violation serves errors from unhealthy application instances
