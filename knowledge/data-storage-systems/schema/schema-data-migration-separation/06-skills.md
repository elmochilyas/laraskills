# Skill: Separate Schema and Data Changes into Independent Migrations

## Purpose

Split schema DDL (ALTER TABLE, CREATE TABLE) from data DML (UPDATE, backfill, transform) into separate migration files, ensuring the schema change runs synchronously in the deploy pipeline while the data migration runs asynchronously as a queued job, preventing long-running data operations from blocking deployment.

## When To Use

- Adding columns that require data backfill
- Data transformations on existing rows
- Any migration where the data operation takes longer than a few seconds

## When NOT To Use

- Trivial data seeding for new lookup tables (< 20 rows)
- Schema-only changes with no data component

## Prerequisites

- Queue infrastructure configured
- Understanding of deploy pipeline timing
- Idempotent data migration design

## Inputs

- Schema change DDL
- Data transformation logic
- Queue configuration

## Workflow

1. Create the schema migration file: `2026_06_02_000001_add_slug_to_articles.php` — contains only `Schema::table()` DDL
2. Create the data migration file: `2026_06_02_000002_backfill_article_slugs.php` — `up()` dispatches a `BackfillSlugs` job to a queue
3. The `BackfillSlugs` job handles chunked processing of existing rows
4. The schema migration runs synchronously in the deploy pipeline (fast, milliseconds)
5. The data migration also runs in the pipeline but only dispatches a job (fast)
6. The actual backfill processing happens asynchronously via queue workers
7. If the backfill fails, the queue retries the failed chunks automatically

## Validation Checklist

- [ ] Schema migration contains only DDL operations
- [ ] Data migration's up() only dispatches a queue job
- [ ] Data migration is idempotent and retryable
- [ ] Schema and data migrations have sequential filenames
- [ ] Backfill uses chunkById or similar stable cursor
- [ ] Queue workers use a dedicated connection pool

## Common Failures

### Heavy UPDATE in schema migration
A schema migration adds a column then runs a heavy UPDATE, locking the table and blocking the deploy. Always move data operations to queued jobs.

### Data migration before schema migration
A queued backfill job is processed before the schema migration adds the column it references. The job fails because the column doesn't exist. Version the backfill jobs to delay dispatch.

## Decision Points

### Same migration file vs separate files?
Separate files always. Schema migration is fast and synchronous. Data migration is potentially long-running and should be async. Mixing them couples speed to data volume.

### Queue job inline vs dedicated migration?
Dedicated migration files for data changes make the migration history explicit. The `up()` method dispatches the job — this is the standard Laravel pattern for schema-data separation.

## Performance Considerations

Schema migrations are fast (ms to seconds). Data migrations should use chunked processing with configurable sleep intervals. Backfill workers should use a separate connection pool to avoid starving application requests.

## Security Considerations

A schema migration succeeding while the data migration fails leaves the column NULL for all rows. Add columns as nullable initially and defer NOT NULL until backfill completes.

## Related Rules

- Never mix DDL and DML in one migration
- Data migrations dispatch queue jobs, not direct UPDATEs
- Use sequential timestamps for related schema/data migration pairs

## Related Skills

- Use DB::table Instead of Eloquent Models in Migrations
- Execute Data Backfill Strategies
- Design Rollback Strategies

## Success Criteria

- Schema migrations run synchronously in milliseconds
- Data migrations run asynchronously via queue
- Failed data migrations are retried automatically
- Schema and data migrations are independently rollback-able
- Column additions are nullable until backfill completes
