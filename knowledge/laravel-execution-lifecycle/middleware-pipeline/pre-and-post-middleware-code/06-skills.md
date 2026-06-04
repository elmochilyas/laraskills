# Skill: Implement Pre- and Post-Middleware Code

## Purpose
Write middleware that executes code both before the controller (inbound/request phase) and after the controller (outbound/response phase) using the `$next($request)` boundary within a single `handle()` method.

## When To Use
- Adding request authentication, validation, or rate limiting (pre-middleware)
- Adding response headers, compression, or logging (post-middleware)
- Implementing CORS middleware (check origin inbound, set headers outbound)
- Timing request duration (start timer inbound, log duration outbound)

## When NOT To Use
- For post-response cleanup that should not block the response (use terminable middleware)
- For business logic that belongs in controllers or services
- For asynchronous operations (use queues)
- For streaming responses (post-middleware that modifies body blocks streaming)

## Prerequisites
- Middleware class with `handle()` method
- Understanding of the onion model and nested closure execution
- Clear separation between inbound and outbound concerns

## Inputs
- Request data for pre-middleware processing
- Response object returned by `$next($request)` for post-middleware processing
- Desired pre and post operations

## Workflow
1. Write code for the inbound phase BEFORE `$next($request)`:
   `// Pre: validate, authenticate, rate limit`
2. Store the result of `$next($request)` in a variable:
   `$response = $next($request);`
3. Write code for the outbound phase AFTER `$next($request)`:
   `// Post: add headers, log, transform`
4. Return the response from `handle()`
5. Separate pre and post sections with clear `// Pre` and `// Post` comments
6. Ensure pre-middleware is fast (blocks request from reaching controller)
7. Ensure post-middleware is fast (blocks response from reaching client)
8. Test short-circuit behavior: return early from pre-code and verify post-code doesn't run

## Validation Checklist
- [ ] Pre-code runs before `$next($request)` (inbound)
- [ ] Post-code runs after `$next($request)` (outbound)
- [ ] Pre and post sections are clearly commented
- [ ] Pre-middleware is fast (minimal TTFB impact)
- [ ] Post-middleware is fast (minimal TTLB impact)
- [ ] Response not accessed/modified in pre-middleware
- [ ] Short-circuit tested (post-code skipped on early return)
- [ ] Exception in controller prevents post-code execution

## Common Failures
- Modifying response in pre-middleware (response doesn't exist yet)
- Placing all logic after `$next()` (post-code skipped by short-circuit)
- Heavy work in pre-middleware (increases TTFB for every request)
- Forgetting that outermost post-middleware has final say on response
- Not understanding that post-code only runs on successful completion

## Decision Points
- Pre or post placement? -> Auth/validation: pre; Response transformation: post; Both: CORS, timing
- Single middleware or split? -> Keep related pre/post together (CORS); split if independently reusable
- Post-middleware or terminable? -> Post if response modification; terminable if post-response cleanup

## Performance Considerations
- Pre-middleware blocks the entire request (heavy = high TTFB)
- Post-middleware blocks the response from being sent (heavy = high TTLB)
- Short-circuit from pre-code saves all downstream processing
- Outermost post-middleware's modifications are final

## Security Considerations
- Auth in pre-middleware must run before middleware that accesses user data
- Short-circuit bypasses downstream post-code (logging, auditing)
- Exception in controller/post-middleware prevents further post-code execution
- Response overwriting: outer post-middleware replaces inner modifications

## Related Rules
- Always Understand That Post-Code Only Runs on Successful Completion
- Keep Pre-Middleware Fast to Minimize TTFB Impact
- Keep Post-Middleware Fast to Minimize TTLB Impact
- Keep Related Pre/Post Logic in the Same Middleware
- Never Modify or Access the Response in Pre-Middleware Code
- Understand That Outermost Post-Middleware Runs Last and Has Final Say
- Separate Pre and Post Code Sections with Clear Comments

## Related Skills
- Implement a Custom Pipeline
- Implement Terminable Middleware
- Assign Route Middleware Correctly

## Success Criteria
- Middleware correctly executes pre-code inbound and post-code outbound
- Pre and post sections are clearly separated with comments
- Performance impact of pre and post code is understood and minimized
- Short-circuit behavior is tested and documented
