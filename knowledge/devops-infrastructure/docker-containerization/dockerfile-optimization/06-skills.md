# Skills: Dockerfile Optimization

## Skill: optimized-dockerfile-create
**Purpose:** Create an optimized production Dockerfile for Laravel
**Trigger:** When creating Dockerfile for Laravel production deployment
**Workflow:**
1. Define multi-stage build (vendor, node, runtime)
2. Copy lock files first for layer caching
3. Install Composer dependencies with `--no-dev`
4. Build assets in node stage
5. Copy only necessary artifacts to runtime stage
6. Configure OPcache and PHP-FPM settings
7. Switch to non-root user
8. Set up health check
**Output:** Optimized production Dockerfile with multi-stage builds
