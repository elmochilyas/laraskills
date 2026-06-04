# Rule: Fix Critical Violations Immediately
---
## Category
Architecture | Reliability
---
## Rule
Always fix critical architectural violations (broken context isolation, circular dependencies, security issues) immediately in the current sprint. Do not defer them to a backlog.
---
## Reason
Critical violations block the CI pipeline or cause production issues. Every day they remain, more code is built on top of a broken foundation. The cost of fixing increases exponentially with time.
---
## Bad Example
A circular dependency between the Checkout and Billing contexts is discovered but deferred to "the refactoring sprint." Three more sprints of features are built on top of the circular dependency. The fix now involves 15 classes instead of 2.
---
## Good Example
```
Critical violation detected: Checkout → Billing → Checkout (circular)
Action: Sprint current, allocate 2 days immediately
Outcome: Circular dependency broken. Architecture tests verify fix.
```
---
## Exceptions
When a critical violation cannot be fixed in the current sprint due to external dependencies. In this case, isolate the violation and create a plan with a timeline.
---
## Consequences Of Violation
More code is built on a broken foundation. The cost of fixing multiplies. The violation becomes part of the accepted norm.

---
# Rule: Group Low-Severity Violations Into Backlog For Cleanup Sprints
---
## Category
Architecture | Maintainability
---
## Rule
Collect low-severity architectural violations (naming inconsistencies, minor convention violations) into a backlog and address them in dedicated cleanup sprints every 4-6 weeks. Do not fix each one individually.
---
## Reason
Context switching to fix each low-severity violation individually is wasteful. Grouping them into a dedicated sprint allows focused effort. The overhead of planning, branching, reviewing, and deploying each individual fix exceeds the value of the fix.
---
## Bad Example
A developer finds a class naming violation and creates a PR to fix it. The PR takes 30 minutes of review time for a 2-minute rename fix. This pattern repeats 20 times across the sprint.
---
## Good Example
```
Cleanup Sprint (Sprint 14):
- Fix 15 naming convention violations (4 hours)
- Add 3 missing repository interfaces (2 hours)
- Update 8 PHPDoc type hints (1 hour)
All in a single branch, single review.
```
---
## Exceptions
Low-severity violations in code the developer is already modifying (see boy scout rule). Fix them as part of the existing change.
---
## Consequences Of Violation
Disproportionate overhead from individual fixes. Developers stop reporting low-severity violations because the fix process is too heavy.

---
# Rule: Use Strangler Pattern For Large-Scale Refactoring
---
## Category
Architecture | Reliability
---
## Rule
When performing large-scale architectural refactoring (extracting a context, breaking a circular dependency), use the strangler pattern: build the new structure alongside the old, redirect traffic, then remove the old structure. Never do big-bang rewrites.
---
## Reason
Strangler pattern is incremental, reversible, and low-risk. At any point, the system can be rolled back to the old structure. Big-bang rewrites stop feature delivery for weeks or months and introduce massive risk.
---
## Bad Example
The team decides to extract Checkout into a separate service. They stop all feature work, create a new repository, rewrite Checkout from scratch, and deploy it as a replacement. Three months later, the new service is still not feature-complete.
---
## Good Example
```
Sprint 1: Build new Checkout service alongside existing code. Both paths work.
Sprint 2: Route 10% of traffic to new service. Monitor for issues.
Sprint 3: Route 100% of traffic. Old path remains as fallback.
Sprint 4: Remove old code. Architecture tests verify the new structure.
```
---
## Exceptions
Small refactoring tasks (renaming a class, extracting a method) that can be done in a single PR. The strangler is for large changes only.
---
## Consequences Of Violation
Long periods without feature delivery. High risk of failure. Rollback is difficult or impossible. Team morale suffers.

---
# Rule: Always Apply The Boy Scout Rule — Leave Code Cleaner Than You Found It
---
## Category
Architecture | Maintainability
---
## Rule
Fix small architectural violations in the code you touch as part of your regular work. Do not leave a violation unfixed just because "it was already there."
---
## Reason
Small violations fixed as they are encountered are cheaper than large remediation projects. A violation that takes 2 minutes to fix when first encountered becomes a 2-hour task if deferred and tracked as a separate item.
---
## Bad Example
A developer is modifying `OrderService` and notices it has an unauthorized import. They think "not my problem, I'll leave it." Six months and 10 modifications later, the import is deeply coupled into the class.
---
## Good Example
```
Modifying OrderService for a feature:
- Before: class uses unauthorized import from Inventory
- During: developer removes the unauthorized import (2 min fix)
- After: architecture test passes, feature is complete
Cost: 2 minutes now vs 2 hours later.
```
---
## Exceptions
When fixing the violation would change the scope of the PR beyond the team's agreement. Document the violation and create a backlog item.
---
## Consequences Of Violation
Small violations accumulate. Each one becomes more coupled over time. The cumulative cleanup effort becomes a large refactoring project.

