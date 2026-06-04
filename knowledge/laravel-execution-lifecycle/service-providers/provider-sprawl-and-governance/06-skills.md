# Skill: Enforce Provider Budget in CI

## Purpose

Define and enforce a hard limit on the total number of service providers (both manually registered and auto-discovered) using a CI pipeline check, preventing unchecked provider growth.

## When To Use

- Enterprise applications where provider count is a tracked health metric.
- Teams experiencing bootstrap time degradation due to provider accumulation.
- Setting up provider governance for the first time.
- After performing a provider audit to establish a baseline.

## When NOT To Use

- Small applications (<10 providers) with no performance concerns.
- Prototypes or MVPs where speed of provisioning is the priority.
- Applications where provider count is stable and well-governed manually.

## Prerequisites

- Understanding of the difference between manual and auto-discovered providers
- CI pipeline access (GitHub Actions, GitLab CI, Jenkins, etc.)
- Provider sprawl baseline measurement

## Inputs

- `bootstrap/providers.php` contents
- `bootstrap/cache/packages.php` contents
- Maximum allowed provider count (budget)
- CI configuration file

## Workflow

1. Determine the current provider count: count manual providers in `bootstrap/providers.php` + discovered providers in `bootstrap/cache/packages.php`.
2. Set a provider budget (e.g., 30 total) based on application size and performance requirements.
3. Create a CI script that counts providers and fails if budget exceeded:
   ```bash
   MAX_PROVIDERS=30
   MANUAL=$(php -r "echo count(require 'bootstrap/providers.php');")
   PACKAGES_FILE="bootstrap/cache/packages.php"
   DISCOVERED=0
   if [ -f "$PACKAGES_FILE" ]; then
       DISCOVERED=$(php -r "\$p = require '$PACKAGES_FILE'; echo count(\$p['providers'] ?? []);")
   fi
   TOTAL=$((MANUAL + DISCOVERED))
   if [ "$TOTAL" -gt "$MAX_PROVIDERS" ]; then
       echo "Provider budget exceeded: $TOTAL > $MAX_PROVIDERS"
       exit 1
   fi
   echo "Provider count: $TOTAL (budget: $MAX_PROVIDERS)"
   ```
4. Add the script as a CI step (runs on every PR and deploy).
5. When budget is exceeded, the team must consolidate, remove, or defer providers or explicitly discuss increasing the budget.

## Validation Checklist

- [ ] Provider budget value is documented and agreed upon by the team
- [ ] CI script counts both manual and auto-discovered providers
- [ ] CI pipeline fails when budget is exceeded
- [ ] Exception process exists (how to exceed budget when justified)
- [ ] Budget is reviewed quarterly and adjusted if necessary
- [ ] Provider count is also tracked as a deployment health metric

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| CI script counts only manual providers | Auto-discovered providers missing from count |
| Budget exceeded on every deploy | Budget set too low for the application — adjust or consolidate |
| Script fails because packages.php doesn't exist | Cache not built yet — run `php artisan optimize` or handle missing file gracefully |
| Budget always passed despite provider growth | Script logic error — provider count not actually being checked |

## Decision Points

- **Budget Value**: Based on application size. Small: 15, Medium: 30, Large: 50 (Octane can handle higher).
- **Failure Mode**: Fail the build vs warn. Start with warn, graduate to fail after team buy-in.

## Performance Considerations

- CI check adds negligible time to pipeline (milliseconds).
- Failing CI for budget violation is cheaper than debugging TTFB regression months later.
- Provider count correlates with bootstrap time — enforcing a budget protects performance.

## Security Considerations

- Budget enforcement can't distinguish between necessary and unnecessary providers — audit is still needed.
- A low budget may incentivize consolidation across domain boundaries, creating god providers.
- Ensure the CI script itself doesn't expose provider class names in logs (minor concern).

## Related Rules

- Rule 1: Set and Enforce a Provider Budget via CI
- Rule 4: Monitor Provider Count as a Deployment Health Metric
- Rule 5: Audit Both Manual and Auto-Discovered Providers

## Related Skills

