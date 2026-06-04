# Version Retirement Policy — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
A version retirement policy defines the rules and procedures for removing old API versions. Phase 2 covers implementing the retirement policy as code: minimum notice periods, escalation procedures, automated retirement enforcement, and exception handling.

## Core Concepts
- **Minimum Notice Period:** The guaranteed minimum time between deprecation announcement and removal.
- **Retirement Criteria:** Conditions that must be met before a version can be retired.
- **Retirement Procedure:** Step-by-step process for removing a version.
- **Exception Handling:** Process for retiring a version outside the normal schedule.

## Mental Models
- **Library Book Weeding:** Libraries retire books based on usage (checked out in last 2 years), condition, and availability of newer editions. Same for API versions.
- **Building Evacuation:** A controlled evacuation has announcements, timelines, support for those who need extra time, and a final sweep. Uncontrolled evacuation is a fire drill.

## Internal Mechanics
- Retirement policy config: `config('api.retirement')` with `min_notice_months`, `auto_remove_after_months`, `exceptions`.
- Retirement eligibility check: a command evaluates each deprecated version against criteria.
- Retirement automation: versions passing all criteria are automatically scheduled for removal.
- Retirement log: audit trail of all retirements with timestamps and rationale.

## Patterns
- Retirement criteria checklist: deprecation notice sent, traffic < X%, minimum notice period met, alternative version stable.
- Retirement window: quarterly windows when retirements happen (e.g., first Monday of quarter).
- Exception process: documented approval chain for early or late retirement.
- Retirement notification: automated emails to affected consumers 90/60/30 days before removal.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Minimum notice period | 12 months for public, 6 months for internal | Industry standard |
| Retirement cadence | Quarterly | Predictable, batch overhead |
| Auto-removal | Traffic < 1% for 60 days | Data-driven |
| Exception process | VP-level approval | Significant decision |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Long notice period (12mo) | Consumer-friendly | Long support burden |
| Short notice period (3mo) | Quick cleanup | Consumer friction |
| Batch retirement (quarterly) | Predictable | Wait for removal window |
| Continuous retirement | Immediate cleanup | Operational churn |

## Performance Considerations
- Retirement policy evaluation is an offline CI/ops task, zero runtime overhead.
- Exception handling is a process, not code — no performance impact.
- Automated removal via scheduled commands running on a nightly cron.

## Production Considerations
- Publish the retirement policy publicly so consumers know what to expect.
- Maintain a retirement calendar showing planned removals for the next 24 months.
- Never retire a version without an alternative available and stable.
- Include retirement policy in API onboarding documentation.

## Common Mistakes
- Having a retirement policy but not enforcing it (versions never actually removed).
- Retiring a version while an alternative is still in beta or unstable.
- Not having an exception process — every retirement is either rigid or arbitrary.
- Forgetting to retire internal services that depend on deprecated versions.

## Failure Modes
- **Perpetual support:** Fear of breaking consumers leads to never retiring old versions.
- **Surprise retirement:** Version retired without following the policy's notice period.
- **Policy inconsistency:** Different teams follow different retirement timelines.
- **Critical dependency:** External consumer depends on old version and can't migrate — exception needed.

## Ecosystem Usage
- **Stripe:** 12-month retirement policy with quarterly release windows.
- **GitHub:** Version retirement announced 12 months in advance, enforced automatically.
- **Twilio:** 12-month policy with documented exception process for enterprise customers.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- When to create new version
- Breaking change identification

### Advanced Follow-up Topics
- API lifecycle management
- SLA management for deprecated versions

## Research Notes
### Source Analysis
Stripe's "API Versions" documentation (2023) defines their retirement policy explicitly. Twilio's "End of Life" policy (2023) provides a detailed exception framework.

### Key Insight
A retirement policy without enforcement is a suggestion. The hardest part is not defining the policy — it's following it consistently when confronted with consumer pushback.

### Version-Specific Notes
Laravel 11's maintenance mode (`php artisan down`) can serve as a temporary retirement mechanism: redirect deprecated versions to a maintenance page with migration info.
