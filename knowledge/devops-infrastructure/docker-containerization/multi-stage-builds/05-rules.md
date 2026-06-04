# Rules: Multi-Stage Builds

## MULTI-001: Minimum 2 Stages for Production
**Condition:** Production Dockerfile for Laravel
**Action:** Use at minimum 2 stages: vendor (Composer) + runtime (PHP)
**Rationale:** Composer requires PHP and potentially git/ssh at build time but not at runtime
**Consequences:** Violation ships Composer binary and dev dependencies in production image

## MULTI-002: Asset Build Separation
**Condition:** Application includes frontend assets (Vue, React, Tailwind)
**Action:** Add dedicated node stage for asset compilation
**Rationale:** Node.js and build dependencies are not needed in PHP runtime
**Consequences:** Violation ships Node.js in production image, increasing size by 300MB+

## MULTI-003: Stage Artifact Minimization
**Condition:** COPY --from between stages
**Action:** Copy only required artifacts, not entire intermediate stage filesystem
**Rationale:** Intermediate stages may contain cache files and build artifacts not needed at runtime
**Consequences:** Violation copies unnecessary files, increasing image size
