# Rules: GitLab CI

## GITLAB-001: Masked Variables for Secrets
**Condition:** GitLab CI/CD pipeline uses API tokens or passwords
**Action:** Store as masked CI/CD variables in GitLab project settings
**Rationale:** Unmasked variables are visible in pipeline logs and job artifacts
**Consequences:** Violation exposes production credentials in CI/CD output

## GITLAB-002: Non-Privileged DIND
**Condition:** Docker-in-Docker used in pipeline
**Action:** Use non-privileged mode unless specific kernel features required
**Rationale:** Privileged mode grants container full host access
**Consequences:** Violation creates container escape vulnerability in CI/CD

## GITLAB-003: Lock File Cache Keys
**Condition:** Pipeline caches Composer or npm dependencies
**Action:** Use `composer.lock` and `package-lock.json` checksums in cache keys
**Rationale:** Static cache keys never invalidate; stale dependencies persist
**Consequences:** Violation results in stale dependency cache without invalidation

## GITLAB-004: Pipeline Timeout
**Condition:** Pipeline configured
**Action:** Set timeout to prevent runaway jobs
**Rationale:** Stuck jobs consume runner capacity indefinitely
**Consequences:** Violation blocks other pipelines from executing
