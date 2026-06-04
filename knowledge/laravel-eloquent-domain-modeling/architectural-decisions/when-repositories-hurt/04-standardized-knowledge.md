# When Repositories Hurt

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When Repositories Hurt |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Repositories become harmful when applied as a default architectural layer without justification. In a standard Laravel application with a single MySQL/PostgreSQL database and Eloquent as the ORM, adding repositories adds indirection without tangible benefit. In-memory SQLite testing (Laravel's `RefreshDatabase` + model factories) eliminates the primary argument for repositories — testability. When the storage backend never changes, the abstraction adds cost (files, cognitive load, indirection) with zero return.

## Core Concepts

- **Accidental Abstraction**: An interface created because "we might need it someday" rather than because storage actually varies
- **Leaky Abstraction**: A repository interface that thinly wraps Eloquent methods with no real hiding of complexity
- **Indirection Cost**: Each abstraction layer adds mental overhead for developers tracing code paths
- **YAGNI**: You Ain't Gonna Need It — features should only be added when actually needed, not anticipated
- **In-Memory SQLite Testing**: Laravel's ability to use SQLite in-memory for tests, making the "swap database for tests" argument for repositories moot

## When To Use This Knowledge

- Evaluating whether to add a repository to a new project
- Reviewing an existing codebase with unnecessary repository layers
- Refactoring to remove repository indirection that adds no value
- Understanding the tradeoffs before adopting enterprise patterns in Laravel

## When Repositories Are Harmful

- The only data source is a single SQL database with Eloquent
- The only reason for the repository is "testing" — Laravel already provides this
- The repository interface mirrors Eloquent's API exactly
- The aggregate only needs basic CRUD (save, find, delete) — no complex persistence logic
- There is no realistic scenario where the storage backend would change

## Best Practices

- **Don't create repositories by default**: Add them only when you have a concrete, current need for storage abstraction. The "we might need it later" argument is YAGNI — you can extract a repository later when the need arises.
- **Test with real databases, not mocks**: Laravel's `RefreshDatabase` trait with SQLite in-memory testing makes repository mocks unnecessary. Mocking a repository hides SQL errors in the implementation.
- **Delete unused repository interfaces**: If a repository interface has only one implementation and no realistic prospect of another, delete the interface and use the implementation directly.
- **Question every repository**: For each repository, ask "What alternative storage backend would this enable?" If the answer is "None," strongly consider removing it.

## Architecture Guidelines

- Prefer direct Eloquent usage in actions — queries are visible and explicit
- Use model factories + RefreshDatabase for testing instead of repository mocks
- If queries are complex, extract to a Query Object rather than a repository
- If storage varies, use a repository interface — but only then

## Performance Considerations

- Repository call overhead is negligible (one extra method call)
- The real cost: Repository methods often lack eager-loading, causing N+1 queries
- Removing repositories eliminates the indirection when debugging query performance
- Laravel's built-in cache already provides query caching without a repository layer

## Security Considerations

- Removing unnecessary repositories eliminates a layer where security filtering could be accidentally omitted
- Direct Eloquent usage makes queries visible for review — no hidden scoping behind an interface

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Repositories for every model from day one | "Enterprise" dogma | 50+ files with zero benefit | Add repositories only when needed |
| Repository interface mirroring Eloquent API | Leaky abstraction | Interface provides no hiding | If interface == Eloquent API, skip repository |
| Testing with repository mocks | Old habits | SQL errors in implementation pass tests | Test with real database and factories |
| Repository for lookup tables | Over-engineering | Interface for key-value storage | Use Eloquent directly |

## Anti-Patterns

- **Repository Proliferation**: 50+ repository interfaces with one implementation each. Refactor aggressively; delete unused interfaces.
- **Mock Testing False Security**: Unit tests pass with mocked repositories, but integration tests fail because Eloquent queries are wrong. Test against a real database.
- **Query Performance Hiding**: Repository's `findAll()` loads 10,000 rows. Developer can't see the query behind the interface. Use Laravel Debugbar.
- **Transactional Atrophy**: Repository calls `Model::save()` inside a transaction, then action wraps in another transaction. Never nest transactions.

## Examples

```php
// DON'T — leaky repository that wraps Eloquent 1:1
class UserRepository
{
    public function save(User $user): void { $user->save(); }
    public function findById(int $id): ?User { return User::find($id); }
    // This is just User::create(). Why?
    public function create(array $data): User { return User::create($data); }
}

// DO — just use Eloquent directly
class RegisterUserAction
{
    public function __invoke(RegisterUserData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
        ]);
        $user->assignRole($data->role);
        return $user;
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | When Repositories Help |
| Closely Related | Query Object Alternative |
| Closely Related | Eloquent as Adapter |
| Closely Related | Ports and Adapters |

## AI Agent Notes

- Default to direct Eloquent usage in actions; only extract to repository when storage genuinely varies
- Test with model factories + RefreshDatabase, not repository mocks
- If the only reason for a repository is testing, it's harmful
- If the interface mirrors Eloquent, delete the interface

## Verification

- [ ] No repository classes exist that have only one implementation
- [ ] No repository interface mirrors Eloquent's API
- [ ] Every query is visible directly in the action or model where it's used
- [ ] No test uses a mock repository — tests use model factories with real DB
- [ ] Developers can read an action and immediately see what queries run
