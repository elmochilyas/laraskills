# Anti-Patterns: Fly.io Deployment

## AP-FLY-001: No Dockerfile Optimization
**Description:** Using default `fly launch` Dockerfile without multi-stage optimization.
**Consequences:** Large images slow deployment and increase storage costs.
**Remediation:** Use multi-stage Dockerfile. Exclude dev dependencies from runtime image.
