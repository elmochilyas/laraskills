# Anti-Patterns: DigitalOcean App Platform

## AP-DOAPP-001: In-App Database
**Description:** Using App Platform's in-app MySQL instead of managed database.
**Consequences:** Database data is lost on every deployment. No backup capability.
**Remediation:** Always use DigitalOcean Managed Database for persistent data.

## AP-DOAPP-002: Custom Nginx Requirements
**Description:** Choosing App Platform but needing custom Nginx configuration it doesn't support.
**Consequences:** Fighting platform limitations. Workarounds are fragile.
**Remediation:** Use Droplets or Docker-based alternatives if custom Nginx configuration is required.
