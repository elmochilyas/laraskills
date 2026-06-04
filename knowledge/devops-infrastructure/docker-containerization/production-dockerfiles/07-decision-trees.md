# Decision Trees: Production Dockerfiles

## Architecture Pattern

**Need Nginx for static files?**
- Yes → Two-container (Nginx + PHP-FPM) or single FrankenPHP
- No → Single PHP container is sufficient

**Using Octane?**
- Yes → Use FrankenPHP or RoadRunner Dockerfile pattern (no Nginx)
- No → Use traditional PHP-FPM with Nginx

## Base Image

**Image size priority:**
- Critical (slow network deploys) → Alpine-based (php:8.3-fpm-alpine)
- Balanced (typical) → Debian-based (php:8.3-fpm)
- Pre-optimized → FrankenPHP official image
