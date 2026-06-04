# Skill: Manage Migration Batch Tracking for Safe Rollback

## Purpose

Use Laravel's `migrations` table and batch system with `--step` mode to control rollback granularity, verify migration state with `migrate:status`, and prevent partial migration failures from leaving the database in an inconsistent state.

## When To Use

- Running migrations in production deployments
- Managing rollback safety for multi-environment releases
- Auditing migration state across environments

## When NOT To Use

- Local development with `migrate:fresh` (skips batch tracking)
- Single-server deployments with no rollback requirements

## Prerequisites

- Understanding of the `migrations` table structure (migration, batch columns)
- Knowledge of batch grouping and rollback behavior

## Inputs

- Migration files to deploy
- Rollback granularity requirement (per-migration or per-batch)
- Environment (production, staging, development)

## Workflow

1. Before deployment, run `php artisan migrate:status` to verify the current migration state matches expectations
2. For production, use `php artisan migrate --step --force` to assign each migration its own batch for granular rollback
3. After deployment, verify all new migrations are recorded with the correct batch numbers
4. If a migration fails, assess whether to roll back the failed batch or create a corrective migration
5. For local development, use `migrate:fresh` to drop all tables and re-run from scratch
6. For staging rollback testing, use `migrate:refresh` to roll back all batches and re-run

## Validation Checklist

- [ ] `migrate:status` shows expected state before running
- [ ] Production migrations use `--step` for per-migration batches
- [ ] After deploy, all new migrations show correct batch numbers
- [ ] `down()` methods exist and are tested for all migrations
- [ ] Failed migration state is verified before recovery action

## Common Failures

### Batch rollback undoes too much
Without `--step`, all migrations in one deploy share a single batch. Rolling back undoes ALL of them. Use `--step` to assign individual batches for granular control.

### migrate:fresh on shared environments
`migrate:fresh` drops all tables instantly with no rollback. This destroys shared staging data. Only use on local development databases.

## Decision Points

### --step vs default?
Use `--step` for production — it assigns each migration its own batch, allowing single-migration rollback. Default batching is acceptable for CI/test environments where full batch rollback is tolerable.

### migrate:refresh vs migrate:fresh?
`migrate:refresh` calls `down()` on every migration — tests rollback paths but takes longer. `migrate:fresh` drops tables directly — faster but doesn't test rollback. Use `migrate:refresh` in staging, `migrate:fresh` in local dev.

## Performance Considerations

Batch tracking has negligible overhead. `--step` increases batch recording writes slightly. For deployments with hundreds of migrations, `schema:dump` is significantly faster than running individual migrations.

## Security Considerations

The `migrations` table is a system table — direct modification can cause unrecoverable state. Never manually INSERT, UPDATE, or DELETE entries unless recovering from a known failure.

## Related Rules

- Use --step for production rollback granularity
- Never use migrate:fresh on shared environments
- Check migrate:status before deployment

## Related Skills

- Create Anonymous Migration Classes
- Configure Migration Ordering and Naming
- Design Rollback Strategies

## Success Criteria

- Production migrations use `--step` for per-migration batches
- Migration state is verified before and after deployment
- Rollback is safe, predictable, and reversible
- Failed migrations are handled without data loss
