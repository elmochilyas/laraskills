# Anti-Patterns: Railway Deployment

## AP-RAILWAY-001: Railway for Enterprise
**Description:** Using Railway for enterprise applications with compliance requirements.
**Consequences:** Railway may not provide required compliance certifications or SLAs.
**Remediation:** Evaluate Platform.sh or enterprise Forge for compliance requirements.

## AP-RAILWAY-002: SQLite in Production
**Description:** Using Railway's ephemeral storage as production database.
**Consequences:** Data lost on every deployment or application restart.
**Remediation:** Always use Railway's managed PostgreSQL for persistent data.
