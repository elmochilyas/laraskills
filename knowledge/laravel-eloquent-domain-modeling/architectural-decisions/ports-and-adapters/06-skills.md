# Ports and Adapters — Skills

---

## Skill 1: Implement a Port Interface with an Adapter

### Purpose
Define a domain-owned port (interface) and implement it with a framework adapter, following hexagonal architecture principles.

### When To Use
- The domain needs to abstract an external concern (persistence, mail, clock, payment)
- You want the domain to be completely isolated from infrastructure
- You need exchangeable implementations (production + test)

### When NOT To Use
- Simple CRUD with no storage variation needed
- The abstraction would be purely speculative (YAGNI)

### Prerequisites
- `Domain\Contracts\` namespace for ports
- `Infrastructure\` namespace for adapters
- Clear understanding of what the domain needs from the outside world

### Inputs
- Domain concept that needs abstraction (e.g., "persist invoices", "send mail")
- Method signatures using domain language
- Framework class or mechanism to implement the adapter

### Workflow

1. **Define the port interface** in `Domain\Contracts\`
   - Name methods using domain concepts, not SQL or implementation terms: `findAllOverdueSince()` not `findWhere()`
   - Return types are domain models, value objects, or primitives — never Eloquent types
   - Parameters are typed — domain models, value objects, or primitives

2. **Create the adapter** in `Infrastructure\Driven\` (for driven/outbound adapters)
   - Implement the port interface
   - Use framework classes internally (Eloquent, Laravel Mail, etc.)
   - Map framework types to domain types at the boundary
   - Never return Eloquent models or framework-typed objects from adapter methods

3. **Create an in-memory adapter** for testing in `Tests\Fakes\`
   - Same interface, in-memory implementation
   - Used in domain service unit tests

4. **Wire the production binding** in a service provider:
   ```php
   class BillingServiceProvider extends ServiceProvider
   {
       public function register(): void
       {
           $this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
           $this->app->bind(MailSender::class, LaravelMailSender::class);
       }
   }
   ```

5. **Wire the test binding** in a test service provider or use `swap()`

6. **Inject the port** into domain services via constructor

### Validation Checklist

- [ ] Port interface defined in domain layer — not infrastructure
- [ ] Port methods named with domain concepts, not SQL terms
- [ ] Port methods use only domain types in signatures
- [ ] Adapter maps framework types to domain types at the boundary
- [ ] Adapter never returns Eloquent models or Collections
- [ ] In-memory adapter exists and is used in tests
- [ ] Binding wired in service provider
- [ ] Domain service injects port interface, not concrete adapter

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Port interface leaks SQL concepts | Named after adapter methods | Rename using domain language |
| Adapter returns Eloquent model | Forgot mapping step | Map to domain model before returning |
| No test adapter exists | Overlooked during setup | Create `InMemory*Adapter` |
| Binding scattered across providers | No centralized wiring | Consolidate in one service provider |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Design ports around domain concepts | `05-rules.md` Rule 1 |
| Rule 2: One port per aggregate root | `05-rules.md` Rule 2 |
| Rule 4: Wire in single service provider | `05-rules.md` Rule 4 |
| Rule 5: Never return Eloquent models | `05-rules.md` Rule 5 |
| Rule 7: Every port needs two implementations | `05-rules.md` Rule 7 |
| Rule 8: Separate driver/driven adapters | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Write Contract Tests for a Port | Ensures adapter correctness |
| Enforce Domain Purity with PHPStan | Maintains the boundary |

### Success Criteria
- Port interface uses only domain language and domain types
- Two adapter implementations exist (production + in-memory)
- Binding visible in a single service provider
- Domain tests use the in-memory adapter, not the real infrastructure

---

## Skill 2: Write Contract Tests for a Port

### Purpose
Create an abstract test suite that defines the behavioral contract of a port interface, then run it against every adapter implementation to ensure behavioral consistency.

### When To Use
- A port has multiple adapter implementations (production + test fake)
- You want to ensure adapter implementations don't drift from each other
- You are practicing adapter-driven development (write the contract test first)

### When NOT To Use
- The adapter is a simple wrapper with no behavioral complexity
- Only one implementation exists and no test fake is planned

### Prerequisites
- Port interface defined
- At least one adapter implementation (production or in-memory)
- Testing framework with PHPUnit

### Inputs
- Port interface to test
- List of adapter classes to verify
- Known state fixtures for setup

### Workflow

1. **Create an abstract test class** `{PortName}ContractTest` that extends `TestCase`

2. **Define an abstract factory method** for creating the adapter:
   ```php
   abstract protected function createRepository(): InvoiceRepository;
   ```

3. **Write test methods that exercise every method on the port**:
   - Test the happy path
   - Test edge cases (null returns, empty collections, duplicate keys)
   - Test error conditions (not found, constraint violations)

4. **Use the abstract factory method** in every test — never hard-code an adapter class

5. **Create concrete test classes for each adapter**:
   ```php
   class EloquentInvoiceRepositoryTest extends InvoiceRepositoryContractTest
   {
       use RefreshDatabase;

       protected function createRepository(): InvoiceRepository
       {
           return app(EloquentInvoiceRepository::class);
       }
   }

   class InMemoryInvoiceRepositoryTest extends InvoiceRepositoryContractTest
   {
       protected function createRepository(): InvoiceRepository
       {
           return new InMemoryInvoiceRepository();
       }
   }
   ```

6. **Run all concrete tests in CI** — a failure in any adapter means the contract is broken

### Validation Checklist

- [ ] Contract test covers every method signature in the port interface
- [ ] Contract test covers happy path and edge cases
- [ ] Contract test covers error conditions (not found, validation, conflicts)
- [ ] Abstract factory method is used — no hard-coded adapters
- [ ] Every adapter has a concrete test class extending the contract test
- [ ] Tests run in CI for all adapters
- [ ] Adding a new adapter requires only: create class, implement interface, add test class

### Related Rules

| Rule | Reference |
|---|---|
| Rule 3: Write contract tests for every adapter | `05-rules.md` Rule 3 |
| Rule 7: Every port needs two implementations | `05-rules.md` Rule 7 |

### Success Criteria
- Abstract test class defines the full contract for the port
- Each adapter passes the same test suite
- Adding a new adapter requires no test changes — just a new test class
- Contract test catches behavioral drift between adapters

---

## Skill 3: Set Up Service Provider Wiring

### Purpose
Create a dedicated service provider that wires all port-to-adapter bindings in one visible location, making the architecture's dependency graph explicit and auditable.

### When To Use
- You have multiple ports and adapters to wire
- You want a single place to audit all architectural bindings
- You need to switch implementations per environment

### Prerequisites
- Port interfaces defined in `Domain\Contracts\`
- Adapter classes defined in `Infrastructure\`
- Basic understanding of Laravel's service container

### Inputs
- List of port-to-adapter pairs
- Environment-specific binding requirements (e.g., real vs. fake mail in tests)
- Contextual binding needs (if any)

### Workflow

1. **Create a service provider** `App\Providers\DomainServiceProvider` or per bounded context

2. **Register all port-to-adapter bindings** in the `register()` method:
   ```php
   public function register(): void
   {
       $this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
       $this->app->bind(Clock::class, SystemClock::class);
       $this->app->bind(MailSender::class, LaravelMailSender::class);
       $this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
   }
   ```

3. **Add contextual bindings** using `when()->needs()->give()` if needed:
   ```php
   $this->app->when(InvoiceController::class)
       ->needs(InvoiceRepository::class)
       ->give(CachedInvoiceRepository::class);
   ```

4. **Add environment switching** in the provider:
   ```php
   if ($this->app->environment('testing')) {
       $this->app->bind(InvoiceRepository::class, InMemoryInvoiceRepository::class);
   }
   ```

5. **Register the provider** in `config/app.php`

6. **Document each binding** with a brief comment explaining purpose

7. **Enforce ONE provider per bounded context** — no scatter across multiple providers

### Validation Checklist

- [ ] All port-to-adapter bindings in one service provider
- [ ] No bindings in controllers, commands, or event listeners
- [ ] Contextual bindings documented with comments
- [ ] Environment-specific bindings grouped together
- [ ] Provider is registered in `config/app.php`
- [ ] No duplicate bindings for the same interface

### Related Rules

| Rule | Reference |
|---|---|
| Rule 4: Wire in single service provider | `05-rules.md` Rule 4 |
| Rule 5: Separate driver/driven adapters | `05-rules.md` Rule 8 |

### Success Criteria
- All port-to-adapter bindings visible in one file
- No adapter is wired outside the service provider
- Environment switching is explicit and grouped
- Developer can understand the full architecture wiring in one place
