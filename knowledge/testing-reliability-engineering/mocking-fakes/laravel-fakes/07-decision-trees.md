# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking, Fakes & Test Doubles
**Knowledge Unit:** Laravel Fakes
**Generated:** 2026-06-03

---

# Decision Inventory

1. Fake vs Mock selection
2. Selective faking vs fake all services
3. Assertion granularity: class-only vs callback verification

---

# Architecture-Level Decision Trees

---

## Decision Name: Fake vs Mock Selection

---

## Decision Context

Choose whether to use a Laravel built-in fake or a Mockery mock for a given service.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Service has a built-in Laravel fake (Bus, Event, Http, Mail, Notification, Queue, Storage)?
↓
YES → Use `::fake()` — always preferred (less brittle, less setup)
NO → Service is a custom interface or third-party SDK?
↓
YES → Use Mockery mock or create a custom fake class

↓
Need to simulate error responses from the service?
↓
Both fakes and mocks support this — use fake if available (realistic in-memory impl)
Use mock if fake doesn't support error simulation

---

## Rationale

Built-in fakes are realistic in-memory implementations with assertion methods designed for each service. Mocks test implementation details and are more brittle.

---

## Recommended Default

**Default:** `::fake()` for all Laravel-native services; mocks only for custom interfaces
**Reason:** Fakes require less setup, are less brittle, and test behavior rather than implementation.

---

## Risks Of Wrong Choice

Mocking Laravel-native services creates brittle tests with more setup code. Skipping fakes risks real side effects.

---

## Related Rules

Rule 1: Prefer `::fake()` over Mockery mocks for all Laravel-native services

---

## Related Skills

Use Laravel's Built-in Fakes for Testing

---

## Decision Name: Selective Faking vs Fake All Services

---

## Decision Context

Choose whether to fake all external services or only specific ones in a test.

---

## Decision Criteria

* architectural

---

## Decision Tree

Test is a feature/integration test covering multiple services?
↓
YES → Fake all external services as safety net (`Mail::fake(); Http::fake(); Queue::fake(); etc.`)
NO → Test focuses on a single service interaction?
↓
YES → Fake only that specific service (keeps test focused)
NO → Use specific faking for the services under test

---

## Rationale

A single unfaked service call during testing can send real emails, make real HTTP calls, or write to real storage. Faking all by default provides a safety net.

---

## Recommended Default

**Default:** Fake all external services in feature tests; fake selectively in focused tests
**Reason:** Prevents accidental real service calls while keeping tests focused.

---

## Risks Of Wrong Choice

Not faking all services risks accidental real HTTP calls or emails during testing. Over-faking in focused tests reduces coverage of real service integration.

---

## Related Rules

Rule 5: Fake all external services in feature tests

---

## Related Skills

Use Laravel's Built-in Fakes for Testing

---

## Decision Name: Assertion Granularity: Class-Only vs Callback Verification

---

## Decision Context

Choose how precisely to verify fake service interactions.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Need to verify the service data payload (recipient, content, parameters)?
↓
YES → Use callback assertion: `Mail::assertSent(fn ($mail) => $mail->hasTo($user->email))`
NO → Asserting only the class/type is sufficient (e.g., event type check)?

↓
YES → Use class-only assertion: `Mail::assertSent(WelcomeMail::class)`
NO → Use callback assertion for data verification

---

## Rationale

Asserting only the class tells you the service was called, but not with the correct data. The mail may go to the wrong recipient or have wrong content.

---

## Recommended Default

**Default:** Use callback assertions for data verification
**Reason:** Ensures the service was called with the correct payload, not just at all.

---

## Risks Of Wrong Choice

Class-only assertions pass even when mail goes to wrong recipient or job has wrong parameters.

---

## Related Rules

Rule 4: Use assertion callbacks for data verification

---

## Related Skills

Use Laravel's Built-in Fakes for Testing
