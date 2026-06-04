# Trait Boot Ordering Rules

## Rule 1: Order Traits in the `use` Statement by Dependency — Dependencies First
---
## Category
Code Organization
---
## Rule
List traits in the `use` statement with foundational traits first and dependent traits last, mirroring their dependency chain.
---
## Reason
`boot{TraitName}()` methods execute in `use` statement order. If trait B's boot method depends on setup performed by trait A's boot method, A must be listed first. Wrong ordering causes silent failures because boot methods execute without errors but in the wrong order.
---
## Bad Example
```php
class User extends Model
{
    use HasRoles,    // Depends on HasTeams
        HasTeams;    // Foundational — should come first
}
```
---
## Good Example
```php
class User extends Model
{
    use HasTeams,    // Foundational — boots first
        HasRoles;    // Depends on HasTeams being booted
}
```
---
## Exceptions
Traits have no interdependencies (e.g., `SoftDeletes` and `HasUuid` are independent).
---
## Consequences Of Violation
Boot methods execute in wrong order; dependent trait setup fails silently; global scopes not registered; event listeners missing.

---

## Rule 2: Document Inter-Trait Dependencies in Docblocks
---
## Category
Maintainability
---
## Rule
Document each trait's boot dependencies in a PHPDoc block on the trait declaration.
---
## Reason
Without documentation, developers using the trait cannot know which other traits must be listed first. Explicit `@requires` annotations in the trait's docblock communicate ordering constraints and prevent subtle bugs when traits are composed on new models.
---
## Bad Example
```php
trait HasRoles
{
    // No documentation — developer must guess dependencies
    protected static function bootHasRoles(): void
    {
        static::addGlobalScope(new RolesScope);
    }
}
```
---
## Good Example
```php
/**
 * @requires HasTeams — must be listed before HasRoles in the use statement
 */
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        static::addGlobalScope(new RolesScope);
    }
}
```
---
## Exceptions
The trait has no dependencies on other traits.
---
## Consequences Of Violation
Wrong ordering when traits are composed; silent boot failures; debugging sessions tracing boot order issues.

---

## Rule 3: Avoid Inter-Trait Dependencies Where Possible
---
## Category
Design
---
## Rule
Design traits to be self-contained with no boot-time dependencies on other traits.
---
## Reason
Traits with dependencies are fragile — the `use` statement order becomes a hidden configuration that breaks silently if wrong. Self-contained traits can be composed in any order, reducing cognitive load and eliminating a class of bugs.
---
## Bad Example
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        static::addGlobalScope(function ($query) {
            $query->whereIn('team_id', static::getTeamIds()); // Calls HasTeams method
        });
    }
}
```
---
## Good Example
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        // Self-contained — no dependency on other traits
        static::addGlobalScope('roles', fn ($query) =>
            $query->where('active', true)
        );
    }
}
```
---
## Exceptions
The trait is intentionally designed as part of a trait family (e.g., `SoftDeletes` which has no dependencies, but a theoretical `SoftDeleteRelations` that depends on `SoftDeletes`).
---
## Consequences Of Violation
Fragile composition; ordering bugs that only appear when traits are used in a new combination; difficulty adding or removing traits.

---

## Rule 4: Write Tests for Each Trait Combination Order
---
## Category
Testing
---
## Rule
Write at least one test for each distinct combination and ordering of traits that has boot-time dependencies.
---
## Reason
Trait boot ordering is a static property that tests can verify. A test that asserts the correct global scopes are registered, event listeners are bound, or defaults are set catches ordering regressions when traits are refactored.
---
## Bad Example
```php
// No tests for trait combination — ordering bugs go undetected
class User extends Model
{
    use HasTeams, HasRoles;
}
```
---
## Good Example
```php
class UserTraitBootOrderTest extends TestCase
{
    public function test_has_teams_boots_before_has_roles(): void
    {
        $user = new User();
        // Assert scopes from HasTeams are available
        $this->assertNotNull($user->getGlobalScope('team_scope'));
        // Assert scopes from HasRoles are available
        $this->assertNotNull($user->getGlobalScope('roles_scope'));
    }
}
```
---
## Exceptions
Traits have no interdependencies; all combinations are trivially safe.
---
## Consequences Of Violation
Ordering regressions go unnoticed; trait dependency changes break models silently; production bugs surface after deployment.

---

## Rule 5: Use `insteadof` and `as` Explicitly When Traits Define Conflicting Boot Methods
---
## Category
Maintainability
---
## Rule
When two traits define the same method name (including `boot{TraitName}`), explicitly resolve the conflict using `insteadof` or `as`.
---
## Reason
PHP requires explicit conflict resolution when two traits define methods with the same name. Without it, the class cannot be compiled. Even if the methods have different names, similar behavior requires attention.
---
## Bad Example
```php
trait A { protected static function bootA(): void {} }
trait B { protected static function bootB(): void {} }
// No conflict — different method names, fine
```
---
## Good Example
```php
trait Loggable
{
    public function log(string $message): void { /* ... */ }
}

trait Auditable
{
    public function log(string $message): void { /* ... */ }
}

class User extends Model
{
    use Loggable, Auditable {
        Auditable::log insteadof Loggable;
        Loggable::log as logToFile;
    }
}
```
---
## Exceptions
No common exceptions — PHP requires resolution.
---
## Consequences Of Violation
Fatal error: Trait method collision; class cannot be instantiated; deployment failures.

---

## Rule 6: Keep the `use` Statement List Under 5 Traits for Readability
---
## Category
Maintainability
---
## Rule
Limit the number of traits in a single model's `use` statement to 5 or fewer.
---
## Reason
A long `use` list with boot methods makes it difficult to reason about boot order, conflicts, and dependencies. If a model needs more than 5 traits, consider extracting a base class or using composition instead of trait inheritance.
---
## Bad Example
```php
class User extends Model
{
    use SoftDeletes,
        HasUuid,
        HasRoles,
        HasTeams,
        HasPermissions,
        HasNotifications,
        HasPreferences,
        HasApiTokens;
}
```
---
## Good Example
```php
class User extends Authenticatable
{
    use SoftDeletes,
        HasUuid,
        HasTeams; // 3 traits — clear and manageable
}
```
---
## Exceptions
The model genuinely needs many orthogonal traits with no interdependencies (e.g., a framework's base user class).
---
## Consequences Of Violation
Difficult to verify boot order; increased risk of dependency bugs; poor readability during code review.
