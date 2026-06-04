# Read Model Separation — Skills

---

## Skill 1: Create a View-Backed Read Model

### Purpose
Build a read-only Eloquent model backed by a database view that pre-joins and pre-aggregates data for display, with no projection code.

### When To Use
- Read representation differs from the write model's structure
- Complex queries (multiple joins, aggregations) run repeatedly
- You need read optimization without a queue-based projection system

### When NOT To Use
- Read and write structures are nearly identical
- The database view becomes a performance bottleneck at scale
- Data must be real-time consistent and the view query is too slow

### Prerequisites
- SQL CREATE VIEW permission on the database
- Write model tables exist with the required data

### Inputs
- Write model tables and columns
- Read model fields (which columns to expose, which to aggregate)
- Filter and sort requirements for the read model queries

### Workflow

1. **Write the SQL view** that pre-joins and pre-aggregates data:
   ```sql
   CREATE VIEW user_order_summaries AS
   SELECT u.id AS user_id,
          u.name AS user_name,
          COUNT(o.id) AS total_orders,
          COALESCE(SUM(o.total_cents), 0) AS lifetime_value_cents
   FROM users u
   LEFT JOIN orders o ON o.user_id = u.id
   GROUP BY u.id, u.name;
   ```

2. **Create a read-only Eloquent model** mapped to the view:
   ```php
   namespace App\Models\Read;

   class UserOrderSummary extends Model
   {
       protected $table = 'user_order_summaries';
       public $incrementing = false;
       public $timestamps = false;
       protected $primaryKey = 'user_id';
   }
   ```

