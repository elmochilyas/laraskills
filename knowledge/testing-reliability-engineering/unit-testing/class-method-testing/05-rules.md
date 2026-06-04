# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Class & Method Testing (DTO Factories)

---

### Rule 1: Use the `with()` pattern to preserve DTO immutability

| Field | Value |
|-------|-------|
| **Name** | Preserve immutability with `with()` |
| **Category** | Factory Design |
| **Rule** | DTO factories must use `with*()` methods that return a new instance (via clone). Never provide setters that mutate the original DTO. |
| **Reason** | DTOs are immutable by contract. Direct property mutation violates this contract and can cause subtle bugs when a DTO is shared between tests or within a test. |
| **Bad Example** | `$dto->setName('admin'); $dto->name = 'admin';` — mutates the original. |
| **Good Example** | `$dto->withName('admin')` — returns new DTO, original unchanged. |
| **Exceptions** | DTOs explicitly designed as mutable (anti-pattern in DDD). |
| **Consequences Of Violation** | Shared DTO instances are mutated unexpectedly. Test failures become order-dependent. |

---

### Rule 2: Favor builder pattern for DTOs with >5 properties

| Field | Value |
|-------|-------|
| **Name** | Builder pattern for complex DTOs |
| **Category** | Factory Design |
| **Rule** | Use a builder class with fluent `with*()` methods for DTOs with more than 5 properties. Use a simple function factory with `$overrides` for smaller DTOs. |
| **Reason** | Named `with*()` methods provide IDE autocompletion and are self-documenting. Array-based overrides for small DTOs are more concise. The threshold balances readability with conciseness. |
| **Bad Example** | `new UserDTO('test', 'test@example.com', 'member', 'en', 'UTC', false, null)` — positional arguments are unreadable. |
| **Good Example** | `UserDTOFactory::new()->withName('Test')->withEmail('test@example.com')` — fluent, readable. |
| **Exceptions** | Consistent team convention may standardize on one pattern. |
| **Consequences Of Violation** | Tests are hard to read due to long constructor calls with positional arguments. |

---

### Rule 3: Align factory defaults with DTO constructor validation

| Field | Value |
|-------|-------|
| **Name** | Factory defaults must pass DTO validation |
| **Category** | Factory Correctness |
| **Rule** | Ensure that factory default values satisfy all validation rules in the DTO constructor. |
| **Reason** | Tests using the factory expect the DTO to be valid by default. If factory defaults fail validation, tests break during setup, not during the behavior under test — wasting debugging time. |
| **Bad Example** | DTO validates `email` format; factory default is `''` (empty string) — construction fails. |
| **Good Example** | Factory default email passes validation: `'email' => 'test@example.com'`. |
| **Exceptions** | DTOs with no constructor validation. |
| **Consequences Of Violation** | Tests fail on DTO construction, not on assertion. Developers waste time debugging setup. |

---

### Rule 4: Use deterministic defaults, not random data

| Field | Value |
|-------|-------|
| **Name** | Fixed defaults for reproducibility |
| **Category** | Factory Design |
| **Rule** | Use fixed string values as DTO defaults (`'name' => 'Test User'`). Never use `fake()`, `uniqid()`, or `Str::random()`. |
| **Reason** | Random data makes test failures non-reproducible — the error message shows different values on every run. Fixed defaults ensure the same failure every time. |
| **Bad Example** | `'email' => fake()->email()` — failure shows different email each run. |
| **Good Example** | `'email' => 'test@example.com'` — deterministic. |
| **Exceptions** | Uniqueness constraints for multiple DTOs (use a dedicated state method). |
| **Consequences Of Violation** | Test failures cannot be reproduced. Debugging requires searching CI logs for the exact random values. |

---

### Rule 5: Place factories in `tests/DTOFactories/` mirroring DTO namespace

| Field | Value |
|-------|-------|
| **Name** | Mirror DTO namespace in factory location |
| **Category** | Organization |
| **Rule** | Place each DTO factory in `tests/DTOFactories/` following the same subdirectory as its DTO in `app/DTOs/`. |
| **Reason** | Mirroring the namespace makes factories discoverable by convention. A developer looking for `app/DTOs/UserDTO.php` can immediately find `tests/DTOFactories/UserDTOFactory.php`. |
| **Bad Example** | Factories in `tests/Support/`, `tests/Helpers/`, or inline in test files. |
| **Good Example** | `app/DTOs/UserDTO.php` → `tests/DTOFactories/UserDTOFactory.php`. |
| **Exceptions** | Simple one-off DTOs without factories. |
| **Consequences Of Violation** | Developers don't know where factories are. Duplicate factories appear in multiple locations. |

---

### Rule 6: Name preset methods for common DTO variants

| Field | Value |
|-------|-------|
| **Name** | Create preset methods for reusable DTO variants |
| **Category** | Factory Design |
| **Rule** | Define named preset methods (`admin()`, `guest()`, `expired()`) for DTO configurations used in 2+ tests. |
| **Reason** | Named presets centralize DTO configuration, eliminate duplication, and make test intent explicit. `UserDTOFactory::admin()->build()` is more readable than setting 3 individual properties. |
| **Bad Example** | `UserDTOFactory::new()->withRole('admin')->withPermissions(['all'])->build()` repeated in 5 tests. |
| **Good Example** | `UserDTOFactory::admin()->build()` — a single `admin()` method. |
| **Exceptions** | DTO variants used in only one test. |
| **Consequences Of Violation** | Changing the admin definition requires editing every test. Configuration drift between tests. |
