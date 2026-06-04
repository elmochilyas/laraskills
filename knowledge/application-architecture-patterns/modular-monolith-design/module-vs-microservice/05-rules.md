# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module vs. microservice: definition and key differences
Knowledge Unit ID: MMD-01
Difficulty Level: Foundation
Last Updated: 2026-06-02

---
## Rule Name
Start with a modular monolith; extract to microservice only when justified
---
## Category
Architecture
---
## Rule
Always start with a modular monolith for Laravel projects. Extract to microservices only when specific, measurable constraints (resource divergence, independent deployment need, team independence) cannot be met by the monolith.
---
## Reason
Industry data shows 40%+ of microservice implementations should have remained monoliths. Modules provide domain isolation without distribution costs (network calls, separate CI, separate deploys, separate monitoring).
---
## Bad Example
```php
// Building 5 microservices from day one for a 5-person Laravel team
// Result: CI x5, deploy x5, monitoring x5 — 50%+ velocity drop
```
---
## Good Example
```php
// Start with modules in a single Laravel app
modules/Billing/
modules/Catalog/
modules/Inventory/
// Extract only when Billing needs independent scaling
```
---
## Exceptions
Team >50 engineers with independently operating sub-teams may justify starting with microservices. Document the rationale with specific organizational constraints.
---
## Consequences Of Violation
Unnecessary operational complexity consumes development capacity; CI costs multiply; deployment coordination overhead; monitoring surface area triples.

---
## Rule Name
Design modules as extraction-ready from the start
---
## Category
Architecture
---
## Rule
Design every module as if it could be extracted to a microservice, even if extraction may never happen.
---
## Reason
Explicit contracts, database schema ownership, and no shared models make extraction straightforward when needed. Without extraction readiness, the module is just a folder with no real isolation.
---
## Bad Example
```php
// No contracts, shared models, shared tables
use App\Models\BillingInvoice; // importing from another "module"
```
---
## Good Example
```php
// Module owns contracts, schema, and models
interface InvoiceContract
{
    public function getInvoice(int $id): InvoiceDTO;
}
```
---
## Exceptions
No common exceptions. Extraction readiness is a core requirement of modular design.
---
## Consequences Of Violation
Module cannot be extracted without rewrite; module boundaries are aspirational, not enforceable.

---
## Rule Name
Enforce module boundaries as runtime constraints, not just folder names
---
## Category
Architecture
---
## Rule
Use architecture tests, static analysis (PHPStan), and CI checks to enforce module boundaries — never rely on directory structure alone to prevent cross-module access.
---
## Reason
Modules as folders without enforcement inevitably degrade into a distributed monolith. Developers take shortcuts, importing models across modules, creating circular dependencies.
---
## Bad Example
```php
// No enforcement — developers can import anything
modules/Billing/ — but OrdersController.php uses Billing\Models\Invoice directly
```
---
## Good Example
```php
// PHPStan rule enforces: only Contracts/ namespace can be imported across modules
// Pest test enforces: no cross-module Eloquent model usage
test('modules only import contracts from other modules')
    ->expect('Modules\Billing\Models')
    ->not->toBeUsedIn('Modules\Catalog');
```
---
## Exceptions
No common exceptions. Enforcement is non-negotiable for modular monolith integrity.
---
## Consequences Of Violation
Module isolation degrades silently; extraction requires complete rewrite; architecture becomes a big ball of mud.

---
## Rule Name
Use contracts not direct imports for cross-module communication
---
## Category
Code Organization
---
## Rule
Never import implementation classes from another module. Always depend on contracts (interfaces) defined in the providing module's Contracts/ directory and resolved via Laravel's service container.
---
## Reason
Direct imports create tight coupling between modules, defeating the purpose of modular isolation. Contracts allow implementation swapping and enable contract testing.
---
## Bad Example
```php
use Modules\Billing\Services\InvoiceService; // direct import

class OrderService
{
    public function __construct(
        protected InvoiceService $service // coupling to concrete class
    ) {}
}
```
---
## Good Example
```php
use Modules\Billing\Contracts\InvoiceServiceContract; // contract import only

class OrderService
{
    public function __construct(
        protected InvoiceServiceContract $service // resolved by container
    ) {}
}
```
---
## Exceptions
In-memory test doubles for the same module (not cross-module) may import implementation classes directly, but prefer contract-based injection even in tests.
---
## Consequences Of Violation
Module coupling prevents independent evolution; contract testing impossible; extraction requires untangling dependencies.

