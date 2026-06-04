# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module extraction path: from module to independent service
Knowledge Unit ID: MMD-11
Difficulty Level: Advanced
Last Updated: 2026-06-02

---
## Rule Name
Extract only when specific, measurable triggers are met
---
## Category
Architecture
---
## Rule
Extract a module to a microservice only when one or more of these triggers is demonstrably true: resource requirement divergence, independent team ownership need, technology stack divergence, or performance isolation requirement.
---
## Reason
Extraction is always a cost (CI x2, deploy x2, monitoring x2, network latency). It provides no benefit unless specific organizational or technical constraints prevent the monolith from working. The modular monolith is a valid end-state architecture, not a temporary state.
---
## Bad Example
```php
// Extraction trigger: "Microservices are trendy"
// No measurable divergence — just excitement
// Result: operational complexity doubles, no business benefit
```
---
## Good Example
```php
// Extraction trigger documented:
// 1. Billing module: 70% of total DB CPU
// 2. Billing deploys 3x more than other modules
// 3. Billing team needs independent deployment cadence
// Decision: Extract Billing to microservice
```
---
## Exceptions
Organizational mandates (e.g., company-wide architecture directive) may force extraction before measurable triggers are met. In this case, document risks and proceed with Strangler Fig pattern.
---
## Consequences Of Violation
Operational cost increases without benefit; development velocity drops; team spends time on distribution infrastructure instead of features.

---
## Rule Name
Harden contracts before extraction begins
---
## Category
Architecture
---
## Rule
Before extracting a module, ensure all its contracts are stable (no changes in the last 4 weeks), documented, versioned, and have comprehensive contract tests. Freeze the contract during extraction.
---
## Reason
Contract changes during extraction add significant cost — every interface change requires updating both the monolith implementation and the new service. Stable contracts are the prerequisite for safe extraction.
---
## Bad Example
```php
// Extraction starts while contracts are still evolving
// Module A: InvoiceContract changes 3 times during extraction
// Each change: update monolith + update new service + update consumers
// Extraction timeline doubles
```
---
## Good Example
```php
// Pre-extraction checklist:
// [x] InvoiceContract stable for 4 weeks (no changes)
// [x] Contract tests exist and pass
// [x] All consumers documented
// [x] Breaking changes versioned (V2 created if needed)
// [x] Contract frozen for duration of extraction
```
---
## Exceptions
Greenfield modules (no existing consumers) may be extracted without contract hardening, but should stabilize contracts before going production.
---
## Consequences Of Violation
Extraction timeline bloats; contract drift causes integration bugs; consumers require simultaneous updates.

---
## Rule Name
Use Strangler Fig pattern for gradual extraction
---
## Category
Architecture
---
## Rule
Extract via the Strangler Fig pattern: gradually redirect routes and consumers from the monolith module to the new service, one route at a time, never via a big-bang deployment.
---
## Reason
Big-bang extraction is high-risk — if the new service has issues, everything breaks simultaneously with no rollback path. Strangler Fig enables gradual traffic shifting, per-feature verification, and instant rollback.
---
## Bad Example
```php
// Big-bang extraction
// Monday: All billing traffic goes to monolith
// Tuesday: ALL billing traffic goes to new service (cutover)
// Wednesday: New service has performance issue — cannot roll back easily
```
---
## Good Example
```php
// Strangler Fig extraction
// Week 1: GET /api/invoices -> new service (10% traffic)
// Week 2: GET /api/invoices -> new service (50% traffic)
// Week 3: GET /api/invoices -> new service (100% traffic)
// Week 4: POST /api/invoices -> new service (10% traffic)
// ...
// Each step: verify, then increase. Instant rollback if issues.
```
---
## Exceptions
Internal modules with no external API (background job only) may have less room for gradual extraction. Extract the job worker as a whole, with a feature flag for the full switch.
---
## Consequences Of Violation
High-risk cutover; no rollback capability; organization-wide impact if the new service fails.

