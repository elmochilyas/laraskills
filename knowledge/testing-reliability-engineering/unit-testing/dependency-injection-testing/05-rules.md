# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Dependency Injection Testing (Null Driver Pattern)

---

### Rule 1: Set null/log/sync drivers for all external services in `.env.testing`

| Field | Value |
|-------|-------|
| **Name** | Nullify external services in testing |
| **Category** | Configuration |
| **Rule** | Configure `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log` in `.env.testing`. |
| **Reason** | Default drivers attempt real external service calls during tests. Sending real emails, queuing to real queues, or using real cache in testing causes unpredictable side effects, depends on service availability, and slows execution. |
| **Bad Example** | `MAIL_MAILER=smtp` — tests send real emails to real recipients. |
| **Good Example** | `MAIL_MAILER=log` — emails written to log, never sent. |
| **Exceptions** | Integration tests in a dedicated suite that deliberately test real service integration. |
| **Consequences Of Violation** | Real emails sent, real API calls made, real cache written during tests. Side effects are unpredictable. |

---

### Rule 2: Override null drivers with fakes (not real drivers) when testing the service

| Field | Value |
|-------|-------|
| **Name** | Use fakes for services under test |
| **Category** | Test Isolation |
| **Rule** | When testing code that uses a service (mail, queue, HTTP), override its null driver with `Mail::fake()`, `Queue::fake()`, or `Http::fake()` in the test. Do not enable the real driver. |
| **Reason** | Null drivers silently drop all operations — they don't record calls for assertions. Fakes provide both safety (no real side effects) and testability (assertions on what was sent). |
| **Bad Example** | Testing mail sending with `MAIL_MAILER=log` but no `Mail::fake()` — can't assert mail was sent. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeEmail::class);`. |
| **Exceptions** | Tests that specifically verify null driver behavior (rare). |
| **Consequences Of Violation** | Cannot verify service interactions. Tests pass even when the mail/queue/HTTP code is broken. |

---

### Rule 3: Use constructor injection instead of facades in application code

| Field | Value |
|-------|-------|
| **Name** | Constructor injection for testability |
| **Category** | Code Design |
| **Rule** | Design classes to receive dependencies via constructor injection. Do not use facades (`Mail::send()`, `Queue::push()`) in classes that will be unit-tested. |
| **Reason** | Constructor injection allows null drivers or fakes to be swapped naturally without service container manipulation. Facades are tightly coupled to the container, making unit testing harder and requiring partial mocking. |
| **Bad Example** | `Mail::send(new WelcomeEmail($user))` inside a service class — requires `Mail::fake()` to intercept. |
| **Good Example** | Constructor: `public function __construct(private Mailer $mailer)`. Usage: `$this->mailer->send(new WelcomeEmail($user))`. |
| **Exceptions** | Feature tests where the full framework stack is booted — facades are acceptable. |
| **Consequences Of Violation** | Classes using facades cannot be unit-tested without container booting. Tests are slower and more complex. |

---

### Rule 4: Create a `TestingServiceProvider` for custom null driver bindings

| Field | Value |
|-------|-------|
| **Name** | Centralize custom null driver bindings |
| **Category** | Configuration |
| **Rule** | Create `App\Providers\TestingServiceProvider` that binds null implementations for third-party SDKs. Register it only when `APP_ENV=testing`. |
| **Reason** | Third-party SDKs (Stripe, Twilio, AWS) don't have built-in null drivers. Scattering null bindings across tests creates duplication and makes it easy to forget one. A single provider centralizes all custom null bindings. |
| **Bad Example** | Each test file manually mocks Stripe: `$this->mock(StripeClient::class)` — inconsistent and duplicated. |
| **Good Example** | `TestingServiceProvider::register()` binds `StripeClientInterface::class` to `NullStripeClient::class` if `$this->app->environment('testing')`. |
| **Exceptions** | Services that need per-test customization (use `$this->instance()` or `->fake()` in the test). |
| **Consequences Of Violation** | Inconsistent null driver coverage. Some tests may accidentally call real third-party APIs. |

---

### Rule 5: Have a separate integration test suite for critical services

| Field | Value |
|-------|-------|
| **Name** | Test real integration separately |
| **Category** | Strategy |
| **Rule** | Maintain a separate integration test suite that runs against real sandbox environments for critical services (payment gateway, authentication provider). |
| **Reason** | Null drivers mask real integration problems. A Stripe API change, a Twilio SDK update, or a misconfigured credential won't be caught by null driver tests. Integration tests provide the safety net. |
| **Bad Example** | All Stripe interactions are nullified — a Stripe API change breaks production silently. |
| **Good Example** | Weekly scheduled CI job runs the "integration" test suite against real sandbox environments. |
| **Exceptions** | Projects with no external service dependencies. |
| **Consequences Of Violation** | External service API changes break production without warning. The team only discovers failures after deployment. |
