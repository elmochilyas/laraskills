# ECC Standardized Knowledge — Version Retirement Policy

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Version Retirement Policy |
| Difficulty | Advanced |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

A version retirement policy defines the rules and procedures for removing old API versions. This KU covers implementing the retirement policy as code: minimum notice periods, escalation procedures, automated retirement enforcement, and exception handling. A retirement policy without enforcement is a suggestion — the hardest part is not defining the policy but following it consistently when confronted with consumer pushback. Key parameters include minimum notice period (12 months for public, 6 for internal), retirement cadence (quarterly), and auto-removal thresholds.

## Core Concepts

- **Minimum Notice Period**: Guaranteed time between deprecation announcement and removal (12mo public, 6mo internal)
- **Retirement Criteria**: Conditions that must be met before removal (traffic < threshold, notice period met, alternative stable)
- **Retirement Procedure**: Step-by-step process for removing a version (routes, docs, tests, monitoring)
- **Exception Handling**: Process for retiring outside the normal schedule (VP-level approval)
- **Retirement Queue**: Prioritized list of versions scheduled for removal (traffic-based prioritization)
- **Post-Retirement Validation**: Automated tests that retired endpoints return 410 for 90 days

## When To Use

- When an API version has been deprecated and meets retirement criteria
- As part of API lifecycle governance — regular retirement cadence
- When setting expectations with consumers about version support windows
- When defining SLA commitments for API versions

## When NOT To Use

- For versions still actively used by a significant portion of consumers
- When no stable alternative version exists
- During peak business periods or holidays

## Best Practices

- **Publish the retirement policy publicly** so consumers know what to expect.
- **Maintain a retirement calendar** showing planned removals for the next 24 months.
- **Never retire a version without an alternative available and stable**.
- **Automate retirement eligibility checks** — traffic < 1% for 60 days triggers review.
- **Use a retirement queue** prioritized by traffic (remove least-used first).
- **Maintain an exception register** with rationale, approver, and expiry for all exceptions.
- **Post-retention guarantee**: 410 for 90 days after retirement for consumer debugging.

## Architecture Guidelines

- Retirement policy evaluation is an offline CI/ops task — zero runtime overhead.
- Published retirement policy at a stable URL so consumers can programmatically check.
- Version status lifecycle: `ACTIVE → DEPRECATED → SUNSET → RETIRED`.
- Config-gated route loading enables emergency restore of retired versions.
- Automated removal via scheduled commands running on a nightly cron.

## Performance Considerations

- Retirement policy evaluation runs offline — zero runtime cost.
- Exception handling is a process, not code — no performance impact.
- Post-retirement validation runs as a test suite, not in production.

## Security Considerations

- Emergency retirement process for security vulnerabilities (bypasses standard timeline).
- Ensure retired versions don't accidentally serve data due to configuration drift.
- Post-retirement audit to verify retired versions return 410 and serve no traffic.

## Common Mistakes

- Having a retirement policy but not enforcing it — versions never actually removed.
- Retiring a version while an alternative is still in beta or unstable.
- Not having an exception process — every retirement is either rigid or arbitrary.
- Making too many exceptions — policy becomes meaningless.

## Anti-Patterns

- **Perpetual support**: Fear of breaking consumers leads to never retiring old versions.
- **Surprise retirement**: Version retired without following the policy's notice period.
- **Policy as excuse**: Team uses policy to justify aggressive removal without consumer empathy.

## Examples

```php
// config/api/retirement.php
return [
    'min_notice_months' => [
        'public' => 12,
        'internal' => 6,
    ],
    'auto_remove_after_months' => 18,
    'retirement_cadence' => 'quarterly',
    'criteria' => [
        'deprecation_notice_sent' => true,
        'traffic_percentage' => 1, // Remove if traffic < 1%
        'alternative_version_stable' => true,
        'notice_period_met' => true,
    ],
];

// Retirement eligibility check
class RetirementEligibilityCommand
{
    public function handle(): void
    {
        foreach (config('api.versions') as $version => $config) {
            if ($config['status'] !== 'DEPRECATED') continue;

            $traffic = TrafficAnalyzer::getVersionTraffic($version);

            if ($traffic->percentage() < 1 && $this->noticePeriodMet($version)) {
                $this->scheduleRetirement($version);
            }
        }
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: phased-deprecation-timeline, when-to-create-new-version
- **Advanced**: API lifecycle management, SLA management for deprecated versions

## AI Agent Notes

- A retirement policy without enforcement is a suggestion. The hardest part is following it consistently when confronted with consumer pushback.
- A retirement policy's true test is the first time a large, vocal consumer fights against it — the policy must withstand pressure from accounts with significant revenue.
- Stripe's 12-month retirement policy with quarterly release windows is the industry reference implementation.

## Verification

- [ ] Retirement policy documented and published publicly
- [ ] Minimum notice period defined (12mo public, 6mo internal)
- [ ] Retirement criteria defined and enforced (traffic %, notice period, alternative stability)
- [ ] Retirement queue maintained with priority scoring
- [ ] Exception process documented with approval chain
- [ ] Post-retirement 410 responses maintained for 90 days
- [ ] Retirement audit runs automatically to verify versions are gone
