# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: DTO Test Factories

---

### Rule 1: Use deterministic defaults, not random data, in DTO factories

| Field | Value |
|-------|-------|
| **Name** | Fixed defaults for DTO factories |
| **Category** | Factory Design |
| **Rule** | Use fixed string values as defaults in DTO factory `build()` methods. Never use `fake()`, `uniqid()`, or other random data generators. |
| **Reason** | Random data makes test failures non-reproducible. When a test fails, the failure message shows different values on every run, making debugging impossible. Fixed defaults ensure deterministic, debuggable tests. |
| **Bad Example** | `'email' => fake()->email()` — assertion failures show different emails each run. |
| **Good Example** | `'email' => 'test@example.com'` — predictable, reproducible. |
| **Exceptions** | Fields with unique constraints when creating multiple records (use a dedicated state method for this). |
| **Consequences Of Violation** | Test failures are impossible to reproduce. Debugging requires searching through logs to find which random values were generated. |

---

### Rule 2: Use builder pattern for DTOs with >5 properties, function factory for simpler DTOs

| Field | Value |
|-------|-------|
| **Name** | Match factory pattern to DTO complexity |
| **Category** | Factory Design |
| **Rule** | Use a builder pattern class with `with*()` methods for DTOs with more than 5 properties. Use a simple function factory for DTOs with 1-5 properties. |
| **Reason** | Builder pattern provides IDE autocompletion and self-documenting code for complex DTOs. A simple function with `$overrides` array is more concise for small DTOs. Over-factoring adds unnecessary complexity. |
| **Bad Example** | A 20-line builder class for a DTO with 2 properties (name, email). |
| **Good Example** | Simple DTO: `function validUserDTO(array $overrides = []): UserDTO { ... }`. Complex DTO: builder class with `withName()`, `withEmail()`, etc. |
| **Exceptions** | Teams that prefer consistency across all DTO factories may standardize on one pattern. |
| **Consequences Of Violation** | Factory code is longer than the test code it supports. Developers avoid using factories because they're over-engineered. |

---

### Rule 3: Align factory defaults with DTO validation constraints

| Field | Value |
|-------|-------|
| **Name** | Match factory defaults to validation rules |
| **Category** | Factory Correctness |
| **Rule** | Ensure DTO factory defaults satisfy all DTO constructor validation rules. If the DTO validates email format, the factory default email must be a valid email. |
| **Reason** | Tests that use factory-created DTOs should not fail due to invalid default data. Mismatch between factory defaults and validation rules causes confusing failures where test setup fails, not the behavior under test. |
| **Bad Example** | DTO validates `email` format, but factory default is `not-an-email` — tests fail on DTO construction. |
| **Good Example** | Factory default `'email' => 'test@example.com'` passes email format validation. |
| **Exceptions** | Factories for DTOs that have no validation rules. |
| **Consequences Of Violation** | Tests fail during setup, not during assertion. Developers waste time debugging setup errors instead of testing behavior. |

---

### Rule 4: Use `with()` pattern to preserve DTO immutability

| Field | Value |
|-------|-------|
| **Name** | Preserve DTO immutability in factories |
| **Category** | Factory Design |
| **Rule** | Use `$dto->withName('new name')` (returns a new cloned instance) instead of `$dto->name = 'new name'` (mutates the original). |
| **Reason** | DTOs should be immutable. Direct property mutation violates the DTO contract and may cause unexpected behavior in tests that reuse DTO instances. The `with()` pattern returns a new instance, preserving the original. |
| **Bad Example** | `$dto->name = 'admin';` — mutates the original DTO, may affect other tests. |
| **Good Example** | `$dto->withName('admin');` — returns a new DTO with the overridden value. |
| **Exceptions** | DTOs explicitly designed to be mutable (rare). |
| **Consequences Of Violation** | Shared DTO instances are mutated across tests. Test failures are order-dependent and hard to debug. |

---

### Rule 5: Place DTO factories in `tests/DTOFactories/` mirroring the DTO namespace

| Field | Value |
|-------|-------|
| **Name** | Organize factories by DTO namespace |
| **Category** | Organization |
| **Rule** | Place DTO factory files in `tests/DTOFactories/` following the same namespace structure as the DTOs in `app/DTOs/`. |
| **Reason** | Convention makes factories discoverable. A developer looking for `app/DTOs/UserDTO.php` immediately finds `tests/DTOFactories/UserDTOFactory.php`. Consistent organization reduces search time. |
| **Bad Example** | DTO factories scattered across `tests/Unit/Helpers/`, `tests/Support/`, and `tests/Factories/`. |
| **Good Example** | `app/DTOs/UserDTO.php` → `tests/DTOFactories/UserDTOFactory.php`. |
| **Exceptions** | DTOs without factories (simple DTOs created inline). |
| **Consequences Of Violation** | Developers don't know where factories are. Duplicate factories are created in multiple locations. |

---

### Rule 6: Define named presets for common DTO configurations

| Field | Value |
|-------|-------|
| **Name** | Create preset methods for common DTO variants |
| **Category** | Factory Design |
| **Rule** | When the same DTO configuration (e.g., admin user, expired subscription) is used in 2+ tests, extract it into a named preset method on the factory. |
| **Reason** | Duplicated `->withRole('admin')->withPermissions(['all'])` across tests creates maintenance burden. Named presets centralize configuration and make tests more readable. |
| **Bad Example** | `UserDTOFactory::new()->withRole('admin')->withPermissions(['all'])->build()` repeated in 5 tests. |
| **Good Example** | `UserDTOFactory::admin()->build()` — single `admin()` preset method. |
| **Exceptions** | DTO configurations used in only one test. |
| **Consequences Of Violation** | Changing the admin DTO definition requires editing every test that creates an admin DTO. Configuration drift between tests. |
