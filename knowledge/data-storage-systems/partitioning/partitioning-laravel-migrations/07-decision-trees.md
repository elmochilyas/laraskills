# 8-9 Partitioning Laravel Migrations - Decision Trees

## Partition in Table Creation vs Separate Migration

---

## Decision Context

Choosing whether to define partitioning in the same migration as table creation or in a separate migration.

---

## Decision Criteria

* performance: same migration ensures partitioning is applied before any data
* architectural: separate migration enables rollback of partition changes independently
* maintainability: separate migration cleaner for partition management

---

## Decision Tree

Creating a new table that should be partitioned?

YES → Partition in the same migration

    ↓
    Schema::create('orders', function (Blueprint $table) { ... });
    DB::statement('ALTER TABLE orders PARTITION BY RANGE ...');
    
    ↓
    Pro: Partition applied before any data exists
    Pro: One migration, one rollback (drops table)
    Con: More complex migration file
    
    ↓
    Always preferred for new tables

NO → Adding partitioning to an existing table?

    YES → Separate migration
        
        ↓
        public function up() {
            DB::statement('ALTER TABLE orders PARTITION BY RANGE ...');
        }
        
        ↓
        WARNING: ALTER TABLE ... PARTITION BY rebuilds the entire table
        For large tables, use pt-online-schema-change or gh-ost
        
        ↓
        Risk: locks table during rebuild
        Mitigation: online DDL tools, maintenance window

NO → Adding/dropping partitions on existing partitioned table?

    → Separate migration for each partition operation
    Each partition ADD/DROP is reversible
    up(): DB::statement('ALTER TABLE ... ADD PARTITION ...')
    down(): DB::statement('ALTER TABLE ... DROP PARTITION ...')

---

## Recommended Default

**Default:** Partition in table creation migration for new tables; separate migrations for partition management
**Reason:** Partition at creation avoids rebuild. Separate partition operations are easier to track and roll back.

---

## Scheduling Partition Management

---

## Decision Context

Choosing between Laravel scheduled commands, cron jobs, or MySQL events for automating partition creation and archival.

---

## Decision Criteria

* performance: any approach works — the operation itself is the bottleneck
* architectural: Laravel commands integrate with app logic; cron is infrastructure-level
* maintainability: Laravel commands are version-controlled; cron scripts may drift

---

## Decision Tree

Application is Laravel?

YES → Use Laravel scheduled commands

    ↓
    php artisan make:command CreateNextPartition
    
    ↓
    protected function schedule(Schedule $schedule) {
        $schedule->command('partitions:create-next')->monthly();
        $schedule->command('partitions:archive-old')->monthly();
    }
    
    ↓
    Version-controlled, testable, integrates with app
    Can check application state before running

NO → Database-native automation?

    YES → MySQL EVENT
        
        ↓
        CREATE EVENT create_next_partition
        ON SCHEDULE EVERY 1 MONTH
        DO ALTER TABLE orders ADD PARTITION ...;
        
        ↓
        No application dependency
        Runs even if app is down
        Harder to version-control, test

NO → Infrastructure-managed?

    → Cron job on server
    * cron job runs a script that executes SQL
    Works outside application
    No Laravel dependency
    Must manage manually on each server

---

## Recommended Default

**Default:** Laravel scheduled commands for Laravel apps; MySQL events for non-Laravel or when app-independence is required
**Reason:** Laravel commands are version-controlled, testable, and integrated. MySQL events are independent of app uptime but harder to manage.

---

## Related Rules

* Rule 8-9-1: Always Use Raw SQL For Partition Operations
* Rule 8-9-2: Never Partition Existing Tables Without Online DDL Tools

---

## Related Skills

* Manage Partitioning in Laravel Migrations
* Schedule Laravel Commands with Cron
