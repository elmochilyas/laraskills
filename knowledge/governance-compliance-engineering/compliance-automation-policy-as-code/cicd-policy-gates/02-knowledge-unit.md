# CI/CD Policy Gates

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** compliance-automation-policy-as-code
- **Knowledge Unit:** CI/CD Policy Gates
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

CI/CD Policy Gates enforce compliance checks within the deployment pipeline, blocking or allowing releases based on automated policy evaluation. For Laravel applications in regulated environments, these gates ensure that every deployment satisfies security, compliance, and operational requirements before reaching production, preventing configuration drift and compliance violations at the pipeline level.

---

## Core Concepts

- **Policy-as-code** expresses compliance requirements as executable checks in CI/CD pipeline configuration
- **Gating stages** are pipeline checkpoints that evaluate policies and determine pass/fail status
- **Artifact scanning** analyzes build artifacts for secrets, vulnerabilities, and compliance metadata
- **Environment promotion** gates ensure deployments only progress through environments (dev → staging → prod) when policies pass
- **Drift detection** compares actual configuration against declared compliance posture
- **Audit trail generation** creates evidence of policy evaluation for every deployment attempt

---

## Mental Models

- **The Airport Security Model:** Every deployment passes through security checkpoints. Without a boarding pass (policy approval), it doesn't board the plane (reach production).
- **The Quality Gate Model:** Like software quality gates, policy gates are toll booths — each checks a specific requirement and denies passage until it's satisfied.
- **The Immigration Checkpoint:** Each environment is a country with its own entry requirements. Code can't enter production without visas (artifact signing, vulnerability scan clearance, config validation).

---

## Internal Mechanics

CI/CD policy gates are typically implemented as pipeline stages in GitHub Actions, GitLab CI, Jenkins, or Laravel Forge deployment scripts. Each stage runs a policy evaluation tool (OPA, Conftest, Checkov, custom Laravel command). The tool receives the deployment artifact metadata and environment configuration, evaluates rules, and returns a pass/fail/error result. Pipeline execution halts on failure. Gate results are logged to an audit system for compliance evidence. Successful gates generate attestations that become part of the deployment record.

---

## Patterns

**Mandatory Gate Pattern:** All deployments must pass every gate regardless of urgency. Benefit: Highest compliance assurance. Tradeoff: Blocks emergency hotfixes — requires exemption process.

**Proportional Gate Pattern:** Different gate severity levels — blocking and warning. Blocking gates halt the pipeline; warning gates log violations but allow deployment with manual approval. Benefit: Balances compliance with deployment velocity. Tradeoff: Warning gates can be ignored, reducing compliance posture.

**Environment Progression Pattern:** Gates become stricter at each environment stage. Dev gates check basic compliance; Production gates require full attestations. Benefit: Early detection of issues with faster feedback. Tradeoff: Different gate configurations per environment require more pipeline maintenance.

---

## Architectural Decisions

Implement policy gates as separate pipeline jobs rather than inline scripts for clarity. Store policy definitions in a dedicated repository or directory versioned alongside application code. Use structured policy output (JSON) for machine-readable audit records. Choose gating tools that integrate with Laravel's ecosystem (OPA, Docker Scout, Sail validation). For Laravel specifically, add gates for: `composer audit` (dependency vulnerabilities), `phpinsights` (code quality), `pint` (coding standards), `pest --coverage` (test coverage threshold), and custom compliance commands.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated compliance enforcement | Pipeline complexity and longer build times | Deployments take 2-10 minutes longer per gate stage |
| Consistent policy application across environments | Policy drift between pipeline and actual enforcement | Must validate pipeline gates match runtime controls |
| Audit evidence generation per deployment | Storage for gate result artifacts | Centralize gate results for compliance access |
| Blocks non-compliant code before production | Emergency deployment exemptions become necessary | Exemption process must be auditable |

---

## Performance Considerations

Gate execution time adds directly to deployment duration. Run independent gates in parallel where possible. Cache policy evaluation results for unchanged artifacts between builds. Use lightweight policy engines (Conftest, custom scripts) for simple checks; reserve OPA for complex multi-factor rules. Optimize dependency scanning by using lock-file analysis instead of full vendor directory scans. Schedule full static analysis gates only on pull requests, not every pipeline trigger.

---

## Production Considerations

Define SLA for deployment gate execution — if total gate time exceeds tolerance, optimize or parallelize. Implement a break-glass procedure for emergency deployments that bypass gates with full audit trail. Monitor gate failure rates — rising failures indicate either policy issues or deployment quality problems. Regularly review gate exemptions to ensure they're still justified. Test gate bypass procedures during disaster recovery drills. Store gate logs in a write-once audit store.

---

## Common Mistakes

**Too many gates blocking all deployments** — excessive gates cause deployment friction and encourage bypass workarounds. Focus on high-risk compliance requirements.

**Gates that don't match runtime controls** — pipeline checks pass but runtime enforcement is different. Validate that CI/CD policies match application-level controls.

**No exemption process for emergencies** — when production is down, gates that block hotfixes become a liability. Design break-glass procedures before they're needed.

---

## Failure Modes

- **Gate false positive:** Pipeline blocks compliant code due to misconfigured rule. Investigate and patch policy immediately, then redeploy.
- **Gate false negative:** Non-compliant code passes a broken gate. Incident response — rollback, fix gate, redeploy with manual verification.
- **Gate tool unavailable:** Analysis tool API is down. Configure fallback to cached results or fail-open with manual approval.
- **Policy version mismatch:** CI uses stale policy version. All policies should be fetched at pipeline start from a versioned source.

---

## Ecosystem Usage

Laravel applications typically implement CI/CD policy gates through GitHub Actions, GitLab CI, or Laravel Envoyer/Forge. The `laravel/sail` CI scripts provide baseline scanning. Common gate tools in the Laravel ecosystem include: OPA (cross-service policy), Composer Audit (dependency vulnerabilities), PHPStan/PSalm (static analysis), Pint (coding standards), and Pest (test coverage thresholds). Forge deployment scripts can include pre-deployment hooks that run custom Gate checks before service restart.

---

## Related Knowledge Units

### Prerequisites
- CI/CD Pipeline Design (GitHub Actions, GitLab CI)
- DevOps & Infrastructure Domain
- Policy-as-Code Fundamentals

### Related Topics
- OPA/OpenPolicyAgent (policy engine for gates)
- Unified Control Mapping (mapping gates to compliance controls)
- Evidence Collection Automation (gate artifacts as evidence)

### Advanced Follow-up Topics
- GitOps Policy Enforcement (ArgoCD, Flux)
- Supply Chain Security (SLSA, SBOM gates)
- Deployment Freeze Automation for Audit Windows

---

## Research Notes

CI/CD policy gates are a key component of the "shift left" security movement, catching issues before they reach production. The effectiveness of gates depends on the quality of policies — poorly designed gates create friction without security value. The SLSA (Supply Chain Levels for Software Artifacts) framework provides a maturity model for CI/CD security that integrates with policy gates. For Laravel specifically, the combination of `composer audit` (dependency scanning), static analysis, and custom compliance commands provides baseline gate coverage that can be extended with OPA for complex multi-factor policies.
