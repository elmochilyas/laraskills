# Rules — Declarative Factory Methods

## Rule 1: Name Methods to Describe What Is Created, Not How
| Field | Value |
|-------|-------|
| **Name** | Name Methods to Describe What Is Created, Not How |
| **Category** | Readability & Communication |
| **Rule** | Name declarative factory methods by what they create (`createSubscribedUser()`), not how they create it (`createUserWithSubscriptionAndPaymentMethod()`). |
| **Reason** | Test readers care about the state of the created object, not the implementation steps. `createSubscribedUser()` tells the reader "this user has an active subscription." The implementation details (subscription plan, payment method, billing cycle) are irrelevant at the call site and belong inside the method. |
| **Bad Example** | `createUserWithStripeSubscriptionAndDefaultPaymentMethod()` — the name describes implementation steps, not the resulting state. |
| **Good Example** | `createSubscribedUser()` — describes what the user is (subscribed), not how they got that way. |
| **Exceptions** | Methods where the implementation choice is material to the test scenario (e.g., `createUserWithFailedPayment()`). |
| **Consequences Of Violation** | Verbose method names that expose implementation details; reduced readability at call sites. |

## Rule 2: Use `createX()` for Persisted, `makeX()` for Non-Persisted
| Field | Value |
|-------|-------|
| **Name** | Use `createX()` for Persisted, `makeX()` for Non-Persisted |
| **Category** | Naming Conventions |
| **Rule** | Prefix declarative methods with `create` when they persist to the database and `make` when they return unsaved models. Never use inconsistent prefixes. |
| **Reason** | Laravel developers understand the `create` vs `make` convention from Eloquent factories. Consistent prefixing immediately tells the reader whether the created object is in the database. Inconsistency (sometimes `create`, sometimes `build`, sometimes no prefix) forces readers to check the method body to understand side effects. |
| **Bad Example** | `buildAdminUser()` — is it persisted? `setupTeamWithAdmin()` — what does "setup" mean? The reader must read the method body. |
| **Good Example** | `createAdminUser()` → persisted. `makeUser()` → not persisted. Clear convention. |
| **Exceptions** | Methods that create multiple objects where some are persisted and some are not (document explicitly in the method docblock). |
| **Consequences Of Violation** | Unclear side effects; readers must inspect method bodies to understand database impact. |

## Rule 3: Always Declare Return Types
| Field | Value |
|-------|-------|
| **Name** | Always Declare Return Types |
| **Category** | Type Safety & IDE Support |
| **Rule** | Declare an explicit PHP return type on every declarative factory method. Never omit return types. |
| **Reason** | Declared return types enable IDE autocompletion, static analysis checks, and self-documentation. A caller of `createAdminUser()` immediately knows they receive a `User` instance without reading the method body. Without return types, callers must inspect the implementation or rely on documentation. |
| **Bad Example** | `private function createAdminUser()` — no return type; IDE can't autocomplete; reader doesn't know what's returned. |
| **Good Example** | `private function createAdminUser(): User` — clear contract; IDE autocompletion; static analysis compatible. |
| **Exceptions** | Methods returning mixed types or multiple types where a union type declaration suffices. |
| **Consequences Of Violation** | No IDE autocompletion; unclear contract; static analysis misses type errors. |

## Rule 4: Limit Parameters to 1-3 Per Method
| Field | Value |
|-------|-------|
| **Name** | Limit Parameters to 1-3 Per Method |
| **Category** | Maintainability & Readability |
| **Rule** | Keep declarative factory method parameters to 1-3. Use an `$overrides` array for exceptional variations. Never create methods with 5+ parameters. |
| **Reason** | Methods with many parameters are hard to read at the call site and indicate poor encapsulation. Each parameter should represent a key variation in the created object's state. If a method needs 6 parameters, it's doing too much — split into multiple methods with focused responsibilities. |
| **Bad Example** | `createUser($role, $plan, $paymentMethod, $teamId, $notificationPrefs, $locale)` — 6 parameters; call sites are unreadable. |
| **Good Example** | `createAdminUser(array $overrides = []): User` — 1 parameter for common case; `$overrides` for rare exceptions. |
| **Exceptions** | Builder-pattern methods that are designed to be called with named arguments (PHP 8+). |
| **Consequences Of Violation** | Unreadable call sites; methods that do too much; high maintenance burden. |

## Rule 5: Return All Created Objects from Multi-Object Methods
| Field | Value |
|-------|-------|
| **Name** | Return All Created Objects from Multi-Object Methods |
| **Category** | Completeness & Reliability |
| **Rule** | When a declarative method creates multiple related objects, return all of them. Never hide created objects from the caller. |
| **Reason** | A method named `createTeamWithAdminAndMember()` that creates a team, admin user, and member user should return all three. If the test only needs the team, it can ignore the other return values. But if the test also needs the admin user, a hidden-return creates a dependency on knowledge that doesn't exist in the test body. Hidden objects cause brittle tests that break when the method changes. |
| **Bad Example** | `createTeamWithAdminAndMember()` creates team and admin but returns only the team — tests that need the admin user must recreate it or use knowledge that the method creates it. |
| **Good Example** | `createTeamWithAdminAndMember(): array` — returns `[$team, $admin, $member]`; callers destructure only what they need: `[$team, $admin] = $this->createTeamWithAdminAndMember()`. |
| **Exceptions** | Objects created solely as intermediate steps (e.g., a factory used to create another object). |
| **Consequences Of Violation** | Brittle tests that rely on hidden state; duplicate object creation in callers. |

## Rule 6: Organize Methods in Domain-Specific Traits
| Field | Value |
|-------|-------|
| **Name** | Organize Methods in Domain-Specific Traits |
| **Category** | Organization & Reuse |
| **Rule** | Group declarative factory methods by domain in separate traits (`UserFactory`, `TeamFactory`, `InvoiceFactory`). Never put all methods in the base test class. |
| **Reason** | A single base test class with 50+ factory methods becomes an unmaintainable "god class." Domain-specific traits allow test classes to import only the helpers they need, keeping the test class focused. Traits also enable composition (using `UserFactory` and `TeamFactory` together) without inheritance depth. |
| **Bad Example** | `Tests\TestCase` — 1000 lines of factory methods for users, teams, invoices, subscriptions, payments. Every test class inherits all methods. |
| **Good Example** | `Tests\Helpers\UserFactory` trait, `Tests\Helpers\TeamFactory` trait. Test class: `class InvoiceTest extends TestCase { use UserFactory, TeamFactory; }`. |
| **Exceptions** | A single global helper for methods used across every test (e.g., `createAdminUser()`). |
| **Consequences Of Violation** | Bloated base test class; unnecessary method exposure; difficulty finding relevant helpers. |
