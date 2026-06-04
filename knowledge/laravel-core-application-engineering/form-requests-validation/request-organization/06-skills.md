# Skill: Organize FormRequests Using Domain-Based Directories

## Purpose
Structure FormRequest classes into domain- or entity-based subdirectories to maintain navigability as the project scales past 15 request classes.

## When To Use
- Projects with 15+ FormRequest classes
- Multi-developer teams where quick file discovery matters
- Feature-based or domain-driven architectures
- Any project where flat `app/Http/Requests/` becomes hard to navigate

## When NOT To Use
- Small projects with fewer than 10 FormRequests (flat organization is simpler)
- Projects that co-locate requests inside feature modules (modular monolith style)
- When the team prefers a flat structure with IDE search

## Prerequisites
- Multiple FormRequest classes
- Decision on naming convention (`{Action}{Entity}Request`)

## Inputs
- Existing or planned FormRequest classes
- Entity/domain boundaries from the application architecture

## Workflow
1. Create subdirectories under `app/Http/Requests/` named after each entity/domain (e.g., `User/`, `Post/`, `Billing/`)
2. Move each FormRequest into its corresponding entity subdirectory
3. Update the namespace of each moved request to match the directory
4. Update all imports (controller files, tests) to use the new namespace
5. Ensure consistent naming: `StoreUserRequest`, `UpdateUserRequest`, `IndexPostRequest`
6. Document the organizational convention in the project's coding standards
7. For feature-module architecture, co-locate requests inside the feature directory instead

## Validation Checklist
- [ ] Subdirectories created for each entity/domain with 2+ requests
- [ ] Namespace matches directory structure (e.g., `App\Http\Requests\User\StoreUserRequest`)
- [ ] All imports in controllers and tests updated
- [ ] Naming convention `{Action}{Entity}Request` applied consistently
- [ ] No mixed organization (flat + domain-based in same project)
- [ ] Single-entity directories contain only the entity's requests
- [ ] Convention documented for future contributions

## Common Failures
- Mixing flat and domain-based organization in the same project
- Inconsistent naming (e.g., `UserStoreRequest` in one place, `StoreUserRequest` in another)
- Forgetting to update namespaces — class not found errors
- Creating too many entity directories (each with 1-2 files) — excessive granularity
- Not updating imports in tests after moving files

## Decision Points
- Use domain-based subdirectories at 15+ requests vs flat organization for smaller projects
- Co-locate requests in feature modules vs centralized `app/Http/Requests/` based on architecture
- Use base classes for shared entity rules vs duplicate rules

## Performance Considerations
- Directory structure has zero impact on performance
- PSR-4 autoloading uses classmaps — filesystem location doesn't affect resolution time
- IDE search is equally fast in either structure

## Security Considerations
- None — organizational structure has no security implications
- Authorization behavior is identical regardless of file location

## Related Rules
- Rule 1: Name FormRequests {Action}{Entity}Request Consistently
- Rule 2: One Request Per Action — Always
- Rule 4: Use Domain-Based Directories at 15+ FormRequests
- Rule 6: Consistent Directory Structure Across the Project

## Related Skills
- Structure Shared Validation Rules Using Inheritance and Traits
- Create and Wire a FormRequest to a Controller Action

## Success Criteria
- FormRequests are easy to locate by entity/domain
- Consistent naming across all request classes
- No mixed organizational strategies
- All namespaces and imports are correct after restructuring
- New team members can predict where a request class lives

---

# Skill: Structure Shared Validation Rules Using Inheritance and Traits

## Purpose
Reuse common validation rules across multiple FormRequests using shallow inheritance (for related entities) and traits (for cross-entity shared rules).

## When To Use
- Multiple FormRequests for the same entity share 50%+ of validation rules
- Cross-entity FormRequests share a specific feature (e.g., tag validation, address fields)
- Reducing duplication while maintaining clarity

## When NOT To Use
- When only 1-2 rules are shared (duplicate them — clarity over DRY)
- When inheritance would create 3+ levels of hierarchy
- When shared rules are trivial (`required|string|max:255`)

## Prerequisites
- Multiple FormRequests with overlapping rules
- Clear understanding of which rules are genuinely shared vs coincidentally similar

## Inputs
- Existing FormRequest classes
- Shared validation rule patterns

## Workflow
1. Identify genuinely shared rules across FormRequests for the same entity
2. Create an abstract base class: `abstract class UserRequest extends FormRequest`
3. Add a `commonRules()` method returning the shared rule array
4. Extend the base class: `class StoreUserRequest extends UserRequest`
5. In concrete requests, call `$this->commonRules()` and merge with action-specific rules
6. For cross-entity shared rules, create a PHP trait (e.g., `ValidatesTags`)
7. Use the trait in each FormRequest that needs those rules
8. Keep inheritance max 2 levels: base → concrete

## Validation Checklist
- [ ] Base class created only when 50%+ rules are shared
- [ ] Inheritance hierarchy is max 2 levels deep
- [ ] Traits used for cross-entity rule sharing (not base classes)
- [ ] `commonRules()` method returns shared rule array
- [ ] Concrete requests merge base rules with specific rules
- [ ] No deep nesting of inheritance (3+ levels)
- [ ] Each request remains independently testable
- [ ] Shared rules are genuinely shared (not coincidentally similar)

## Common Failures
- Deep inheritance hierarchies (3+ levels) — hard to trace which rules apply
- Using base classes for cross-entity sharing — implies false domain relationship
- Over-abstracting — extracting shared rules too early, before patterns are clear
- Base class grows unmanageable — accumulates rules from all subclasses
- Traits with too many responsibilities — keep focused on one concern

## Decision Points
- Use inheritance (base class) for same-entity shared rules vs trait for cross-entity
- Use 2-level inheritance vs composition with traits — prefer traits for unrelated concerns
- Duplicate vs extract — extract only when 3+ requests share the same rules

## Performance Considerations
- Inheritance adds zero performance overhead
- Trait usage has no runtime cost
- Method calls to `commonRules()` are negligible

## Security Considerations
- Each concrete request still implements its own `authorize()` — inheritance does not bypass security
- Base class `authorize()` should be abstract if each action has different authorization
- Overriding `authorize()` in a subclass overrides the base — intentional per-request control

## Related Rules
- Rule 3: Keep Inheritance Hierarchy Max 2 Levels Deep
- Rule 5: Use Traits for Shared Rules Across Unrelated Entities

## Related Skills
- Organize FormRequests Using Domain-Based Directories
- Create and Wire a FormRequest to a Controller Action

## Success Criteria
- Shared rules are defined once and reused correctly
- Each concrete request can override or extend rules as needed
- Inheritance is shallow and traceable
- Cross-entity sharing uses traits, not inheritance
- No duplicated rule definitions across requests
- Each request is independently testable
