# Skill: Keep Transactions Short

## Purpose

Minimize transaction duration by moving pre- and post-processing outside the transaction, ensuring locks are held only for the minimal necessary database work.

## When To Use

- Every transaction in application code
- Reviewing existing transaction usage for optimization
- Designing new transactional logic
- Debugging lock contention issues

## When NOT To Use

- Single-statement queries (autocommit mode)
- Read-only operations (no locks held unless FOR UPDATE)

## Prerequisites

- Understanding of transaction lock duration
- Ability to refactor code to move operations outside transaction

## Inputs

- Transaction code block
- Non-database operations (API calls, file I/O, computation)

## Workflow (numbered steps)

1. Identify operations inside the transaction:
   - Database reads and writes (necessary)
   - External API calls (move outside)
   - File uploads/downloads (move outside)
   - Heavy computation (do before or after)
   - User input waits (move outside)
   - Logging to external services (move outside)

2. Refactor: Outside → Transaction → Outside pattern:
   ```php
   // ❌ BAD: API call inside transaction
   DB::transaction(function () use ($data) {
       $order = Order::create($data);
       $response = Http::post('payment.example.com', $data); // 500ms lock hold!
       $payment = Payment::create([...]);
   });

   // ✅ GOOD: API call before transaction
   $response = Http::post('payment.example.com', $data); // outside
   DB::transaction(function () use ($data, $response) {
       $order = Order::create($data);
       $payment = Payment::create([...]);
   });
   ```

3. Measure transaction duration:
   - Log transaction start and end times
   - Alert on transactions exceeding 100ms (interactive) or 1s (batch)
   - Profile to identify slow operations inside transactions

4. For batch operations: process in smaller batches with separate transactions
   ```php
   foreach (array_chunk($items, 100) as $batch) {
       DB::transaction(function () use ($batch) {
           foreach ($batch as $item) {
               $item->process();
           }
       });
   }
   ```

5. Design: compute upfront, read-with-lock-and-update quickly

## Validation Checklist

- [ ] No external API calls inside transactions
- [ ] No file uploads or user input waits inside transactions
- [ ] Transaction duration measured and logged
- [ ] Batch operations split into smaller transaction batches
- [ ] Heavy computation done before or after transaction
- [ ] Transactions complete in < 100ms (interactive) or < 1s (batch)

## Common Failures

- API call inside transaction — lock held for 200-5000ms
- File upload inside transaction — lock held for seconds
- User confirmation inside transaction — indefinite lock hold
- Single large transaction for 10K rows — hours of lock time
- Logging inside transaction — unnecessary delay

## Decision Points

- Single large transaction vs batch of small transactions
- Read-without-lock outside vs read-with-lock inside
- Pre-validation outside vs validation inside transaction

## Performance Considerations

- Every millisecond in a transaction = lock contention window
- External API calls: 10-1000ms each (unacceptable in transaction)
- Batch size: 100 vs 1000 items per transaction
- Read-lock-update cycle: typically < 5ms for a simple operation

## Security Considerations

- Short transactions reduce data exposure window
- Rollback of large transactions may take time (compensating operations)

## Related Rules

- 9-13-1: Never Include External Calls in Transactions
- 9-13-2: Keep Transactions Under 100ms for Interactive Workloads

## Related Skills

- Manage Transaction Length
- Implement Transaction Retry Logic
- Batch Process with Separate Transactions

## Success Criteria

- All external calls moved outside transactions
- Transaction duration < 100ms for interactive requests
- Batch operations use multiple smaller transactions
- Transaction duration monitored and alerted
