# Rules: DigitalOcean App Platform

## DOAPP-001: Use Managed Database
**Condition:** Production Laravel on App Platform
**Action:** Use DigitalOcean Managed Database, not in-app MySQL
**Rationale:** In-app database is ephemeral and cannot be backed up independently
**Consequences:** Violation causes data loss on app redeploy

## DOAPP-002: Health Check Configuration
**Condition:** App Platform service configured
**Action:** Configure health check endpoint for routing and auto-healing
**Rationale:** Without health checks, App Platform routes traffic to unhealthy app instances
**Consequences:** Violation serves errors from unhealthy application instances
