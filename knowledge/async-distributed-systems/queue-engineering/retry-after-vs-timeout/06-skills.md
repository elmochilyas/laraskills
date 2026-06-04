# Skill: Configure retry_after and --timeout to Prevent Double Processing

## Purpose
Set `retry_after` (connection config) and `--timeout` (worker flag) with a safe gap to eliminate double-processing from reservation expiry.

## When To Use
When configuring any new queue connection or when auditing existing queue configuration for double-processing risk.

## When NOT To Use
Jobs that are fully idempotent where double-processing has no side effects.

## Prerequisites
- Access to `config/queue.php`
- Knowledge of longest job `$timeout` property across all job classes

## Inputs
- Connection name (e.g., `redis`, `sqs`)
- Maximum job-level `$timeout` across all job classes
- Worker `--timeout` flag value

## Workflow
1. Find max job timeout: `grep -rh 'public \$timeout' app/Jobs/ | sed 's/[^0-9]*//g' | sort -rn | head -1`
2. Set `--timeout` to max job timeout + 30% buffer
3. Set `retry_after` = `--timeout` + 10s in `config/queue.php`
4. Verify no job `$timeout` exceeds `retry_after`: `grep -rh 'public \$timeout' app/Jobs/ | sed 's/[^0-9]*//g' | while read t; do if [ "$t" -gt 70 ]; then echo "WARNING: Job timeout $t > retry_after"; fi; done`
5. Update Supervisor command with new `--timeout`
6. Restart workers

## Validation Checklist
- [ ] `--timeout` is at least 10s less than `retry_after`
- [ ] No job `$timeout` property exceeds `retry_after`
- [ ] Job `$timeout` values are documented and reviewed per deploy
- [ ] Separate connections have separate `retry_after` values if runtimes differ

## Common Failures
- Job `$timeout` property silently overrides worker `--timeout` — must audit both
- `--timeout` == `retry_after` — clock skew causes intermittent double-processing
- Same `retry_after` for connections with mixed fast/slow job types

## Decision Points
- If jobs have very different runtimes, use separate connections with tuned `retry_after` values

## Performance Considerations
- `retry_after` has no CPU impact — it is a backend timer
- Too-low `retry_after` causes unnecessary double-processing overhead

## Security Considerations
- Double-processing from misconfiguration can cause duplicate charges, duplicate notifications, or data corruption

## Related Rules
- Rule 1: Always Keep --timeout at Least 10s Below retry_after
- Rule 2: Never Ignore Job $timeout Override
- Rule 3: Remember retry_after Is Per-Connection, Not Per-Queue

## Related Skills
- Configure Supervisor stopwaitsecs for Graceful Shutdown
- Configure Worker Daemon Architecture

## Success Criteria
A job that exceeds `--timeout` is killed before `retry_after` expires — no second worker picks it up, no double-processing occurs.
