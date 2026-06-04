# Framework Decoupling — Skills

---

## Skill 1: Define a Domain Port and Wire an Adapter

### Purpose
Create a domain-owned interface (port) and a framework adapter (implementation), then wire them together in a service provider.

### When To Use
- The domain needs to abstract an infrastructure concern (mail, cache, clock, persistence)
- You want to unit-test domain logic without loading Laravel's kernel
- The application may outlive the current framework choice

### When NOT To Use
- Simple CRUD application with minimal business rules
- Small team where delivery speed outweighs architectural purity

### Prerequisites
- `Domain\Contracts\` namespace exists
- `Infrastructure\` namespace exists
- Framework adapter implementation strategy is clear

### Inputs
- Domain need (e.g., "send email", "get current time", "store invoices")
- Interface method signatures expressed in domain language
- Framework class to use for the adapter (e.g., `Mail::`, `Carbon`, Eloquent)

### Workflow

1. **Identify the domain need** — what does the domain require from the outside world?

2. **Define the port interface** in `Domain\Contracts\`
   - Name the interface after the domain concept: `Clock`, `InvoiceRepository`, `MailSender`
   - Methods return domain types (`DateTimeImmutable`, domain models, value objects)
   - Methods accept domain types — never `Request`, `Response`, or Eloquent models
   - No `use Illuminate\*` statements in the interface file

3. **Create the framework adapter** in `Infrastructure\`
   - Implement the port interface
   - Use framework classes internally (Laravel Mail, Eloquent, Carbon conversion)
   - Map between framework types and domain types at the boundary

4. **Wire the binding** in a `DomainServiceProvider`:
   ```php
   class DomainServiceProvider extends ServiceProvider
   {
       public function register(): void
       {
           $this->app->bind(Clock::class, SystemClock::class);
           $this->app->bind(MailSender::class, LaravelMailSender::class);
       }
   }
   ```

5. **Inject the port** into domain services via constructor
   - Domain services never reference the adapter class — only the port interface
   - All framework dependencies stay in the infrastructure layer

### Validation Checklist

- [ ] Port interface defined in `Domain\Contracts\` — not in infrastructure
- [ ] Port interface has zero `use Illuminate\*` imports
- [ ] Port methods use domain types (DateTimeImmutable, value objects, domain models)
- [ ] Adapter implements the port and uses framework types internally
- [ ] Adapter maps framework types to domain types at the boundary
- [ ] Binding registered in a service provider, not scattered across controllers
- [ ] Domain service injects the port interface, not the concrete adapter

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Domain imports `Illuminate\*` | Port defined in infrastructure | Move port to domain |
| Domain uses Carbon | Convenience over discipline | Replace with `DateTimeImmutable` |
| Binding hidden in controller | No centralized wiring | Move to `DomainServiceProvider` |
| Adapter returns Eloquent model | Forgot to map to domain type | Map to domain model before returning |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Define ports in domain layer | `05-rules.md` Rule 1 |
| Rule 2: Use `DateTimeImmutable` not Carbon | `05-rules.md` Rule 2 |
| Rule 4: Domain services use domain-defined interfaces only | `05-rules.md` Rule 4 |
| Rule 5: Wire adapters in service providers | `05-rules.md` Rule 5 |

### Related Skills

| Skill | Relationship |
|---|---|
| Enforce Domain Purity with PHPStan | Maintains the boundary |
| Implement a Repository with Eloquent Mapping | Concrete application of this pattern |

### Success Criteria
- Port interface lives in `Domain\Contracts\`
- Adapter lives in `Infrastructure\`
- Domain service injects the port, not the adapter
- Service provider wires the binding in one place
- Domain tests run without Laravel's kernel

---

## Skill 2: Refactor Domain Code to Remove Framework Dependencies

### Purpose
Identify and eliminate `use Illuminate\*` and `use App\Models\*` imports from domain code by replacing them with domain-owned interfaces and native PHP types.

### When To Use
- Domain code accidentally depends on framework classes (Carbon, Collection, Facades)
- You are introducing hexagonal architecture to an existing Laravel project
- Code review reveals framework imports in domain namespaces

### When NOT To Use
- The application has no separated domain layer (simple CRUD)
- The framework dependency is intentional and documented

### Prerequisites
- Understanding of framework decoupling principles
- PHPStan configured with domain purity rules
- Service provider for port-to-adapter wiring

### Inputs
- List of domain files with `use Illuminate\*` imports
- List of `use App\Models\*` imports in domain code
- PHPStan violations report

### Workflow

1. **Run PHPStan to identify violations** — generate a list of all framework imports in `Domain/`

2. **For each `use Carbon\Carbon` in domain code**:
   - Replace with `\DateTimeImmutable`
   - Update method signatures and return types
   - Convert Carbon → DateTimeImmutable at the adapter boundary

3. **For each `use Illuminate\Support\Collection`**:
   - Replace with `array` — use `array<int, DomainModel>` or `array<string, mixed>`
   - Update return type annotations

4. **For each `use App\Models\*` import**:
   - The domain was using an Eloquent model directly
   - Define a domain model (plain PHP) mirroring the needed fields
   - Create a repository interface in `Domain\Contracts\`
   - Inject the repository port into the domain service

5. **For each Facade or `app()` call**:
   - Define a domain-owned interface for the capability
   - Inject the interface via constructor
   - Create a framework adapter that implements the interface

6. **Update tests** — domain unit tests should no longer need `RefreshDatabase` or Laravel bootstrap

### Validation Checklist

- [ ] Zero `use Illuminate\*` imports in `Domain/`
- [ ] Zero `use App\Models\*` imports in `Domain/`
- [ ] Carbon replaced with `DateTimeImmutable` everywhere in domain
- [ ] `Collection` replaced with `array` in domain return types
- [ ] All external dependencies injected via constructor — no Facades, no `app()`
- [ ] PHPStan passes with domain purity rules
- [ ] Domain unit tests run without `RefreshDatabase`

### Related Rules

| Rule | Reference |
|---|---|
| Rule 2: Use `DateTimeImmutable` not Carbon | `05-rules.md` Rule 2 |
| Rule 3: Enforce domain purity with static analysis | `05-rules.md` Rule 3 |
| Rule 4: Domain services use domain-only interfaces | `05-rules.md` Rule 4 |
| Rule 7: No Request/Input in domain | `05-rules.md` Rule 7 |
| Rule 8: Native arrays not Collection | `05-rules.md` Rule 8 |

### Success Criteria
- PHPStan reports zero violations in `Domain/`
- All domain unit tests run without database or Laravel kernel
- Domain code uses only native PHP types and domain-defined interfaces
- Framework imports are confined to `Infrastructure\`

---

## Skill 3: Add PHPStan Rules for Domain Purity

### Purpose
Configure PHPStan to enforce the domain boundary by rejecting framework imports in domain code and rejecting Eloquent types in domain returns.

### When To Use
- You are adopting hexagonal architecture
- You want automated enforcement of architectural boundaries
- Team size > 2 and code review alone is insufficient

### Prerequisites
- PHPStan installed at max level or high level
- `Domain\` namespace with existing code
- Understanding of PHPStan custom rules or extensions

### Inputs
- Namespace paths for domain, infrastructure, application layers
- List of allowed framework imports (if any)
- PHPStan baseline file for existing violations

### Workflow

1. **Install `phpstan/phpstan-deprecation-rules` and `phpstan/phpstan-strict-rules`**

2. **Configure path-based rules** in `phpstan.neon`:
   ```neon
   parameters:
       level: max
       paths:
           - src/Domain
           - src/Infrastructure
           - src/Application
   ```

3. **Add a custom rule to disallow `use Illuminate\*` in `Domain/`**:
   - Use `disallowed-namespaces` from the `ergebnis/phpstan-rules` package or write a custom rule
   - Configure: `src/Domain` cannot import `Illuminate\*` or `App\Models\*`

4. **Add a rule to disallow Eloquent return types in repository interfaces**:
   - Repository interfaces in `Domain\Contracts\` must not return `Model`, `Builder`, `Collection`

5. **Add a rule to disallow `Carbon` in domain**:
   - `Domain/` cannot import `Carbon\Carbon` or `Carbon\CarbonImmutable`

6. **Generate a baseline** for existing violations to allow incremental adoption

7. **Add PHPStan to CI pipeline** with `--fail-on-empty-result` and `--no-progress`

8. **Create a pre-commit hook** using `husky` or `pre-commit` to run PHPStan on changed files

### Validation Checklist

- [ ] PHPStan configured with path-based rules for `Domain/`
- [ ] `Illuminate\*` imports rejected in `Domain/`
- [ ] `App\Models\*` imports rejected in `Domain/`
- [ ] `Carbon` imports rejected in `Domain/`
- [ ] Baseline file documents existing violations for gradual cleanup
- [ ] PHPStan runs in CI and fails on new violations
- [ ] Pre-commit hook runs PHPStan on changed domain files

### Related Rules

| Rule | Reference |
|---|---|
| Rule 3: Enforce domain purity with static analysis | `05-rules.md` Rule 3 |
| Rule 4: Domain services use domain-only interfaces | `05-rules.md` Rule 4 |

### Success Criteria
- CI fails when any domain file imports a framework class
- PHPStan prevents accidental coupling at commit time
- Baseline allows incremental migration of existing violations
- Developers get immediate feedback without waiting for code review