---
## Rule Name
Understand the 100-1000x latency difference: modules are microseconds, microservices are milliseconds
---
## Category
Performance
---
## Rule
Prefer module boundaries over network boundaries for latency-sensitive operations. In-process contract calls are PHP function calls (~1-10µs); microservice calls are HTTP requests (~1-100ms).
---
## Reason
A single user request crossing 5 microservices experiences 5-500ms of network latency. The same operation in a modular monolith completes in microseconds.
---
## Bad Example
```php
// Making HTTP calls to another service for a synchronous validation
$response = Http::get('http://inventory-service/api/check-stock', $items);
// adds 50-200ms per request
```
---
## Good Example
```php
// In-process contract call — microseconds
$this->inventoryContract->checkStock($items);
// same deployment, no network overhead
```
---
## Exceptions
If the specific module already runs as an independent microservice (after extraction), network calls are inevitable. Design for eventual consistency where possible.
---
## Consequences Of Violation
Unnecessary latency in critical user paths; poor user experience; higher infrastructure costs for marginal benefit.

---
## Rule Name
Extract only when module resource requirements diverge significantly
---
## Category
Scalability
---
## Rule
Only extract a module to a microservice when its resource requirements (CPU, memory, database connections, scaling needs) diverge significantly from the rest of the monolith.
---
## Reason
Premature extraction adds cost without benefit. A well-optimized Laravel monolith handles millions of users. Extraction is a cost, not a feature.
---
## Bad Example
```php
// "We might need to scale reporting separately someday"
// Builds microservice for reporting that handles 100 req/min
// Now: CI x2, deploy x2, monitoring x2
```
---
## Good Example
```php
// Track per-module resource usage
// Billing: 60% CPU, Inventory: 20%, Catalog: 10%, Reporting: 10%
// When Billing diverges -> extract Billing
```
---
## Exceptions
Organizational constraints (team independence requirement) may justify extraction even without resource divergence.
---
## Consequences Of Violation
Wasted engineering time on distribution infrastructure; higher operational costs; slower feature delivery.

---
## Rule Name
Modules share the database server; microservices own separate databases
---
## Category
Architecture
---
## Rule
In a modular monolith, all modules share the same database server (but own their tables). When extracting to a microservice, the extracted module must get its own separate database.
---
## Reason
Extracted microservices sharing the monolith's database creates a distributed monolith — the operational complexity of microservices with the coupling of a monolith.
---
## Bad Example
```php
// Extracted service still using the monolith's database
'mysql' => [
    'database' => 'monolith_db', // shared database
]
// Now: distributed monolith — worst of both worlds
```
---
## Good Example
```php
// Extracted service gets its own database
'mysql' => [
    'database' => 'billing_service_db', // independent database
]
// Communication only via HTTP/queue, never direct database access
```
---
## Exceptions
During the Strangler Fig extraction transition period, shared database access may temporarily exist with a clear cutover plan.
---
## Consequences Of Violation
Distributed monolith anti-pattern; schema evolution coupling between services; extraction benefits nullified.

---
## Rule Name
Respect the team-size threshold: <30 engineers → modular monolith, >50 → consider microservices
---
## Category
Architecture
---
## Rule
Default to modular monolith for teams under 30 engineers. Only consider microservices when the team exceeds 50 engineers with independently operating sub-teams.
---
## Reason
Microservices are primarily an organizational pattern enabling team independence. The technical complexity of microservices is the cost of organizational independence — absorb it only when needed.
---
## Bad Example
```php
// 8-person team, 5 microservices
// Each developer maintains 3+ services
// 50% of time spent on CI, deploy, monitoring
```
---
## Good Example
```php
// 8-person team, single modular monolith
// One CI pipeline, one deploy, one monitoring surface
// 90% of time on feature development
```
---
## Exceptions
Specific technology needs (different modules need different stacks) or regulatory requirements (PCI scope isolation) may justify earlier microservice adoption.
---
## Consequences Of Violation
Development velocity drops 50%+; operational toil consumes innovation capacity; team morale decreases.
