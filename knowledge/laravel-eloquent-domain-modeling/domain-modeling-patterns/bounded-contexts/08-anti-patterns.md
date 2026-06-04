# Bounded Contexts — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Bounded Contexts |
| Focus | Anti-patterns in bounded context definition and communication |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Shared Database Tables Across Bounded Contexts | Architecture | Critical |
| 2 | Direct Model Imports From Other Contexts | Architecture | Critical |
| 3 | Technical Layer Organization Instead of Business Capability | Code Organization | High |
| 4 | Missing Anti-Corruption Layer With External Systems | Architecture | High |
| 5 | Scattered Event Listener Registration | Maintainability | Medium |
| 6 | No Context Map Documentation | Maintainability | Medium |

## Repository-Wide Cross-Cutting Patterns

- Shared database tables are the most common bounded context violation — tables are shared across contexts with no API boundary
- `use` imports of models from other contexts create invisible source-level coupling
- Projects organized by technical layer (Models, Controllers, Services) instead of business capability are the norm, making context boundaries invisible

---

## 1. Shared Database Tables Across Bounded Contexts

### Category
Architecture

### Description
Two or more bounded contexts reading from and writing to the same database tables directly. This creates hidden coupling where one context's schema changes can break another context at runtime.

### Why It Happens
The application was built as a monolith and bounded contexts were introduced later without separating the data. It's "easier" to share a table than to create an API or event boundary. Developers may not realize the coupling exists until it causes problems.

### Warning Signs
- Multiple contexts' models map to the same database table
- Schema migrations require coordination across teams
- One context's data cleanup affects another context's operations
- Database locks or contention traced to cross-context table access
- No API or event layer between contexts — they share the database directly
- Comments like "don't change this column, X context uses it"

### Why Harmful
- Schema changes require coordinated releases across contexts
- One context's performance issue (table lock, slow query) affects another
- Contexts cannot be deployed independently
- Hidden coupling prevents database per-context scaling
- Adding a new context that needs the same data is impossible without schema coupling

### Consequences
- Coordinated deployments: every schema change requires all teams to release together
- Performance contention: one context's slow queries degrade others using the same table
- Migration nightmares: splitting tables later requires complex data migration
- Team coupling: teams cannot work independently because schema ownership is unclear
- Security: one context may expose columns that another context shouldn't access

### Preferred Alternative
```php
// Sales context owns orders table
// Shipping context reads from shipments table built via event projection
// Communication: OrderPlaced event → Shipping listener creates shipment record
```

### Refactoring Strategy
1. Identify database tables accessed by multiple contexts
2. Designate each table to exactly one owning context
3. For other contexts needing that data, create event projections or API endpoints
4. Migrate read access first (read from projection), then write access (write to new structure)
5. Remove cross-context table access

### Detection Checklist
- [ ] Cross-reference model namespaces with database table names
- [ ] Check for foreign key relationships across context boundaries
- [ ] Review migration files for cross-context table modifications
- [ ] Search for `DB::table(` or raw SQL accessing tables owned by other contexts
- [ ] Audit schema changes — do they require coordination between teams?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Share Database Tables Across Bounded Contexts |
| Decision Tree | `07-decision-trees.md` — Cross-Context Communication |
| Skill | `06-skills.md` — Organize Code Into Business Capability Contexts |

---

## 2. Direct Model Imports From Other Contexts

### Category
Architecture

### Description
Using `use` statements to import Eloquent models from a different bounded context's namespace. This creates direct source-level coupling and enables casual cross-context method calls that bypass the architectural boundary.

### Why It Happens
Convenience: the model exists, it has the data needed, and importing it is a single line. The developer may not be aware of the context boundary. There's no technical enforcement preventing cross-context imports in Laravel.

