# Rule: Identify contexts using language divergence, not database schema
---
## Category
Architecture
---
## Rule
Use language divergence (same word, different meaning across domains) as the primary signal for bounded context identification.
---
## Reason
Database schema reflects historical data design, not domain boundaries. Language divergence reveals where distinct domain models exist — the strongest indicator that separate contexts are needed.
---
## Bad Example
```php
// Identifying contexts by looking at table structure
$contexts = ['users', 'orders', 'products']; // derived from existing DB tables
```
---
## Good Example
```php
// Identifying contexts by language differences
// "Customer" in Sales means buyer with discount tier.
// "Customer" in Support means ticket submitter with SLA.
// These are different contexts.
class CustomerInSales { /* ... */ }
class CustomerInSupport { /* ... */ }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Context boundaries don't align with business language, requiring expensive rework later.

# Rule: Default to coarse boundaries and split later
---
## Category
Architecture
---
## Rule
Start with broader context boundaries and split later when concrete pain emerges.
---
## Reason
It is easier and safer to split a large context than to merge two that should never have been separated. Coarse boundaries minimize integration overhead and prevent premature complexity.
---
## Bad Example
```php
// 20 contexts for a small application
public function contexts(): array
{
    return ['user', 'profile', 'avatar', 'login', 'registration', ...]; // over-split
}
```
---
## Good Example
```php
// Start coarse: 3-4 contexts for a small app
public function contexts(): array
{
    return ['identity', 'billing', 'catalog']; // right-sized, refinable later
}
```
---
## Exceptions
When clear language divergence already exists at day one (e.g., integrating two distinct business units from the start).
---
## Consequences Of Violation
Integration overhead dominates development; splitting is easier than merging but both are costly.

# Rule: Separate contexts when data has distinct lifecycle
---
## Category
Architecture
---
## Rule
Use data lifecycle divergence (different change frequency, consistency requirements, or retention policies) as a signal for separate contexts.
---
## Reason
Data that changes at different rates under different consistency needs should be independently evolvable. Sharing a context forces all data to follow the same lifecycle policy.
---
## Bad Example
```php
// Order data (real-time, transactional) and Analytics data (batch, append-only)
// living in the same context
class OrderContext
{
    public function createOrder(): void { /* transactional */ }
    public function recordAnalytics(): void { /* batch */ }
}
```
---
## Good Example
```php
// Order context (ACID) and Analytics context (eventual consistency, batch)
class OrderContext
{
    public function createOrder(): void { DB::transaction(/* ... */); }
}

class AnalyticsContext
{
    public function ingestOrderEvent(OrderPlaced $event): void
    {
        // Eventually consistent ingestion
    }
}
```
---
## Exceptions
When data lifecycle differences are negligible and splitting would add complexity without benefit.
---
## Consequences Of Violation
Contexts forced to share incompatible lifecycle policies, leading to workarounds and technical debt.

# Rule: Validate context boundaries with business stakeholders
---
## Category
Architecture
---
## Rule
Always validate tentative context boundaries with business stakeholders by asking domain terminology questions before coding.
---
## Reason
Business stakeholders are the source of truth for domain language. Technical-only identification misses subtle semantic differences and creates boundaries that don't match business operations.
---
## Bad Example
```php
// Boundaries decided in engineering alone, never validated
// Stakeholders discover later that "Invoice" means different things in AR vs AP
```
---
## Good Example
```php
// Validate: "Does 'Customer' mean the same thing here?"
// Workshop output confirms Sales and Support use "Customer" differently.
// Result: separate SalesOrder and SupportTicket contexts.
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Context boundaries don't serve the business, requiring costly re-architecture when semantic misalignment is discovered.

# Rule: Align context boundaries with module/namespace boundaries
---
## Category
Code Organization
---
## Rule
Map each bounded context to a dedicated module directory or namespace prefix in the Laravel application.
---
## Reason
Physical code structure must reflect logical architecture. When context boundaries are invisible in the codebase, developers cannot easily determine ownership, dependencies, or scope of changes.
---
## Bad Example
```php
// All models in a flat namespace
app/Models/User.php
app/Models/Order.php
app/Models/Product.php
app/Models/Invoice.php // no context distinction
```
---
## Good Example
```php
// Each context has its own namespace
app/Domains/Identity/Models/User.php
app/Domains/Billing/Models/Invoice.php
app/Domains/Catalog/Models/Product.php
app/Domains/Ordering/Models/Order.php
```
---
## Exceptions
Single-context applications — no namespace separation needed.
---
## Consequences Of Violation
Code ownership is unclear; developers cannot identify context boundaries; accidental coupling increases.

