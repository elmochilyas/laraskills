# Rules — Test Data Seeding (Declarative Factory Methods)

## Rule 1: Name Methods to Describe What They Create, Not How
| Field | Value |
|-------|-------|
| **Name** | Name Methods to Describe What They Create, Not How |
| **Category** | Readability & Communication |
| **Rule** | Name declarative methods by the resulting state (`createAdminUser()`), not the implementation (`createUserWithAdminRole()`). |
| **Reason** | Test callers care about what the created object is (admin user), not how it was made (setting the `admin` role). The implementation should be encapsulated inside the method. "What" names are shorter, clearer, and reveal intent at the call site. |
| **Bad Example** | `createUserWithAdminRoleAndPermissions()` — describes implementation steps, not the resulting state. |
| **Good Example** | `createAdminUser()` — describes the user's role, which is all the caller needs to know. |
| **Exceptions** | Methods where the implementation detail is material (e.g., `createUserWithStripeError()`) — the "how" matters to the scenario. |
| **Consequences Of Violation** | Verbose method names; call sites cluttered with implementation details. |

## Rule 2: Use the `create`/`make` Naming Convention
| Field | Value |
|-------|-------|
| **Name** | Use the `create`/`make` Naming Convention |
| **Category** | Naming Conventions |
| **Rule** | Prefix persisted-object methods with `create` and non-persisted with `make`. Never use `build`, `setup`, `prepare`, or inconsistent prefixes. |
| **Reason** | `create` and `make` are the established Laravel convention from `Model::factory()->create()` and `Model::factory()->make()`. Consistency across the codebase means any developer immediately knows whether a method creates database records. Arbitrary prefixes require looking at the method body. |
| **Bad Example** | `buildTeamWithAdmin()` — is the team persisted? The prefix "build" is ambiguous. |
| **Good Example** | `createTeamWithAdmin()` → persisted. `makeTeam()` → not persisted. Unambiguous. |
| **Exceptions** | Methods that create a mix of persisted and non-persisted objects (return multiple values, document clearly). |
| **Consequences Of Violation** | Uncertain database impact; readers must inspect method bodies. |

## Rule 3: Always Declare Explicit Return Types
| Field | Value |
|-------|-------|
| **Name** | Always Declare Explicit Return Types |
| **Category** | Type Safety & Contract |
| **Rule** | Add explicit PHP return types to all declarative factory methods. Never omit return types for methods that return test data. |
| **Reason** | Return types are a contract between the method and its callers. `createAdminUser(): User` guarantees the caller receives a `User` instance. Without the return type, the caller doesn't know what they get without reading the method body. Return types also enable IDE autocompletion and static analysis. |
| **Bad Example** | `private function createAdminUser()` — no return type; ambiguous contract; no IDE support. |
| **Good Example** | `private function createAdminUser(): User` — clear contract; full IDE support; static analysis compatible. |
| **Exceptions** | Methods returning `$this` for method chaining (builder pattern). |
| **Consequences Of Violation** | No IDE autocompletion; ambiguous contracts; static analysis blind spots. |

## Rule 4: Limit Parameters to 2-3 Per Method
| Field | Value |
|-------|-------|
| **Name** | Limit Parameters to 2-3 Per Method |
| **Category** | Maintainability & Readability |
| **Rule** | Keep method parameters to 2-3. Use `array $overrides = []` for exceptional variations. Never create methods with 4+ parameters. |
| **Reason** | Each parameter adds cognitive load at the call site. A method with 5 parameters forces the caller to remember the order and meaning of each. Using parameters only for the most common variations and `$overrides` for rare ones keeps call sites readable. |
| **Bad Example** | `createUser($role, $plan, $paymentMethod, $notificationPrefs, $locale)` — 5 positional parameters; call sites are unreadable. |
| **Good Example** | `createUser(string $role = 'member', array $overrides = []): User` — 2 parameters; rare variations in `$overrides`. |
| **Exceptions** | Builder-pattern methods designed for named arguments (PHP 8+ named parameters). |
| **Consequences Of Violation** | Unreadable call sites; methods that try to handle too many variations. |

## Rule 5: Return All Created Objects from Multi-Object Methods
| Field | Value |
|-------|-------|
| **Name** | Return All Created Objects from Multi-Object Methods |
| **Category** | Completeness & Transparency |
| **Rule** | When a declarative method creates multiple objects, return all of them in a named tuple or array. Never hide created objects. |
| **Reason** | A method named `createTeamWithAdminAndMember()` that creates team, admin, and member should return all three. If a test needs the admin but it isn't returned, the test must either recreate the admin or rely on undocumented knowledge that the method creates one. Both approaches are brittle. |
| **Bad Example** | `createTeamWithAdminAndMember()` returns only `$team` — test needs `$admin`; must recreate or guess. |
| **Good Example** | `createTeamWithAdminAndMember(): array{Team, User, User}` returns `[$team, $admin, $member]`; callers destructure: `[$team, $admin] = $this->createTeamWithAdminAndMember()`. |
| **Exceptions** | Objects created purely as intermediate steps for the primary object. |
| **Consequences Of Violation** | Hidden dependencies; duplicate data creation; brittle tests. |

## Rule 6: Organize Methods in Domain-Specific Traits
| Field | Value |
|-------|-------|
| **Name** | Organize Methods in Domain-Specific Traits |
| **Category** | Organization & Reuse |
| **Rule** | Group declarative factory methods by domain in traits (`UserFactory`, `TeamFactory`, `InvoiceFactory`). Never dump all methods in the base test class or a single helpers file. |
| **Reason** | A single file with 50 factory methods is hard to navigate and find relevant helpers. Domain-specific traits allow test classes to import only what they need, keep helpers organized by feature, and enable composition without inheritance depth. |
| **Bad Example** | `Tests\Helpers.php` — 80 factory methods for every domain; test class must use all of them even when only needing invoices. |
| **Good Example** | `Tests\Helpers\UserFactory.php`, `Tests\Helpers\InvoiceFactory.php`. Test class: `use UserFactory, InvoiceFactory;`. |
| **Exceptions** | 1-2 shared helpers used by every test (e.g., `createAdminUser()` in base class). |
| **Consequences Of Violation** | Bloated helper files; difficulty finding relevant methods; unnecessary method exposure. |
