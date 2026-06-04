# Decision Trees: FrankenPHP Standalone

## Adoption Decision

**Is this a new deployment?**
- Yes → FrankenPHP is default recommendation
- No → Evaluate migration cost from Nginx+PHP-FPM

**Need Mercure?**
- Yes → FrankenPHP is ideal (built-in Mercure hub)
- No → FrankenPHP still recommended, Mercure can be disabled

## Runtime Selection

**Deployment model:**
- Container-based → Use `dunglas/frankenphp` Docker image
- Bare metal → Use FrankenPHP standalone binary
- Kubernetes → Use FrankenPHP Docker image with K8s deployment
