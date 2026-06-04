# When Repositories Hurt

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Repositories become harmful when applied as a default architectural layer without justification. In a standard Laravel application with a single MySQL/PostgreSQL database and Eloquent as the ORM, adding repositories adds indirection without tangible benefit. The in-memory SQLite testing strategy (Laravel's RefreshDatabase + model factories) eliminates the primary argument for repositories — testability. When the storage backend never changes, the abstraction adds cost (files, cognitive load, indirection) with zero return.

## Core Concepts
- **Accidental Abstraction:** An interface created because "we might need it someday" rather than because storage actually varies.
- **Leaky Abstraction:** A repository interface that thinly wraps Eloquent methods, providing no real hiding of complexity.
- **Indirection Cost:** Each layer of abstraction adds mental overhead for developers tracing code paths.
- **YAGNI (You Ain't Gonna Need It):** The principle that features should only be added when actually needed, not anticipated.
- **In-Memory SQLite Testing:** Laravel's ability to use SQLite in-memory for tests, making the "swap database for tests" argument moot.

## Mental Models
- **The Plastic Wrap:** Repositories on top of single-source Eloquent is like wrapping your sandwich in plastic wrap, then in foil, then in a bag. You still get to the same sandwich, just with more layers to peel.
- **The Empty Vending Machine:** You designed a machine that can dispense Coke, Pepsi, and Sprite, but only Coke was ever installed. You paid for three slots, three selection buttons, and three inventory systems — but only one drink ever comes out.
- **The Phone Number You Never Change:** You programmed speed dial for a phone number you've memorized. The speed dial adds a step, not convenience.

## Internal Mechanics
A repository-for-single-Eloquent-source works like this at runtime:
1. Action calls $this->contractRepo->findById()
2. Repository calls Contract::with('relation')->find()
3. Returns the same model the action could have fetched directly

The indirection provides zero behavioral difference. The only difference is:
- 1 extra PHP class loaded
- 1 extra interface to maintain
- 1 extra mapping layer when method signatures change
- N extra files to navigate when reading code

## Patterns
- **Leaky Eloquent Repository:** Repository interface has methods named after Eloquent scopes (indWhere, indWhereIn) — proving the abstraction isn't hiding anything.
- **Transactional Repository:** Repository wraps save in a transaction, causing nested transaction counter bugs when actions also use transactions.
- **Generic Repository:** 
ew Repository(User::class) — a single generic repository class for all models, which provides zero domain-specific abstraction.

## Architectural Decisions
- Skip repositories when the only data source is a single SQL database with Eloquent.
- Skip repositories when the only reason is "testing" — Laravel's model factories and SQLite testing already solve this.
- Skip repositories when the interface mirrors Eloquent's API exactly.
- Skip repositories for CRUD-heavy aggregates where storage logic is save, ind, delete.
- Use repositories only when storage genuinely varies or persistence logic is genuinely complex.

## Tradeoffs

| Benefit (Claimed) | Cost (Actual) | Consequence |
|-------------------|---------------|-------------|
| "Swap databases easily" | Nobody actually swaps databases in production | YAGNI violation — pay for option you never exercise |
| "Makes testing easier" | Laravel SQLite testing already provides DB isolation without mocks | Extra files for zero testing improvement |
| "Domain/persistence separation" | Repository methods return Eloquent models with lazy-loading risks | Half-measure abstraction — model still couples to Eloquent |
| "Standard enterprise pattern" | Adds ceremony for every CRUD operation | New devs must trace through layers to understand queries |
| "Future-proofing" | Present cost for hypothetical future need | Indirection today for a benefit that may never materialize |

## Performance Considerations
- Repository call overhead is negligible (one extra method call).
- The real cost: Repository methods often lack eager-loading, causing N+1 queries.
- The caching benefit can be achieved with Laravel's built-in cache decorator without a repository layer.

## Production Considerations
- **Debugging:** Each repository layer means an extra stack frame; with 4-5 repository calls per request, traceability suffers slightly.
- **Developer Velocity:** Developers must open the interface, then the implementation, then trace to the model. Removing the layer means one less hop.
- **Team Onboarding:** New Laravel developers (who know Eloquent) must learn the team's custom repository conventions.

## Common Mistakes
- Adding repositories to every model in the first week of a project "for consistency."
- Writing a repository interface that has indWhere(, , ) — literally re-exposing Eloquent's where syntax.
- Testing with repository mocks while Eloquent queries in the repository have syntax errors — the mock passes, the system fails.
- Creating a repository for a simple Setting model that stores key-value pairs.

## Failure Modes
- **Repository Proliferation:** 50+ repository interfaces in App\Contracts\Repositories, each with one implementation. Mitigate: Refactor aggressively; delete unused interfaces.
- **Mock Testing False Security:** Unit tests pass with mocked repositories, but integration tests fail because Eloquent queries are wrong. Mitigate: Test against real database, not mocks.
- **Query Performance Hiding:** Repository's indAll() loads 10,000 rows. Developer profiling can't see the query because it's hidden behind an interface. Mitigate: Use Laravel Debugbar and monitor query counts.
- **Transactional Atrophy:** Repository calls Model::save() inside a transaction. The action wraps in another transaction. Now the action's outer transaction rollback doesn't affect the inner repository save behavior. Mitigate: Never nest transactions; repositories should not manage transactions.

## Ecosystem Usage
- **Laravel Framework Core:** The framework itself does not use repositories for its internal models.
- **Laravel Jetstream / Spark / Cashier:** None use repositories — they use direct Eloquent in actions.
- **spatie packages:** Selectively use repositories (for multi-source data) but avoid them for simple CRUD.
- **The PHP community (2023-2025):** Growing backlash against unnecessary repository layers in Laravel projects.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — The counterpart: when repositories actually add value.
- [Query Object Alternative](../query-object-alternative/02-knowledge-unit.md) — Better alternative for read complexity.
- [Eloquent as Adapter](../eloquent-as-adapter/02-knowledge-unit.md) — Using Eloquent behind a repository when needed.
- [Ports and Adapters](../ports-and-adapters/02-knowledge-unit.md) — Theory of the pattern repositories implement.

### Advanced Follow-up Topics

## Research Notes
- **Taylor Otwell (Laracon 2015, 2017):** "Repositories are not something I use in Laravel. Eloquent is already an implementation of the Active Record pattern." Directly advises against default repository layers.
- **Jeffrey Way (Laracasts):** Advocates against repository abstraction in Laravel, citing Laravel's testing capabilities making them unnecessary.
- **Matt Stauffer (Laravel: Up & Running):** Discusses repositories as a tool for specific situations, not a default pattern.
- **Adam Wathan (Laracon 2017):** Argues that in-memory SQLite testing eliminates the primary testing argument for repositories.
- **Freek Van der Herten (spatie):** "We don't use repositories by default. We add them when we need to abstract a data source."