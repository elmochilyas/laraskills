# Decision Trees: Dockerfile Optimization

## Base Image Selection

**Performance requirement:**
- Maximum performance → `php:8.3-fpm` (Debian-based, larger but well-tested)
- Minimal size → `php:8.3-fpm-alpine` (smaller image, smaller attack surface)
- Pre-optimized → `dunglas/frankenphp` (includes Octane, Caddy)

## Multi-Stage Strategy

**Assets to build:**
- No frontend framework → 2-stage (vendor + runtime)
- Vue/React with npm → 3-stage (vendor + node + runtime)
- Heavy build steps → 4-stage (vendor + node + build tools + runtime)
