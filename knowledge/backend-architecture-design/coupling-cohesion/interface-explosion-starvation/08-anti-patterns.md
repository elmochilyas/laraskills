# ECC Anti-Patterns — Interface Explosion vs Starvation

## Domain: Backend Architecture & Design | Subdomain: Anti-Patterns & Architectural Smells

### Anti-Pattern Inventory

1. **Interface Per Class** — Unnecessary interfaces for every concrete class
2. **Mirror Interfaces** — Interface with same shape as its single implementation
3. **Interface Starvation** — No interfaces at system boundaries, hard to mock/test
4. **Framework Interface Dependency** — Core domain depends on framework interfaces
5. **Developer Can't Find Implementations** — Too many indirections from explosion
6. **Changing SDK Breaks Everywhere** — No adapter interface from starvation

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Interface Per Class

**Category:** Architecture

**Description:** Creating an interface for every single class regardless of need.

**Why It Happens:** "Best practice" doctrine; belief that interfaces are always good.

**Warning Signs:** `UserServiceInterface` → `UserService` (one-to-one, single implementation for years).

**Why Is It Harmful:** Doubles file count. Adds indirection without value. Navigation slowed. Maintenance overhead for no benefit.

**Preferred Alternative:** Interface only when there are or will be multiple implementations.

**Refactoring Strategy:** Remove unused interfaces. Keep only where multiple implementations exist.

**Related Rules:** Interface only for multiple implementations (05-rules.md)

---

### Anti-Pattern 2: Mirror Interfaces

**Category:** Architecture

**Description:** Interface with identical methods as its concrete implementation.

**Why It Happens:** Developers define interface, then generate implementation that matches exactly.

**Warning Signs:** Interface methods === concrete class methods; no abstraction, just duplication.

**Why Is It Harmful:** Adds indirection with zero abstraction value. Changes to interface require identical changes to implementation.

**Preferred Alternative:** Interface should abstract — different from any implementation. Or don't have interface until needed.

**Refactoring Strategy:** Remove mirror interfaces. Or redesign interface to be meaningful abstraction.

**Related Rules:** Interface should abstract, not mirror (05-rules.md)

---

### Anti-Pattern 3: Interface Starvation

**Category:** Architecture

**Description:** No interfaces at system boundaries, making testing and substitution difficult.

**Why It Happens:** Simplicity preference; "interfaces are overhead" mindset.

**Warning Signs:** No interfaces for payment gateways, external APIs, or infrastructure services; tests use concrete implementations.

**Why Is It Harmful:** Cannot mock external services in tests. Tests become integration tests. Changing implementation (e.g., Stripe → Braintree) requires rewriting all callers.

**Preferred Alternative:** Interface at system boundaries where implementations vary.

**Refactoring Strategy:** Add interfaces for external service clients. Use DI to inject implementations.

**Related Rules:** Interface at system boundaries (05-rules.md)

---

### Anti-Pattern 4: Framework Interface Dependency

**Category:** Architecture

**Description:** Core domain classes implementing interfaces from the framework.

**Why It Happens:** Convenience — framework provides interfaces for common patterns.

**Warning Signs:** Domain classes `implements ShouldQueue`, `implements Authenticatable`; domain depends on framework interfaces.

**Why Is It Harmful:** Domain layer coupled to framework. Cannot use domain without framework. Violates dependency rule.

**Preferred Alternative:** Define interfaces in domain. Implement framework interfaces in infrastructure layer.

**Refactoring Strategy:** Extract domain interfaces. Add adapter in infrastructure that implements both domain and framework interfaces.

**Related Rules:** Domain defines its own interfaces (05-rules.md)

---

### Anti-Pattern 5: Can't Find Implementations

**Category:** Navigation

**Description:** Too many interfaces and indirections make finding implementations difficult.

**Why It Happens:** Over-abstraction creates deep navigation chains.

**Warning Signs:** IDE "Go to Implementation" shows 10+ options; developers waste time finding actual code.

**Why Is It Harmful:** Development velocity drops. Onboarding takes longer. Abstraction costs exceed benefits.

**Preferred Alternative:** Limit indirection depth. Group interfaces and implementations logically.

**Refactoring Strategy:** Remove unnecessary indirections. Use naming conventions that make implementations discoverable.

**Related Rules:** Prefer discoverability over abstraction (05-rules.md)

---

### Anti-Pattern 6: SDK Change Breaks Everything

**Category:** Architecture

**Description:** External SDK used directly throughout codebase with no adapter abstraction.

**Why It Happens:** No interface starvation at external boundaries.

**Warning Signs:** SDK classes imported across 50+ files; vendor SDK update requires changes everywhere.

**Why Is It Harmful:** SDK upgrade becomes full-codebase refactoring. Vendor lock-in. Cannot switch providers.

**Preferred Alternative:** Wrap external SDK behind domain-owned interface.

**Refactoring Strategy:** Define interface for external functionality. Create adapter implementing it using SDK. Replace direct SDK usage with interface.

**Related Rules:** Wrap external SDKs behind interfaces (05-rules.md)