3. **Place the model in `App\Models\Read\`** namespace to signal read-only intent

4. **Never add `save()`, `create()`, `update()`, or `delete()` methods**

5. **Add indexes** on the underlying tables that support the view's query plan

6. **Build a rebuild command** (for views that materialize data) or document that the view always reflects current data

### Validation Checklist

- [ ] Read model is backed by a database view (or materialized view)
- [ ] Read model class has no `save()`, `create()`, `update()`, or `delete()` calls
- [ ] Read model is in `App\Models\Read\` namespace
- [ ] View SELECT excludes sensitive write-model columns
- [ ] Underlying tables have indexes supporting the view query
- [ ] Staleness documentation is added if using materialized views

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| View query too slow | Missing indexes | Add indexes on filtered/joined columns |
| View exposes sensitive columns | `SELECT *` in view definition | Use explicit column list |
| Cannot update the view | No migration management | Add view creation to a migration |
| Read model used for writes | Convenience | Enforce read-only at code review |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Never call save/update/delete on read models | `05-rules.md` Rule 1 |
| Rule 4: Use database views as default read model | `05-rules.md` Rule 4 |
| Rule 5: Index read model tables independently | `05-rules.md` Rule 5 |
| Rule 6: Never expose sensitive columns | `05-rules.md` Rule 6 |
| Rule 8: Separate namespace for read models | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Build a Projection System with Rebuild Command | Next step when views are not enough |

### Success Criteria
- View-backed read model returns pre-joined, pre-aggregated data
- No projection code needed — the database handles it
- Read model is in `App\Models\Read\` with zero write methods
- Underlying tables are indexed for view query performance

---

## Skill 2: Build a Projection System with Rebuild Command

### Purpose
Create a read model populated by event handlers (projectors) with a rebuild Artisan command for recovery, monitoring projection lag.

### When To Use
- A database view is too slow for the required read performance
- The read model needs data from multiple bounded contexts
- You need to transform or denormalize data beyond what a view can do

### When NOT To Use
- A database view can serve the same data with acceptable performance
- The application cannot tolerate eventual consistency
- The read model is trivial (1-2 joins, no transformation)

### Prerequisites
- Write model and event system in place
- Queue system configured (for async projection)
- Read model table created via migration

### Inputs
- Write model events that should trigger projection
- Read model table schema
- Transformation logic (mapping rules, aggregations)

### Workflow

1. **Create the read model migration** with indexes optimized for read queries

2. **Create the read model class** in `App\Models\Read\`

3. **Create a projector class** that listens to domain events and updates the read model:
   ```php
   class OrderSummaryProjector
   {
       public function projectOrder(Order $order): void
       {
           OrderSummary::updateOrCreate(
               ['user_id' => $order->user_id],
               [
                   'total_orders' => DB::raw('total_orders + 1'),
                   'lifetime_value_cents' => DB::raw('lifetime_value_cents + ' . $order->total_cents),
               ]
           );
       }
   }
   ```

4. **Register event listeners** to trigger the projector on relevant events

5. **Create a rebuild Artisan command**:
   ```php
   #[AsCommand('read-model:rebuild-order-summaries')]
   class RebuildOrderSummariesCommand extends Command
   {
       public function handle(OrderSummaryProjector $projector): void
       {
           Order::chunk(100, function ($orders) use ($projector) {
               foreach ($orders as $order) {
                   $projector->projectOrder($order);
               }
           });
       }
   }
   ```

6. **Document acceptable staleness** as a PHPDoc on the read model class

7. **Add projection lag monitoring**: track the time delta between event creation and projection completion, alert if it exceeds the SLA

### Validation Checklist

- [ ] Read model migration has indexes optimized for query patterns
- [ ] Projector class handles all relevant events
- [ ] Rebuild Artisan command exists and can recover from scratch
- [ ] Acceptable staleness is documented (PHPDoc on read model class)
- [ ] Projection lag is tracked and alerts on SLA breach
- [ ] Read model has zero write methods — update via projector only

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Never call save/update/delete on read models | `05-rules.md` Rule 1 |
| Rule 2: Provide rebuild Artisan command | `05-rules.md` Rule 2 |
| Rule 3: Define acceptable staleness | `05-rules.md` Rule 3 |
| Rule 5: Index read model tables independently | `05-rules.md` Rule 5 |
| Rule 7: Monitor projection lag | `05-rules.md` Rule 7 |
| Rule 8: Separate namespace for read models | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a View-Backed Read Model | Simpler alternative before building a projection system |

### Success Criteria
- Read model stays current via event-driven projection
- Rebuild command can recover from corruption in one command
- Projection lag is monitored and alerts on threshold breach
- Read model is independently indexable from the write model

---

## Skill 3: Set Up Read Model Indexing

### Purpose
Add database indexes to read model tables that are optimized for the actual read queries, independent of write model indexes.

### When To Use
- Read model queries are slower than expected
- Read model is used for filtering, sorting, or aggregation
- Read model and write model have different access patterns

### When NOT To Use
- Read model is backed by a database view on a small table
- All queries are by primary key only

### Prerequisites
- Read model table or view exists
- Query patterns are understood (which columns are filtered/sorted)

### Inputs
- Read model table name
- Query patterns (filter columns, sort columns, join columns)
- Query frequency (which queries matter most)

### Workflow

1. **Analyze query patterns** — collect the `WHERE`, `ORDER BY`, and `GROUP BY` clauses from all queries hitting the read model

2. **Design composite indexes** for the most common filter combinations:
   ```php
   Schema::table('order_summaries', function (Blueprint $table) {
       $table->index(['status', 'created_at']); // Common filter pattern
       $table->index('user_id');                 // Lookup pattern
       $table->index('total_cents');             // Sort pattern
   });
   ```

3. **Add indexes in a migration** — separate from write model migrations

4. **Remove unused indexes** from earlier iterations

5. **Monitor index usage** with `EXPLAIN` or database monitoring tools

6. **Document the indexing strategy** in the read model class PHPDoc

### Validation Checklist

- [ ] Indexes designed for actual query patterns (not guessed)
- [ ] Composite indexes ordered by selectivity (most selective first)
- [ ] Indexes added in a dedicated migration
- [ ] Unused indexes identified and removed
- [ ] Query plans verified with `EXPLAIN` for common queries
- [ ] Index maintenance strategy accounted for (write overhead on projection updates)

### Related Rules

| Rule | Reference |
|---|---|
| Rule 5: Index read model tables independently | `05-rules.md` Rule 5 |

### Success Criteria
- Read model queries use indexes effectively (no full table scans)
- Query plans show index seeks for the most common filter patterns
- Indexes are documented and maintained separately from write model indexes
- Index usage is monitored and adjusted as query patterns evolve
