# Skills: Provisioning Tools

## Skill: server-provision-plan
**Purpose:** Design a server provisioning plan for Laravel production deployment
**Trigger:** When preparing infrastructure for a new Laravel production deployment
**Workflow:**
1. Estimate traffic requirements and choose server sizes
2. Design server type decomposition (app, web, database, cache, worker)
3. Select cloud provider based on region and feature requirements
4. Configure PHP-FPM memory calculation for each server type
5. Plan OPcache configuration per server
6. Design network topology (private networking, firewall rules)
7. Document server inventory with sizing rationale
**Output:** Server provisioning plan document with architecture diagram

## Skill: stack-configuration-optimization
**Purpose:** Generate optimized configuration values for LEMP stack components
**Trigger:** When configuring Nginx, PHP-FPM, MySQL, or Redis for Laravel
**Workflow:**
1. Analyze server specifications (CPU, RAM, disk type)
2. Calculate PHP-FPM pm.max_children from available memory
3. Determine OPcache memory based on codebase size
4. Configure Nginx buffer sizes based on application response patterns
5. Tune MySQL connection limits and query cache
6. Set Redis maxmemory policy
**Output:** Configuration values with rationale for each LEMP component
