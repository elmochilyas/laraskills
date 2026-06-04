# Skills: FrankenPHP Standalone

## Skill: frankenphp-deploy-setup
**Purpose:** Deploy Laravel with FrankenPHP standalone binary
**Trigger:** When deploying Laravel with FrankenPHP
**Workflow:**
1. Build application with Octane
2. Configure FrankenPHP Docker image
3. Set worker count based on CPU cores
4. Configure Mercure if needed
5. Set up Caddy automatic HTTPS
6. Configure health check endpoint
7. Deploy with `octane:reload` on updates
**Output:** FrankenPHP deployment with automatic HTTPS and Octane workers
