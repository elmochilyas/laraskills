# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Laravel Fakes |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Service container, Facade system, Test double taxonomy |
| Related KUs | HTTP Client faking, Mail/notification testing, Queue/job testing, Storage fake testing |
| Source | domain-analysis.md K029 |

# Overview

Laravel built-in fakes (Bus, Event, Http, Mail, Notification, Queue, Storage) provide working in-memory implementations of framework services that record calls for later assertion. They replace real service interactions (HTTP calls, email sending, queue dispatching) with zero-side-effect alternatives. Fakes are preferred over mocks for Laravel applications because they provide more realistic behavior, require less setup, and are less brittle. The Laravel ecosystem convention is: "prefer fakes over mocks."

# Core Concepts

- **`Bus::fake()`**: Fakes the command bus. Records dispatched commands/jobs.
- **`Event::fake()`**: Fakes the event dispatcher. Records dispatched events.
- **`Http::fake()`**: Fakes the HTTP client. Returns predefined responses.
- **`Mail::fake()`**: Fakes the mailer. Records sent mails.
- **`Notification::fake()`**: Fakes the notification system. Records sent notifications.
- **`Queue::fake()`**: Fakes the queue. Records pushed jobs.
- **`Storage::fake()`**: Fakes a storage disk. Stores files in memory.
- **`Exceptions::fake()`**: Fakes the exception handler. Records reported exceptions.

# When To Use

- For every feature test that interacts with framework services (mail, queue, HTTP, events, storage)
- As the default choice over mocks for all Laravel-native services
- For tests that must prevent side effects (no real emails, no real HTTP calls)
- For verifying service interactions without executing the real service

# When NOT To Use

- For services without built-in fakes (use mocks or custom fakes)
- When you need to test the real service integration (use separate integration tests)
- When the fake behavior differs significantly from the real implementation
- For unit tests where the service interaction is not the concern under test

# Best Practices (WHY)

- **Prefer fakes over mocks always**: Fakes implement the real interface, are less brittle, and require less setup. Mocks (`shouldReceive`) should be reserved for custom interfaces without built-in fakes.
- **Call `::fake()` before the action, not after**: Fakes replace the service container binding. If the service was already resolved before `::fake()` is called, the fake doesn't take effect. Call at test start.
- **Always assert on faked services**: Setting up a fake but never asserting its calls means the test passes even if the service wasn't used. The fake + assertion is the mandatory pair.
- **Fake all external services in feature tests**: `Mail::fake(); Http::fake(); Queue::fake(); Event::fake();` at the start of integration tests prevents any accidental external calls.
- **Use assertion callbacks for data verification**: `Mail::assertSent(fn ($mailable) => $mailable->hasTo($user->email))` provides precise verification without checking full object state.

# Architecture Guidelines

- **Fake vs Mock**: Always prefer fakes when available. Use mocks only for services without built-in fakes.
- **Fake all vs fake selectively**: Fake all at start of integration tests. Fake selectively in unit tests.
- **Assertion granularity**: `assertSent(Class)` for existence checks. `assertSent(fn () => ...)` for detailed verification.
- **Count assertions**: `assertSentTimes('Class', 3)` for idempotency testing.

# Performance Considerations

- Fake registration: <1ms per fake (container binding replacement).
- Fake operation: In-memory operations. <0.1ms per recorded call.
- Assertion execution: <1ms per assertion (array search).
- Storage fakes with large files: In-memory storage may increase memory. Clear between tests.

# Security Considerations

- Fakes prevent accidental external interactions in tests. Critical for CI where network access may be limited or have costs.
- Ensure fake data doesn't contain real credentials or secrets.
- `Exceptions::fake()` prevents real error reporting, which is important for not polluting error monitoring with test errors.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not calling `::fake()` before code that uses the service | `::fake()` called after service resolved | Fake doesn't take effect; real service used | Call `::fake()` early (in `setUp()` or test start) |
| Assuming fakes validate input | `Http::fake()` accepts any URL | URL typo not caught; test passes with wrong URL | Assert request content: `assertSent(fn ($r) => $r->url() === '...')` |
| Mocking instead of using fakes | Familiarity with Mockery; `shouldReceive` pattern | More brittle tests; more setup code | Use `::fake()` for all Laravel-native services |
| Not asserting on fake after the action | Setting up fake but not verifying calls | Action may not have used service; test passes anyway | Always assert expected call was made |
| Faking too late | Calling `::fake()` after service already resolved | Binding already resolved; fake doesn't apply | Call early, ideally in `setUp()` |

# Anti-Patterns

- **Mocking Laravel-native services**: Using `$this->mock(Event::class)` instead of `Event::fake()`. Mocks are more brittle and require more setup.
- **Fake without assertion**: `Mail::fake()` at start but no `Mail::assertSent()`. Test passes even if no email was sent.
- **Fake after resolution**: Calling `::fake()` after code already resolved the service. Fake has no effect.
- **No error path simulation**: Using fakes only for success paths. Error handling code remains untested.

# Examples

```php
// Fake all services
public function test_order_processing()
{
    Mail::fake();
    Event::fake();
    Queue::fake();
    Http::fake();

    $response = $this->actingAs($user)->post('/orders', $data);

    $response->assertOk();
    Mail::assertSent(OrderConfirmation::class);
    Event::assertDispatched(OrderPlaced::class);
    Queue::assertPushed(ProcessOrderJob::class);
}

// Verify dispatched data with callback
public function test_welcome_mail_content()
{
    Mail::fake();
    $user = User::factory()->create(['name' => 'John']);

    $this->post('/register', $validData);

    Mail::assertSent(function (WelcomeMail $mail) use ($user) {
        return $mail->hasTo($user->email)
            && $mail->hasSubject('Welcome to our app!');
    });
}

// Selective faking
public function test_selective_mailer_faking()
{
    Mail::fake('smtp');
    // Other mailers work normally
}

// Storage fake
public function test_avatar_upload()
{
    Storage::fake('s3');

    $this->actingAs($user)
        ->post('/avatar', ['avatar' => UploadedFile::fake()->image('photo.jpg')])
        ->assertOk();

    Storage::disk('s3')->assertExists('avatars/photo.jpg');
}
```

# Related Topics

- **Prerequisites**: Service container, Facade system, Test double taxonomy
- **Related**: HTTP Client faking, Mail/notification testing, Queue/job testing, Storage fake testing
- **Advanced**: Custom fake development, Fake vs mock decision matrix, Partial faking patterns

# AI Agent Notes

- The default choice for testing Laravel-native services is `::fake()`. Only reach for mocks when there's no built-in fake.
- Always call `::fake()` before the code under test. If the service was already resolved from the container, the fake won't take effect.
- Every `::fake()` call should be paired with at least one assertion. A fake without assertion is a test that passes by doing nothing.

# Verification

- [ ] All Laravel-native service interactions use `::fake()` instead of mocks
- [ ] `::fake()` is called before the code under test (early in test or `setUp()`)
- [ ] Every faked service has at least one corresponding assertion
- [ ] Assertion callbacks verify service data (recipients, content, context)
- [ ] All external services are faked in integration tests
- [ ] Error paths are simulated through fakes (error responses, exceptions)
- [ ] `Storage::fake()` disk name matches the code under test
- [ ] Fakes are scoped properly (auto-restored between tests)
