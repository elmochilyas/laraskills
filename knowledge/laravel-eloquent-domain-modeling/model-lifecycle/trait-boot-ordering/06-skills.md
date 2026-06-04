# Skill: Order Dependent Traits in use Statement with Dependencies First

## Purpose

Arrange traits in the `use` statement with foundational traits listed first and dependent traits listed last, ensuring `boot{TraitName}` methods execute in the correct dependency order.

## When To Use

- A model uses multiple traits with `boot{TraitName}` or `initialize{TraitName}` methods
- Traits have inter-dependencies (trait B depends on setup from trait A)
- Debugging boot-order-dependent behavior

## When NOT To Use

- All traits are independent with no boot-time dependencies
- The model uses only one trait

## Prerequisites

- Two or more traits with boot or initialize methods
- Understanding of which traits depend on which

## Inputs

- List of traits to compose on the model
- Dependency map (which traits depend on which)

## Workflow

1. Identify each trait's boot-time dependencies:
   - `HasTeams` — foundational: no dependencies
   - `HasRoles` — depends on `HasTeams` being booted first
   - `SoftDeletes` — independent
   - `HasUuid` — independent
2. List traits in the `use` statement with dependencies first:
   ```
   class User extends Model
   {
       use HasTeams,     // Foundational — boots first
           HasRoles,    // Depends on HasTeams
           SoftDeletes, // Independent
           HasUuid      // Independent
   }
   ```
3. Document each trait's dependencies in its docblock:
   ```
   /**
    * @requires HasTeams — must be listed before HasRoles in the use statement
    */
   trait HasRoles
   {
       protected static function bootHasRoles(): void
       {
           static::addGlobalScope(new RolesScope)
       }
   }
   ```
4. Keep the `use` statement list under 5 traits for readability
5. Write tests for each trait combination that has boot-time dependencies:
   ```
   public function test_has_teams_boots_before_has_roles(): void
   {
       $user = new User()
       $this->assertNotNull($user->getGlobalScope('team_scope'))
       $this->assertNotNull($user->getGlobalScope('roles_scope'))
   }
   ```

## Validation Checklist

- [ ] Traits in `use` statement are ordered by dependency (foundational first)
- [ ] Inter-trait dependencies are documented in trait docblocks (`@requires`)
- [ ] Trait combination tests exist for dependent traits
- [ ] `use` statement has 5 or fewer traits
- [ ] Method conflicts are resolved explicitly with `insteadof` and `as`
- [ ] Traits are designed to be self-contained where possible

## Common Failures

- **Wrong order**: `HasRoles` listed before `HasTeams` when `HasRoles` depends on `HasTeams`. Boot methods execute in the wrong order.
- **Missing dependency docs**: No `@requires` annotation on a trait that depends on another. Developers guess the wrong order.
- **Too many traits**: 8+ traits in a `use` statement making boot order unreadable. Extract a base class or use composition.
- **Method conflicts unresolved**: Two traits define the same method name without `insteadof` or `as`. PHP fatal error.

## Decision Points

- **Dependent vs independent traits**: Prefer independent, self-contained traits. Only add dependencies when the trait genuinely cannot function without another.
- **Trait composition vs base class**: If boot order becomes complex, consider extracting a base class instead of managing trait ordering.

## Performance Considerations

- Trait boot order has no performance impact — all boot methods run once per class
- Well-ordered traits prevent silent bugs that would waste debugging time

## Security Considerations

- Boot order can affect which global scopes are applied — wrong order may bypass access control scopes accidentally

## Related Rules

- Rule 1: Order Traits in the `use` Statement by Dependency
- Rule 2: Document Inter-Trait Dependencies in Docblocks
- Rule 3: Avoid Inter-Trait Dependencies Where Possible
- Rule 4: Write Tests for Each Trait Combination Order
- Rule 5: Use `insteadof` and `as` Explicitly When Traits Define Conflicting Boot Methods
- Rule 6: Keep the `use` Statement List Under 5 Traits for Readability

## Related Skills

- Trait Boot Convention for Lifecycle Hooks
- Trait Init Convention for Instance Defaults
- Trait Decomposition for Cross-Cutting Concerns

## Success Criteria

- Traits execute in correct dependency order during model boot
- Inter-trait dependencies are documented and testable
- `use` statement is readable and stays under 5 traits
- Method conflicts are resolved explicitly
- No silent boot-time bugs due to incorrect ordering
