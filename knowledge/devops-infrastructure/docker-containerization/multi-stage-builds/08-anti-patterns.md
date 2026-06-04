# Anti-Patterns: Multi-Stage Builds

## AP-MULTI-001: Single Stage Container
**Description:** A single Dockerfile stage containing PHP, Node.js, Composer, and all build tools.
**Consequences:** Image size exceeds 1.5GB. CVE scanning reveals hundreds of vulnerabilities in build tools.
**Remediation:** Split into multi-stage build. Runtime stage has only PHP and necessary extensions.

## AP-MULTI-002: COPY --from Whole Stage
**Description:** Using `COPY --from=vendor /` to copy entire vendor stage filesystem.
**Consequences:** Copies Composer cache, apt lists, and temporary build files into the runtime image.
**Remediation:** Copy specific directories: `COPY --from=vendor /app/vendor /var/www/vendor`.
