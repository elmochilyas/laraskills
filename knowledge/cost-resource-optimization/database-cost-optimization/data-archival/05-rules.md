---
## Rule Name
Partition Tables by Date for Automated Archival

## Category
Architecture

## Rule
Implement date-based table partitioning on all tables exceeding 50GB or 10M rows. Archive detachable partitions older than the retention window.

## Reason
Partition detachment is an instant metadata operation. Dropping or archiving old data becomes a no-copy operation that takes milliseconds, not hours.

## Bad Example
```sql
DELETE FROM orders WHERE created_at < '2023-01-01';
-- Locks table, creates massive transaction log, takes hours on 100GB table
```

## Good Example
Monthly partitioning; detach partition `orders_202301` when it exceeds the retention window. The detached partition becomes an independent table that can be moved or dropped instantly.

## Exceptions
Tables under 50GB where a full DELETE in batches (chunked) completes within the maintenance window.

## Consequences Of Violation
Database grows unbounded. Queries on active data slow down as old data accumulates. Instance resizing costs $500-2000+/month more than necessary.

---
## Rule Name
Archive Soft-Deleted Records After 90 Days

## Category
Data Management

## Rule
Auto-archive soft-deleted Eloquent records older than 90 days. Export to Parquet on S3, then force-delete from the active table.

## Reason
Soft-deleted records serve no purpose after the appeal or recovery window expires. They bloat tables, slow queries, and increase backup size.

## Bad Example
```php
// never pruning soft-deleted records
User::whereNotNull('deleted_at')->count(); // 500K deleted users
// active queries scan through 500K dead rows
```

## Good Example
```php
// Scheduled job, runs daily
User::whereNotNull('deleted_at')
    ->where('deleted_at', '<', now()->subDays(90))
    ->chunk(100, function ($users) {
        // export to S3 Parquet
        // force delete
    });
```

## Exceptions
Compliance requirements that mandate longer soft-delete retention (e.g., financial records: 7 years).

## Consequences Of Violation
Active tables grow 2-5x larger than necessary. Query performance degrades. Database backup times and storage costs increase proportionally.

---
## Rule Name
Export Archived Data as Parquet, Not CSV

## Category
Data Management

## Rule
Always export archived data to Parquet format on S3. Never use CSV or raw JSON dumps for archival.

## Reason
Parquet compresses 70-80% smaller than CSV, supports schema evolution, and is queryable via Athena with standard SQL. Storage cost drops from $0.023/GB to $0.004/GB.

## Bad Example
```php
// CSV export, uncompressed
$csv = "id,name,email\n1,John,...\n";
Storage::put('archive/users-2023.csv', $csv);
// 1GB CSV file, unqueryable without loading entirely
```

## Good Example
Export as Parquet using a library. File is 200MB for the same data. Queryable via Athena: `SELECT * FROM archived_users WHERE created_at > '2023-01-01'`.

## Exceptions
When the archived data is purely for legal hold and will never be queried again (use Glacier Deep Archive directly).

## Consequences Of Violation
CSV archives consume 5x more storage, cannot be queried efficiently, and may become unreadable if schema information is lost.

---
## Rule Name
Keep 3-6 Months of Data in Active Database

## Category
Architecture

## Rule
Configure the active database to hold no more than 6 months of data. Move data older than 6 months to the archive tier.

## Reason
80% of queries touch data from the last 30 days. Keeping years of data in the active database means most queries pay I/O cost scanning data no one accesses.

## Bad Example
A 500GB database where 400GB is data older than 6 months. Queries on recent data are slow because the buffer pool is full of cold data. Instance costs $1000+/month.

## Good Example
Active database holds 100GB (6 months). Archive holds 400GB on S3 Glacier at $1.60/month. Queries on active data are 5x faster. Instance cost is $200/month.

## Exceptions
Applications where historical data is queried as frequently as recent data (e.g., analytics dashboards with year-over-year comparisons).

## Consequences Of Violation
Database instance is sized for total data volume, not active data volume. You pay 5x more for storage and compute that serve data nobody queries.

---
## Rule Name
Test Archive Restoration Quarterly

## Category
Reliability

## Rule
Schedule a quarterly automated test that restores a random sample of archived data and validates its schema, completeness, and accessibility.

## Reason
Archive formats, schemas, and access methods become unreadable over time. Quarterly testing ensures compliance data is actually recoverable.

## Bad Example
Archiving data for 3 years without testing. When an auditor requests 3-year-old records, the S3 Parquet file has a schema mismatch and cannot be queried.

## Good Example
Quarterly cron job: pick a random partition, restore to a test database, run validation queries, report success/failure.

## Exceptions
No common exceptions. If data is worth archiving, it is worth testing restoration.

## Consequences Of Violation
Archived data may be permanently unreadable, leading to compliance violations, legal liability, and irreversible data loss.

---
## Rule Name
Document Retention Policy Per Entity Type

## Category
Code Organization

## Rule
Document a retention policy for every Eloquent model that accumulates data. Specify active duration, warm duration, cold duration, and legal hold/deletion date.

## Reason
Without explicit retention policies, data accumulates indefinitely. Engineers cannot make archival decisions without policy guidance.

## Bad Example
No retention policy. The `logs` table has 3 years of data, `orders` has 5 years, `sessions` has 18 months. Nobody knows what to archive or delete.

## Good Example
| Entity | Active | Warm | Cold | Delete |
|--------|--------|------|------|--------|
| orders | 6mo | 2yr S3 IA | 7yr Glacier | +30d |
| logs | 7d | 30d S3 IA | - | 37d |
| audit | 30d | 1yr S3 IA | 7yr Glacier | +30d |

## Exceptions
No common exceptions. Every persistent entity needs a policy.

## Consequences Of Violation
Data accumulates without governance, driving up storage costs. Legal discovery requests become expensive. Compliance audits fail.

---
## Rule Name
Use Laravel's Prunable Trait for Auto-Purging

## Category
Framework Usage

## Rule
Implement Laravel's `Prunable` trait on Eloquent models that accumulate soft-deleted or expired records. Schedule `model:prune` to run daily.

## Reason
The `Prunable` trait provides a framework-native mechanism for automatic data purging. It runs as a single artisan command and integrates with the model lifecycle.

## Bad Example
```php
// Manual cleanup queries scattered across controllers
Order::where('expires_at', '<', now())->delete(); // in controller
```

## Good Example
```php
use Illuminate\Database\Eloquent\Prunable;

class Order extends Model
{
    use Prunable;

    public function prunable()
    {
        return static::where('expires_at', '<', now()->subDays(90));
    }
}

// Schedule: $schedule->command('model:prune')->daily();
```

## Exceptions
When the pruning logic requires complex cross-model coordination that cannot be expressed in a single query.

## Consequences Of Violation
Without automatic pruning, expired records accumulate. Manual cleanup scripts are inconsistent and error-prone.
