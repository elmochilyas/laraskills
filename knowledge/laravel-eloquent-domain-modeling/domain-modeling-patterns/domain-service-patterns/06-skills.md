# Domain Service Patterns — Skills

---

## Skill 1: Extract a Domain Service for Cross-Model Logic

### Purpose
Create a stateless domain service class to hold business logic that involves multiple models or external domain computations, keeping individual models focused.

### When To Use
- Business logic spans two or more unrelated models (e.g., `Invoice` and `Payment`)
- The computation is domain-specific but doesn't naturally belong to a single model
- The logic requires external dependencies (exchange rates, tax calculation)

### When NOT To Use
- The logic belongs to a single model (use a model domain method)
- The logic is a simple query on a single model
- The logic is application orchestration (use an action/command handler)

### Prerequisites
- Understanding of which models are involved in the logic
- Domain interfaces for external dependencies

### Inputs
- Service class name
- Models/interfaces the service needs
- Business logic to implement

### Workflow

1. **Identify cross-model logic** — code that reads from or acts on multiple unrelated models

2. **Define a domain service interface** if the implementation may vary:
   ```php
   interface PricingService
   {
       public function calculateTotal(Order $order, Customer $customer): Money;
   }
   ```

3. **Implement the service** — stateless, with domain dependencies injected:
   ```php
   class StandardPricingService implements PricingService
   {
       public function __construct(
           private readonly TaxRateProvider $taxRates,
       ) {}
   ```

4. **Inject the service** where needed (actions, command handlers, controllers)

5. **Keep services stateless** — all state lives in models passed as parameters

6. **Do not use Eloquent query builder** in domain services (use repository interfaces)

### Validation Checklist

- [ ] Service is stateless (no mutable properties)
- [ ] Domain interface is defined for the service
- [ ] Service receives models as parameters (doesn't fetch them)
- [ ] Business logic belongs to no single model
- [ ] Service is injected, not instantiated internally
- [ ] No Eloquent queries in the service (use injected repositories)

### Related Rules

| Rule | Reference |
|---|---|
| Extract stateless domain services for cross-model logic | `05-rules.md` Rule 1 |
| Define interfaces for domain services | `05-rules.md` Rule 2 |
| Domain services receive models, not fetch them | `05-rules.md` Rule 3 |
| Keep domain services free of Eloquent | `05-rules.md` Rule 4 |
| Inject services, don't instantiate | `05-rules.md` Rule 5 |

### Success Criteria
- Cross-model logic is extracted into a domain service
- Service is stateless and receives all data as parameters
- Service is testable with mocked dependencies
- No Eloquent queries exist in the service class
