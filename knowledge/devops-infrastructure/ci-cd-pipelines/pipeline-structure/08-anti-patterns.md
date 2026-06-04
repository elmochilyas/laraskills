# Anti-Patterns: Pipeline Structure

## AP-PIPE-001: The Pipeline That Never Ends
**Description:** A pipeline with 15+ stages that takes 45+ minutes to complete.
**Why it happens:** Every tool and check is added to the pipeline without considering cumulative execution time.
**Consequences:** Developers stop waiting for pipeline results. Deployments happen daily instead of per-commit. When a failure occurs, context is lost.
**Remediation:** Set a maximum pipeline duration target (10 minutes for standard projects). Move expensive but non-critical checks to scheduled overnight jobs.

## AP-PIPE-002: The Skip-the-Pipeline Deploy
**Description:** Developers deploy to production bypassing the pipeline entirely because it's too slow or unreliable.
**Why it happens:** The pipeline has become a bottleneck, not a safety net.
**Consequences:** Untested code reaches production. The pipeline is maintained but unused — worse than having no pipeline, because it creates false confidence.
**Remediation:** Make the pipeline fast (under 10 minutes) and reliable. Remove steps that frequently false-positive. Enforce pipeline-only deployments through infrastructure controls.

## AP-PIPE-003: Rebuild for Rollback
**Description:** Rollback requires rebuilding the previous version because no artifacts are retained.
**Why it happens:** Artifact storage is perceived as unnecessary cost.
**Consequences:** If dependencies (Composer packages, npm packages) have changed since the previous build, the rebuilt version may differ from the originally deployed version.
**Remediation:** Retain build artifacts for the rollback window. Label artifacts with commit SHA and build timestamp.
