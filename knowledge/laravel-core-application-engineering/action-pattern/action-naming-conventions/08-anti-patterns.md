# ECC Anti-Patterns — Action Naming Conventions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Naming Conventions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Mixed Naming Conventions (The Most Destructive Anti-Pattern)
2. Flat Action Directory at Scale (No Domain Grouping)
3. Method Name Mismatch with Class Intent
4. Redundant ActionSuffix in Dedicated Namespace
5. Convention Chosen Without Considering Future Scale

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files (no; N/A)
- Overengineering (flat directory renamed to NounVerb instead of subdirectories)
- Premature Abstraction (ActionSuffix on every class)

---

## Anti-Pattern 1: Mixed Naming Conventions

### Category
Code Organization | Maintainability

### Description
A codebase where action classes use a mix of VerbNoun (`CreateOrder`), NounVerb (`UserUpdate`), and VerbNoun+ActionSuffix (`DeleteUserAction`) in the same directory. Developers cannot predict the name of any action without searching.

### Why It Happens
No documented convention. Different developers follow different mental models. Team grows without establishing naming standards. Code review does not enforce consistency.

### Warning Signs
- `app/Actions/` contains `CreateOrder`, `UserUpdate`, `DeleteUserAction`, `TeamCreate`
- Developers regularly use IDE search to find actions instead of knowing the name
- New actions follow whatever pattern was used in the most recent file

### Why It Is Harmful
Cognitive friction in every interaction with the action directory. Developers must check each file to know its name. Duplicate actions appear because developers cannot find existing ones. The architecture appears unprofessional and chaotic.

### Real-World Consequences
A developer creates `CancelOrderAction` (VerbNoun+ActionSuffix) when `CancelOrder` (VerbNoun) already exists. Two files for the same operation. The codebase now has two competing conventions and duplicate logic.

### Preferred Alternative
Choose exactly one naming convention and enforce it across all actions. Document the decision. Use Pest architecture tests to enforce compliance.

### Refactoring Strategy
1. Document the chosen convention (recommended: VerbNoun).
2. Rename all actions that violate the convention to match.
3. Update all `use` imports and references across the codebase.
4. Add Pest architecture tests enforcing the naming pattern.
5. Add the naming convention to the team's PR template.

### Detection Checklist
- [ ] List all action classes — count how many follow each convention
- [ ] Verify no more than one convention is present

### Related Rules
- Rule: Choose One Naming Convention and Apply It Consistently

### Related Skills
- Skill: Choose and Document a Naming Convention

### Related Decision Trees
- Decision: VerbNoun vs NounVerb Naming Convention

---

## Anti-Pattern 2: Flat Action Directory at Scale (No Domain Grouping)

### Category
Code Organization | Scalability

### Description
200+ action files in a single `app/Actions/` directory with no domain subdirectories. Navigation requires IDE search for every action. Developers cannot browse related actions.

### Why It Happens
The directory started small (<20 files) and grew organically. Subdirectories were never introduced because "it would require renaming everything." The team switched naming conventions instead of adding subdirectories.

### Warning Signs
- `app/Actions/` has 50+ files in a flat listing
- Developers use global search to find any action
- IDE autocomplete lags in the directory
- Related actions (all billing operations) are scattered alphabetically

### Why It Is Harmful
Navigation friction increases with every new action. Developers cannot see all order-related actions without searching. File proliferation reduces the signal-to-noise ratio.

### Real-World Consequences
A developer cannot find the existing `GenerateInvoiceAction` and creates a duplicate. The flat directory becomes a dumping ground for unrelated operations.

### Preferred Alternative
Add domain subdirectories (`app/Actions/Order/`, `app/Actions/User/`) without renaming existing classes. This is additive, not reductive.

### Refactoring Strategy
1. Map each action to its domain (bounded context).
2. Create subdirectories per domain under `app/Actions/`.
3. Move action files into subdirectories (do NOT rename class names).
4. Update namespace declarations.
5. Update all `use` imports.
6. Run `composer dump-autoload` and the full test suite.

### Detection Checklist
- [ ] Count files in `app/Actions/` (threshold: 20)
- [ ] Check if any domain has 10+ actions that need grouping

### Related Rules
- Rule: Use Domain Subdirectories Before Changing Naming Conventions
- Rule: Organize Actions in Domain Subdirectories

### Related Skills
- Skill: Introduce Domain Subdirectories to a Flat Action Directory

### Related Decision Trees
- Decision: VerbNoun vs NounVerb Naming Convention (subdirectories as alternative)

---

## Anti-Pattern 3: Method Name Mismatch with Class Intent

### Category
Design | Maintainability

### Description
An action class whose public method name conflicts with or is unrelated to the class name. Example: `CreateOrderAction` with method `process()` instead of `handle()` or `create()`.