---
# Rule: Always Verify Remediation With Architecture Tests In CI
---
## Category
Architecture | Reliability
---
## Rule
After any architectural remediation, verify that the fix passes all architecture tests in CI. Never consider a remediation complete until the CI pipeline confirms no violations remain.
---
## Reason
Without verification, the remediation may be incomplete. The developer may have fixed the obvious violation but introduced new ones in the process. CI verification provides objective confirmation.
---
## Bad Example
A developer fixes an unauthorized import by moving a class. They remove the old import but forget to update the architecture test exception list. The test still fails. The developer assumes the fix is complete.
---
## Good Example
```
1. Fix the violation (modify code)
2. Run architecture tests locally (green)
3. Push to CI (pre-merge gate passes)
4. Check drift score (no regression)
5. Remediation = complete
```
---
## Exceptions
None. Verification is a required step in every remediation workflow.
---
## Consequences Of Violation
Incomplete remediation. The violation persists or new violations are introduced. The team believes the problem is fixed when it is not.

---
# Rule: Classify Violations By Severity Before Scheduling Remediation
---
## Category
Architecture | Maintainability
---
## Rule
Always classify every architectural violation by severity (Critical, High, Medium, Low) before scheduling remediation. Never treat all violations equally.
---
## Reason
Without severity classification, the team cannot prioritize. Critical violations that break the architecture are treated the same as low-severity naming issues. Resources are spread thin instead of concentrated on the most impactful fixes.
---
## Bad Example
A backlog has 50 architectural violations with no severity labels. The team picks violations randomly during cleanup sprints. A critical context boundary violation sits unfixed while naming issues are addressed.
---
## Good Example
```
Severity Classification:
- CRITICAL: Broken context isolation, circular dependencies, security violations
- HIGH: Unauthorized cross-context imports, missing core contracts
- MEDIUM: Incorrect layer usage, missing interfaces
- LOW: Naming conventions, minor pattern violations
```
---
## Exceptions
None. Severity classification is foundational to effective remediation planning.
---
## Consequences Of Violation
Critical violations are not prioritized. Low-severity violations consume remediation resources. The architecture degrades where it matters most.

---
# Rule: Include Security Review For Security-Related Violations
---
## Category
Security
---
## Rule
When remediating an architectural violation with security implications (authorization bypass, data exposure, input validation gap), include a security review as part of the remediation process.
---
## Reason
Architectural violations with security implications may have already caused vulnerabilities. Simply fixing the structure without reviewing whether the vulnerability was exploited (or exists in other forms) leaves the application exposed.
---
## Bad Example
A controller is found to bypass the authorization middleware. The developer moves it behind the middleware. No one checks whether the unauthorized access path was ever used or whether other controllers have the same issue.
---
## Good Example
```
Violation: DashboardController bypasses auth middleware.
Remediation:
1. Fix: Add auth middleware to the controller.
2. Security review: Check logs for unauthorized access. Audit other
   controllers for the same pattern.
3. Follow-up: Add architecture test that all controllers in admin
   namespace have auth middleware.
```
---
## Exceptions
Violations that are clearly structural with no security impact (naming, file organization).
---
## Consequences Of Violation
Security vulnerabilities persist after the structural fix. The team assumes the fix resolved the issue, but the underlying vulnerability remains.

---
# Rule: Never Use Big-Bang Approach For Architecture Refactoring
---
## Category
Architecture | Reliability
---
## Rule
Never stop all feature development to fix all architectural violations at once. Always use incremental remediation (strangler pattern, boy scout rule, grouped cleanup sprints).
---
## Reason
Big-bang refactoring stops value delivery, introduces massive risk, and rarely completes successfully. The codebase changes everywhere at once, making it impossible to isolate bugs. Incremental approaches deliver value continuously and allow rollback at any point.
---
## Bad Example
"Let's stop everything for two months and fix all architectural debt." Two months later, the refactoring is 60% complete, the business is unhappy, and the original violations are still partially present.
---
## Good Example
```yaml
Every sprint: 80% features, 20% architecture debt.
Dedicated cleanup sprint every 6 weeks.
Boy scout rule in every PR.
Result: steady improvement without stopping delivery.
```
---
## Exceptions
When the codebase is small (under 10K LOC) and the violations are few. For any significant codebase, incremental is the only safe approach.
---
## Consequences Of Violation
Long periods without feature delivery. High risk of introducing bugs across the entire codebase. Team burnout. The refactoring is often abandoned before completion.
