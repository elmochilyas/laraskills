# Skills: Production Dockerfiles

## Skill: production-dockerfile-create
**Purpose:** Create production Dockerfile for Laravel
**Trigger:** When containerizing Laravel for production deployment
**Workflow:**
1. Create `.dockerignore` with appropriate exclusions
2. Implement multi-stage build (vendor, node, runtime)
3. Install only required PHP extensions
4. Configure OPcache for production
5. Switch to non-root user
6. Add HEALTHCHECK instruction
7. Configure Nginx or FrankenPHP as appropriate
8. Set timezone and locale
9. Test image build and validate size
**Output:** Production Dockerfile with optimized layers and security configuration
