# Skill: Isolate Concurrent Migrations with --isolated Flag

## Purpose

Use `php artisan migrate --isolated` to prevent multiple servers in a load-balanced deployment from running migrations concurrently, acquiring an atomic cache lock that ensures only one server applies schema changes while others exit gracefully.

## When To Use

- Multi-server load-balanced deployments
- Containerized environments with multiple replicas
- Any deployment where multiple instances might run `migrate` simultaneously

## When NOT To Use

- Single-server deployments with manual migration execution
- Environments where migrations are managed externally

## Prerequisites

- Cache driver configured (Redis recommended for atomic locks)
- Laravel 9+ with `--isolated` support
- `MIGRATION_LOCK_TIMEOUT` configured appropriately

## Inputs

- Lock timeout duration (default 30 seconds)
- Cache driver configuration

## Workflow

1. Configure a shared cache driver (Redis) accessible by all application servers
2. Update the deployment script to run `php artisan migrate --isolated --force` instead of plain `migrate`
3. Set `MIGRATION_LOCK_TIMEOUT` in `.env` to a value exceeding the longest expected migration (default 30s)
4. Verify that the lock acquisition works: run `migrate --isolated` on two servers simultaneously — only one should apply migrations
5. After migration completes, optionally terminate Horizon workers: `php artisan horizon:terminate`

## Validation Checklist

- [ ] Cache driver supports atomic locks (Redis recommended)
- [ ] All app servers point to the same cache backend
- [ ] `MIGRATION_LOCK_TIMEOUT` exceeds the longest migration
- [ ] Deployment script uses `--isolated --force`
- [ ] Servers that don't acquire the lock exit with code 0 (not failure)

## Common Failures

### Lock timeout too short
A migration takes 60 seconds but the default lock timeout is 30. The lock expires, a second server acquires it, and both run concurrently. Set timeout to at least 2x the expected longest migration.

### Cache unavailable
If the cache driver is down, `--isolated` cannot acquire a lock. The migration may fail or run without isolation depending on configuration. Monitor cache availability as part of deployment health checks.

## Decision Points

### --isolated vs manual orchestration?
`--isolated` is simpler and sufficient for most deployments. Manual orchestration (deploy only on one server) is an alternative but requires extra infrastructure (deploy hooks, leader election).

### Lock timeout value?
Start with 30 seconds. Monitor actual migration times. Set to 2x the P99 migration duration. For data backfill migrations, this may need to be minutes.

## Performance Considerations

Cache lock overhead is negligible (< 5ms). Migration time is unchanged since only one server runs migrations. Lock timeout should be generous to prevent premature expiration.

## Security Considerations

The migration lock is stored in the shared cache. If the cache is compromised, an attacker could prevent migrations from running by creating a fake lock entry. Use Redis authentication and network isolation.

## Related Rules

- Always use --isolated in multi-server deployments
- Set lock timeout to 2x expected migration duration
- Monitor lock acquisition in deployment logs

## Related Skills

- Manage Migration Batch Tracking
- Configure Migration Ordering and Naming
- Design Rollback Strategies

## Success Criteria

- Only one server acquires the migration lock per deployment
- Lock timeout exceeds the longest migration duration
- Servers without the lock exit successfully without error
- Cache backend is shared and supports atomic locks
- Horizon workers terminate after migration to refresh schema cache
