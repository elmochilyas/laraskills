# Skill: Configure `failed_jobs` Storage for Production

## Purpose
Set up the `failed_jobs` database table (or DynamoDB) to persist permanently failed job payloads, exceptions, and metadata for retry and debugging.

## When To Use
Every production application with queue jobs, since `queue:failed` and retry depend on this storage. Database for simple setups; DynamoDB for high-volume failure storage.

## When NOT To Use
DynamoDB for low-volume failures (unnecessary infrastructure); storing sensitive data in payload without awareness.

## Prerequisites
- Run `queue:failed-table` migration
- Configure `config/queue.php` `failed` section

## Inputs
- Failure volume estimate
- Compliance requirements for payload retention
- Retry window for pruning schedule

## Workflow
1. Run `php artisan queue:failed-table` and migrate
2. Configure `config/queue.php` `failed` driver (database or DynamoDB)
3. For high-volume systems: use dedicated DB connection for failed jobs
4. Schedule pruning: `$schedule->command('queue:prune-failed --hours=168')->daily()`
5. Be aware of sensitive data in payload — minimize constructor arguments
6. Consider DynamoDB for >1000 failures/day on AWS
7. Prune during low-traffic periods

## Validation Checklist
- [ ] `failed_jobs` table migrated and configured
- [ ] Dedicated DB connection for high-volume failures
- [ ] Pruning scheduled (7-30 day retention)
- [ ] Payload reviewed for sensitive data
- [ ] `config/queue.php` `failed` section configured
- [ ] DynamoDB set up if applicable

## Common Failures
- Never pruning — table grows unbounded, slow queries
- Storing sensitive data in payload — PII/keys stored permanently
- Relying on DynamoDB for analytics — lacks complex queries
- No dedicated connection — failure storage competes with app queries

## Decision Points
- Simple setup: database `failed_jobs` table
- High volume or AWS-native: DynamoDB
- Compliance: review payload sensitivity, set retention policy

## Related Rules
- Rule 1: prune-failed-jobs-regularly
- Rule 2: dedicated-connection-for-high-volume-failures
- Rule 3: be-aware-of-sensitive-payload-data

## Related Skills
- Schedule Pruning of Failed Jobs
- Implement `failed()` Method for Job-Specific Cleanup
- Listen to `Queue::failing` for Global Failure Monitoring

## Success Criteria
`failed_jobs` table is configured, pruned regularly, uses appropriate storage backend, and payload sensitivity is reviewed.
