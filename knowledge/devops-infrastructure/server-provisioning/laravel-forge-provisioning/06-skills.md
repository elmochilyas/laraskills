# Skills: Laravel Forge Provisioning

## Skill: forge-server-provision
**Purpose:** Provision and configure a Laravel Forge server with production-ready settings
**Trigger:** When setting up a new server for Laravel deployment via Forge
**Workflow:**
1. Select cloud provider, region, and server size based on workload profile
2. Apply Forge recipe for base LEMP stack installation
3. Configure PHP-FPM pool settings with calculated `pm.max_children`
4. Set OPcache memory based on application codebase size
5. Configure firewall rules (22, 80, 443 from trusted sources)
6. Create deployment script with OPcache clear, migration, queue restart
7. Set up monitoring (Nightwatch or alternative)
8. Issue SSL certificate via Let's Encrypt with auto-renewal
**Output:** Fully provisioned Forge server ready for application deployment

## Skill: forge-server-decompose
**Purpose:** Design server type decomposition strategy for Forge-managed infrastructure
**Trigger:** When planning multi-server architecture for Forge-deployed Laravel application
**Workflow:**
1. Estimate traffic volume and resource requirements per service
2. Determine separation boundaries (app vs web vs db vs cache vs worker)
3. Map server sizes to each role based on workload
4. Configure private networking between servers
5. Design load balancer upstream configuration
6. Plan shared state strategy (Redis for sessions, managed DB for persistence)
7. Document server topology for operations team
**Output:** Server type decomposition plan with sizing, networking, and load balancing

## Skill: forge-recipe-authoring
**Purpose:** Create version-controlled Forge recipes for reproducible server provisioning
**Trigger:** When standardizing server configuration across multiple Forge servers
**Workflow:**
1. Identify configuration that should be consistent across servers
2. Create base recipe for OS-level configuration
3. Create service-specific recipes (PHP, Nginx, database, Redis)
4. Test recipe on staging server
5. Store recipes in version control alongside deployment scripts
6. Document recipe dependencies and application order
**Output:** Forge recipe templates version-controlled in repository
