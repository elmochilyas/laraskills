# ECC Anti-Patterns — Organizing by Layer

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Organizing by layer: app/Http, app/Models, app/Services |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God Service Class
2. Layer Leakage
3. Inconsistent Extraction
4. Repository-Wrapper Service Classes
5. Catch-All Directory Creep

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Services
- Overengineering
- Premature Abstraction

---

## Anti-Pattern 1: God Service Class

### Category
Architecture

### Description
A single service class handling operations for multiple unrelated entities or domains. `UserService` grows to handle registration, login, password reset, profile updates, billing, and notifications — effectively recreating the fat-controller problem in the service layer.

### Why It Happens
Adding methods to an existing service is easier than creating a new class. Team lacks a "one responsibility per service" convention. Entity-oriented naming (`UserService`) implies all user-related operations belong together.

### Warning Signs
- A service class exceeds 300 lines
- The service class imports 8+ different models
- Methods in the service handle entirely unrelated concerns (registration + billing + notifications)
- Changes to one method frequently break unrelated methods via shared state

### Why It Is Harmful
God services violate Single Responsibility Principle. High coupling means changes to billing risk breaking registration. The class becomes impossible to unit test without mocking 10+ dependencies. No clear refactoring path emerges.

### Real-World Consequences
A `UserService` handling registration, billing, and notifications caused a billing change to accidentally send duplicate welcome emails for a week. The regression was missed because the billing test suite didn't test registration behavior.

### Preferred Alternative
Split by responsibility — one service per business capability. Use `RegistrationService`, `BillingService`, `NotificationService` instead of a monolithic `UserService`. For single discrete operations, use Action classes.

### Refactoring Strategy
1. Identify all distinct responsibilities within the god service by grouping methods by entity or domain
2. Create focused service classes for each group
3. Copy methods, dependencies, and tests to new services
4. Update all controllers and callers to inject the appropriate focused service
5. Remove the original god service after confirming no remaining references

### Detection Checklist
- [ ] Count methods in each service class — more than 8-10 across unrelated entities?
- [ ] Check import count — does the service import more than 5 different model classes?
- [ ] Review method groupings — are they all related to one domain?

### Related Rules
- R05: Split Services When They Handle Multiple Unrelated Operations (COS-02/05-rules.md)

### Related Skills
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)

### Related Decision Trees
- Service Class vs Action Class for Business Logic (COS-02/07-decision-trees.md)

---

## Anti-Pattern 2: Layer Leakage

### Category
Architecture

### Description
Controllers calling Eloquent models directly instead of delegating to services. `User::where(...)` queries, inline business logic calculations, and direct model mutations appear in controller methods despite a service layer existing.

### Why It Happens
Service extraction is perceived as overhead. Developers take the shortest path from route to database. No architecture tests enforce boundaries. Team convention is inconsistent — some controllers use services, others don't.

### Warning Signs
- Controllers contain `Model::where(...)`, `DB::table(...)`, or `Model::create(...)` calls
- No architecture tests verifying layer isolation
- Controllers have more than 20 lines of logic beyond validation and response
- Business rules are duplicated across controllers

### Why It Is Harmful
Business logic mixed with HTTP orchestration cannot be unit tested (requires full HTTP stack). Logic duplication across controllers creates inconsistency. Refactoring business rules requires changing every controller that breaks the boundary.

### Real-World Consequences
A critical pricing calculation was embedded in 5 different controllers. When the pricing rule changed, the team missed updating 2 controllers, causing inconsistent pricing for a subset of users over 3 months.

### Preferred Alternative
Enforce a delegation rule: controllers validate input via Form Requests, call services, and return responses — no business logic. Back this with architecture tests that fail CI when controllers call Eloquent models directly.

### Refactoring Strategy
1. Run architecture tests to quantify every controller-to-model direct call
2. Extract inline business logic to service methods
3. Replace direct model calls with service method invocations
4. Add architecture tests that prevent future leakage
5. Set up CI to fail on layer violation detection

### Detection Checklist
- [ ] Grep for `::find(`, `::where(`, `::create(`, `::update(` inside `app/Http/Controllers/`
- [ ] Check if architecture tests exist for layer boundaries
- [ ] Review PRs for new business logic added to controllers

### Related Rules
- R01: Keep Controllers Free of Business Logic Beyond HTTP Orchestration (COS-02/05-rules.md)
- R04: Enforce Layer Boundaries via Architecture Tests (COS-02/05-rules.md)

### Related Skills
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)

### Related Decision Trees
- Layer-Based vs Feature-Based Organization (COS-02/07-decision-trees.md)

---

## Anti-Pattern 3: Inconsistent Extraction

### Category
Code Organization

### Description
Some controllers are thin (delegating to services), while others contain inline business logic. No team standard exists for when to extract business logic. The codebase becomes unpredictable — developers can't assume where logic lives.

### Why It Happens
No team-wide extraction rule. Individual developers make different architectural choices. Legacy code predates service layer conventions. New developers learn from whichever controller they encounter first.

### Warning Signs
- Some controllers are 10 lines, others are 300 lines
- No team documentation on extraction criteria (e.g., "extract when > 15 lines of logic")
- Code reviews inconsistently request extraction
- New features sometimes use services, sometimes don't

### Why It Is Harmful
Unpredictable codebase — developers must read every controller to find business logic. Testing strategy cannot be uniform (some logic testable via unit tests, some requires HTTP integration). Onboarding confusion about project conventions.

### Real-World Consequences
A team spent 6 months alternating between fat and thin controllers. New developer onboarding included a "guess where the logic lives" scavenger hunt. Unit test coverage was misleading — 70% overall but 30% on the business-critical module with fat controllers.

