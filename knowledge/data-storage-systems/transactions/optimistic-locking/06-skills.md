# Skill: Implement Optimistic Locking

## Purpose

Use version-based optimistic locking to detect concurrent modifications without acquiring database locks, with retry on conflict.

## When To Use

- Low contention on the resource (conflicts are rare)
- Read-heavy workload with occasional concurrent updates
- Web forms where multiple users may edit the same record
- Application can accept retry on conflict
- No requirement for immediate consistency (ASAP is fine)

## When NOT To Use

- High contention (many concurrent writes to same row)
- Pessimistic locking is already simpler for the use case
- Database-level locking is required (FOR UPDATE needed)
- Conflicts must be prevented, not detected after the fact
- Retry is not possible (async processing, side effects)

## Prerequisites

- Version column on the table (integer or timestamp)
- Application retry logic

## Inputs

- Row to update
- Current version (read before transaction)
- New values to apply

## Workflow (numbered steps)

1. Add a version column to the model migration:
   ```php
   Schema::table('orders', function (Blueprint $table) {
       $table->unsignedInteger('version')->default(0);
   });
   ```

2. Implement optimistic lock check on update:
   ```php
   function updateOrder(int $id, array $data, int $expectedVersion): bool
   {
       $affected = DB::table('orders')
           ->where('id', $id)
           ->where('version', $expectedVersion)
           ->update(array_merge($data, [
               'version' => $expectedVersion + 1,
           ]));

       if ($affected === 0) {
           throw new OptimisticLockException("Order $id was modified by another user");
       }
       return true;
   }
   ```

3. In web forms, include version as hidden field:
   ```blade
   <form>
       <input type="hidden" name="version" value="{{ $order->version }}">
       <!-- other fields -->
   </form>
   ```

4. Handle conflict in the controller:
   ```php
   try {
       updateOrder($id, $data, $request->version);
       return redirect()->back()->with('success', 'Updated');
   } catch (OptimisticLockException $e) {
       return redirect()->back()
           ->with('error', 'This order was modified by another user. Please review changes.')
           ->withInput();
   }
   ```

5. For API endpoints, retry with fresh data:
   ```php
   function retryUpdate(int $id, array $data, int $maxRetries = 3): bool
   {
       for ($i = 0; $i < $maxRetries; $i++) {
           $current = DB::table('orders')->find($id);
           $affected = DB::table('orders')
               ->where('id', $id)
               ->where('version', $current->version)
               ->update(array_merge($data, ['version' => $current->version + 1]));
           if ($affected > 0) return true;
           usleep(50_000); // 50ms backoff
       }
       throw new OptimisticLockException("Update failed after $maxRetries retries");
   }
   ```

## Validation Checklist

- [ ] Version column exists on the table
- [ ] All updates include version check in WHERE clause
- [ ] Version incremented on each update
- [ ] Conflict detected (0 affected rows) and handled
- [ ] Retry logic implemented when appropriate
- [ ] Web forms include version as hidden field

## Common Failures

- Version check on UPDATE but version not incremented — never detects conflicts
- No conflict detection — 0 affected rows silently means "no update"
- Web form missing version field — conflict detection impossible
- Optimistic lock for high-contention resource — excessive retries
- Updated by other columns (WHERE version = X) — must use version value, not column reference

## Decision Points

- Integer version vs timestamp (integer is more reliable)
- Retry vs show conflict to user (show for web, retry for API)
- Optimistic vs pessimistic locking based on contention level
- Version per row vs per aggregate (per row is simpler)

## Performance Considerations

- Zero read overhead (no locks on reads)
- Update conflict: only on write attempt (not on read)
- Retry: re-read + re-apply + re-attempt (cost of conflict)
- No lock contention: scales to many concurrent reads

## Security Considerations

- Version must not be guessable (simple integer is fine)
- Conflict detection doesn't bypass access controls
- Version field should not be user-modifiable (server-managed)

## Related Rules

- 9-14-1: Always Check Affected Rows for Version Match
- 9-14-2: Prefer Optimistic Locking for Low-Contention Resources

## Related Skills

- Implement Pessimistic Locking
- Implement Transaction Retry Logic
- Handle Concurrent Web Form Submissions

## Success Criteria

- Version check on all updates for locked resources
- Conflict detection working (0 affected rows detected)
- Web forms include version field
- Retry logic for API endpoints
- Low failure rate (optimistic lock works well for low contention)
