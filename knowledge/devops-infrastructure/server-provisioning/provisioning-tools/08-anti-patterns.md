# Anti-Patterns: Provisioning Tools

## AP-PROV-001: The Monolith Server
**Description:** Running all services (Nginx, PHP-FPM, MySQL, Redis, Supervisor) on a single production server.
**Why it happens:** Initial deployment was fast and convenient; team never revisited the decision.
**Consequences:** Resource contention across all services. A PHP memory leak crashes MySQL. Database I/O blocks Nginx. Impossible to scale individual components.
**Remediation:** Decompose into at least app+DB servers. Use managed databases where possible.

## AP-PROV-002: Configuration by Incantation
**Description:** Copying PHP-FPM or Nginx configs from blog posts and forums without understanding what they do.
**Why it happens:** Configuration tuning feels like dark arts; copying "proven" settings is easier than learning.
**Consequences:** Configurations that worked for someone else's workload may be wrong for yours. Bloated buffers waste memory; insufficient settings cause errors.
**Remediation:** Calculate every configuration value from server specifications and workload patterns.

## AP-PROV-003: Golden Image Obsolescence
**Description:** Creating a "perfect" server image, copying it for new servers, but never updating it as software versions change.
**Why it happens:** Image creation is a one-time project; updating requires re-testing all downstream effects.
**Consequences:** New servers start with outdated PHP versions, known CVEs, and deprecated configurations.
**Remediation:** Use provisioning tools with recipes rather than golden images. Automate periodic base image updates.
