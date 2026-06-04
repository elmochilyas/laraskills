# Skill: Implement Graceful Error Handling

## Purpose

Design error handling at the correct architectural layer, choosing between null returns, exception throwing, and error responses based on the operation context.

## When To Use

- When designing service layer methods that can fail
- When implementing controller actions that need user feedback
- When adding error recovery to existing operations
- When refactoring catch-all controllers

## Prerequisites

- Understanding of the application's architectural layers (controller, service, handler)
- Knowledge of which operations are recoverable vs non-recoverable

## Workflow

1. Identify the failure mode:
   - Expected possible absence → return null
   - Unexpected failure → throw custom exception
   - HTTP-specific response needed → let bubble to controller or handler

2. For service layer methods:
   ```php
   public function findUser(int $id): ?User { ... }           // null for expected absence
   public function processPayment(Order $order): Payment { ... } // throws on failure
   ```

3. For controller actions, catch HTTP-relevant exceptions:
   ```php
   public function show(int $id)
   {
       $user = $this->userService->findUser($id);
       if (!$user) {
           return redirect()->route('users.index')->with('error', 'User not found.');
       }
       return view('users.show', compact('user'));
   }
   ```

4. For recoverable failures in services, catch and degrade:
   ```php
   try {
       return $this->recommendationEngine->get($userId);
   } catch (RecommendationException $e) {
       Log::warning('Recommendation failed', ['user_id' => $userId]);
       return Product::popular()->limit(10)->get(); // degraded fallback
   }
   ```

5. Add error reference ID for production errors that need user-visible tracking.

## Validation Checklist

- [ ] Service methods return null for expected absences
- [ ] Unexpected failures throw custom exception types
- [ ] No HTTP responses are returned from service layer
- [ ] Catch blocks either log+re-throw or perform recovery — never silent
- [ ] Error messages do not expose internal details
- [ ] Error reference IDs link user reports to logs
- [ ] Recoverable failures have fallback behavior defined

## Common Failures

1. Silent swallow — error invisible, no recovery.
2. Exception for expected absence — expensive control flow.
3. Service returns HTTP response — coupled to web, unusable from queue.
4. Internal details in error message — security vulnerability.
5. No degraded fallback — recoverable failure becomes complete failure.

---

# Skill: Design User-Facing Error Messages

## Purpose

Design error messages that provide actionable feedback without exposing internal details, with appropriate use of reference IDs for system errors.

## Workflow

1. Classify the error type:
   - **User-actionable:** Validation error, duplicate entry, rate limit — show specific guidance
   - **System error:** Database failure, payment gateway timeout — show generic message + reference ID
   - **Expected absence:** Not found, empty results — show appropriate "not found" message

2. Format actionable errors with specific guidance:
   ```php
   // Good: "Email is already registered. Try logging in or use a different email."
   // Bad: "SQLSTATE[23000]: Integrity constraint violation"
   ```

3. Format system errors with reference ID:
   ```php
   // Good: "Something went wrong. Reference: ERR-a1b2c3d4"
   // Bad: "Call to undefined method App\Models\User::nonExistentMethod()"
   ```

4. Log the full context with the reference ID for debugging.

## Validation Checklist

- [ ] User-actionable errors provide specific guidance
- [ ] System errors show generic message with reference ID
- [ ] No stack traces, file paths, or SQL in user-facing messages
- [ ] Reference IDs are unique and linkable to log entries

## Common Failures

1. Exposing database constraint names in validation messages.
2. Showing "An error occurred" for user-actionable errors like validation.
3. No reference ID — user reports "I got an error" with no trace.
