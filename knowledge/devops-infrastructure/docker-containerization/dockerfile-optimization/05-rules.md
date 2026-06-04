# Rules: Dockerfile Optimization

## DOCKERFILE-001: Lock File First
**Condition:** Dockerfile copies application code for dependency installation
**Action:** Copy `composer.json` and `composer.lock` before copying application source
**Rationale:** Dependency installation only changes when lock files change, not on every code change
**Consequences:** Violation invalidates Composer cache on every code change, doubling build time

## DOCKERFILE-002: Multi-Stage Builds
**Condition:** Production Dockerfile for Laravel
**Action:** Use multi-stage builds to separate build toolchain from runtime
**Rationale:** Build stage has Node.js, Composer; runtime stage has only PHP and PHP extensions
**Consequences:** Violation ships Node.js and Composer binaries in production image

## DOCKERFILE-003: Pin Base Image Tags
**Condition:** Dockerfile specifies base image
**Action:** Use specific version tags (`php:8.3.12-fpm-alpine`), not major-only (`php:8.3-fpm`)
**Rationale:** Floating tags silently pull newer images with potentially breaking changes
**Consequences:** Violation causes unreproducible builds

## DOCKERFILE-004: Non-Root User
**Condition:** Production runtime container
**Action:** Create and switch to non-root user before running application
**Rationale:** Root in container has same UID as root on host; container escape grants full host access
**Consequences:** Violation enables privilege escalation on container compromise
