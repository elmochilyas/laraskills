# Decision Trees — Null Driver Pattern

## Decision Tree 1: Null Driver vs Fake vs Real Implementation

```
How should an external service be configured in tests?
│
├── Is the service itself being tested (behavioral verification)?
│   └── YES → Use Fake with assertion capability
│       Example: Testing mail sending → use `Mail::fake()` + `Mail::assertSent()`
│       Null drivers can't verify calls — they silently drop everything
│
├── Is the service NOT being tested but needs to be silenced?
│   └── YES → Use Null Driver
│       ├── Laravel-native service (mail, queue, cache, session) → Configure in `.env.testing`
│       │   MAIL_MAILER=log, QUEUE_CONNECTION=sync, CACHE_STORE=array
│       └── Third-party SDK (Stripe, Twilio) → Custom null implementation
│           NullStripeClient implements StripeClientInterface
│           Bind in TestingServiceProvider
│
└── Is real behavior critical for this test (integration test)?
    └── YES → Use Real Implementation
        Limited to integration test suite
        Example: Testing actual Redis cache behavior
```

## Decision Tree 2: Where to Configure the Null Driver

```
Where should the null driver configuration live?
│
├── Is it a standard Laravel service (mail, queue, cache)?
│   └── → `.env.testing` configuration
│       MAIL_MAILER=log, QUEUE_CONNECTION=sync, CACHE_STORE=array
│       One-liner environment overrides — no code changes needed
│
├── Is it a third-party SDK?
│   └── → TestingServiceProvider + Null implementation class
│       1. Create NullStripeClient implementing StripeClientInterface
│       2. Bind in TestingServiceProvider::register():
│          `$this->app->bind(StripeClientInterface::class, NullStripeClient::class);`
│       3. Guard with environment check
│
└── Is it a per-test override?
    └── → Inline in test method
        `Storage::fake('s3')`, `Http::fake()`, `Mail::fake()`
        Replaces null driver only for the scope of this test
```

## Decision Tree 3: Null Driver Documentation Requirements

```
What needs to be documented about this null driver?
│
├── Does the null driver behave differently from the real driver?
│   └── YES → Document behavioral differences
│       Example: "array cache never evicts — test with Redis in CI for eviction behavior"
│       Without docs: tests pass but production fails
│
├── Could this null driver mask security-critical behavior?
│   └── YES → Document security implications
│       Example: Null audit logger → ensure audit-specific tests use real/spy
│
└── Is it a custom null driver for a third-party SDK?
    └── YES → Document in class docblock
        What methods return, what side effects are silenced
```
