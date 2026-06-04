# Skill: Prevent Write Skew

## Purpose

Detect and prevent write skew — a serialization anomaly where two concurrent transactions read overlapping data, both verify a condition that passes individually, and both write, violating a global invariant.

## When To Use

- Invariants that depend on a condition over multiple rows or a range of data
- Doctor on-call schedule (at least one must be on call)
- Preventing overselling (total allocated must not exceed total available)
- Resource or capacity management (total assigned ≤ total capacity)
- Any "check-then-act" across multiple rows

## When NOT To Use

- Simple row-level invariants (optimistic or pessimistic locking on single row suffices)
- No concurrent writes to related data
- READ COMMITTED is sufficient and write skew is acceptable
- Invariant enforced by database constraint (CHECK, UNIQUE, FK)

## Prerequisites

- Understanding of write skew vs other anomalies
- Ability to use FOR UPDATE or SERIALIZABLE isolation

## Inputs

- Invariant to protect (e.g., "at least one doctor on call", "total ≤ capacity")
- Transaction code that checks and then acts based on the check
- Related rows that participate in the invariant

## Workflow (numbered steps)

1. Identify write-skew-prone patterns:
   ```php
   // Classic write skew: two doctors check "is anyone on call?"
   $onCall = Doctor::where('on_call', true)->count(); // both see 0
   Doctor::where('id', $doctorId)->update(['on_call' => true]); // both set themselves
   ```

2. Fix with explicit range locks (`FOR UPDATE`):
   ```php
   DB::transaction(function () use ($doctorId) {
       // Lock the rows that determine the invariant
       $onCall = Doctor::where('on_call', true)->lockForUpdate()->count();
       if ($onCall < 1) {
           Doctor::where('id', $doctorId)->update(['on_call' => true]);
       }
   });
   ```
   - `FOR UPDATE` locks all "on_call" rows
   - Second transaction waits until first commits
   - After first commits, second re-reads and sees updated state

3. Fix with SERIALIZABLE isolation (PostgreSQL SSI):
   ```php
   DB::transaction(function () use ($doctorId) {
       DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
       $onCall = Doctor::where('on_call', true)->count();
       if ($onCall < 1) {
           Doctor::where('id', $doctorId)->update(['on_call' => true]);
       }
   }, 5); // retry 5 times on serialization failure
   ```
   - SSI detects the conflict via predicate locking
   - One transaction is aborted, the other succeeds
   - Retry handles the aborted transaction

4. For capacity management:
   ```php
   DB::transaction(function () use ($projectId, $hours) {
       $project = Project::where('id', $projectId)->lockForUpdate()->first();
       $assigned = Task::where('project_id', $projectId)->sum('hours');
       if ($assigned + $hours <= $project->capacity) {
           Task::create(['project_id' => $projectId, 'hours' => $hours]);
       }
   });
   ```

## Validation Checklist

- [ ] Write-skew-prone patterns identified and fixed
- [ ] FOR UPDATE locks the rows that determine the invariant
- [ ] SERIALIZABLE (SSI) used if FOR UPDATE scope is unclear
- [ ] Retry logic for SSI serialization failures
- [ ] Invariant verified after fix with concurrent test
- [ ] No hidden write skew through implicit conditions

## Common Failures

- Assuming REPEATABLE READ prevents write skew (it does NOT)
- FOR UPDATE on single row but invariant depends on other rows
- SSI without retry — transaction aborted, invariant unprotected
- Write skew through non-obvious dependencies (two-step logic)
- Missing FOR UPDATE on all rows that participate in the invariant

## Decision Points

- FOR UPDATE (explicit locking) vs SERIALIZABLE (automatic detection)
- FOR UPDATE: must know which rows to lock (simpler but requires analysis)
- SSI: automatically detects conflicts (simpler code, but retry overhead)
- Database-level invariant (CHECK with function) vs application-level prevention

## Performance Considerations

- FOR UPDATE: blocks concurrent transactions until commit
- SSI: optimistic, no blocking, but aborts on conflict (retry cost)
- FOR UPDATE lock scope: must lock broad enough to prevent write skew
- SSI scope: entire transaction tracked (higher overhead)
- Write skew prevention is more expensive than row-level locking

## Security Considerations

- Write skew prevention doesn't affect access controls
- Invariants must be carefully defined to prevent security bypass (e.g., resource allocation limits)

## Related Rules

- 9-18-1: Always Use FOR UPDATE or SERIALIZABLE for Write Skew Prevention
- 9-18-2: Never Rely on REPEATABLE READ to Prevent Write Skew

## Related Skills

- Implement Serializable Snapshot Isolation (SSI)
- Use Row-Level Locks (FOR UPDATE)
- Choose Isolation Level

## Success Criteria

- Write-skew-prone patterns identified across the application
- FOR UPDATE or SERIALIZABLE prevents all write skew
- Invariant holds under concurrent access
- Performance impact of prevention is acceptable
- SSI retry logic handles < 5% abort rate
