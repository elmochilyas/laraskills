# Decision Trees — Dependency Injection Testing (Null Driver Pattern)

## Decision Tree 1: Constructor Injection vs Facade

```
How should external services be consumed?
│
├── Is the class being designed for unit testability?
│   └── YES → Use constructor injection
│       ```php
│       class OrderService {
│           public function __construct(
│               private Mailer $mailer,
│               private PaymentGateway $gateway
│           ) {}
│       }
│       ```
│       Benefit: swap implementations per test without container booting
│
├── Is the class only tested via feature tests (full framework boot)?
│   └── OK to use facades, but prefer injection for consistency
│       `Mail::send(...)`, `Queue::push(...)` — require container
│       Test with: `Mail::fake()`, `Queue::fake()`
│
└── Is the class a Laravel controller or route handler?
    └── Use constructor injection (Laravel auto-resolves)
        Laravel resolves controller dependencies from the container
        Test with feature tests, mock dependencies via `$this->instance()`
```

## Decision Tree 2: Null Driver vs Fake for a Specific Test

```
How should this external service be handled in this test?
│
├── Is the service itself being tested (behavioral verification)?
│   └── YES → Use Fake with assertion capability
│       ``Mail::fake()` + `Mail::assertSent(WelcomeMail::class)``
│       Null driver silently drops — can't verify calls
│
├── Is the service being used but NOT the focus of this test?
│   └── YES → Use Null Driver (configured in `.env.testing`)
│       No per-test setup needed
│       `MAIL_MAILER=log` → real emails never sent
│       But also no verification — that's fine, it's not the focus
│
└── Is this a third-party SDK without Laravel-native fakes?
    └── Create custom Null implementation
        1. Create `NullPaymentGateway implements PaymentGatewayInterface`
        2. Bind in `TestingServiceProvider`
        3. For tests that verify payment → `$this->mock(PaymentGatewayInterface::class)`
```

## Decision Tree 3: Where to Configure Null Drivers

```
Where should each null driver configuration live?
│
├── Standard Laravel service (mail, queue, cache, session)?
│   └── → `.env.testing` environment file
│       MAIL_MAILER=log, QUEUE_CONNECTION=sync, CACHE_STORE=array
│       SESSION_DRIVER=array, BROADCAST_DRIVER=log
│
├── Third-party SDK (Stripe, Twilio, AWS)?
│   └── → TestingServiceProvider + Null implementation
│       ```php
│       class TestingServiceProvider extends ServiceProvider {
│           public function register(): void {
│               if ($this->app->environment('testing')) {
│                   $this->app->bind(StripeClient::class, NullStripeClient::class);
│               }
│           }
│       }
│       ```
│
└── Per-test override needed?
    └── → Inline in test method
        `$this->instance(PaymentGateway::class, $fakeGateway);`
        Or `Storage::fake('s3')` / `Http::fake()`
```
