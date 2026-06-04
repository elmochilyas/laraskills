# Anti-Patterns: FrankenPHP Standalone

## AP-FRANKEN-001: Nginx with FrankenPHP
**Description:** Running FrankenPHP behind Nginx, defeating the purpose of the single-binary approach.
**Consequences:** Adds unnecessary complexity. FrankenPHP includes Caddy which handles SSL, HTTP/2, and reverse proxying.
**Remediation:** Let FrankenPHP handle HTTP directly. Use Caddy's built-in capabilities.

## AP-FRANKEN-002: Default Mercure Configuration
**Description:** Running Mercure hub with default JWT secret or no authentication.
**Consequences:** Anyone can publish events to all connected clients. Real-time features are exploited for phishing or data exfiltration.
**Remediation:** Always configure a strong Mercure JWT secret. Restrict publishing to authorized services.