### Warning Signs
- `use App\Contexts\Sales\Models\Order;` in a Shipping context file
- Cross-context `belongsTo` or `HasMany` relationships
- Service classes in one context calling methods on models from another context
- No event or API layer between contexts — just direct model access
- Tests in one context that load models from another context
- Global search for `use` statements crossing context directories

### Why Harmful
- Source-level coupling is invisible in architecture diagrams but tight at the code level
- Refactoring one context's model requires updating all importers in other contexts
- The context boundary becomes a convention with no enforcement
- New developers follow the pattern, making the coupling worse
- Moving to microservices requires untangling all cross-context imports

### Consequences
- Tight coupling that prevents independent evolution of contexts
- Refactoring difficulty: changing a model's namespace or structure breaks multiple contexts
- Code that is hard to test in isolation (context tests depend on another context's models)
- Architectural drift: the codebase says "contexts" but behaves like a monolith
- No clear ownership: which context "owns" the model?

### Preferred Alternative
```php
// No cross-context imports — use events or API calls
class CreateShipmentOnOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Shipment::create(['order_id' => $event->orderId]);
    }
}
```

### Refactoring Strategy
1. Search for `use App\Contexts\{OtherContext}\Models\` patterns
2. For each cross-context import, determine the data needed
3. Replace direct model access with event listening or API calls
4. Add the necessary events or API endpoints to the owning context
5. Remove the cross-context `use` statement

### Detection Checklist
- [ ] Search for `use App\Contexts\` across all context directories
- [ ] Check for cross-context namespace references in service providers
- [ ] Review relationships (`belongsTo`, `HasMany`) for cross-context references
- [ ] Audit controller actions for cross-context model usage
- [ ] Verify that each context only imports from within its own directory

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Import Models from Another Bounded Context |
| Rule | `05-rules.md` — Communicate Between Contexts Only Through Events or APIs |
| Skill | `06-skills.md` — Organize Code Into Business Capability Contexts |

---

## 3. Technical Layer Organization Instead of Business Capability

### Category
Code Organization

### Description
Organizing the Laravel application by technical layer (app/Models, app/Controllers, app/Events) rather than by business capability (app/Contexts/Sales, app/Contexts/Inventory). This scatters business logic across the codebase and makes context boundaries invisible.

### Why It Happens
Laravel's default directory structure organizes by technical layer. Most tutorials and documentation follow this pattern. Developers don't realize the benefits of business-capability organization until the codebase grows unmanageable.

### Warning Signs
- Directory structure: `app/Models/`, `app/Controllers/`, `app/Events/`
- Finding all code related to "Order" requires searching across 10+ directories
- No visible context boundaries in the directory structure
- Models from different business domains in the same Models directory
- Controllers for different domains in the same Controllers directory
- Difficulty assigning ownership of code areas to teams

### Why Harmful
- Related business logic is scattered across the filesystem
- Context boundaries exist only in documentation (if at all)
- Finding all code for a single business operation requires navigating many directories
- Team ownership is unclear — who owns the Order model? Order controller?
- Refactoring to bounded contexts later requires moving files across the codebase

### Consequences
- Code discoverability suffers: related files are not colocated
- Context coupling is invisible: any controller can import any model
- Onboarding difficulty: new developers must learn the full technical layer before understanding domains
- Architectural drift: no structural enforcement of boundaries
- Costly refactoring to introduce context boundaries later

### Preferred Alternative
```
app/
  Contexts/
    Sales/
      Models/Order.php
      Controllers/OrderController.php
      Events/OrderPlaced.php
      Policies/OrderPolicy.php
    Inventory/
      Models/Product.php
      Controllers/ProductController.php
```

### Refactoring Strategy
1. Identify business capabilities in the application
2. Create the `app/Contexts/` directory structure
3. Move models, controllers, events, and policies into their respective context directories
4. Update namespaces and `use` statements
5. Remove the old `app/Models/`, `app/Controllers/` directories

### Detection Checklist
- [ ] Check directory structure for technical-layer vs business-capability organization
- [ ] Calculate how many directories you must visit to trace a single business operation
- [ ] Review import statements for cross-domain coupling (likely in technical-layer organization)
- [ ] Verify that context boundaries exist in the filesystem, not just in documentation
- [ ] Assess the effort to restructure into business capabilities

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Organize Code by Business Capability, Not Technical Layer |
| Skill | `06-skills.md` — Organize Code Into Business Capability Contexts |

---

## 4. Missing Anti-Corruption Layer With External Systems

### Category
Architecture

### Description
Using external system objects, models, or terminology directly inside a bounded context without an Anti-Corruption Layer (ACL). The external domain model leaks into the local context, polluting its ubiquitous language and creating tight coupling.

### Why It Happens
Integrating with an external API seems straightforward — just call it and use the response. Creating an ACL seems like unnecessary indirection. The external system's data model looks "close enough" to the local model.

### Warning Signs
- External API response objects used directly in domain logic
- External system terminology (e.g., CRM's "Account" vs local "Customer") used interchangeably
- Direct HTTP client calls in controllers or services with no translation layer
- External data structures leaked into Eloquent model attributes
- Changes to the external API break local domain logic
- No dedicated class/module for external integration

### Why Harmful
- The local domain model becomes polluted with external concepts and terminology
- Changes in the external system ripple through the local codebase
- The ubiquitous language is inconsistent: some code uses local terms, some uses external terms
- Harder to switch external providers (tight coupling to the current one)
- Testing external integration requires mocking at the HTTP level instead of the ACL level

### Consequences
- Brittle integration: external API changes break local business logic
- Language pollution: "Customer" and "Account" used interchangeably in different parts of the code
- Testing complexity: mocking external APIs for every test that touches domain logic
- Provider lock-in: switching external systems requires codebase-wide changes
- Domain model contamination: external data structures become part of the domain

### Preferred Alternative
```php
class CustomerAcL
{
    public function __construct(private ExternalCrmApi $api) {}

    public function getCustomer(string $email): Customer
    {
        $crmCustomer = $this->api->getCustomer($email);
        return new Customer(
            name: $crmCustomer->getFullName(),
            email: $crmCustomer->getEmailAddress(),
        );
    }
}
```

### Refactoring Strategy
1. Identify all direct external API calls in domain-level code
2. Create an ACL class per external system
3. Move all external communication into the ACL, including translation between models
4. Replace direct external API calls with ACL method calls
5. Test the ACL independently with mocked external responses

### Detection Checklist
- [ ] Search for HTTP client calls in controllers, services, and models
- [ ] Check for external SDK classes imported in domain code
- [ ] Look for external terminology used in model attributes or method names
- [ ] Review test setup: are external mocks scattered or centralized?
- [ ] Verify that external data structures are translated before entering domain logic

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Implement an Anti-Corruption Layer When Integrating with External Contexts |
| Skill | `06-skills.md` — Organize Code Into Business Capability Contexts |
| Knowledge | `04-standardized-knowledge.md` — Anti-Corruption Layer |

---

## 5. Scattered Event Listener Registration

### Category
Maintainability

### Description
Registering domain event listeners using `Event::listen()` calls scattered across service providers, boot methods, and other files instead of centralizing them in the `EventServiceProvider` `$listen` array.

### Why It Happens
Convenience: adding an `Event::listen()` call in the nearest service provider is faster than navigating to `EventServiceProvider`. Some packages register listeners dynamically. Teams may not have established a convention for event registration.

### Warning Signs
- `Event::listen()` calls in `AppServiceProvider::boot()`, route service providers, or custom providers
- No event-to-listener mapping in `EventServiceProvider::$listen`
- Difficulty determining which listeners handle a given event
- Listeners registered conditionally based on runtime configuration
- Duplicate listener registration (same listener registered in multiple places)

### Why Harmful
- No single source of truth for event-subscriber relationships
- Auditing event chains requires a full-codebase search
- New developers cannot discover event handling by looking at one file
- Listeners may be registered multiple times (performance overhead)
- Event refactoring is risky: you may not find all listeners

### Consequences
- Missed listeners when events are renamed or removed
- Difficulty onboarding new team members ("where are the listeners registered?")
- Hard-to-trace bugs where expected side effects don't fire
- Duplicate side effects from multiple registrations
- Time wasted searching for listener registration across providers

### Preferred Alternative
```php
// In EventServiceProvider:
protected $listen = [
    OrderPlaced::class => [
        SendOrderConfirmation::class,
        UpdateInventoryProjection::class,
        CreateShipment::class,
    ],
];
```

### Refactoring Strategy
1. Search for all `Event::listen()` calls across the codebase
2. Collect all event-to-listener mappings
3. Move them to `EventServiceProvider::$listen`
4. Remove scattered `Event::listen()` calls
5. Add a team convention document about listener registration

### Detection Checklist
- [ ] Search for `Event::listen(` across all service providers
- [ ] Check `EventServiceProvider::$listen` for completeness
- [ ] Audit each event class — are all its listeners visible in one place?
- [ ] Review boot methods in all service providers
- [ ] Verify no duplicate listener registrations

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Register All Domain Event Listeners in EventServiceProvider |
| Skill | `06-skills.md` — Organize Code Into Business Capability Contexts |

---

## 6. No Context Map Documentation

### Category
Maintainability

### Description
Failing to maintain a context map that documents each bounded context, its responsibilities, and its relationships with other contexts. The architecture exists only in team members' heads.

### Why It Happens
The team knows the context boundaries because they designed them. Documentation is seen as overhead. The code "is the documentation." Context maps aren't part of Laravel's default tooling, so they're easily overlooked.

### Warning Signs
- No `docs/context-map.md` or equivalent
- New team members ask "what contexts exist and how do they communicate?"
- Context boundaries are assumed but not documented
- Architecture decision records mention contexts but no map exists
- Cross-context communication patterns vary across the codebase (no standard)
- Meetings held to discuss "which context owns this?"

### Why Harmful
- Architectural knowledge is tribal — lost when team members leave
- New developers cannot understand the context architecture without extensive mentoring
- Context boundaries drift without documentation to catch violations
- Communication patterns are inconsistent without a documented standard
- Decision-making about where new features go is unstructured

### Consequences
- Context boundary violations go undetected because there's no documented baseline
- Onboarding takes longer as new team members reverse-engineer the architecture
- Inconsistent cross-context communication patterns evolve
- Architectural decisions forgotten, leading to repeated debates
- Costly refactoring when undocumented boundaries are violated

### Preferred Alternative
```markdown
// docs/context-map.md
## Context Map
- **Sales** (Customer) → **Shipping** (Supplier)
  Communication: Domain events → Queue → Async listener
- **Sales** (Shared Kernel) → **Billing** (Shared Kernel)
  Communication: Shared Payment value object
- **Inventory** (Conformist) → External ERP (Upstream)
  Communication: ACL translating ERP terminology
```

### Refactoring Strategy
1. Document each bounded context and its responsibilities
2. Map all inter-context relationships (events, APIs, shared kernel)
3. Note the communication mechanism for each relationship
4. Store the map in `docs/context-map.md` and review it quarterly
5. Add context map review to the architecture decision process

### Detection Checklist
- [ ] Check `docs/` directory for context map documentation
- [ ] Ask team members to describe context boundaries — are they consistent?
- [ ] Review recent PRs — do they reference context boundaries in discussions?
- [ ] Audit cross-context communication patterns — are they consistent?
- [ ] Verify the context map is up to date with the actual codebase structure

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Context Maps to Document Inter-Context Relationships |
| Skill | `06-skills.md` — Organize Code Into Business Capability Contexts |
