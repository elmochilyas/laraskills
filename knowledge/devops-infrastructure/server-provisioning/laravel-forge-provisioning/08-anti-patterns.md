# Anti-Patterns: Laravel Forge Provisioning

## AP-FORGE-001: The Snowflake Server
**Description:** Operators manually SSH into Forge servers to install packages, change configurations, and troubleshoot, creating servers that cannot be reproduced from scratch.
**Why it happens:** The Forge dashboard provides convenience but not complete coverage. Teams reach for SSH as a faster path than figuring out Forge recipes.
**Consequences:** Server rebuilds for scaling or disaster recovery become multi-day manual processes. Configuration drift makes troubleshooting impossible — "it works on server A but not server B" because they are no longer identical.
**Detection:** Compare `dpkg -l` across servers — differences indicate drift. Check Forge recipe logs against actual running configuration.
**Remediation:** Every manual SSH modification must be mirrored into a Forge recipe or documented as a permanent infrastructure change. Schedule periodic server reprovisioning from recipes to catch drift.

## AP-FORGE-002: The Unicorn Server
**Description:** Running Nginx, PHP-FPM, MySQL, Redis, and Supervisor on a single production server because "it's just an MVP" that grew into a production system without re-architecture.
**Why it happens:** Startup pressure to ship fast. The initial single-server decision was never revisited because "it still works."
**Consequences:** Resource contention across all services. A traffic spike kills the database because PHP-FPM consumed all memory. A PHP memory leak saturates the server and takes MySQL down with it. Database I/O blocks Nginx. Migration from this pattern requires application downtime.
**Detection:** Memory and CPU usage exceeds 80% regularly. MySQL slow query log shows "waiting for table level lock" — a symptom of I/O contention between PHP and MySQL.
**Remediation:** Plan server decomposition with a phased approach: first extract database to managed service, then separate workers, then add dedicated Redis.

## AP-FORGE-003: Forge-Driven Development
**Description:** Making infrastructure decisions based on what's easy in the Forge dashboard rather than what's architecturally correct. Example: using Forge's load balancer feature instead of a proper load balancer because it requires fewer clicks.
**Why it happens:** Forge makes certain things easy (load balancer setup) and other things impossible (proper health-check gating). Teams optimize for dashboard convenience.
**Consequences:** Architectural compromises compound. Forge's built-in load balancer lacks sophisticated health checking, circuit breaking, and traffic management capabilities of dedicated solutions. Production incidents that proper health checking would prevent become recurring problems.
**Remediation:** Treat Forge as a provisioning tool, not an architecture decision-maker. Design infrastructure architecture first, then find where Forge fits in the design.

## AP-FORGE-004: The Phantom Envoyer
**Description:** Using Envoyer as a deployment tool without Forge as the server manager, managing server configuration manually via SSH while Envoyer handles only the symlink swap.
**Why it happens:** Teams already familiar with manual server management adopt Envoyer for zero-downtime deploys but skip Forge because "we already have servers running."
**Consequences:** Envoyer handles deployments, but server configuration (PHP versions, Nginx configs, SSL) remains unmanaged. Server provisioning is not repeatable. Scaling requires manual server setup.
**Remediation:** Adopt Forge alongside Envoyer, even if only for new servers. Migrate existing servers into Forge management gradually.

## AP-FORGE-005: Recipe Abandonment
**Description:** Forge recipes are created during initial setup but never updated. As server configurations evolve through the dashboard, recipes fall behind and become useless for server reproduction.
**Why it happens:** Recipes are a one-time provisioning tool. There is no dashboard feedback showing recipe drift.
**Consequences:** Recipes become false documentation — they suggest a configuration that no longer matches reality. New servers provisioned from these recipes start with outdated configurations.
**Remediation:** Update recipes whenever intentional configuration changes are made. Use automated checks to compare recipe-defined state with actual server state.
