# Metadata
- **Domain:** Testing & Reliability Engineering
- **Subdomain:** Test Data Management
- **Knowledge Unit:** Test Data Seeding (Declarative Factory Methods)
- **KU Code:** ku-02-test-data-seeding
- **Last Updated:** 2026-06-02

---

# Executive Summary
Declarative factory methods are custom helper methods that encapsulate complex object creation behind intent-revealing names like `$this->createAdminUser()` or `$this->createTeamWithOwnerAndMembers()`. They serve as a domain-specific language (DSL) for test data setup, improving readability, reducing duplication, and making test Arrange sections self-documenting. This pattern is a core recommendation from the Laravel community for production-scale test suites.

---

# Core Concepts
- **Declarative method:** A private/protected test helper that wraps factory calls behind a descriptive name. Expresses what is created, not how.
- **`create` vs `make` convention:** `createX()` persists to DB. `makeX()` returns unsaved model. Follows Laravel convention.
- **Parameterized methods:** Methods accepting 1-3 key parameters + optional `$overrides` array for variations.
- **Multi-object return:** Using named arrays or array destructuring for methods that create several related models.
- **Trait-based organization:** Grouping declarative methods by domain (UserFactory, TeamFactory, SubscriptionFactory) into traits.

---

# Mental Models
- **Test DSL:** Declarative methods form a mini-language for your domain. `createSubscribedUser()` says everything about what the test needs.
- **Collapsed complexity:** A 10-line factory chain collapses into one expressive method call. Readers see intent, not implementation.
- **DRY for test data:** The same way production code refactors duplication into methods, test data setup should be extracted into helpers.

---

# Internal Mechanics
- **Trait resolution:** PHP traits are copied into the using class at compile time. No runtime overhead.
- **Method visibility:** Typically `private` or `protected`. Used via `$this->methodName()` in test methods.
- **Return type enforcement:** PHP 8.x typed properties and return types. `private function createAdminUser(): User`.
- **`$overrides` pattern:** `array_merge` with defaults at the top of the method body. Explicit overrides win.

---

# Patterns
- **Single-entity method:** `private function createAdminUser(array $overrides = []): User`
- **Multi-entity method returning arrays:** `private function createTeamWithAdmin(): array { return [$team, $admin]; }`
- **Parameterized plan-based method:** `private function createUserOnPlan(string $plan = 'free'): User`
- **Trait grouping:** One trait per domain aggregate (UserFactory, TeamFactory, SubscriptionFactory).

---

# Architectural Decisions
| Decision | Rationale |
|----------|-----------|
| Traits over base class methods | Enables selective inclusion; avoids dumping ground |
| `create`/`make` naming convention | Established Laravel convention; immediately understood |
| `array $overrides = []` pattern | Flexible without parameter explosion |
| 3-parameter max limit | Forces focused methods; prevents kitchen-sink design |

---

# Tradeoffs
| Tradeoff | Pros | Cons |
|----------|------|------|
| Many small methods | Very expressive test code | Harder to discover; trait file navigation overhead |
| Parameterized methods | Fewer methods to maintain | Parameter logic complexity |
| Multi-object return | Complete data context for test | Destructuring boilerplate at call sites |

---

# Performance Considerations
- **Zero overhead:** Declarative methods add no runtime cost beyond the underlying factory calls.
- **Trait loading:** PHP class loading is negligible. No runtime performance concern.
- **Excess data risk:** Chained multi-object methods may create more data than a single test needs. Keep methods focused.
- **Transaction cleanup:** `RefreshDatabase` rolls back all data created by any declarative method.

---

# Production Considerations
- **Method visibility:** Keep methods `private` in traits. Don't expose as public API.
- **Side effect awareness:** Methods may trigger notifications, jobs, or external API calls. Use `Queue::fake()` and `Mail::fake()` as applicable.
- **Trait audit:** Periodically review traits for unused or duplicated methods. Consolidate quarterly.

---

# Common Mistakes
- **Over-parameterization:** One method with 10 parameters for every variation. Prefer multiple focused methods.
- **Hidden global state:** `createUserWithTeam()` creates team and attaches user but returns only the user. Test doesn't know team exists.
- **Missing return types:** PHP dynamic typing leads to lost IDE autocompletion. Always declare `: User` or `: array`.
- **Too many tiny methods:** `createUser1()`, `createUser2()`, `createUser3()` for minor variations. Use parameters or states instead.

---

# Failure Modes
- **Circular trait dependency:** Trait A calls method from Trait B which calls Trait A. Keep methods independent.
- **Method bloat:** Over time traits accumulate dozens of methods. Standardize quarterly cleanup.
- **Inconsistent naming:** `createAdmin()`, `makeAdminUser()`, `buildAdmin()` all doing different things. Standardize on `create`/`make`.

---

# Ecosystem Usage
- **Laravel community standard:** Used extensively in Laravel test suites. Recommended by Benjamin Crozat, Kirschbaum, Spatie.
- **Pest:** Works naturally with declarative methods via `$this->` or Pest's global helpers.
- **Blueprint:** Laravel Blueprint generates declarative test methods alongside model factories.

---

# Related Knowledge Units
- ku-01-test-data-factories (Factory states and sequences — consumed internally)
- ku-03-test-data-cleanup (Minimal data principle — declarative methods should create minimum data)
- ku-04-test-data-relationships (Relationship factories — used inside declarative methods)

---

# Research Notes
- Benjamin Crozat (2026): "A test's Arrange section should read like a sentence. If it takes 10 lines to set up, extract a method."
- greeden (2026): "Declarative factory methods are the single highest-ROI readability improvement for Laravel test suites."
- Kirschbaum (2026): "Organize factory helpers in domain traits. A UserFactory trait, a TeamFactory trait. Mix and match in test classes."
