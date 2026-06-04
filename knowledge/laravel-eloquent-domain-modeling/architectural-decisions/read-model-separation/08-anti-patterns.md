# Anti-Patterns: Read Model Separation

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Read Model Separation |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Stale Data (Unmonitored Projection Lag) | Reliability | Critical |
| 2 | Projection Failure Without Recovery | Reliability | Critical |
| 3 | Schema Drift Between Projector and Read Model | Design | High |
| 4 | Over-Engineering Read Models for Simple CRUD | Design | Medium |
| 5 | Mutating Data Through a Read Model | Architecture | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Rebuild Artisan Command for Projection | read-model-separation | Critical |
| Exposing Sensitive Write-Columns in Read Models | read-model-separation | High |
| Using Queue Projection When DB View Would Suffice | read-model-separation | Medium |
| Mixing Read and Write Models in Same Namespace | read-model-separation, model-design | Medium |
| No Documented Staleness SLA per Read Model | read-model-separation | High |

---

## Anti-Pattern 1: Stale Data (Unmonitored Projection Lag)

### Category
Reliability — Silent Data Decay

### Description
The read model's data becomes increasingly stale because projection (the process updating the read model from write events) falls behind or stops. No monitoring tracks the time delta between writes and read model updates, so no one knows the data is stale until users report it.

### Why It Happens
Queue-based projections are implemented without lag monitoring. The assumption is "the queue will process fast enough." As the queue backs up, workers crash, or projection code throws exceptions, the lag grows silently.

### Warning Signs
- No metric tracking the time between event creation and projection completion
- No alerting for projection lag thresholds
- Dashboard or report pages show data that doesn't match the source of truth
- Queue worker logs show processing delays but no alert is triggered
- Read model class has no documented staleness SLA

### Why Harmful
Users make decisions based on stale data. A dashboard showing "orders today" that is 30 minutes behind causes incorrect business decisions. Customer support using a customer summary read model that is 2 hours stale gives wrong information to callers. Trust in the system erodes. Without monitoring, the team discovers the issue only when it impacts users or business metrics.

### Real-World Consequences
A `CustomerLifetimeValue` read model is projected from sales events. The projection worker crashes due to an unhandled edge case (order with zero total). For 3 days, all customer lifetime values are frozen at pre-crash values. The marketing team runs a campaign targeting "high-value customers" based on stale data, sending premium offers to customers whose lifetime value has since dropped below the threshold. 30% of offers go to the wrong segment. The wasted campaign budget is $15,000.

### Preferred Alternative
Track projection lag as a metric for every read model. Set alert thresholds at 80% of the documented staleness SLA. Monitor lag dashboards and alert on breaches.

### Refactoring Strategy
1. Add a `projected_at` or `event_occurred_at` timestamp to each read model record
2. Create a health check that compares `MAX(projected_at)` against `NOW()` for each read model
3. Set alert thresholds: warning at 50% of SLA, critical at 80% of SLA
4. Add a monitoring dashboard showing lag per read model
5. For critical read models, add synchronous projection fallback if async lag exceeds threshold
6. Document the acceptable staleness in each read model's PHPDoc

### Detection Checklist
- [ ] No projection lag metric exists
- [ ] Read model class has no documented staleness SLA
- [ ] No alerting for projection failures or lag
- [ ] Team discovers stale data through user reports, not monitoring

### Related Rules/Skills/Decision Trees
- **Rule 3**: Define acceptable staleness per read model (`05-rules.md`)
- **Rule 7**: Monitor projection lag and alert on threshold breaches (`05-rules.md`)
- **Decision 3**: Real-Time Consistency vs Eventual Consistency (`07-decision-trees.md`)

---

## Anti-Pattern 2: Projection Failure Without Recovery

### Category
Reliability — Unrecoverable State

### Description
A projector (the code that updates the read model from events) has a bug that corrupts the read model data, or the read model table needs to be rebuilt from source data. There is no Artisan command or recovery procedure to rebuild the read model from scratch. Recovery requires manual SQL, database restores, or engineering intervention.

### Why It Happens
Builders focus on the happy path (projector processes events correctly) and don't plan for failure scenarios. "It won't break" optimism. No time allocated for build/rebuild commands during development.

### Warning Signs
- No `php artisan read-model:rebuild-*` commands exist
- Read model data recovery requires SQL scripts or manual fixes
- Projection bugs are fixed by truncating the read model table and reprocessing events manually
- Team has a wiki page titled "How to fix [ReadModel] when it breaks"
- Migration rollback corrupts read model data with no automatic recovery

### Why Harmful
When the read model is corrupted, there is no self-service recovery. Operations must page engineering, who must write ad-hoc SQL or scripts to rebuild the data. Recovery takes hours instead of minutes. During recovery, users see incorrect or empty data. Repeated corruption without recovery erodes trust in read-model-based features.

