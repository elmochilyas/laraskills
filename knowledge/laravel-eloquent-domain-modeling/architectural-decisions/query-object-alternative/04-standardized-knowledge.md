# Query Object Alternative

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Query Object Alternative |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

A Query Object is a dedicated class encapsulating a reusable database query. It serves as an alternative to repositories for read operations — instead of adding many finder methods to a repository, each distinct query gets its own class. This keeps the read side explicit, testable, and avoids repository bloat. Query Objects shine when an application has many distinct queries against the same model.

## Core Concepts

- **Query Object**: A class named after a specific query, containing query logic and returning a result
- **Read Separation**: Queries are separated from write operations (different concerns)
- **Reusability**: A query object can be reused across controllers, actions, and CLI commands
- **Composability**: Query objects accept filters, sort orders, and pagination parameters
- **Testability**: Query objects are tested against a real database in isolation

## When To Use

- The same complex query is needed in multiple places
- A repository would accumulate too many finder methods
- The operation is read-only and never needs persistence abstraction
- You want to unit-test a query's logic independently

## When NOT To Use

- The query is simple (1-2 where clauses) — use a model local scope
- The query is used in only one place and is trivial
- The operation involves writes — that's an action's job

## Best Practices

- **Name query objects by what they return**: `OverdueInvoicesQuery`, `UsersByRoleQuery` — the class name documents the intent.
- **Accept filter DTOs, not raw request input**: Query objects should accept typed filter parameters. Raw request input couples the query to HTTP and bypasses validation.
- **Never mutate data in a query object**: The name says "Query Object." Don't put `save()` or `update()` calls in them.
- **Scope-first, query-object-second**: Start with a model local scope; extract to a query object when the query grows to 3+ conditions or is reused.

## Architecture Guidelines

- Place query objects in `App\Queries\{Domain}\{QueryName}Query.php`
- Inject query objects into actions or controllers, not the reverse
- Query objects should not check authorization — they query; authorization happens at the caller level
- Query objects are the ideal place to apply `select`, `with`, and eager load constraints

## Performance Considerations

- Query objects are the natural unit for caching — cache key derived from class name + parameters
- Always eager-load relations inside query objects; never lazy-load
- Support pagination parameters rather than returning all rows
- Avoid lazy-loading inside query objects — always eager-load relations

## Security Considerations

- Query objects never receive raw user input — validate and transform at the controller level
- Authorization is not the query object's responsibility; callers must check permissions
- Be cautious with dynamic `orderBy` from user input — validate allowed sort columns

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Mutation in query objects | Misunderstanding responsibility | Side effects in read path | Use actions for writes |
| Query object for every `where` | Over-engineering | Class explosion | Use model scopes for simple queries |
| Hard-coded eager loads | Convenience | Unnecessary joins for simple uses | Accept optional `$with` parameter |
| Returning all rows without pagination | Forgetting scale | Memory exhaustion on large datasets | Default to pagination or limits |
| Business logic in query objects | Leaking domain rules | Non-obvious filtering | Query objects filter/sort only |

## Anti-Patterns

- **Query Object Proliferation**: 200 query objects, many unused. Check usage before creating; delete unused ones.
- **Business Logic Leak**: Query object applies business rules beyond filtering. Query objects should only filter/sort; domain decisions go in models or actions.
- **Performance Hiding**: Query object returns all rows without pagination. Enforce pagination or limits at the query object level.
- **Over-Abstraction**: Query object wraps `Model::where(...)->get()`. Use model scopes for trivial cases.

## Examples

```php
class OverdueInvoicesQuery
{
    public function __construct(
        private int $daysOverdue = 30,
        private ?int $tenantId = null,
    ) {}

    public function __invoke(): Collection
    {
        return Invoice::with('user', 'lines')
            ->where('status', 'sent')
            ->where('due_at', '<', Carbon::now()->subDays($this->daysOverdue))
            ->when($this->tenantId, fn ($q) => $q->where('tenant_id', $this->tenantId))
            ->orderBy('due_at')
            ->get();
    }
}

// Usage
class SendOverdueRemindersAction
{
    public function __construct(
        private OverdueInvoicesQuery $overdueInvoices,
    ) {}

    public function __invoke(): void
    {
        $invoices = ($this->overdueInvoices)(daysOverdue: 30);
        foreach ($invoices as $invoice) {
            // send reminder
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | When Repositories Help |
| Closely Related | When Repositories Hurt |
| Closely Related | Read Model Separation |
| Closely Related | Write Model Separation |

## AI Agent Notes

- Query objects call no `save()`, `update()`, or `delete()` methods
- Accept explicit filter parameters (not raw request input)
- Return typed results (Collection, Paginator, Model, or null)
- No business logic — only query construction

## Verification

- [ ] Query object does not call `save()`, `update()`, or `delete()`
- [ ] Query object accepts explicit filter parameters (not raw request input)
- [ ] Query object is tested against a real database with known seed data
- [ ] Query object returns a typed result (Collection, Paginator, Model, or null)
- [ ] Query object does not contain business logic — only query construction