- Perform a Provider Audit
- Audit and Optimize Eager Provider Overhead

## Success Criteria

- CI pipeline fails when provider budget is exceeded.
- Provider count stays within budget (or exceptions are documented).
- Team has visibility into provider count changes on every PR.
---

# Skill: Perform a Provider Audit

## Purpose

Systematically review all registered service providers (manual and auto-discovered) to identify candidates for removal, consolidation, or deferral — reducing bootstrap time and improving maintainability.

## When To Use

- Quarterly provider health review.
- When TTFB has increased and provider count is a suspected cause.
- After acquiring a codebase or joining a new team.
- Before setting a provider budget in CI.

## When NOT To Use

- Applications with <10 providers and no performance concerns.
- Between major feature releases — avoid unnecessary disruption.

## Prerequisites

- Access to `bootstrap/providers.php` and `bootstrap/cache/packages.php`
- List of all application domains and their responsible teams
- Bootstrap profiling data (optional but helpful)

## Inputs

- Manual provider list (`bootstrap/providers.php`)
- Auto-discovered provider list (`bootstrap/cache/packages.php`)
- Provider bootstrap timing data (if available)
- List of known abandoned or replaced packages

## Workflow

1. Collect all providers: manual + auto-discovered.
2. Categorize each provider: Infrastructure / Domain / Package / Development.
3. For each provider, answer:
   - Is this provider still needed? What breaks without it?
   - Is there a duplicate or overlapping provider?
   - Could this provider be deferred (services used on <30% of routes)?
   - Is this provider registered but its package abandoned?
4. Mark candidates for removal (unused, abandoned, replaced).
5. Mark candidates for deferral (eligible but currently eager).
6. Mark candidates for consolidation (within same domain, fragmented).
7. Implement changes and verify all bindings still work.
8. Update the provider budget baseline after audit.

## Validation Checklist

- [ ] All providers (manual + discovered) identified and categorized
- [ ] Each provider assessed for necessity with documented justification
- [ ] Abandoned or replaced packages identified
- [ ] Duplicate or overlapping providers flagged
- [ ] Deferral candidates documented with route usage percentage
- [ ] Consolidation candidates within same domain boundaries identified
- [ ] Changes implemented and verified (no broken bindings)
- [ ] Provider budget updated with new baseline

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Missed auto-discovered providers | Only auditing `bootstrap/providers.php` — check `packages.php` too |
| Removed provider that was still needed | Provider usage not fully understood — verify with code search or tests |
| Broke production by removing provider in use | No staging verification — always test audit changes in staging first |
| Audit too aggressive | Consolidated across domain boundaries, creating god providers |

## Decision Points

- **Remove vs Keep**: What would break if this provider were removed? If "nothing" and no future plans → remove.
- **Defer vs Stay**: Services used on <30% of routes and no boot-time artifacts → defer.
- **Consolidate vs Split**: Same domain, 3+ sub-providers → consider proxy pattern. Different domains → keep separate.

## Performance Considerations

- Primary goal: reduce total provider count, especially eager providers.
- Secondary goal: optimize remaining providers (lighter `register()` / `boot()`).
- 80/20 rule: 20% of providers account for 80% of bootstrap time — focus on top contributors.
- Document before and after bootstrap time for the audit report.

## Security Considerations

- Removed providers may remove security-relevant bindings — verify auth, encryption, and audit providers before removal.
- Auto-discovered packages may have had security updates that changed behavior.
- Document any security-critical findings in the audit report.

## Related Rules

- Rule 2: Perform Quarterly Provider Audits
- Rule 5: Audit Both Manual and Auto-Discovered Providers
- Rule 6: Consolidate Providers Within Domain Boundaries, Never Across Them

## Related Skills

- Enforce Provider Budget in CI
- Audit and Optimize Eager Provider Overhead

## Success Criteria

- Reduced total provider count by 20%+ or to within budget (whichever is more ambitious).
- Bootstrap time measurably improved in profiling data.
- Audit report documents all changes and justifications.
- Remaining providers are clearly categorized (infrastructure, domain, package).