### Real-World Consequences
A bug in `OrderSummaryProjector` double-counts every order when a specific promotion code is used. Over 2 weeks, 500 order summaries show inflated totals. The team discovers the bug but has no rebuild command. An engineer spends 6 hours writing a script to truncate and reprocess all order events. During those 6 hours, the sales team cannot trust the order summary dashboard and resorts to spreadsheets.

### Preferred Alternative
Every read model backed by a projection must have a rebuild Artisan command that can reconstruct it from source data. The rebuild command should be tested in CI and documented in runbooks.

### Refactoring Strategy
1. Create `App\Console\Commands\Rebuild{ReadModelName}.php` for each read model
2. The command should: truncate read model table, iterate over source data, run projectors for each record
3. Use `chunk()` to process source data in batches
4. Add `--from-scratch` flag (truncate before rebuild) and `--since` flag (partial rebuild)
5. Test the rebuild command in CI: seed source data, run command, assert read model matches expected
6. Document the rebuild command in runbooks for operations team

### Detection Checklist
- [ ] No rebuild Artisan command for the read model
- [ ] Recovery procedure documented as "manual SQL" or "contact engineering"
- [ ] Projection bugs require truncating and reprocessing data manually
- [ ] No CI test for rebuild command

### Related Rules/Skills/Decision Trees
- **Rule 2**: Provide a rebuild Artisan command for every read model (`05-rules.md`)
- **Skill 2**: Build a Projection System with Rebuild Command (`06-skills.md`)

---

## Anti-Pattern 3: Schema Drift Between Projector and Read Model

### Category
Design — Silent Structural Divergence

### Description
The projector writes fields to the read model that do not match the read model's expected schema — wrong column names, missing fields, type mismatches. The divergence is not caught by tests because the projection is not integration-tested against the read model's actual schema.

### Why It Happens
The projector and read model class are developed independently. A migration changes the read model table but the projector is not updated. The read model class has different column definitions than what the projector writes. No integration test validates the round-trip.

### Warning Signs
- Projector tests mock the read model class instead of writing to a test database
- Read model migration changes column names/types without updating projectors
- Production errors: "Column not found" when projector runs against read model table
- Read model class has `$fillable` or `$casts` that don't match what the projector writes
- Adding a field to the read model requires updating projector, migration, read model class, and test — but some are missed

### Why Harmful
Schema drift causes runtime errors when the projector fails to write to the read model. The projection silently skips records (try/catch around projector calls), causing data loss in the read model. Debugging is difficult because the read model appears to work for old data but fails for new projections.

### Real-World Consequences
A migration renames `order_summaries.total_cents` to `order_summaries.grand_total_cents`. The `OrderSummaryProjector` still writes to `total_cents`. The projector's `updateOrCreate` call silently adds `total_cents` as a new column (if `$fillable` is not guarded) or throws an exception (if strict mode). If guarded, the field is silently dropped, and all new order summaries have zero totals. A week passes before someone notices the dashboard shows zero revenue.

### Preferred Alternative
Integration-test the projector against the actual read model table (using a test database). The test should: run the projector, assert the read model record matches expected values, and verify all columns are correctly mapped. Run a schema comparison between projector output and read model migration in CI.

### Refactoring Strategy
1. Add an integration test for each projector that writes to a real test database
2. The test should: seed source data, run the projector, query the read model table, assert all columns
3. Add a migration check: compare the projector's written columns against the read model migration's column list
4. Create a shared data contract (interface or DTO) between projector and read model
5. Document in the read model class PHPDoc which projectors write to it

### Detection Checklist
- [ ] Projector tests use mocks instead of a real database
- [ ] Read model schema changes without corresponding projector changes
- [ ] "Column not found" errors in projector logs
- [ ] Fields silently missing from read model records
- [ ] No shared contract between projector and read model

### Related Rules/Skills/Decision Trees
- **Skill 2**: Build a Projection System with Rebuild Command (`06-skills.md`)
- **Skill 1**: Create a View-Backed Read Model (`06-skills.md`)

---

## Anti-Pattern 4: Over-Engineering Read Models for Simple CRUD

### Category
Design — Unnecessary Complexity

### Description
Creating separate read models, projectors, rebuild commands, and monitoring for applications where reads and writes use the same structure and queries are simple. The overhead of maintaining read models exceeds any performance or architectural benefit.

### Why It Happens
Architecture enthusiasm — the team adopts read model separation because it's a "best practice" for large systems. They don't account for the current system's size or complexity. Over-engineering as a hedge against hypothetical future needs.

### Warning Signs
- Read model is an exact copy of write model columns with no denormalization
- Read model is used in exactly one place (one API endpoint or one view)
- No performance measurement exists showing the read model is faster than querying the write model
- Projector code just copies data with no transformation
- Team cannot articulate the specific benefit this read model provides
- Read model maintenance (rebuild command, lag monitoring, projector tests) takes more time than the query would have taken against the write model

