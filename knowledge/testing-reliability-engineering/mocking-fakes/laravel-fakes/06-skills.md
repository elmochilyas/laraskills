# Skill: Use Laravel's Built-in Fakes for Testing

## Purpose
Leverage Laravel's built-in fake implementations — `Event::fake()`, `Bus::fake()`, `Mail::fake()`, `Notification::fake()`, `Queue::fake()`, and `Storage::fake()` — to prevent side effects and verify that framework services are used correctly.

## When To Use
- When testing that events, mail, notifications, jobs, or storage operations are dispatched correctly
- When preventing real side effects (email sending, queue processing, filesystem writes) during tests
- When asserting that specific payloads are passed to framework services
- When testing error handling for these services

## When NOT To Use
- When testing the real behavior of these services (use a dedicated integration test)
- When the fake interface doesn't support the assertion you need (use a mock)
- When the fake's behavior differs from the real implementation in a way that affects the test
- For testing authentication or session services (use the real implementation)

## Prerequisites
- Knowledge of Laravel's facade system
- Understanding of each fake's specific assertion methods
- Awareness of which version of Laravel introduced each fake

## Inputs
- The service to fake (Event, Bus, Mail, Notification, Queue, Storage)
- Expected dispatch type, payload, and count
- Optional assertions about what should not be dispatched

## Workflow
1. Call the appropriate `*::fake()` method before the action: `Event::fake()`, `Bus::fake()`, `Mail::fake()`, `Notification::fake()`, `Queue::fake()`, `Storage::fake()`
2. Optionally fake only specific items: `Event::fake([InvoicePaid::class])`
3. For Storage, configure the fake disk: `Storage::fake('s3')`
4. Execute the action under test
5. Assert the expected dispatches: `Event::assertDispatched()`, `Mail::assertSent()`, `Queue::assertPushed()`, etc.
6. For Storage, assert file operations: `Storage::disk('s3')->assertExists('photos/photo.jpg')`
7. Assert that unexpected dispatches did not occur: `Event::assertNotDispatched()`
8. Use callback assertions for payload verification: `Mail::assertSent(OrderShipped::class, fn ($mail) => $mail->order->id === $order->id)`

## Validation Checklist
- [ ] Appropriate `*::fake()` method is called before the action
- [ ] Specific fakes are used when relevant (not over-faking)
- [ ] Assertions verify both dispatch and payload
- [ ] Dispatch count is verified when relevant
- [ ] Operations that should not occur are asserted with `assertNot*` methods
- [ ] Storage assertions verify both creation and content of files

## Common Failures
- Forgetting to call `*::fake()` — real side effects execute during tests
- Using the wrong assertion method for the fake type
- Not verifying payload contents — existence alone doesn't guarantee correctness
- Over-faking — faking services that aren't used in the test
- Not restoring fakes between tests (Laravel handles this, but custom implementations may not)

## Decision Points
- `Mail::fake()` vs `Notification::fake()` — Mail for direct mail sending, Notification for multi-channel notifications
- `Storage::fake()` with specific disk vs default — always specify the disk to match production
- `Bus::fake()` vs `Queue::fake()` — Bus for sync dispatch testing, Queue for async job testing

## Performance Considerations
- All Laravel fakes have negligible overhead (<0.5ms)
- Fakes prevent real I/O operations (disk writes, SMTP connections, queue connections)
- Storage fakes use in-memory filesystems — no actual disk writes

## Security Considerations
- Storage fakes should not contain real sensitive files
- Mail fakes may capture HTML content with user data — ensure CI output doesn't expose it
- Bus/Queue fakes capture job data that may contain sensitive parameters

## Related Rules
- [Rule: Call `*::fake()` Before the Action](./05-rules.md)
- [Rule: Verify Payloads with Callback Assertions](./05-rules.md)
- [Rule: Use the Specific Fake, Not the General One](./05-rules.md)

## Related Skills
- Event Testing
- HTTP Client Faking
- Mail Notification Testing
- Storage Fake Testing

## Success Criteria
- [ ] All tests that interact with framework services use the appropriate fake
- [ ] Payload assertions verify correct data is passed to each service
- [ ] No real side effects occur during the test suite run
- [ ] Service interaction tests are fast (<100ms per test) and deterministic
