# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Null Driver Pattern

---

### Rule 1: Default null, override per-test with fakes

| Field | Value |
|-------|-------|
| **Name** | Null drivers by default, fakes per test |
| **Category** | Configuration |
| **Rule** | Configure null/log/sync drivers for all external services in `.env.testing`. Override with `Mail::fake()`, `Queue::fake()`, etc. only in tests that verify that specific service. |
| **Reason** | Null drivers prevent accidental real service calls across the entire test suite. Per-test fakes add interaction verification only where needed. This provides safety by default with targeted assertion capability. |
| **Bad Example** | No null drivers configured — any test can accidentally send real emails. |
| **Good Example** | `.env.testing` sets `MAIL_MAILER=log`. Mail tests use `Mail::fake()` for assertions. Non-mail tests use null driver safely. |
| **Exceptions** | None. This is the standard testing configuration. |
| **Consequences Of Violation** | Accidental real service calls during testing. Emails sent to real recipients, API calls hitting production endpoints. |

---

### Rule 2: Do not use null drivers for services under behavioral test

| Field | Value |
|-------|-------|
| **Name** | Fakes for behavioral verification, not null drivers |
| **Category** | Test Isolation |
| **Rule** | When testing code that sends mail, dispatches jobs, or makes HTTP calls, use `Mail::fake()`, `Queue::fake()`, or `Http::fake()`. Do not rely on null drivers for behavioral verification. |
| **Reason** | Null drivers silently drop operations without recording them. They provide safety but no assertion capability. Fakes provide both safety and assertions like `assertSent()` `assertPushed()`. |
| **Bad Example** | Testing mail with `MAIL_MAILER=log` — no way to assert that the mail was sent with correct arguments. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);`. |
| **Exceptions** | Tests where the only goal is to prevent real side effects. |
| **Consequences Of Violation** | Cannot verify that services were called correctly. Mail sending could be completely broken and tests still pass. |

---

### Rule 3: Create custom null drivers for third-party SDKs without Laravel-native fakes

| Field | Value |
|-------|-------|
| **Name** | Custom null drivers for third-party SDKs |
| **Category** | Custom Drivers |
| **Rule** | For third-party SDKs (Stripe, Twilio, AWS) that don't have built-in null drivers, create custom null implementations that implement the same interface. Bind them in `TestingServiceProvider`. |
| **Reason** | Without null drivers, tests that touch third-party SDKs make real API calls. This slows tests, depends on external service availability, and may incur costs. Custom null implementations prevent this. |
| **Bad Example** | `StripeClient` used directly in code with no null alternative — tests call real Stripe API. |
| **Good Example** | `NullStripeClient implements StripeClientInterface` with no-op methods. Bound in `TestingServiceProvider` when `APP_ENV=testing`. |
| **Exceptions** | Integration test suite that deliberately tests real third-party integration. |
| **Consequences Of Violation** | Tests make real third-party API calls. Slow, brittle tests that depend on network access and may incur costs. |

---

### Rule 4: Use `TestingServiceProvider` to bind all null implementations in one place

| Field | Value |
|-------|-------|
| **Name** | Centralize null bindings |
| **Category** | Configuration |
| **Rule** | Create `App\Providers\TestingServiceProvider` that binds all null implementations. Guard registration with `$this->app->environment('testing')`. |
| **Reason** | Scattered null bindings across the codebase are hard to maintain. A single provider provides a clear inventory of which services are nullified in testing. |
| **Bad Example** | Null bindings scattered across `EventServiceProvider`, `RouteServiceProvider`, and individual test files. |
| **Good Example** | Single `TestingServiceProvider::register()` method with all null bindings. |
| **Exceptions** | Per-test overrides that are not suitable for global nullification. |
| **Consequences Of Violation** | Inconsistent null driver coverage. Some services are nullified, others are not. |

---

### Rule 5: Document known behavioral differences between null and real drivers

| Field | Value |
|-------|-------|
| **Name** | Document null driver behavior gaps |
| **Category** | Documentation |
| **Rule** | Document the behavioral differences between null drivers and their real counterparts. For example: null cache never evicts, array cache never evicts, Redis evicts by policy. |
| **Reason** | Tests using null drivers may pass while the same code fails in production with real drivers. Developers need to know the gaps to avoid false confidence. |
| **Bad Example** | No documentation — developer assumes null cache behaves like Redis. |
| **Good Example** | Comment in config: "// array driver never evicts — test with Redis in CI for cache eviction behavior." |
| **Exceptions** | None. Documentation is essential for safe null driver usage. |
| **Consequences Of Violation** | Tests pass with null drivers but code fails in production. False confidence in test coverage. |
