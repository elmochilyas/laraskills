# ECC Standardized Knowledge — API Audit Review Process

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | API Audit Review Process |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

The API audit review process is a periodic evaluation of the API surface to identify consistency violations, deprecated endpoints not cleaned up, documentation drift, security issues, and technical debt. Regular quarterly audits ensure the API remains healthy, consistent, and aligned with governance policies. Effectiveness is measured by remediation rate, not finding rate.

## Core Concepts

- **Audit frequency**: Quarterly for mature APIs; monthly for rapidly changing ones.
- **Audit checklist**: Structured set of checks covering consistency, security, deprecation status, documentation accuracy, and performance.
- **Debt tracking**: Each issue logged as technical debt with severity, owner, and target resolution date.
- **Remediation plan**: Prioritized action plan generated from audit findings.
- **Audit report**: Formal document summarizing findings, metrics, and recommendations.
- **Trend analysis**: Tracking findings over time to identify improvement or degradation.
- **Blocker classification**: Blocker, Critical, Major, Minor, Suggestion.

## When To Use

- Regular API health evaluation (quarterly minimum)
- Pre-release review before major API version launches
- Post-incident review to identify systemic issues
- Compliance-driven evaluations for regulated industries

## When NOT To Use

- Real-time monitoring (covered by API Monitoring and Alerting)
- Individual endpoint design review (covered by Team API Consistency Rules)
- Security penetration testing (separate process)

## Best Practices

- **Automated first, manual second**: Run all automated checks (Spectral + custom scripts), then focus human review on what automation cannot catch.
- **Rotating auditor role**: Share knowledge and prevent blind spots by rotating audit responsibility.
- **Debt budget**: Allocate 10% of sprint capacity to remediating audit findings.
- **Severity-based action thresholds**: Critical findings fixed within 48 hours; Major within current sprint; Minor within quarter.
- **Measure remediation rate**: Track closure rate, not open findings count.

## Architecture Guidelines

- Audit checklist includes: OpenAPI linting, deprecation report, security scan, documentation diff, consistency scoring.
- Remediation tracked in GitHub Issues with labels matching severity.
- Audit reports stored in repository for historical reference.
- Trend dashboard updated after each audit cycle with automated data.

## Performance Considerations

- Automated checks run in under 5 minutes for most API surfaces.
- Manual audit: 2-4 hours per quarter for mature API; 4-8 hours for growing API.
- Debt tracking overhead negligible once integrated into existing workflows.

## Security Considerations

- Emergency findings (security) bypass normal audit cycle — reported, fixed, verified within 48 hours.
- Audit reports may contain security vulnerability details. Access-controlled storage.
- Rotating auditor role includes security checklist items.

## Common Mistakes

- Treating audits as one-time event rather than ongoing process.
- Generating reports nobody reads (no accountability for findings).
- Flagging too many issues (audit fatigue) or too few (missed problems).
- Not following up on remediation — findings accumulate and overwhelm.
- Auditing only production and ignoring staging/development environments.

## Anti-Patterns

- **Audit fatigue**: Too many low-severity findings -> team ignores audit entirely.
- **Remediation stagnation**: Findings remain open for quarters with no progress.
- **Inconsistent auditor standards**: Different auditors apply different standards without calibration.

## Examples

- Audit frequency: Quarterly automated + manual review. Schedule triggered first day of quarter.
- Severity classification: Blocker = production outage, Critical = data loss, Major = breaking consumer contract, Minor = convention violation, Suggestion = improvement opportunity.
- Remediation tracking: `10% sprint allocation for audit findings; older findings prioritized over newer ones`.

## Related Topics

- **Prerequisites**: Team API Consistency Rules, API Style Guide Documentation
- **Closely Related**: ADR Process for APIs, API Monitoring and Alerting
- **Advanced**: Automated audit trend dashboards, Cross-team audit coordination, SLA-based remediation timelines per severity

## AI Agent Notes

When conducting API audits: run automated checks first (Spectral + custom), then manual review for semantic issues, rotate auditor role each quarter, allocate 10% sprint capacity to remediation, measure remediation rate not finding rate, use severity-based action thresholds, track trend over time.

## Verification

Sources: Google AIP framework audit requirements, Stripe internal quality program, domain-analysis.md.
