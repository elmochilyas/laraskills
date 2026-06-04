# Skills: Multi-Stage Builds

## Skill: multi-stage-dockerfile-create
**Purpose:** Create multi-stage Dockerfile for Laravel
**Trigger:** When optimizing production Docker image
**Workflow:**
1. Define vendor stage with Composer install
2. Define node stage with npm build
3. Define runtime stage with PHP-FPM
4. COPY compiled vendor from vendor stage
5. COPY compiled assets from node stage
6. Configure runtime (OPcache, PHP-FPM, non-root user)
7. Test image size and functionality
**Output:** Multi-stage Dockerfile producing minimal production image