# Rule: Do not identify contexts by team structure alone
---
## Category
Architecture
---
## Rule
Use domain language and data lifecycle as primary signals for context identification; team structure is a secondary consideration.
---
## Reason
Letting team structure alone define boundaries creates contexts that don't align with business domain semantics. Teams can share a context if the domain is cohesive; teams should split when the domain diverges.
---
## Bad Example
```php
// Contexts defined solely by team org chart
$contextA = new TeamA()->createContext();
$contextB = new TeamB()->createContext();
// Neither considers domain language divergence
```
---
## Good Example
```php
// Contexts identified from domain language analysis first
// Team assignment follows: map teams to identified contexts
$contexts = $domainAnalysis->getBoundaries();
$ownership = $teamMapper->assignTeams($contexts);
```
---
## Exceptions
When team structure already aligns with clear language divergence, team-structure identification is valid as a shortcut.
---
## Consequences Of Violation
Contexts align with org chart rather than domain semantics, causing friction in business feature development.

# Rule: Use event storming or domain storytelling for context discovery
---
## Category
Architecture
---
## Rule
Use facilitated workshops (Event Storming, Domain Storytelling, Data Ownership Matrix) to identify bounded contexts.
---
## Reason
Structured workshops force explicit naming and grouping of domain concepts. The collaborative process reveals language divergence and lifecycle differences that individual analysis misses.
---
## Bad Example
```php
// Solo architect defines all context boundaries in a single session
// Misses subtle domain distinctions that emerge from group discussion
```
---
## Good Example
```php
// Workshop output: aggregated domain events, commands, actors, and aggregates
// Grouped by language meaning into context candidates
// Result: data-validated, stakeholder-approved context map
```
---
## Exceptions
Extremely simple domains where context boundaries are obvious and universally agreed.
---
## Consequences Of Violation
Context boundaries based on single-person analysis miss critical domain nuances, requiring rework.

# Rule: Distinguish between owned and referenced models in each context
---
## Category
Architecture
---
## Rule
When identifying a context, classify each business concept as either owned (context creates/updates/deletes) or referenced (context reads by ID from another context).
---
## Reason
Ownership must be explicit per concept per context. Without this classification, contexts will accidentally share write access to the same data, creating hidden coupling and conflicting lifecycle management.
---
## Bad Example
```php
// Context identified but ownership not defined
// Later, both Identity and Billing modify "user" records directly
```
---
## Good Example
```php
// Context boundary definition includes ownership
$identityContext = new Context('Identity', [
    'owned' => ['User', 'Role', 'Permission'],
    'referenced' => [], // no external references
]);

$billingContext = new Context('Billing', [
    'owned' => ['Invoice', 'Payment'],
    'referenced' => ['User' => ReferenceType::BY_ID],
]);
```
---
## Exceptions
Single-context applications — ownership classification is unnecessary.
---
## Consequences Of Violation
Multiple contexts write to the same data, causing write conflicts, broken invariants, and coupling.

# Rule: Do not create a context for every CRUD entity
---
## Category
Architecture
---
## Rule
Group related entities into a single bounded context; do not create a separate context per CRUD entity.
---
## Reason
A context represents a meaningful domain boundary with cohesive language and lifecycle. Splitting every entity into its own context creates overwhelming integration overhead without domain benefit.
---
## Bad Example
```php
// One context per entity — 50 contexts for 50 tables
public function contexts(): array
{
    return ['users', 'profiles', 'avatars', 'settings',
            'posts', 'comments', 'likes', 'tags', ...];
}
```
---
## Good Example
```php
// Cohesive grouping by domain meaning
public function contexts(): array
{
    return ['identity', 'content', 'moderation']; // entities grouped by domain
}
```
---
## Exceptions
When each entity genuinely has independent lifecycle, different teams, and distinct language meaning.
---
## Consequences Of Violation
Context management overhead exceeds benefits; integration complexity defeats the purpose of bounded contexts.
