# Anti-Patterns: Dockerfile Optimization

## AP-DOCKERFILE-001: The Monolithic Dockerfile
**Description:** A single-stage Dockerfile that includes Composer, Node.js, PHP, and all build tools in the final image.
**Consequences:** Final image size exceeds 1GB. Every CVE in build tools is present in the runtime image.
**Remediation:** Use multi-stage builds. Build stage has all tools; runtime stage has only PHP and extensions.

## AP-DOCKERFILE-002: COPY . Everywhere
**Description:** Using `COPY . /var/www` before running `composer install`, invalidating the entire layer cache on every source code change.
**Consequences:** Every code change invalidates the dependency installation cache. Build time increases from 2 minutes to 10 minutes.
**Remediation:** Copy `composer.*` first, run `composer install`, then copy the rest of the source.