### Why It Happens
The class was originally named for one operation, then repurposed. The developer felt `process()` was more generic. No team convention for method naming.

### Warning Signs
- `CreateOrderAction` has method `process()`
- `SendEmailAction` has method `handle()` but no clear naming convention
- Method names vary across actions in the same directory

### Why It Is Harmful
Forces mental mapping — developers must reconcile "Create" with "process." Prevents generic action invocation patterns. Makes the API inconsistent.

### Real-World Consequences
A developer calls `$action->create()` on a `CreateOrderAction` that only has `process()`. Runtime error. Time wasted checking method names.

### Preferred Alternative
Use a single generic method name (`handle()` or `execute()`) across all actions, or use descriptive names (`create()`, `update()`) that match the class intent.

### Refactoring Strategy
1. Choose a team standard method name (`handle()` recommended).
2. Rename all action methods to the standard.
3. Update all call sites.
4. If using Spatie's QueueableAction with `handle()`, override `queueMethod()`.

### Detection Checklist
- [ ] Check if method names are consistent across all actions
- [ ] Check if any method name contradicts the class name

### Related Rules
- Rule: Match Method Name to Class Intent
- Rule: Establish a Single Method Name Convention Across the Team

### Related Skills
- Skill: Choose and Document a Naming Convention

### Related Decision Trees
- Decision: Method Name Convention for Actions

---

## Anti-Pattern 4: Redundant ActionSuffix in Dedicated Namespace

### Category
Code Organization

### Description
Using the `Action` suffix on every class (`CreateOrderAction`) when the class is in the `App\Actions` namespace — the namespace already identifies it as an action.

### Why It Happens
Blindly following an online tutorial that used the suffix. No consideration of whether the namespace provides context. Fear that without the suffix, the class might be confused with something else.

### Warning Signs
- Every file in `app/Actions/` ends with `Action`
- Import statements are longer than necessary: `use App\Actions\CreateOrderAction;`
- No other class types coexist in the `app/Actions/` namespace

### Why It Is Harmful
Redundant ceremony. Longer class names, import statements, and file names with zero benefit. The namespace already provides the context.

### Real-World Consequences
Typing overhead adds up across hundreds of actions. Import statements wrap to the next line unnecessarily. File names are longer for no reason.

### Preferred Alternative
Omit the `Action` suffix when using the `App\Actions` namespace. Use the suffix only when actions share a namespace with other class types (e.g., open-source packages).

### Refactoring Strategy
1. Remove the `Action` suffix from all class names in `App\Actions\` (not needed when `App\Actions` namespace identifies them).
2. Update all `use` imports.
3. Rename files to remove `Action` suffix.
4. Keep the suffix if actions coexist with other class types in the same namespace.

### Detection Checklist
- [ ] Check if any suffix is redundant given the namespace
- [ ] Verify no naming collisions exist after stripping the suffix

### Related Rules
- Rule: Use ActionSuffix Only When Necessary to Avoid Name Collisions

### Related Decision Trees
- Decision: ActionSuffix vs No Suffix

---

## Anti-Pattern 5: Convention Chosen Without Considering Future Scale

### Category
Scalability | Maintainability

### Description
A naming convention is chosen for a 10-action codebase without considering how it works at 100+ actions. The team later discovers the convention does not scale and must perform a project-wide rename.

### Why It Happens
Early-stage projects optimize for current needs. The convention decision is treated as reversible. "We'll fix it later."

### Warning Signs
- Flat VerbNoun was chosen at 10 actions and is now unmanageable at 100
- The team is considering switching to NounVerb (which requires renaming everything)
- No domain subdirectories exist despite 50+ actions
- No convention documentation exists

### Why It Is Harmful
Changing conventions at scale requires renaming every class, import, test, and documentation reference. The cost is a multi-day refactor with high risk of breaking changes.

### Real-World Consequences
The team spends a sprint renaming 80+ action classes instead of building features. Missed references cause production errors. Git history on every action file is polluted with rename-only commits.

### Preferred Alternative
Plan for scale proactively. Use VerbNoun with domain subdirectories from the start. Document the threshold for introducing subdirectories (20 files). Do NOT switch naming conventions — add subdirectories instead.

### Refactoring Strategy
1. Stop the planned naming convention change.
2. Introduce domain subdirectories (additive, no renames).
3. Document the subdirectory threshold.
4. Only rename conventions if subdirectories are insufficient.

### Detection Checklist
- [ ] Does the codebase have >20 flat action files?
- [ ] Is the team considering a naming convention change instead of subdirectories?

### Related Rules
- Rule: Use Domain Subdirectories Before Changing Naming Conventions
- Rule: Prefer VerbNoun as Default

### Related Skills
- Skill: Choose and Document a Naming Convention
- Skill: Introduce Domain Subdirectories to a Flat Action Directory
