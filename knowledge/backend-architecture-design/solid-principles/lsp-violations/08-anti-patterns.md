# Anti-Patterns: SOLID Principles — LSP Violations

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Design Patterns & Principles |
| **Topic** | SOLID principles in PHP: LSP violations |
| **Difficulty** | Intermediate |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | solid-principles |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Inheritance for Code Reuse | Architecture | High |
| 2 | Strengthened Preconditions | Design | High |
| 3 | Weakened Postconditions | Design | High |
| 4 | Silent No-Op Implementation | Design | Medium |
| 5 | New Exception Types | Reliability | High |

## Repository-Wide Anti-Patterns

- **Reuse-Without-Substitutability**: Inheriting purely for code reuse without ensuring behavioral substitutability
- **Design-by-Contract Ignorance**: Adding stronger validation in subtypes or returning weaker results without documentation
- **Exception Contract Leakage**: Throwing exceptions in subtypes that the base contract does not declare

---

## 1. Inheritance for Code Reuse

**Category:** Architecture

**Description:** Subclassing a base class purely to reuse its methods, without ensuring the subclass is substitutable for the base.

**Why It Happens:** PHP's inheritance model makes code reuse the path of least resistance. Developers think "I want those methods" without considering LSP.

**Warning Signs:**
- Child classes that override methods to throw exceptions or do nothing
- `@inheritdoc` docblock without understanding the contract
- Base class methods called but behavior differs in subclass

**Why Harmful:** Code that works with the base class breaks silently when given the subclass. Bugs surface at runtime because PHP has no compile-time contract enforcement.

**Consequences:**
- Runtime errors from unexpected subtype behavior
- Hard-to-diagnose bugs (everything compiles, but behavior is wrong)
- Fear of using polymorphism — teams avoid interfaces they don't trust

**Alternative:** Prefer composition over inheritance. Extract shared behavior into a service or delegate class that both can use.

**Refactoring Strategy:**
1. Identify subclasses that override base behavior incompatibly
2. Extract shared logic into a composed service
3. Replace inheritance with interface + composition

**Detection Checklist:**
- [ ] Is inheritance used primarily for code reuse?
- [ ] Can the subtype be substituted for the base without behavioral change?
- [ ] Would composition serve the same purpose?

**Related Rules/Skills/Trees:**
- Rule: Favor Composition Over Inheritance (`04-standardized-knowledge.md:48-49`)

---

## 2. Strengthened Preconditions

**Category:** Design

**Description:** Adding validation or constraints in a subtype method that the base type did not have, making the subtype less permissive than its parent.

**Why It Happens:** A developer adds "reasonable" validation in the subtype to protect against invalid inputs, not realizing they're strengthening the contract.

**Warning Signs:**
- Child method throws exceptions for inputs the parent accepts
- Child method adds type narrowing not present in parent
- New validation logic in overridden methods

**Why Harmful:** Code that passes valid input to the base type breaks when given the subtype. This violates the contract that subtypes accept everything the base accepts.

**Consequences:**
- Intermittent runtime failures when types are substituted
- Hard-to-debug issues — the error appears at the wrong abstraction level
- Callers must know concrete types to avoid validation

**Alternative:** Validate at system boundaries, not in polymorphic methods. Use value objects to guarantee valid state before reaching the method.

**Refactoring Strategy:**
1. Identify subtype methods with stronger validation than base
2. Move validation to entry points (controllers, commands)
3. Ensure subtype method accepts everything the base accepts

**Detection Checklist:**
- [ ] Does the subtype reject inputs the base accepts?
- [ ] Are there additional exception throws in subtype methods?
- [ ] Does the subtype narrow parameter types beyond base contract?

**Related Rules/Skills/Trees:**
- Rule: Subtypes Must Accept All Base Inputs (`04-standardized-knowledge.md:13-15`)

---

## 3. Weakened Postconditions

**Category:** Design

