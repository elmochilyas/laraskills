# Version Retirement Process

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Version retirement is the operational process of decommissioning an entire API version after it reaches end-of-life. Unlike per-endpoint deprecation, version retirement removes a complete surface area and requires coordinated migration of all consumers still on that version. The process includes freeze, migration window, cutoff, and archival phases.

## Core Concepts
- **Version Freeze:** The point at which no new features are added to the retiring version; only critical security patches are applied.
- **Migration Window:** The period between freeze announcement and forced cutoff, during which consumers must migrate.
- **Sunset Date:** The official date after which the version is no longer served.
- **Migration Report:** A dashboard showing which consumers have migrated and which remain.
- **Cutoff Enforcement:** Gateway-level blocking of requests targeting the retired version.
- **Archive:** The retired version's specification and documentation are moved to read-only storage.

## Mental Models
- **Building Demolition:** Tenants are notified months ahead, relocation plans are provided, utilities are shut off in sequence, and finally the building is demolished. The land (API namespace) may be reused later.
- **Airline Route Closure:** An airline announces a route is ending, re-books passengers on alternative routes, then closes the route. The route number (version) is retired permanently.

## Internal Mechanics
1. **Freeze Declaration:** A version is marked as frozen in the API registry — no new deployments target that version.
2. **Consumer Audit:** The consumer registry is queried for all active consumers on the retiring version.
3. **Notification Wave 1:** 6 months before cutoff — email + dashboard alert + public changelog entry.
4. **Notification Wave 2:** 3 months before cutoff — same channels plus direct outreach to high-volume consumers.
5. **Notification Wave 3:** 30 days before cutoff — escalation to named contacts.
6. **Soft Cutoff:** On sunset date, the API gateway returns `410 Gone` with a `Link` header pointing to the migration guide.
7. **Hard Cutoff:** 30 days after sunset, gateway returns `404 Not Found` and the version is removed from the registry.

## Patterns
- **Traffic-Light Retirement:** Green (active) → Yellow (frozen, deprecation headers) → Red (410 Gone) → Black (404 Not Found).
- **Gradual Traffic Shedding:** Reduce rate limits for the retiring version over time to incentivize migration.
- **Whitelist Exception:** Critical consumers can be whitelisted for extended access during the grace period.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Migration window length | 3mo / 6mo / 12mo | 6 months | Aligns with deprecation policy window |
| Soft cutoff response | 410 / 404 | 410 with Link header | Gives consumers actionable error info |
| Exception mechanism | Feature flag / Allowlist | Allowlist + expiration date | Prevents indefinite extensions |
| Archive format | Static files / DB snapshot | OpenAPI spec in S3 + docs in static site | Read-only, auditable, accessible |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Long migration window vs rapid cleanup | Long windows reduce urgency; rapid cleanup breaks unprepared consumers |
| Soft vs hard 404 response | Soft 410 gives migration info but adds confusion; hard 404 is clean but unhelpful |
| Automated vs manual exception handling | Automated is faster but may grant exceptions too easily; manual is thorough but slow |

## Performance Considerations
- Version routing at the gateway adds minimal latency (single map lookup).
- Migration report generation queries the consumer registry and request logs — schedule daily, not real-time.
- Archived specs should be served from CDN with long cache headers to reduce origin load.

## Production Considerations
- **Monitoring:** Track traffic to the retiring version daily; alert if traffic spikes after cutoff.
- **Logging:** Log all 410/404 responses to the retired version including consumer ID.
- **Backup:** Keep the retired version's deployment artifacts for 6 months in case of emergency rollback.
- **Rollback:** Maintain a feature flag that can restore the retired version for up to 30 days post-cutoff.
- **Testing:** Run integration tests after cutoff to verify the version is truly unreachable.

## Common Mistakes
- Announcing retirement without a complete migration guide.
- Not tracking consumer migration progress during the window.
- Granting exceptions without expiration dates (permanent exceptions defeat retirement).
- Retiring a version that still has undocumented dependencies (internal services).
- Failing to archive the spec before removal.

## Failure Modes
- **Incomplete Migration:** A large consumer fails to migrate by cutoff. Mitigation: escalation process with executive sponsorship.
- **Dependency Surprise:** An internal microservice still depends on the retired version. Mitigation: comprehensive dependency mapping before freeze.
- **Gateway Misconfiguration:** Version routing rule is removed before the cutoff date. Mitigation: infrastructure-as-code with PR approval for routing changes.
- **Consumer Panic:** A premature retirement announcement causes consumer flight. Mitigation: communicate "sunset date" clearly, not "imminent removal."

## Ecosystem Usage
- **Twilio:** Retires API versions on a published calendar with 12-month migration windows.
- **Google Cloud APIs:** Maintains a "Sunset" page listing all versions with their retirement dates.
- **Shopify:** Provides migration guides and version comparison tables for each retired version.

## Related Knowledge Units

### Prerequisites
- [Deprecation Policy Design](ku-01-deprecation-policy-design)
- [API Changelog Maintenance](ku-03-api-changelog-maintenance)

### Related Topics
- [Breaking Change Process](ku-05-breaking-change-process)
- [API Audit Review Process](ku-08-api-audit-review-process)

### Advanced Follow-up Topics
- Consumer migration analytics dashboard
- Automated dependency mapping across microservices
- Multi-version coexistence strategies (shadow reads, dual writes)

## Research Notes

### Source Analysis
Stripe and Twilio both use a phased notification approach with multiple waves. Twilio's 12-month window is among the most generous in the industry and correlates with their high consumer satisfaction.

### Key Insight
The hardest part of version retirement is not the technical cutoff — it's **consumer migration tracking**. Most teams underestimate the effort to identify, contact, and verify migration for every consumer. A consumer registry with contact information is a prerequisite.

### Version-Specific Notes
- Laravel 11.x: Version routing is typically handled at the gateway (nginx/OpenAPI) rather than the framework itself; Laravel serves a single API surface.
- PHP 8.4: No direct language support for version retirement; all enforcement is infrastructure-level.
