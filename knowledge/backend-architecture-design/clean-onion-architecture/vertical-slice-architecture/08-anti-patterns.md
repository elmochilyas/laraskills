# ECC Anti-Patterns — Vertical Slice Architecture

## Domain: Backend Architecture & Design | Subdomain: Architectural Styles

### Anti-Pattern Inventory

1. **Premature Abstraction** — Extracting shared logic before three instances exist
2. **Slices Too Large** — A single "slice" containing multiple features
3. **Cross-Slice Coupling** — Slices directly depending on other slices' internals
4. **No Shared Kernel** — Duplication of value objects and domain concepts across slices
5. **Anemic Slices** — Slice classes with no behavior, just data passing
6. **Inconsistent Slice Structure** — Each slice organized differently, confusing navigation

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Premature Abstraction

**Category:** Architecture

**Description:** Extracting shared code between slices before duplication is proven.

**Why It Happens:** Developers uncomfortable with duplication; extract common code after two occurrences.

**Warning Signs:** "Shared" directory with single usage; abstractions created for hypothetical future needs.

**Why Is It Harmful:** Vertical Slice's core value is controlled duplication in exchange for independence. Premature abstraction re-introduces coupling between slices and creates generic, hard-to-understand code.

**Preferred Alternative:** Wait for three instances before extracting. Duplication is cheaper than wrong abstraction.

**Refactoring Strategy:** Remove premature abstractions. Let slices duplicate code. Extract only when maintenance cost of duplication exceeds abstraction cost.

**Related Rules:** Don't abstract before three occurrences (05-rules.md)

---

### Anti-Pattern 2: Slices Too Large

**Category:** Architecture

**Description:** A single slice handling multiple distinct features.

**Why It Happens:** Features seen as too small for their own slice; related features grouped arbitrarily.

**Warning Signs:** Slice directory containing 10+ files; slice handles 3+ different use cases.

**Why Is It Harmful:** Large slices lose independence — changes for one feature affect others in same slice. Cohesion decreases, coupling increases.

**Preferred Alternative:** One slice per feature/use case. If slice grows beyond reasonable size, split by sub-feature.

**Refactoring Strategy:** Identify distinct use cases within large slice. Extract each to its own slice directory.

**Related Rules:** One slice per feature (05-rules.md)

---

### Anti-Pattern 3: Cross-Slice Coupling

**Category:** Architecture

**Description:** Slices directly importing classes from other slices' internals.

**Why It Happens:** Different features need related data; easy to `use` from another slice.

**Warning Signs:** `use App\Features\CreateOrder\Models\OrderModel` in CancelOrder slice.

**Why Is It Harmful:** Creates implicit dependencies between slices. Cannot modify one slice without checking all that depend on it. Independence principle violated.

**Preferred Alternative:** Slices communicate through shared kernel (events, interfaces) or dedicated public APIs.

**Refactoring Strategy:** Move shared types to `Shared/` kernel. Slices communicate via events, not direct imports.

**Related Rules:** Slices must not depend on other slice internals (05-rules.md)

---

### Anti-Pattern 4: No Shared Kernel

**Category:** Architecture

**Description:** Value objects, domain events, and base types duplicated across slices unnecessarily.

**Why It Happens:** Slices treated as fully isolated with no shared foundation.

**Warning Signs:** Same `Email` value object defined in 5 slices; same events defined per slice with identical structure.

**Why Is It Harmful:** Inconsistency — same concept represented differently across slices. Maintenance burden — changes require updating N copies.

**Preferred Alternative:** Define shared value objects and domain events in a Shared kernel used by all slices.

**Refactoring Strategy:** Identify duplicated types across slices. Extract to `Shared/` directory. Reference from all slices.

**Related Rules:** Maintain shared kernel for common types (05-rules.md)

---

### Anti-Pattern 5: Anemic Slices

**Category:** Architecture

**Description:** Slice classes contain wiring and data passing, no actual behavior.

**Why It Happens:** Developers treat slices as just another file structure convention.

**Warning Signs:** Handler forwards to service; service returns data; controller passes to view — no actual logic in slice.

**Why Is It Harmful:** Slices become ceremony without substance. Same procedural code as layered architecture, just organized differently.

**Preferred Alternative:** Each slice owns its complete behavior. Handler contains the use case logic, not just delegation.

**Refactoring Strategy:** Inline service calls into handler. Remove extra layers within slice. Slice should be independently understandable.

**Related Rules:** Slice contains full feature behavior (05-rules.md)

---

### Anti-Pattern 6: Inconsistent Slice Structure

**Category:** Maintainability

**Description:** Each slice organized differently, making navigation unpredictable.

**Why It Happens:** No slice template or convention; each developer organizes their slice differently.

**Warning Signs:** One slice uses `Handler`, another uses `Action`, another uses `Service`; different file hierarchies.

**Why Is It Harmful:** Developers waste time figuring out each slice's structure. Onboarding slowed. Cognitive load increased.

**Preferred Alternative:** Standardize slice structure with template. All slices follow same naming conventions.

**Refactoring Strategy:** Create slice template. Refactor existing slices to match. Add generator command for new slices.

**Related Rules:** Standardize slice structure (05-rules.md)
