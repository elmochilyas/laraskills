# Skills: Ploi Server Management

## Skill: ploi-docker-server-setup
**Purpose:** Provision and configure a Ploi-managed Docker server for Laravel
**Trigger:** When setting up a production Docker environment using Ploi
**Workflow:**
1. Select cloud provider and server size (add 128MB for agent overhead)
2. Provision server with Docker support in Ploi
3. Configure Docker Compose file for Laravel services (PHP-FPM, Nginx, database)
4. Set up Ploi agent monitoring and SSH fallback access
5. Deploy application via Ploi deployment script with Docker build context
6. Configure firewall through Ploi for Docker ports and application access
**Output:** Ploi-managed Docker server running Laravel in containers

## Skill: ploi-staging-promotion
**Purpose:** Create and promote staging environments using Ploi
**Trigger:** When setting up a staging workflow for Laravel deployment
**Workflow:**
1. Create staging site in Ploi with automatic SSL
2. Configure independent environment variables for staging
3. Set up isolated database for staging with anonymized production snapshot
4. Configure deployment trigger for staging branch pushes
5. Test promotion workflow (promote staging to production via Ploi)
**Output:** Ploi staging environment with promotion pipeline
