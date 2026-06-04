# ECC Anti-Patterns — Cohesion Types & Measurement

## Domain: Backend Architecture & Design | Subdomain: Architectural Governance

### Anti-Pattern Inventory

1. **Utility/Helper Classes** — Logical cohesion grouping unrelated functions
2. **God Class** — Class with coincidental/functional mix of responsibilities
3. **"Manager" Classes** — Vague responsibility that accumulates everything
4. **Only Measuring Coupling** — Ignoring cohesion metrics entirely
5. **False High Cohesion** — Methods sharing fields but doing unrelated operations
6. **Siloed Classes** — Over-splitting that destroys meaningful cohesion

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Utility/Helper Classes

**Category:** Cohesion

**Description:** Classes named `StringHelper`, `ArrayUtils`, `GeneralUtility` containing unrelated functions.

**Why It Happens:** Developers don't know where to put a function; utility class is default.

**Warning Signs:** `Helpers.php` file with 50+ unrelated functions; static utility methods sprinkled throughout codebase.

**Why Is It Harmful:** Lowest level of cohesion (logical/coincidental). No encapsulation. Makes code hard to find and test. Encourages procedural style.

**Preferred Alternative:** Each function belongs to a class with a single responsibility.

**Refactoring Strategy:** Identify responsibilities in utility class. Extract each group to its own focused class.

**Related Rules:** Replace utility classes with focused value objects or services (05-rules.md)

---

### Anti-Pattern 2: God Class

**Category:** Cohesion

**Description:** Single class that handles reporting, validation, persistence, and business logic.

**Why It Happens:** Convenience — one place for everything related to a concept.

**Warning Signs:** Class > 1000 lines; class has 10+ injected dependencies; class changed for many different reasons.

**Why Is It Harmful:** Multiple unrelated responsibilities in one class. Changes for one reason risk breaking unrelated functionality. Impossible to test in isolation.

**Preferred Alternative:** Split by responsibility into focused, single-purpose classes.

**Refactoring Strategy:** Extract each responsibility group into separate class. Use composition to delegate.

**Related Rules:** One class, one responsibility (05-rules.md)

---

### Anti-Pattern 3: "Manager" Classes

**Category:** Cohesion

**Description:** Classes named `OrderManager`, `UserManager`, `PaymentManager` with vague responsibilities.

**Why It Happens:** "Manager" is a default suffix when developers can't name the class properly.

**Warning Signs:** Manager class does CRUD, validation, notifications, reporting — all in one class.

**Why Is It Harmful:** Vague name hides low cohesion. Manager classes become dumping grounds for anything related to the domain concept.

**Preferred Alternative:** Use specific names that describe the single responsibility: `OrderCreator`, `OrderValidator`, `OrderNotifier`.

**Refactoring Strategy:** Split manager responsibilities into specific action/service classes.

**Related Rules:** Name classes by their specific responsibility (05-rules.md)

---

### Anti-Pattern 4: Only Measuring Coupling

**Category:** Analysis

**Description:** Focusing exclusively on coupling metrics while ignoring cohesion.

**Why It Happens:** Coupling tools (Deptrac) are more common than cohesion analysis.

**Warning Signs:** Low coupling celebrated while utility classes grow; team proud of loose coupling but code still hard to maintain.

**Why Is It Harmful:** Low coupling + low cohesion is still bad architecture. Classes can be independent but contain unrelated logic.

**Preferred Alternative:** Measure both coupling and cohesion as complementary metrics.

**Refactoring Strategy:** Add cohesion measurement (LCOM) to analysis pipeline. Review low-cohesion classes alongside high-coupling ones.

**Related Rules:** Measure both coupling and cohesion (05-rules.md)

---

### Anti-Pattern 5: False High Cohesion

**Category:** Analysis

**Description:** Methods share fields but perform completely unrelated operations.

**Why It Happens:** LCOM metric considers field sharing as cohesion indicator, ignoring semantic relationship.

**Warning Signs:** LCOM score looks good but class is hard to understand; methods operate on same data for different purposes.

**Why Is It Harmful:** Metric gives false confidence. Class appears cohesive but has multiple responsibilities operating on shared state.

**Preferred Alternative:** Combine metrics with code review. High field sharing doesn't guarantee semantic cohesion.

**Refactoring Strategy:** Review "cohesive" classes for semantic coherence. Split if methods use same fields for different purposes.

**Related Rules:** Verify cohesion semantically, not just metrically (05-rules.md)

---

### Anti-Pattern 6: Siloed Classes

**Category:** Cohesion

**Description:** Over-splitting creates classes with single methods, destroying meaningful cohesion.

**Why It Happens:** SRP interpreted as "one method per class."

**Warning Signs:** Classes with one public method and nothing else; 200+ classes for simple CRUD operations.

**Why Is It Harmful:** Related operations scattered across many classes. Navigation becomes difficult. Cohesion destroyed by fragmentation.

**Preferred Alternative:** Group related operations into cohesive classes. Method count is not a cohesion metric.

**Refactoring Strategy:** Merge related single-method classes. Aim for 3-5 public methods per class as guideline.

**Related Rules:** Group related operations, don't over-split (05-rules.md)
