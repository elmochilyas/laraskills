# ECC Anti-Patterns — Coupling Types & Measurement

## Domain: Backend Architecture & Design | Subdomain: Architectural Governance

### Anti-Pattern Inventory

1. **Static Facade Coupling** — Domain logic calling `Cache::`, `Config::`, `Mail::` directly
2. **Boolean Parameter Coupling** — Methods using boolean flags to change behavior
3. **Fat DTO Coupling** — Passing entire objects when only single fields needed
4. **Content Coupling** — Direct property access on external class internals
5. **Schema Coupling** — Code tightly bound to database schema details
6. **Metric Obsession** — Optimizing coupling numbers without understanding context

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Static Facade Coupling

**Category:** Architecture

**Description:** Business logic calling Laravel facades (`Cache::`, `Config::`, `Mail::`) directly, creating common coupling through global state.

**Why It Happens:** Convenience — facades are globally available with minimal code.

**Warning Signs:** `use Illuminate\Support\Facades\*` in domain/service classes; static calls mixed with business logic.

**Why Is It Harmful:** Creates hidden coupling to global state. Tests require full Laravel bootstrap. Cannot swap implementations.

**Preferred Alternative:** Inject dependencies via constructor. Use Laravel's dependency injection container.

**Refactoring Strategy:** Replace static facade calls with injected service interfaces.

**Related Rules:** Inject dependencies, don't use facades in domain (05-rules.md)

---

### Anti-Pattern 2: Boolean Parameter Coupling

**Category:** API Design

**Description:** Methods with boolean parameters that alter behavior.

**Why It Happens:** Easier to add parameter than create separate methods.

**Warning Signs:** `sendNotification($user, $urgent)` where `$urgent` changes delivery method.

**Why Is It Harmful:** Method does two different things based on flag. Caller must know flag meaning. Testing requires combinatorial explosion.

**Preferred Alternative:** Separate methods for different behaviors: `sendUrgentNotification($user)` and `sendStandardNotification($user)`.

**Refactoring Strategy:** Extract boolean-controlled branches into separate methods.

**Related Rules:** Replace boolean parameters with separate methods (05-rules.md)

---

### Anti-Pattern 3: Fat DTO Coupling

**Category:** API Design

**Description:** Passing entire objects when only one or two fields are needed.

**Why It Happens:** Convenience — already have the object, pass the whole thing.

**Warning Signs:** Method signature accepts `User $user` but only uses `$user->getId()`.

**Why Is It Harmful:** Method coupled to entire User interface. Changes to User class may affect this method. Harder to test (need full User object).

**Preferred Alternative:** Pass only required parameters as primitive types or value objects.

**Refactoring Strategy:** Change parameter from object to specific fields needed.

**Related Rules:** Pass only what's needed (05-rules.md)

---

### Anti-Pattern 4: Content Coupling

**Category:** Architecture

**Description:** Direct access to another class's internal properties or implementation details.

**Why It Happens:** Laravel models have public attributes; developers access them directly.

**Warning Signs:** `$model->attributes['field']`; accessing `$obj->privateProperty` via reflection.

**Why Is It Harmful:** Strongest form of coupling. Changes to internal implementation break external code. Encapsulation destroyed.

**Preferred Alternative:** Use public API methods. Respect encapsulation boundaries.

**Refactoring Strategy:** Replace direct property access with method calls.

**Related Rules:** Don't access external class internals (05-rules.md)

---

### Anti-Pattern 5: Schema Coupling

**Category:** Architecture

**Description:** Code tightly coupled to database schema details (column names, table structures).

**Why It Happens:** Eloquent makes schema directly accessible from code.

**Warning Signs:** Raw SQL in services; `DB::raw()` for business logic; column names duplicated across codebase.

**Why Is It Harmful:** Schema changes cascade through entire codebase. Cannot change DB without changing business code.

**Preferred Alternative:** Use repository pattern or query scopes to encapsulate schema details.

**Refactoring Strategy:** Extract raw queries behind repository methods. Use named scopes on models.

**Related Rules:** Encapsulate schema details behind interfaces (05-rules.md)

---

### Anti-Pattern 6: Metric Obsession

**Category:** Analysis

**Description:** Optimizing coupling metrics as numbers without architectural context.

**Why It Happens:** "Lower coupling is better" applied blindly.

**Warning Signs:** Classes split purely to reduce Ce score; coupling reduced but domain coherence destroyed.

**Why Is It Harmful:** Meaningful domain relationships broken for metric improvement. System harder to understand despite "better" metrics.

**Preferred Alternative:** Interpret coupling metrics in domain context. Accept necessary coupling for coherent modules.

**Refactoring Strategy:** Review coupling in context of domain boundaries. Accept high coupling within a bounded context.

**Related Rules:** Interpret coupling metrics in domain context (05-rules.md)
