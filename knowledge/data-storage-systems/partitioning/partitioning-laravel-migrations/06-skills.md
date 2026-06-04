# Skill: Manage Partitioning in Laravel Migrations

## Purpose

Create and manage partitioned tables in Laravel using raw SQL for partition declarations and partition management operations.

## When To Use

- Creating new partitioned tables via Laravel migrations
- Adding/dropping partitions via Laravel migrations
- Managing partition lifecycle through scheduled Laravel commands
- Partitioned tables in MySQL or PostgreSQL from Laravel

## When NOT To Use

- Non-partitioned tables (use standard Laravel schema builder)
- Existing tables (partitioning after data exists requires rebuild)
- Cloud-managed databases that handle partitioning automatically

## Prerequisites

- Laravel application with database migration setup
- Understanding of partition strategy (range, list, hash)
- Database support for partitioning (MySQL 5.1+, PostgreSQL 10+)

## Inputs

- Migration file for table creation
- Partition definitions
- Partition management SQL commands

## Workflow (numbered steps)

1. Create the table using `Schema::create`, then apply partitioning with raw SQL:
   ```php
   Schema::create('orders', function (Blueprint $table) {
       $table->id();
       $table->date('created_at');
       // ... other columns
   });
   DB::statement('ALTER TABLE orders PARTITION BY RANGE (YEAR(created_at)) (
       PARTITION p2023 VALUES LESS THAN (2024),
       PARTITION p2024 VALUES LESS THAN (2025),
       PARTITION p_future VALUES LESS THAN MAXVALUE
   )');
   ```
2. For partition management, create separate migrations:
   ```php
   // Add partition migration
   public function up() {
       DB::statement('ALTER TABLE orders ADD PARTITION (
           PARTITION p2025 VALUES LESS THAN (2026)
       )');
   }
   public function down() {
       DB::statement('ALTER TABLE orders DROP PARTITION p2025');
   }
   ```
3. Schedule partition management in Laravel:
   ```php
   // App\Console\Commands\ManagePartitions.php
   $schedule->command('partitions:create-next')->monthly();
   $schedule->command('partitions:archive-old')->monthly();
   ```
4. For MySQL, ensure partitioning is applied before any data exists (cannot partition with data without rebuild)
5. Test migrations: `php artisan migrate --pretend` to preview SQL

## Validation Checklist

- [ ] Migration creates partitioned table successfully
- [ ] Partition management migrations run and rollback correctly
- [ ] Scheduled partition creation works
- [ ] Scheduled partition archival works
- [ ] `php artisan migrate` runs without errors
- [ ] All environments (local, staging, production) have same partition setup

## Common Failures

- Cannot partition existing table with data — use pt-online-schema-change
- DB::statement migration not marked as destructive — cannot rollback
- Rollback DROP PARTITION cannot restore data (need backup)
- Partition syntax differences between MySQL and PostgreSQL in same codebase
- Migration order: partition creation must come after table creation

## Decision Points

- Partition in table creation migration vs separate migration
- MySQL vs PostgreSQL: raw SQL may differ (use DB::connection()->getDriverName())
- Schedule partition management via Laravel commands vs cron jobs
- Rollback strategy for partition operations

## Performance Considerations

- `ALTER TABLE ... PARTITION BY` rebuilds entire table if data exists
- ADD/DROP PARTITION: instant for range partitioning
- Schedule partition management during low-traffic periods
- Migration `--pretend` shows SQL without executing

## Security Considerations

- Raw SQL in migrations must not contain credentials
- Partition management commands should use dedicated database user with partition privileges
- Rollback of DROP PARTITION: data cannot be restored from migration alone (require backup)

## Related Rules

- 8-9-1: Always Use Raw SQL For Partition Operations
- 8-9-2: Never Partition Existing Tables Without Online DDL Tools

## Related Skills

- Implement Range Partitioning
- Implement Partition Management
- Schedule Laravel Commands with Cron

## Success Criteria

- Migration creates partitioned table correctly
- Partition management works via migrations and scheduled commands
- Rollback of partition addition works (DROP PARTITION)
- Partition creation automated in all environments