### Preferred Alternative
Establish a team-wide extraction rule: all non-trivial business logic (more than 5 lines of conditional code) lives in a service or action class. Document this rule in CONTRIBUTING.md and enforce in code review.

### Refactoring Strategy
1. Audit all controllers and classify them as "extracted" or "inline"
2. Document the extraction threshold (e.g., "any logic beyond 5 lines of data formatting")
3. Refactor inline controllers systematically, starting with the most business-critical
4. Add architecture tests that verify extraction consistency
5. Include extraction criteria in PR review checklist

### Detection Checklist
- [ ] Compare line counts across controllers — is there high variance?
- [ ] Check if the project has a documented extraction standard
- [ ] Review 3 recent PRs — is extraction consistently applied?

### Related Rules
- R02: Extract Every Non-Trivial Business Operation to a Service Class (COS-02/05-rules.md)

### Related Skills
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)

---

## Anti-Pattern 4: Repository-Wrapper Service Classes

### Category
Framework Usage

### Description
Service classes that merely wrap Eloquent CRUD operations without adding business value. `UserService::find()`, `UserService::create()`, `UserService::update()` that delegate directly to `User::find()`, `User::create()`, `User::update()` — adding ceremony without encapsulation or business logic.

### Why It Happens
Belief that all model access must go through a service layer. Previous experience with Repository pattern in other frameworks. Misunderstanding of service class responsibility (orchestration vs CRUD wrapping).

### Warning Signs
- Service methods mirror Eloquent methods exactly: `find()`, `all()`, `create()`, `update()`, `delete()`
- Service methods contain no business logic, validation, or orchestration
- Calling the service is more verbose than calling Eloquent directly
- The service has no tests beyond "calls the model method"

### Why It Is Harmful
Ceremony without value — the service adds an indirection layer that provides no encapsulation, no testability benefit, and no business logic. It makes simple operations more verbose and creates maintenance burden when the service must be updated for every model change.

### Real-World Consequences
A project had 15 repository-wrapper service classes, each with `find()`, `create()`, `update()`, `delete()` methods. When a model renamed a column, the team had to update: the migration, the model, AND the service method. Zero benefit gained from the extra layer.

### Preferred Alternative
Use Eloquent directly from service classes that contain actual business logic. Only introduce a service when it orchestrates multiple operations, enforces business rules, or coordinates cross-cutting concerns. For simple CRUD, call Eloquent directly in controllers or thin service methods.

### Refactoring Strategy
1. Identify all service methods that are pure CRUD wrappers
2. Replace calls to `$service->find($id)` with `Model::find($id)` inline
3. After removing all pure-wrapping methods, delete any service class left with zero methods
4. Add architecture tests to prevent new wrapper services from being created

### Detection Checklist
- [ ] Grep for `return Model::` in service classes — are methods just forwarding calls?
- [ ] Check if removing the service class would require any business logic relocation
- [ ] Verify services contain actual orchestration, validation, or business rules

### Related Rules
- R06: Never Create Repository-Wrapper Service Classes (COS-02/05-rules.md)

### Related Skills
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)

### Related Decision Trees
- Add app/Repositories vs Use Eloquent Directly (COS-01/07-decision-trees.md)

---

## Anti-Pattern 5: Catch-All Directory Creep

### Category
Code Organization

### Description
Creating `app/Helpers/`, `app/Utilities/`, `app/Common/`, or `app/Traits/` directories that accumulate unrelated code. Over time these become dumping grounds with no clear ownership — formatting functions, validation helpers, trait mixins, and random utility classes all mixed together.

### Why It Happens
No clear naming convention for miscellaneous code. Developers don't know where else to put a file. The directory name is generic enough to accept anything. No team ownership — "it's just helpers."

### Warning Signs
- `app/Helpers/` or `app/Common/` exists and contains more than 5 files
- Files in the catch-all directory serve different purposes (formatting, I/O, math, string)
- No team owns the catch-all directory — bugs filed there go unassigned
- New files are added to the catch-all because "that's where the other stuff is"

### Why It Is Harmful
Unrelated code mixed together with no ownership. Untestable global functions. Duplicated logic — developers can't find existing functions so they write new ones. Dead code accumulates because nobody knows what's in there and fear removing anything.

### Real-World Consequences
A 3-year-old `app/Helpers/` directory contained 47 files: 12 date formatters (5 were duplicates), 8 array helpers (3 identical), 15 functions using deprecated APIs, and 12 files that nothing imported. No team member could identify which helpers were actually in use.

### Preferred Alternative
Name directories by specific concern. `app/Support/DateFormatter.php`, `app/Services/TaxService.php`, `app/Actions/SendEmailNotification.php`. Each directory name describes exactly what it contains. Cross-cutting infrastructure gets a specific home like `app/Support/`, never a catch-all.

### Refactoring Strategy
1. Audit every file in catch-all directories and classify by purpose
2. Create named directories for each purpose group
3. Move files to group-specific directories with namespace updates
4. Remove dead code (zero references in the codebase)
5. Delete the catch-all directory after all files are relocated
6. Add a team rule: "Catch-all directories are prohibited"

### Detection Checklist
- [ ] Does `app/Helpers/`, `app/Common/`, `app/Utilities/`, or `app/Traits/` exist?
- [ ] Count files in each — more than 5 is a warning
- [ ] Review file purposes — are they truly related?

### Related Rules
- R03: Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/` (COS-02/05-rules.md)

### Related Skills
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)

### Related Decision Trees
- Add Catch-All Directory vs Name by Specific Concern (COS-02/07-decision-trees.md)
