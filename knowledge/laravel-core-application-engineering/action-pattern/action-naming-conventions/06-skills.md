# Skill: Choose and Document a Naming Convention

## Purpose

Select, document, and consistently apply an action naming convention across the entire codebase so that developers can predict the name of any action without searching.

## When To Use

- Starting a new Laravel project that uses the action pattern.
- A codebase has mixed naming conventions (VerbNoun, NounVerb, ActionSuffix mixed together).
- The action directory has grown to 10+ files and no naming convention has been documented.
- Onboarding new developers who need clear guidance on how to name new actions.

## When NOT To Use

- The codebase has fewer than 5 actions and no immediate growth plans — a convention can be deferred.
- The project uses Jetstream conventions exclusively — follow Jetstream's existing pattern instead.
- The team has already documented a convention and is following it consistently — no change needed.

## Prerequisites

- Understanding of the four naming conventions (VerbNoun, NounVerb, VerbNoun+ActionSuffix, DescriptiveMethod).
- Knowledge of the team's primary navigation pattern (operation-first or entity-first).
- Authority to make or recommend a codebase-wide naming decision.

## Inputs

- The current action directory listing (`app/Actions/`).
- A list of existing action names (to check for collisions or inconsistency).
- Team preferences: operation-first or entity-first mental model.
- Framework constraints: Jetstream usage, Spatie QueueableAction, package dependencies.

## Workflow

1. **Assess current state.** List all existing action class names in `app/Actions/`. Note any mixed conventions. Count the total number of action files. Count action files per domain (billing, user, order, etc.).

2. **Choose the default convention.** Apply the decision tree:
   - If the team thinks in terms of **operations** ("I need to create something") → use **VerbNoun** (`CreateOrder`, `UpdateUser`).
   - If the team thinks in terms of **entities** ("I need to do something with Orders") → use **NounVerb** (`OrderCreate`, `UserUpdate`).
   - If actions coexist with other class types in shared namespaces → add **ActionSuffix** (`CreateOrderAction`).
   - If following Jetstream → use **DescriptiveMethod** (class `CreateTeam`, method `create()`).
   - **Default recommendation:** VerbNoun (most common, natural English, framework-standard).