---
## Rule Name
Never share the database after extraction
---
## Category
Architecture
---
## Rule
An extracted microservice must have its own separate database. The new service must not share the monolith's database — this creates a distributed monolith (worst of both worlds).
---
## Reason
A shared database between the monolith and the extracted service means schema changes require coordination, queries can still JOIN across services, and deployment coupling remains. The extracted service is not truly independent.
---
## Bad Example
```php
// Extracted Billing service still uses monolith's database
'mysql' => [
    'database' => 'monolith_db', // SHARED — distributed monolith
]
// Schema change in Billing still requires monolith coordination
```
---
## Good Example
```php
// Extracted Billing service gets its own database
'mysql' => [
    'database' => 'billing_service_db', // INDEPENDENT
]
// Schema changes only affect Billing service
// Communication only via HTTP/queue
```
---
## Exceptions
During transition period (Strangler Fig), both the monolith module and the new service may temporarily access the same database. This must be phased out with a documented cutover date.
---
## Consequences Of Violation
Distributed monolith anti-pattern; schema evolution coupling; deployment coordination still required; microservice benefits nullified.

---
## Rule Name
Feature-flag the cutover for instant rollback
---
## Category
Reliability
---
## Rule
Wrap extraction cutover in a feature flag. When enabling the new service for a route, do it via a toggle that allows instant reversion without deployment.
---
## Reason
Without a feature flag, rolling back a bad extraction requires a full deployment. With a feature flag, switching back is instant — a config change or database update.
---
## Bad Example
```php
// No feature flag — cutover is hard-coded
// To roll back: deploy old code (takes 10+ minutes)
```
---
## Good Example
```php
// Feature flag controls extraction
if (Feature::active('billing_extraction')) {
    // Call new microservice
    return $this->billingHttpClient->getInvoice($id);
} else {
    // Call monolith module
    return $this->billingMonolithContract->getInvoice($id);
}

// Rollback: Feature::deactivate('billing_extraction') — instant
```
---
## Exceptions
Extraction of internal-only modules (no external API) that cannot be feature-flagged at the route level may use queue-routing flags instead.
---
## Consequences Of Violation
Rollback requires full deployment (10+ minutes); extraction risk is higher; team may hesitate to extract due to rollback difficulty.

---
## Rule Name
Use parallel run extraction to verify correctness
---
## Category
Reliability
---
## Rule
During extraction, run both the monolith module and the new service simultaneously for the same requests. Compare outputs to verify correctness before cutting over.
---
## Reason
Output comparison catches behavioral differences between the monolith module and the new service. Logic errors, data differences, and edge case handling can be fixed before users are affected.
---
## Bad Example
```php
// Direct cutover without parallel run
// New service calculates tax differently — users see wrong amounts
// Caught only after production impact
```
---
## Good Example
```php
// Parallel run mode
if (Feature::active('billing_extraction_parallel')) {
    $monolithResult = $this->billingMonolithContract->getInvoice($id);
    $serviceResult = $this->billingHttpClient->getInvoice($id);

    if ($monolithResult != $serviceResult) {
        Log::warning('Extraction discrepancy', [
            'invoice_id' => $id,
            'monolith' => $monolithResult,
            'service' => $serviceResult,
        ]);
    }

    return $monolithResult; // Return proven result until cutover
}
```
---
## Exceptions
Event-driven extractions (queue listeners moving to separate service) may use dead-letter queues for discrepancy detection instead of synchronous comparison.
---
## Consequences Of Violation
Undetected behavioral differences reach users; data integrity issues; trust in extraction process erodes.

---
## Rule Name
Extract the database schema before extracting the service code
---
## Category
Architecture
---
## Rule
As a preparatory step for extraction, migrate the module's tables to their own database schema or connection while the code is still in the monolith. Then extract the code after the database is already independent.
---
## Reason
Separating the database is the hardest part of extraction. Doing it while the code is still co-located allows safe migration tooling and easier rollback. Once the database is independent, extracting the code is straightforward.
---
## Bad Example
```php
// Extract code first, database second
// Month 1: Code extracted to new service
// Month 2: Discover shared database access — extraction is blocked
// Need to revert code extraction or accept distributed monolith
```
---
## Good Example
```php
// Step 1: Move billing tables to billing database connection
//   (Module still in monolith, but using separate DB connection)
// Step 2: Verify everything works with separate connection
// Step 3: Extract code to new service
//   (Code extraction is now simple — database is already independent)
```
---
## Exceptions
When the module shares very few tables with the rest of the monolith, code-first extraction may be simpler. Evaluate both approaches before deciding.
---
## Consequences Of Violation
Extraction blocked by database coupling mid-process; distributed monolith created; extraction timeline doubles.
