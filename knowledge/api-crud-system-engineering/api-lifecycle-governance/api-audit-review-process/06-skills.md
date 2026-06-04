# Skill: Conduct API Audit Reviews

## Purpose
Perform periodic API surface audits using automated checks first then manual review, with severity-based remediation thresholds, rotating auditor role, 10% sprint capacity allocation, and version-controlled audit reports.

## When To Use
- Regular API health evaluation (quarterly minimum)
- Pre-release review before major API version launches
- Post-incident review to identify systemic issues
- Compliance-driven evaluations for regulated industries

## When NOT To Use
- Real-time monitoring (covered by API Monitoring and Alerting)
- Individual endpoint design review (covered by Team API Consistency Rules)
- Security penetration testing (separate process)

## Prerequisites
- Team API consistency rules
- OpenAPI spec and documentation
- Automated linting tools (Spectral)

## Inputs
- Audit checklist (consistency, security, deprecation, docs accuracy, performance)
- Previous audit report for trend comparison
- OpenAPI spec per API version

## Workflow
1. Run automated checks first (Spectral linting, deprecation report, security scan, documentation diff) before manual review
2. Generate structured audit report with findings categorized by severity (Blocker, Critical, Major, Minor, Suggestion)
3. Log each finding as technical debt with severity, owner, and target resolution date
4. Enforce severity-based action thresholds: Critical within 48 hours, Major within sprint, Minor within quarter
5. Allocate 10% of sprint capacity to audit finding remediation
6. Measure and report remediation closure rate as primary metric — not finding discovery count
7. Rotate auditor role each quarter — never same person consecutive quarters
8. Store audit reports in version control for historical reference and trend analysis
9. Audit staging and development environments alongside production

## Validation Checklist
- [ ] Automated checks run before manual review
- [ ] Findings categorized by severity (Blocker/Critical/Major/Minor/Suggestion)
- [ ] Remediation tracked with owners and target dates
- [ ] Severity-based action thresholds enforced
- [ ] 10% sprint capacity allocated to remediation
- [ ] Remediation closure rate tracked as primary metric
- [ ] Auditor role rotated each quarter
- [ ] Audit reports committed to version control
- [ ] All environments audited (not just production)

## Common Failures
- Treating audits as one-time event rather than ongoing process
- Generating reports nobody reads
- Flagging too many issues (audit fatigue) or too few (missed problems)
- Not following up on remediation — findings accumulate
- Auditing only production, ignoring staging/development environments

## Decision Points
- Audit frequency: quarterly (mature) vs monthly (rapidly changing)
- Severity classification scale: 5-level vs 3-level
- Remediation budget: 10% vs 15% for high-debt periods

## Performance Considerations
- Automated checks run in under 5 minutes for most API surfaces
- Manual audit: 2-4 hours per quarter for mature API
- Debt tracking overhead negligible once integrated into existing workflows

## Security Considerations
- Emergency security findings bypass normal audit cycle — fixed within 48 hours
- Audit reports may contain security vulnerability details — access-controlled storage
- Rotating auditor role includes security checklist items

## Related Rules
- Run Automated Checks Before Manual Review
- Measure Remediation Rate, Not Finding Rate
- Allocate 10% of Sprint Capacity to Remediation
- Enforce Severity-Based Action Thresholds
- Rotate Auditor Role Each Quarter
- Store Audit Reports in Version Control
- Never Let Audits Cover Only Production

## Related Skills
- Enforce Team API Consistency
- Implement ADR Process for APIs
- Monitor API Health

## Success Criteria
- Automated checks catch majority of issues before manual review
- Critical findings are fixed within 48 hours
- Remediation rate stays above 80%
- Audit reports are accessible in version control for trend analysis
- Findings do not accumulate across quarters
- All environments are covered by audit scope
