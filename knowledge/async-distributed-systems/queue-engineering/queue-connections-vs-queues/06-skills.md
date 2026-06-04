# Skill: Design Queue Topology with Connections and Queues

## Purpose
Design correct queue topology by distinguishing connections (backends) from queues (logical channels), avoiding unnecessary infrastructure multiplication while supporting priority and isolation.

## When To Use
When planning queue infrastructure for a new project, adding new job types, or refactoring existing queue topology.

## When NOT To Use
Single-queue applications with uniform job requirements — one connection and one queue suffice.

## Prerequisites
- Understanding of queue connection vs queue distinction
- Knowledge of workload characteristics per job type

## Inputs
- Job types and their latency requirements
- Driver types needed (Redis, SQS, etc.)
- Isolation requirements (separate Redis instances)

## Workflow
1. Define queue names by workload characteristic (critical, default, bulk, media, reports)
2. Use a single Redis connection for all queue names unless different drivers are needed
3. Name queues by latency/resource profile, not job class
4. Configure workers with priority ordering: `--queue=critical,default,bulk`
5. If using SQS: create separate queue URLs and separate workers per URL
6. Set `after_commit=true` at connection level for transactional safety
7. Document topology before deploying first job

## Validation Checklist
- [ ] Queue names describe workload characteristics, not job classes
- [ ] Single connection serves all queues unless different drivers justified
- [ ] No separate connections per queue name
- [ ] SQS: separate URLs and workers per queue
- [ ] `after_commit=true` at connection level
- [ ] Topology documented and understood by the team

## Common Failures
- Separate Redis instances per queue name — unnecessary infrastructure overhead
- Naming queues by job class — proliferation of single-job-type queues
- Not setting `after_commit` — jobs process before transaction commits
- SQS with comma-separated `--queue` — only first queue used

## Decision Points
- Same driver, same Redis instance → one connection, multiple queue names
- Different drivers → separate connections (e.g., Redis for latency-sensitive, SQS for bulk)
- Fully isolated Redis instances → separate connections

## Performance Considerations
- All queues on one Redis connection share the same connection pool
- Adding a queue name costs nothing (just a list key in Redis)
- SQS charges per request — polling many empty queues costs the same as one

## Security Considerations
- Separate connections provide stronger isolation for sensitive job types
- IAM permissions can be scoped per SQS queue if using separate URLs

## Related Rules
- Rule 1: define-topology-before-deploying
- Rule 2: name-queues-by-workload-characteristic
- Rule 3: no-separate-connections-per-queue
- Rule 4: set-after-commit-at-connection-level
- Rule 5: one-connection-many-queues

## Related Skills
- Select and Configure the Right Queue Driver
- Configure Queue Priority via Multiple Queue Names

## Success Criteria
Queue topology uses one connection per driver type with multiple named queues for priority, no unnecessary infrastructure, and jobs route to the correct queue based on their latency requirements.
