# ECC Anti-Patterns — Premature Abstraction & YAGNI

## Domain: Backend Architecture & Design | Subdomain: Anti-Patterns & Architectural Smells

### Anti-Pattern Inventory

1. **Interface for Single Implementation** — `UserRepositoryInterface` with one impl
2. **Repository for Every Model** — Repository pattern for all Eloquent models, including simple ones
3. **Factory for Every Object** — Factory classes for objects constructed once
4. **Strategy Pattern for One Strategy** — Strategy interface with a single concrete strategy
5. **Adapter Wrapping Nothing** — Adapter that directly mirrors wrapped class
6. **Event for Everything** — Domain events for operations that have no consumers

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Interface for Single Implementation

**Category:** Architecture

**Description:** Interface created for a class that has only one implementation and no foreseeable second one.

**Why It Happens:** "Interface-driven design" applied as dogma rather than pattern.

**Warning Signs:** `PaymentGatewayInterface` with only `StripePaymentGateway` implementation for 3+ years.

**Why Is It Harmful:** Doubles maintenance. Interface must stay in sync with implementation. Navigation slowed. No abstraction benefit.

**Preferred Alternative:** Write concrete class first. Add interface when second implementation is needed.

**Refactoring Strategy:** Remove interface, rename concrete class as the source. If interface is needed later, extract from concrete.

**Related Rules:** Interface only when second implementation exists (05-rules.md)

---

### Anti-Pattern 2: Repository for Every Model

**Category:** Architecture

**Description:** Repository pattern for every Eloquent model, even simple single-table CRUD.

**Why It Happens:** "Repository pattern is good" applied universally without considering complexity.

**Warning Signs:** `SettingRepository` with methods `find($key)`, `save($key, $value)` — thin wrapper around `Setting::where(...)`.

**Why Is It Harmful:** Boilerplate for no value. Eloquent already provides repository-like interface. Extra abstraction layer adds maintenance without benefit.

**Preferred Alternative:** Use Eloquent directly for simple CRUD. Add repository only for complex queries or when switching ORM.

**Refactoring Strategy:** Remove repository wrapping simple Eloquent queries. Keep repositories only for complex data access patterns.

**Related Rules:** Repository only for complex data access (05-rules.md)

---

### Anti-Pattern 3: Factory for Every Object

**Category:** Architecture

**Description:** Factory classes for objects constructed with simple, non-varying logic.

**Why It Happens:** "Use factory pattern" applied to every object creation.

**Warning Signs:** `UserFactory::create($data)` that just calls `new User($data)`.

**Why Is It Harmful:** Factory adds no value when construction is simple. Caller must know about both factory and created type.

**Preferred Alternative:** Use constructor or named constructors directly. Add factory only when creation logic is complex or varies.

**Refactoring Strategy:** Inline simple factories. Call constructors directly.

**Related Rules:** Factory only for complex or varying construction (05-rules.md)

---

### Anti-Pattern 4: Strategy for One Strategy

**Category:** Architecture

**Description:** Strategy pattern with only one concrete implementation.

**Why It Happens:** Anticipating future variation that never materializes.

**Warning Signs:** `ExportStrategy` interface with only `CsvExport` class for years.

**Why Is It Harmful:** Indirection without variation. Code harder to follow. Strategy selector just returns one fixed strategy.

**Preferred Alternative:** Write concrete implementation first. Extract strategy when second implementation is confirmed.

**Refactoring Strategy:** Remove strategy interface. Inline single implementation.

**Related Rules:** Strategy only when multiple algorithms exist (05-rules.md)

---

### Anti-Pattern 5: Adapter Wrapping Nothing

**Category:** Architecture

**Description:** Adapter class that directly mirrors the adapted class without adding abstraction value.

**Why It Happens:** "We might switch providers" applied to stable, long-term dependencies.

**Warning Signs:** `LoggerAdapter` with methods identical to `Logger`; `MailAdapter` with same interface as `Mail::`.

**Why Is It Harmful:** Wrapper without abstraction. Adds maintenance without benefit. Changes to wrapped class require identical changes to adapter.

**Preferred Alternative:** Only wrap when adapting between incompatible interfaces or expecting provider change.

**Refactoring Strategy:** Remove adapters wrapping stable dependencies. Add only when interface mismatch exists.

**Related Rules:** Adapter only for interface mismatch (05-rules.md)

---

### Anti-Pattern 6: Event for Everything

**Category:** Architecture

**Description:** Creating domain events for operations that have no event consumers.

**Why It Happens:** "Event-driven architecture" applied preemptively.

**Warning Signs:** Events defined with zero listeners; "future-proofing" events for hypothetical consumers.

**Why Is It Harmful:** Dead code. Event classes without listeners waste maintenance. Adds indirection without benefit.

**Preferred Alternative:** Add events when consumers are known. Remove events without listeners.

**Refactoring Strategy:** Remove events with zero listeners. Add events only when at least one consumer exists.

**Related Rules:** Events only when consumers exist (05-rules.md)
