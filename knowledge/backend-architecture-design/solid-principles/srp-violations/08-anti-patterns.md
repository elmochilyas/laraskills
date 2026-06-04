# Anti-Patterns: SOLID Principles — SRP Violations

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Design Patterns & Principles |
| **Topic** | SOLID principles in PHP: SRP violations |
| **Difficulty** | Foundation |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | solid-principles |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | God Model | Architecture | High |
| 2 | Over-Splitting | Design | Medium |
| 3 | Trait-Based Separation | Design | Medium |
| 4 | Extracting Without Decoupling | Architecture | High |

## Repository-Wide Anti-Patterns

- **God Model**: Eloquent models handling auth, billing, notifications, and reporting alongside persistence
- **Micro-Class Proliferation**: 100 tiny classes for 10 responsibilities creating navigation nightmares
- **Trait-as-Bandage**: Using traits to extract responsibility while keeping implicit coupling to the model

---

## 1. God Model

**Category:** Architecture

**Description:** Eloquent models that handle authentication, authorization, billing, notifications, reporting, and other concerns in addition to persistence and core relationships.

**Why It Happens:** Laravel's convention of "fat models" encourages adding all behavior to the model. It's the path of least resistance — no new classes, no new files.

**Warning Signs:**
- Eloquent models exceeding 500 lines
- Model files with methods for sending email, generating reports, handling payments
- Single model used across controllers, jobs, commands, and tests

**Why Harmful:** Every responsibility is a reason to change. A model with 10 responsibilities changes for 10 different reasons, each change risking breakage in unrelated functionality.

**Consequences:**
- Fragile models — any change can break unrelated features
- Impossible to test in isolation
- Merge conflicts from multiple developers working on same model
- Slow test suites from model booting

**Alternative:** Keep models focused on persistence and core relationships. Extract responsibilities into dedicated action classes, value objects, or services.

**Refactoring Strategy:**
1. Identify distinct responsibilities in the model (billing, notifications, reporting)
2. Extract each into a dedicated class
3. Inject dependencies instead of using model methods directly

**Detection Checklist:**
- [ ] Does the model exceed 300 lines?
- [ ] Does the model handle concerns beyond persistence and relationships?
- [ ] Can you list distinct responsibilities the model has?

**Related Rules/Skills/Trees:**
- Rule: Keep Models Focused on Persistence (`04-standardized-knowledge.md:13-14`)

---

## 2. Over-Splitting

**Category:** Design

**Description:** Creating too many small classes that fragment logic across many files, making the codebase harder to navigate and understand.

**Why It Happens:** Overcorrection from seeing God classes. Teams apply SRP so aggressively that every minor operation becomes its own class.

**Warning Signs:**
- One class per method
- Navigation requires opening 10+ files for a single feature
- Classes with single methods that are never reused

**Why Harmful:** Over-splitting increases cognitive load — developers must understand many small pieces and how they connect. It also increases file count without proportional benefit.

**Consequences:**
- Higher cognitive load navigating many small classes
- More files to maintain without clear structure
- Team resistance to SRP after bad experience

**Alternative:** Group related behavior into cohesive classes. A class with 3-5 related methods is fine — SRP allows multiple methods if they serve the same responsibility.

**Refactoring Strategy:**
1. Review classes with only 1 method and no reuse
2. Merge related small classes with stable interfaces
3. Keep classes that serve different conceptual responsibilities separate

**Detection Checklist:**
- [ ] Are classes with 1-2 methods justified by reuse?
- [ ] Is navigation overhead acceptable?
- [ ] Are related behaviors grouped or scattered?

**Related Rules/Skills/Trees:**
- Rule: Balance SRP With Pragmatic Cohesion (`04-standardized-knowledge.md:42-43`)

---

## 3. Trait-Based Separation

**Category:** Design

**Description:** Using PHP traits to extract model responsibilities while maintaining implicit dependencies on the model's methods and properties.

**Why It Happens:** Traits seem like an easy extraction — move methods to a trait file, keep using `$this->` to access model properties.

**Warning Signs:**
- Traits that use `$this->attribute` or `$this->relationship()`
- Traits spread across models with implicit coupling
- Trait methods have no explicit dependencies

**Why Harmful:** Traits hide dependencies. A trait that calls `$this->save()` or `$this->user()` has an invisible contract with the using class. Changes to the model break the trait silently.

**Consequences:**
- Hidden coupling between traits and models
- Traits that can't be tested independently
- Fragile — changing model properties breaks traits unpredictably

**Alternative:** Use composition over inheritance. Extract to dedicated classes with explicit constructor dependencies.

**Refactoring Strategy:**
1. Identify trait methods that access `$this->` model properties
2. Extract trait into a class with explicit dependencies
3. Inject the new class where the trait was used

**Detection Checklist:**
- [ ] Do traits access `$this->` model properties?
- [ ] Are traits independently testable?
- [ ] Are trait-model contracts documented?

**Related Rules/Skills/Trees:**
- Rule: Prefer Composition Over Trait-Based Extraction (`04-standardized-knowledge.md:48-49`)

---

## 4. Extracting Without Decoupling

**Category:** Architecture

**Description:** Moving methods to separate classes but keeping tight coupling — the extracted class still depends on the original model's internals.

**Why It Happens:** Partial refactoring — teams move code to a new file but pass the entire model as argument, achieving file organization without actual decoupling.

**Warning Signs:**
- Extracted classes receive the entire model as constructor argument
- Extracted methods call `$model->save()` internally
- Cannot test extracted class without booting Eloquent

**Why Harmful:** The extracted class still couples to the model, so changes to the model still break the extracted class. Testability and maintainability don't improve.

**Consequences:**
- No real improvement in cohesion or testability
- False sense of architectural improvement
- Still need model booting for unit tests

**Alternative:** Extract to classes with primitive or value object dependencies. The extracted class should not depend on Eloquent.

**Refactoring Strategy:**
1. Review extracted classes — do they receive the full model?
2. Replace model dependencies with primitives or DTOs
3. Ensure extracted class can be tested without Eloquent

**Detection Checklist:**
- [ ] Does the extracted class receive the entire model?
- [ ] Can the extracted class be tested without Eloquent?
- [ ] Does the extracted class use model persistence methods?

**Related Rules/Skills/Trees:**
- Rule: Extract With Explicit Dependencies, Not Model Coupling (`04-standardized-knowledge.md:48-49`)
