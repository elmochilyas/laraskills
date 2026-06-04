# ECC Anti-Patterns — Feature-Based Organization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Organizing by feature/vertical slice within app/ |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Leaky Features
2. Giant Feature / God Feature
3. Orphaned Features
4. Shared Code Explosion
5. Inconsistent Feature Structure

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Services
- Overengineering
- Premature Abstraction

---

## Anti-Pattern 1: Leaky Features

### Category
Architecture

### Description
Feature A imports models, services, or other classes directly from Feature B's directory. Feature A's `CheckoutService` uses `App\Features\UserRegistration\Models\User` instead of communicating through events, contracts, or the shared kernel. Cross-feature coupling defeats the purpose of feature isolation.

### Why It Happens
Quickest path to reference a needed class. Missing shared kernel — shared code has no neutral home. Team doesn't enforce boundary rules. Events and contracts are perceived as too much overhead.

### Warning Signs
- `use App\Features\SomeOtherFeature\` imports in feature code
- Changing one feature requires updating multiple features
- Feature tests fail when an unrelated feature changes
- No architecture tests enforce feature boundaries

### Why It Is Harmful
Brittle feature boundaries — changing one feature breaks unrelated features. Feature ownership becomes meaningless. Feature extraction (splitting into separate packages or microservices) becomes impossible without untangling dependencies.

### Real-World Consequences
Feature A (Checkout) imported models from Feature B (UserRegistration). When Feature B renamed a model property, Feature A broke silently — customers couldn't complete checkout until the coupling was discovered during the next deployment.

### Preferred Alternative
Communicate across features using events or contract interfaces. Extract truly shared code to a shared kernel (`app/Shared/`). Enforce no-direct-imports with architecture tests.

### Refactoring Strategy
1. Identify all cross-feature imports with architecture tests or grep
2. For each, determine if the code should be in shared kernel or communicated via events
3. Extract shared code to `app/Shared/` or add event-based communication
4. Remove direct imports between features
5. Add CI-enforced architecture tests preventing new cross-feature leaks

### Detection Checklist
- [ ] Grep for `use App\Features\` inside `app/Features/` — count cross-feature references
- [ ] Check if architecture tests exist for feature isolation
- [ ] Verify feature boundaries align with team ownership

### Related Rules
- R02: Never Import Directly from Another Feature's Internal Code (COS-05/05-rules.md)
- R05: Establish a Shared Kernel for Cross-Cutting Concerns (COS-05/05-rules.md)
- R08: Enforce Feature Boundaries via Architecture Tests (COS-05/05-rules.md)

### Related Skills
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)

### Related Decision Trees
- Feature-Based vs Domain-Based Organization (COS-05/07-decision-trees.md)

---

## Anti-Pattern 2: Giant Feature / God Feature

### Category
Code Organization

### Description
A feature directory containing 50+ files and multiple distinct sub-capabilities. The "Checkout" feature grows to include checkout, subscription management, refunds, invoices, and payment method management — effectively recreating a domain within a single feature directory.

### Why It Happens
Feature boundary too coarse. "Everything related to money goes in Payments." Feature started small and grew incrementally without being split. Team avoids splitting because of perceived overhead.

### Warning Signs
- Feature directory exceeds 30-50 files
- Feature contains multiple sub-capabilities that could stand alone
- Different team members own different parts of the same feature
- Feature tests take 10+ minutes to run

### Why It Is Harmful
Giant features lose the discoverability benefit that feature organization provides. They become as hard to navigate as flat layer directories. Feature ownership blurs — multiple teams touch the same feature. Testing becomes slow.

### Real-World Consequences
A "Checkout" feature grew to 80+ files including order processing, subscription management, refunds, and invoice generation. When the team split into two (frontend and backend), both teams modified the same feature directory, causing daily merge conflicts.

### Preferred Alternative
Split features when they exceed 30-50 files or encompass multiple sub-capabilities. Extract `Checkout/Refunds`, `Checkout/Subscriptions`, `Checkout/Invoices` as separate features or further decompose.

### Refactoring Strategy
1. List all sub-capabilities within the giant feature
2. Create new feature directories for each sub-capability
3. Move classes to appropriate new features
4. Update namespace declarations
5. Establish a team rule: split features at 30-50 file threshold

### Detection Checklist
- [ ] Count files in each feature directory — over 50 is a warning
- [ ] Review feature for multiple distinct sub-capabilities
- [ ] Check if feature requires input from multiple teams

### Related Rules
- R06: Limit Feature Size — Extract Sub-Features (COS-05/05-rules.md)

### Related Skills
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)

### Related Decision Trees
- Feature-Based vs Domain-Based Organization (COS-05/07-decision-trees.md)

---

## Anti-Pattern 3: Orphaned Features

### Category
Maintainability

### Description
Features that are no longer actively developed but remain in the codebase without clear lifecycle management. Dead code, unused routes, orphaned event listeners, and abandoned models accumulate in feature directories with no owner.

### Why It Happens
No feature lifecycle policy. Features are deprecated but never removed ("we might need it again"). Fear of deleting code that might be needed. No automated detection of unused or dead features.

### Warning Signs
- Feature has no active development for 6+ months
- No team owns the feature in ownership documentation
- Feature routes return 404 or are unreachable
- Feature's tests are skipped or failing for months

### Why It Is Harmful
Dead code confuses new developers who assume all features are active. Maintenance burden — dead features must still be loaded and deployed. Atrophy — when the feature is needed, the code is unreliable because it hasn't been maintained.

### Real-World Consequences
An abandoned "LoyaltyPoints" feature remained in the codebase for 18 months. Routes were removed but event listeners remained registered. A change to the `User` model triggered the abandoned listener, which tried to update a non-existent loyalty table, causing a 500 error.

### Preferred Alternative
Establish a feature lifecycle: active → deprecated → removed with a 3-month deprecation window. Archive deprecated features to a branch or tag. Remove the directory and all references during the next cleanup sprint.

### Refactoring Strategy
1. Identify features with no commits in 6+ months
2. Confirm with team that the feature is deprecated
3. Remove all code, routes, event listeners, and database tables
4. Add entry to CHANGELOG about removed feature
5. Archive the code to a dedicated branch for reference

### Detection Checklist
- [ ] Check git log for each feature directory — any commits in 6 months?
- [ ] Verify all feature routes are reachable and functional
- [ ] Check if feature event listeners have active listeners

### Related Rules
- R01: Keep Each Feature Fully Self-Contained (COS-05/05-rules.md)

### Related Skills
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)

---

## Anti-Pattern 4: Shared Code Explosion

### Category
Architecture

### Description
Every feature duplicates the same CRUD boilerplate, validation logic, and infrastructure code. Features have their own copies of `BaseController`, `ApiResponseTrait`, pagination helpers, date formatters, and audit logging — all identical but duplicated across N features.

### Why It Happens
Over-correction on feature isolation. Misunderstanding "no cross-feature imports" as "no shared code at all." Fear that a shared kernel creates coupling. No team investment in creating and maintaining a shared kernel.

### Warning Signs
- Same utility class exists in 3+ feature directories with identical code
- Features implement the same infrastructure pattern differently
- Bug fixes must be applied to N copies of the same code
- Onboarding documents say "copy this class to your new feature folder"

### Why It Is Harmful
Massive duplication — fixing a bug requires changes in N locations. Inconsistent implementations — features evolve their copies differently. Maintenance burden grows linearly with features. Violates DRY principle.

### Real-World Consequences
A bug in date formatting logic existed in 5 feature directories. The team fixed it in 3 features, missed 2. Invoices in those 2 features displayed wrong dates for 3 months until a customer reported the discrepancy.

### Preferred Alternative
Extract shared infrastructure to a shared kernel (`app/Shared/`, `app/Support/`). Base controllers, response formatters, audit logging, and utility classes should live in one place. Share infrastructure; don't share domain logic.

### Refactoring Strategy
1. Identify all duplicated code across features using code duplication detection
2. Extract each unique piece to `app/Shared/` with a clear name
3. Update all features to import from the shared location
4. Delete the duplicated copies
5. Add a team rule: "Third copy triggers extraction"

### Detection Checklist
- [ ] Search for identical files across feature directories
- [ ] Check if features have their own copies of base controllers or utility classes
- [ ] Verify bug fix can be applied in one location

### Related Rules
- R05: Establish a Shared Kernel for Cross-Cutting Concerns (COS-05/05-rules.md)

### Related Skills
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)

### Related Decision Trees
- Shared Kernel vs Code Duplication Across Features (COS-05/07-decision-trees.md)

---

## Anti-Pattern 5: Inconsistent Feature Structure

### Category
Code Organization

### Description
Features within the same project have different directory structures. Some features have controllers, models, and services; others have only controllers. Some have Events/, some don't. Some use routes.php, others add routes to the global routes file. No feature skeleton template exists.

### Why It Happens
No team convention for feature scaffolding. Each feature was created by a different developer with different preferences. Features were added incrementally as team conventions evolved.

### Warning Signs
- Feature features directories have different subdirectory structures
- Some features have routes.php files, others don't
- Some features have Events/, others don't
- New feature creation requires a discussion about structure

### Why It Is Harmful
Unpredictable codebase — developers can't assume what exists in each feature. Onboarding confusion — new developers must learn multiple feature patterns. Scaffolding new features requires manual decisions about structure.

### Real-World Consequences
A new team member spent 30 minutes creating a new feature because they had to check 3 existing features to understand what files they needed. Two features didn't have Events/ directories — but they should have. The inconsistent pattern wasted developer time across every feature creation.

### Preferred Alternative
Create a feature skeleton template (e.g., `artisan make:feature` or a stub directory) that defines the standard structure. Enforce the template in code review. Automate feature creation with a generator command.

### Refactoring Strategy
1. Define the standard feature skeleton: minimum directories, required files (routes.php, service providers), optional directories
2. Create a custom `artisan make:feature` command that scaffolds the template
3. Retrofit existing features to match the template structure
4. Remove deviation without justification
5. Add CI check that features match the template

### Detection Checklist
- [ ] Compare subdirectory contents across feature directories — are they consistent?
- [ ] Check if a feature skeleton template or generator exists
- [ ] Verify new feature PRs follow the established pattern

### Related Rules
- R01: Keep Each Feature Fully Self-Contained (COS-05/05-rules.md)

### Related Skills
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)
