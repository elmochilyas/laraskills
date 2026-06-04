# Skill: Remediate Architectural Violations Systematically

## Purpose
Classify violations by severity (Critical/High/Medium/Low). Fix critical violations immediately in the current sprint. Group low-severity violations into backlog for cleanup sprints every 4-6 weeks. Use strangler pattern for large-scale refactoring. Apply the boy scout rule (leave code cleaner than you found it). Verify remediation with architecture tests in CI. Include security review for security-related violations. Never use big-bang approach.

## When To Use
- Fixing known architectural violations
- Reducing drift score over time

## When NOT To Use
- Experimental or throwaway code
- Modules scheduled for complete rewrite next quarter

## Prerequisites
- Drift detection configured (AEG-08)
- Architecture tests defined (AEG-01)

## Inputs
- Violation list with severity
- Remediation plan per violation

## Workflow
1. **Classify violations by severity before scheduling remediation.** Critical: broken context isolation, circular dependencies, security. High: unauthorized imports, missing core contracts. Medium: incorrect layer usage. Low: naming conventions.

2. **Fix critical violations immediately.** Critical violations block CI or cause production issues. Allocate time from the current sprint. Don't let them accumulate.

3. **Group low-severity violations into backlog for cleanup sprints.** Collect into a backlog. Address in dedicated cleanup sprints every 4-6 weeks. Context switching for each low-severity fix is wasteful.

4. **Use strangler pattern for large-scale refactoring.** Build the new structure alongside the old, redirect traffic, then remove the old structure. Never big-bang rewrites.

5. **Apply the boy scout rule — leave code cleaner than you found it.** Fix small violations in the code you touch as part of regular work. A 2-minute fix now is cheaper than a 2-hour task later.

6. **Always verify remediation with architecture tests in CI.** After remediation, run all architecture tests. Never consider a remediation complete until CI confirms no violations remain.

7. **Include security review for security-related violations.** When remediating a violation with security implications, review whether the vulnerability was exploited or exists in other forms.

8. **Never use big-bang approach for architecture refactoring.** Never stop all feature development to fix all violations at once. Always use incremental remediation.

## Validation Checklist
- [ ] Violations are classified by severity
- [ ] Critical violations are fixed immediately
- [ ] Low-severity violations are tracked in backlog
- [ ] Large refactoring uses strangler approach
- [ ] Boy scout rule is practiced (fix violations in code you touch)
- [ ] Remediation is verified by architecture tests in CI
- [ ] Security review included for security-related violations

## Common Failures
- **Ignoring violations.** "We'll fix it later" — later never comes.
- **Big-bang refactoring.** Stopping all feature work — high risk, long period without delivery.
- **No verification.** Remediation not verified — violation may not be fully fixed.

## Decision Points
- **Fix immediately vs backlog?** Critical/High: fix immediately. Medium/Low: backlog for cleanup sprint.
- **Strangler vs rewrite?** Strangler for large refactoring. Direct fix for small changes.

## Performance Considerations
- Refactoring is development-time cost. No production performance impact.

## Security Considerations
- Remediation workflows should include security review if the violation has security implications.

## Related Rules
- Rule: Fix Critical Violations Immediately (AEG-09/05-rules.md)
- Rule: Group Low-Severity Violations For Cleanup Sprints (AEG-09/05-rules.md)
- Rule: Use Strangler Pattern For Large-Scale Refactoring (AEG-09/05-rules.md)
- Rule: Always Apply The Boy Scout Rule (AEG-09/05-rules.md)
- Rule: Always Verify Remediation With Architecture Tests (AEG-09/05-rules.md)
- Rule: Classify Violations By Severity (AEG-09/05-rules.md)
- Rule: Include Security Review For Security Violations (AEG-09/05-rules.md)
- Rule: Never Use Big-Bang Approach (AEG-09/05-rules.md)

## Related Skills
- Track Architecture Drift (AEG-08/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

## Success Criteria
- Every violation is classified by severity (Critical/High/Medium/Low) before remediation.
- Critical violations are fixed immediately in the current sprint — no deferral.
- Low-severity violations are grouped into cleanup sprints every 4-6 weeks.
- Large refactoring uses the strangler pattern — incremental, reversible, low-risk.
- The boy scout rule is applied in every PR — small violations fixed as encountered.
- Every remediation is verified by passing architecture tests in CI.
- Security-related violations include a security review as part of remediation.