### Why Harmful
Every read model adds maintenance surface: migrations, projector code, rebuild command, lag monitoring, schema tests. For simple CRUD applications where reads and writes share structure, this overhead is pure waste. The complexity of the projection system often exceeds the complexity of the business logic it serves.

### Real-World Consequences
A blog application creates a `PostSummary` read model with projectors, rebuild command, and lag monitoring. The read model contains exactly the same columns as the `posts` table. The query it serves is `SELECT title, excerpt, published_at FROM posts WHERE published = true ORDER BY published_at DESC`. The original query takes 12ms. The projection system (queue job + projector + rebuild command) took 2 days to build and adds 3 files to maintain. The performance benefit is 0ms (same query speed). The maintenance cost over 12 months far exceeds the benefit.

### Preferred Alternative
Start with the write model for both reads and writes. Only extract a read model when query performance is measured to be too slow, or when the read representation differs structurally from the write model.

### Refactoring Strategy
1. Identify read models that are structural copies of write models
2. Measure query performance against the write model (is the read model actually faster?)
3. If no structural difference and no performance benefit, remove the read model
4. Redirect all read queries to the write model
5. Delete the projector, rebuild command, read model class, and read model migration
6. Document the measurement and decision for future reference

### Detection Checklist
- [ ] Read model columns are identical to write model columns
- [ ] No denormalization, aggregation, or transformation in projection
- [ ] No performance measurement shows read model is faster
- [ ] Read model is used by a single endpoint or view
- [ ] Projector code is a simple copy (`updateOrCreate` with same fields)

### Related Rules/Skills/Decision Trees
- **Rule 4**: Use database views as the default read model (`05-rules.md`)
- **Decision 1**: Read Model Separation vs Single Model (`07-decision-trees.md`)

---

## Anti-Pattern 5: Mutating Data Through a Read Model

### Category
Architecture — Bypassing Domain Invariants

### Description
A read model class is used for writes — `$readModel->save()`, `$readModel->update()`, or `$readModel->delete()` is called somewhere in the codebase. Data modifications through the read model bypass domain invariants, validation, and the write model's business rules.

### Why It Happens
The read model extends Eloquent Model, which naturally has `save()`, `update()`, and `delete()` methods. A developer in a hurry or unaware of the read vs. write distinction uses the read model for a quick update. The Eloquent API makes writes trivially easy.

### Warning Signs
- Read model class has callers that call `->save()` or `->update()`
- Read model has `$fillable` or `$guarded` properties (indicates writes are expected)
- Read model is used in a form action or API endpoint that accepts PUT/PATCH/DELETE
- Read model migration has constraints that suggest write operations (unique indexes, foreign keys)
- Code review shows `ReadModelName::create(...)` or `$readModel->delete()`

### Why Harmful
Writes through read models bypass the entire write model's business logic. Invariants (status transitions, validation rules, calculations) are not enforced. Data integrity degrades silently. The read model's denormalized structure is corrupted by direct writes, creating inconsistencies between the write model source of truth and the read model.

### Real-World Consequences
A developer needs to update an order's status quickly for a support ticket. Instead of going through the `Order` write model and `MarkOrderAsShippedAction` (which validates inventory and triggers notifications), they call `OrderSummary::where('id', $id)->update(['status' => 'shipped'])` on the read model. The inventory is not deducted, the customer does not receive a tracking email, and the warehouse picks a different order because inventory counts are wrong.

### Preferred Alternative
Read models must be read-only. Prevent writes at the code level by:
- Using read-only database connections (read replicas)
- Overriding `save()`, `update()`, `delete()` to throw exceptions
- Using PHPStan rules to reject write method calls on read model classes
- Registering read models on a read-only database connection

### Refactoring Strategy
1. Search for all `->save()`, `->update()`, `->delete()`, `::create()` calls on read model classes
2. Replace each with the appropriate write model operation or action class call
3. Add a guard to the read model: `public function save(array $options = []): bool { throw new \DomainException('Read models are read-only.'); }`
4. Register read models on a read-only database connection in `config/database.php`
5. Add a PHPStan rule: method calls on `App\Models\Read\*` must not include `save`, `update`, `delete`, `create`

### Detection Checklist
- [ ] `->save()` or `->update()` called on a read model instance
- [ ] Read model class has `$fillable` or `$guarded` arrays
- [ ] Read model is registered with a writable database connection
- [ ] No guard method overrides preventing writes
- [ ] Form actions or API endpoints use read models for writes

### Related Rules/Skills/Decision Trees
- **Rule 1**: Never call `save()`, `create()`, `update()`, or `delete()` on a read model (`05-rules.md`)
- **Rule 6**: Never expose write-model columns in read models (`05-rules.md`)
- **Skill 1**: Create a View-Backed Read Model (`06-skills.md`)
