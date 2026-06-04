# Rules: API Version Governance

## Rule: Define Version Nomenclature
- **Condition:** When establishing API version governance
- **Action:** Define four version states: Active, Deprecated, Sunset, Removed. Document each state's definition, support level, and transition triggers.
- **Consequence:** Clear version states enable predictable lifecycle management and consumer planning.
- **Enforcement:** Governance review enforces that every version has a current state assignment.

## Rule: Set Minimum Supported Version Policy
- **Condition:** When operating multi-version APIs
- **Action:** Adopt N-2 as the minimum supported version policy. Document the policy in the API style guide. Internal APIs may use N-1.
- **Consequence:** Limits maintenance burden to economically justifiable levels while giving consumers reasonable migration windows.
- **Enforcement:** CI checks reject deployments that would increase supported version count beyond N-2.

## Rule: Enforce Major-Only Versioning For APIs
- **Condition:** When defining API version labels
- **Action:** Use Major.Minor format where major version changes signal breaking changes. Minor version signals additive, non-breaking changes. Never use Patch for API version labels.
- **Consequence:** Consumers know a major version bump requires attention; minor bumps are safe to accept.
- **Enforcement:** Automated checks prevent breaking changes within a major version.

## Rule: Track Version Usage Metrics Before Deprecation
- **Condition:** Before deprecating any API version
- **Action:** Collect and review per-version usage metrics (requests/day, active consumers). Deprecate only when usage drops below established threshold or replacement version has been available for minimum 6 months.
- **Consequence:** Data-driven deprecation prevents accidentally breaking consumers not visible to the team.
- **Enforcement:** Governance checklist requires usage metric review before deprecation approval.

## Rule: Set Sunset Dates At Deprecation Time
- **Condition:** When deprecating an API version
- **Action:** Set and communicate a specific sunset date immediately upon deprecation. Minimum 6-month window for public APIs. Document in changelog and notify registered consumers.
- **Consequence:** Consumers have clear migration deadline and cannot claim ignorance of removal.
- **Enforcement:** Deprecation without sunset date is rejected by governance review.

## Rule: Review Governance Quarterly
- **Condition:** Every calendar quarter for teams with multi-version APIs
- **Action:** Conduct version governance review: assess usage metrics, review deprecation candidates, confirm sunset dates, update changelog, plan consumer communications.
- **Consequence:** Regular reviews prevent version accumulation and ensure governance stays current.
- **Enforcement:** Governance review logged with decision record; missed reviews flagged to engineering management.

## Rule: Communicate Sunset Dates To All Consumers
- **Condition:** When an API version reaches sunset phase
- **Action:** Notify all known consumers via documented communication channels (email, dashboard notification, webhook). Include migration deadline, migration guide link, and escalation contact.
- **Consequence:** Consumers receive actionable notice with time to migrate.
- **Enforcement:** Consumer notification receipt tracked in governance system.

## Rule: Apply Security Patches To All Supported Versions
- **Condition:** When a security vulnerability is identified
- **Action:** Patch all Active and Deprecated versions within SLA. Versions that cannot be patched within SLA must be accelerated to Sunset.
- **Consequence:** All supported versions maintain security posture; vulnerable versions are removed faster.
- **Enforcement:** Security team notified of all version state changes; patch latency tracked per version.

## Rule: Deprecation Must Include Migration Path
- **Condition:** When deprecating a version
- **Action:** Provide a documented migration path from the deprecated version to the recommended version. Include specific changes required, breaking differences, and any automated migration tools.
- **Consequence:** Consumers can execute migration without reverse-engineering the differences.
- **Enforcement:** Migration path documentation is a required field in deprecation record.

## Rule: No Breaking Changes In Non-Major Versions
- **Condition:** When making changes within an existing major version
- **Action:** All changes must be backward-compatible: additive only, no field removals, no semantic changes, no tightened validation.
- **Consequence:** Consumers can upgrade minor versions without regression testing.
- **Enforcement:** Automated contract tests compare current vs proposed response schemas; breaking changes fail CI.