3. **Assess domain subdirectory need.** If the total action count exceeds 20, or any domain has 10+ actions, plan to introduce domain subdirectories (`App\Actions\Order\`, `App\Actions\User\`). This solves navigation problems without changing the naming convention.

4. **Check for naming collisions.** Search for duplicate action names across different domains (e.g., two `CreateOrder` in different bounded contexts). If collisions exist, domain subdirectories are mandatory.

5. **Choose the method name convention.** Decide on a single method name for all actions: `handle()`, `execute()`, or `__invoke()`. If using Spatie's `QueueableAction` with `handle()`, document that `queueMethod()` must be overridden. If using `execute()`, auto-detection works without override.

6. **Document the decision.** Create a project-level architecture decision record. Include: the chosen convention, the reasoning, the method name standard, the subdirectory plan, change criteria, and an explicit list of what is and is not allowed.
   ```
   # Action Naming Convention
   Chosen convention: VerbNoun (e.g., `CreateOrder`, `CancelOrder`)
   Method name: `execute()` (auto-detected by QueueableAction)
   Action suffix: Not used (App\Actions namespace provides context)
   Subdirectories: Introduced at 20+ actions per App\Actions\
   Change criteria: Add domain subdirectories before changing conventions
   ```

7. **Enforce with architecture tests.** Add Pest architecture tests that enforce the naming convention:
   ```php
   test('actions use VerbNoun naming')
       ->expect('App\Actions')
       ->toMatchConstraint(fn ($class) => /* check VerbNoun pattern */);
   ```

8. **Communicate to the team.** Share the documented convention in team channels. Update onboarding materials. Reference the convention in the PR template.

## Validation Checklist

- [ ] A single naming convention is chosen (VerbNoun, NounVerb, ActionSuffix, or DescriptiveMethod)
- [ ] The convention is documented in a project-level architecture decision record
- [ ] All existing action names are consistent with the chosen convention
- [ ] A single method name is chosen for all actions (`handle()`, `execute()`, or `__invoke()`)
- [ ] Domain subdirectory plan is documented (threshold for introducing subdirectories)
- [ ] Pest architecture tests enforce the naming convention
- [ ] No mixed conventions exist in the codebase (the most destructive anti-pattern)
- [ ] Method names match class intent (no `CreateOrder` with method `process()`)

## Common Failures

- **No documentation.** The convention is implied by existing code but never written down. New developers infer different conventions, and mixing begins.
- **Choosing by personal preference.** One developer prefers NounVerb and another prefers VerbNoun, leading to a mix. Use the decision criteria, not personal preference.
- **ActionSuffix inconsistency.** Some actions have `Action` suffix, others do not. Choose one approach and apply it universally.
- **Method name mismatch with Spatie QueueableAction.** Team chooses `handle()` but does not override `queueMethod()`, causing worker-time errors. Document the Spatie interaction explicitly.
- **Convention chosen without considering future scale.** VerbNoun works at 20 actions but becomes unmanageable at 100 without subdirectories. Plan for subdirectories proactively.

## Decision Points

- **VerbNoun vs NounVerb:** VerbNoun is the default recommendation. Switch to NounVerb only in entity-heavy domains where entity-grouping is more valuable than operation-grouping. For CRUD-heavy apps, VerbNoun is preferred.
- **ActionSuffix vs no suffix:** Omit the suffix when `App\Actions` namespace provides unambiguous context. Use the suffix when actions coexist with other class types in shared namespaces (e.g., open-source packages, shared libraries).

## Performance Considerations

- Naming convention has zero impact on runtime performance. Class names are resolved via PSR-4 autoloading (cached by OpCache).
- At 500+ actions in a flat directory, IDE file listings and autocomplete may slow down. The solution is domain subdirectories, not a naming convention change.

## Security Considerations

- Action names are not a security boundary. A publicly discoverable `DeleteAllUsersAction` name does not make it callable — access control must be enforced separately.

## Related Rules

- Rule: Choose One Naming Convention and Apply It Consistently (action-naming-conventions/05-rules.md)
- Rule: Use Domain Subdirectories Before Changing Naming Conventions (action-naming-conventions/05-rules.md)
- Rule: Match Method Name to Class Intent (action-naming-conventions/05-rules.md)
- Rule: Document the Naming Convention Decision Explicitly (action-naming-conventions/05-rules.md)
- Rule: Prefer VerbNoun as Default (action-naming-conventions/05-rules.md)
- Rule: Use ActionSuffix Only When Necessary (action-naming-conventions/05-rules.md)

## Related Skills

- Introduce Domain Subdirectories to a Flat Action Directory (action-naming-conventions/06-skills.md)
- Extract Controller Logic to an Action (action-class-design/06-skills.md)

## Success Criteria

- A developer who needs to create a "suspend user" action knows the exact class name without searching (`SuspendUserAction` or `UserSuspendAction`, depending on the convention).
- Code review rejects any action that violates the documented naming convention.
- The architecture decision record is the authoritative reference for naming questions.
- No pull request re-litigates the naming convention — it is settled policy.

---

# Skill: Introduce Domain Subdirectories to a Flat Action Directory

## Purpose

Restructure a flat `app/Actions/` directory with 20+ action files into domain subdirectories (`app/Actions/{Domain}/`) to improve navigation, reduce cognitive load, and prevent file proliferation without renaming any existing action classes.

## When To Use

- `app/Actions/` contains 20+ flat files and developers struggle to find specific actions.
- The action directory mixes operations from different business domains (billing, user, inventory).
- IDE file listings and autocomplete have slowed noticeably.
- The team is considering switching naming conventions — evaluate subdirectories first.

## When NOT To Use

- The action directory has fewer than 20 files — flat organization is still manageable.
- Actions are already organized by domain subdirectories — no change needed.
- The project has only one domain — subdirectories add no navigational value.
- The team plans to switch to a feature-based directory structure (different from domain subdirectories).

## Prerequisites

- An existing `app/Actions/` directory with 20+ action files.
- A clear understanding of the application's domain boundaries (bounded contexts).
- Git or version control to stage the restructuring.

## Inputs

- The full listing of `app/Actions/` with all action files.
- A domain/bounded context map of the application.
- All import references to the action classes across the codebase.

## Workflow

1. **Map domains.** Review all action files in `app/Actions/`. Group them by business domain (Billing, Inventory, User, Order, etc.). Create a mapping: each action → its domain. If an action spans multiple domains, choose the primary domain.

2. **Create domain subdirectories.** Create subdirectories under `app/Actions/` for each domain: `app/Actions/Billing/`, `app/Actions/User/`, etc. Use `StudlyCase` for domain names.

3. **Move action files.** Move each action file into its domain subdirectory. Do NOT rename the files — the class name stays the same. The namespace changes from `App\Actions\ClassName` to `App\Actions\{Domain}\ClassName`.
   ```
   # Before:
   app/Actions/CreateOrder.php       # namespace App\Actions;
   app/Actions/CancelOrder.php        # namespace App\Actions;
   
   # After:
   app/Actions/Order/CreateOrder.php  # namespace App\Actions\Order;
   app/Actions/Order/CancelOrder.php  # namespace App\Actions\Order;
   ```

4. **Update namespaces.** For each moved file, update the `namespace` declaration from `namespace App\Actions;` to `namespace App\Actions\{Domain};`.

5. **Update imports.** For every file that imports the moved action class, update the `use` statement to reflect the new namespace:
   ```php
   // Before:
   use App\Actions\CreateOrder;
   // After:
   use App\Actions\Order\CreateOrder;
   ```

6. **Update service provider bindings.** If any action has explicit service provider bindings (singletons, contextual bindings), update the class references in the providers.

7. **Update tests.** Move test files from `tests/Unit/Actions/{ActionName}Test.php` to `tests/Unit/Actions/{Domain}/{ActionName}Test.php`. Update `use` statements in test files.

8. **Verify autoloading.** Run `composer dump-autoload` to regenerate the PSR-4 autoload map. Run the test suite to confirm all imports resolve correctly.

9. **Update documentation.** Update any architecture decision records, README files, or onboarding documents that reference the flat action directory structure.

## Validation Checklist

- [ ] Action files are organized into domain subdirectories under `app/Actions/`
- [ ] Action classes were NOT renamed — only directory and namespace changed
- [ ] Namespace declarations in each action file are updated
- [ ] All `use` imports across the codebase are updated
- [ ] Test files are moved and imports updated
- [ ] Service provider bindings are updated
- [ ] `composer dump-autoload` ran successfully
- [ ] Entire test suite passes
- [ ] Documentation references are updated

## Common Failures

- **Renaming classes during the move.** Changing both directory AND class name makes git history untraceable and breaks every import. Move first, rename later (if needed) in a separate commit.
- **Domain boundaries are unclear.** An action like `ProcessRefund` could go in Billing or Order. Choose one domain per action. If genuinely cross-domain, a third domain or a generic domain (`Shared`, `Common`) may be appropriate.
- **Missing some import updates.** A PHP file in a different namespace (e.g., a config file, a facade, a blade view) references the old `App\Actions\ClassName` without a `use` statement. Search the entire codebase for references.
- **Tests not moved.** Action tests remain in the flat `tests/Unit/Actions/` directory. Mirror the source structure for easy discovery.

## Decision Points

- **Domain granularity:** Use existing bounded contexts (Order, User, Billing, Inventory). If the project does not have explicit bounded contexts, group by the entity the action primarily operates on.
- **Single-action domain:** If a domain has only 1 action, either leave it in a parent directory until it grows or create the subdirectory proactively. Prefer proactive creation to avoid further restructuring.

## Performance Considerations

- Domain subdirectories have zero runtime performance impact. PSR-4 autoloading is unaffected by directory depth.
- IDE performance improves because file listings are now scoped to smaller directories.

## Security Considerations

- No direct security implications. Domain subdirectories do not affect access control or authorization.

## Related Rules

- Rule: Use Domain Subdirectories Before Changing Naming Conventions (action-naming-conventions/05-rules.md)
- Rule: Organize Actions in Domain Subdirectories (action-class-design/05-rules.md)

## Related Skills

- Choose and Document a Naming Convention (action-naming-conventions/06-skills.md)

## Success Criteria

- A developer looking for billing-related actions opens `app/Actions/Billing/` and finds only billing operations.
- The flat `app/Actions/` directory is no longer a scrolling list of 50+ unrelated files.
- No action class was renamed — subdirectories were added while preserving the existing naming convention.
- The full test suite passes without any import-related failures.