**Description:** A subtype method returning weaker guarantees than the base type — returning null where base returns an object, fewer items, or less specific results.

**Why It Happens:** The subtype legitimately can't fulfill the base contract but returns what it can. The developer assumes callers will handle the weaker result.

**Warning Signs:**
- Subtype returns `null` where base returns an object
- Subtype returns an empty collection where base returns data
- Docblock shows `@return ?array` vs base's `@return array`

**Why Harmful:** Callers depend on postconditions of the base type. A subtype that returns null or empty results silently breaks caller assumptions, causing NPEs or empty states.

**Consequences:**
- Null pointer exceptions from unexpected null returns
- Empty states not handled by caller logic
- Silent failures — missing data without errors

**Alternative:** Use the Null Object pattern for missing results. Ensure the return type matches the base contract exactly.

**Refactoring Strategy:**
1. Identify subtype methods with weaker return guarantees
2. Replace null returns with Null Object pattern
3. Ensure return types match base contract exactly

**Detection Checklist:**
- [ ] Does the subtype return null where base returns non-null?
- [ ] Does the subtype return fewer items than documented?
- [ ] Are return types consistent across hierarchy?

**Related Rules/Skills/Trees:**
- Rule: Subtypes Must Fulfill Base Return Contracts (`04-standardized-knowledge.md:14-15`)

---

## 4. Silent No-Op Implementation

**Category:** Design

**Description:** A subtype method that does nothing (empty body) while the base type documents specific expected behavior.

**Why It Happens:** The subtype doesn't need the behavior but must implement the interface. An empty method seems harmless.

**Warning Signs:**
- Method body is empty or returns a default
- `// no-op` or `// not needed` comments
- Logging call that does nothing

**Why Harmful:** Callers depend on the method having an effect. A no-op silently breaks caller expectations — no error, no output, no effect.

**Consequences:**
- Features silently not working for certain subtypes
- Hard to debug — no error is thrown, but nothing happens
- Callers must check if the subtype supports the operation

**Alternative:** Implement with meaningful behavior or throw a documented exception. Better: split the interface so the subtype doesn't need the method.

**Refactoring Strategy:**
1. Identify no-op implementations in subtypes
2. Document why the behavior is not needed
3. Extract into a separate interface if the method is irrelevant

**Detection Checklist:**
- [ ] Are there no-op method implementations?
- [ ] Do callers expect the method to have an effect?
- [ ] Could the interface be split to avoid the irrelevant method?

**Related Rules/Skills/Trees:**
- Rule: Avoid No-Op Implementations (`04-standardized-knowledge.md:14-15`)

---

## 5. New Exception Types

**Category:** Reliability

**Description:** Throwing exception types in a subtype method that the base type's contract does not declare or imply.

**Why It Happens:** The subtype needs to signal an error state not anticipated by the base contract. Adding a new exception type seems natural.

**Warning Signs:**
- Subtype throws exceptions not documented in base interface
- `@throws` annotations differ between base and subtype
- Callers catch exceptions from subtypes that base doesn't throw

**Why Harmful:** Callers written against the base type don't catch unexpected exception types. These propagate as 500 errors or crash the application.

**Consequences:**
- Unexpected 500 errors from subtype-specific exceptions
- Callers must know concrete types to catch appropriately
- Violates caller's expectation of exception contract

**Alternative:** Wrap subtype-specific exceptions in base-declared exception types. Document all possible exceptions at the interface level.

**Refactoring Strategy:**
1. Identify exception types thrown by subtype but not base
2. Wrap them in base-declared exception types
3. Update interface documentation to include all possible exceptions

**Detection Checklist:**
- [ ] Does the subtype throw exceptions the base doesn't?
- [ ] Are `@throws` annotations consistent across the hierarchy?
- [ ] Do callers catch unexpected exception types?

**Related Rules/Skills/Trees:**
- Rule: Subtypes Must Not Throw Undeclared Exceptions (`04-standardized-knowledge.md:14-15`)
