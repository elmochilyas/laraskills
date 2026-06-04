# Decision Trees — Test Double Taxonomy

## Decision Tree 1: Which Test Double to Use

```
What type of dependency interaction needs to be verified?
│
├── Is the dependency never used in the test, but required by constructor?
│   └── YES → DUMMY
│       `new NullLogger()` to fill constructor parameter
│       Minimal setup, no assertions on the dummy
│
├── Does the dependency return data that controls test behavior?
│   └── YES → STUB
│       `$repo->method('find')->willReturn($user)`
│       Only the return value matters, not how many times called
│
├── Does the test need to verify the dependency was called after the action?
│   └── YES → SPY
│       `$mailer->shouldHaveReceived('send')->once()`
│       Post-hoc verification — least brittle interaction checking
│
├── Does the test require precise pre-configured call expectations?
│   └── YES → MOCK
│       `$mock->shouldReceive('charge')->once()->with(100)`
│       Most brittle — use only for critical orchestration logic
│
└── Is a lightweight in-memory implementation cleaner than per-test stubs?
    └── YES → FAKE
        Laravel fakes: `Http::fake()`, `Mail::fake()`, `Queue::fake()`
        Most preferred — balances realism with simplicity
```

## Decision Tree 2: Fake vs Mock for Laravel Services

```
Is there a Laravel-native fake available for this service?
│
├── YES → Use the Laravel Fake (always preferred over mocks)
│   ├── HTTP → `Http::fake([...])` + `Http::assertSent(...)`
│   ├── Mail → `Mail::fake()` + `Mail::assertSent(...)`
│   ├── Queue → `Queue::fake()` + `Queue::assertPushed(...)`
│   ├── Storage → `Storage::fake('s3')` + `Storage::assertExists(...)`
│   ├── Notification → `Notification::fake()` + `Notification::assertSentTo(...)`
│   ├── Event → `Event::fake()` + `Event::assertDispatched(...)`
│   └── Bus → `Bus::fake()` + `Bus::assertDispatched(...)`
│
├── NO, but the service uses a custom interface I own
│   └── Create a custom Fake class implementing the interface
│       More maintainable than per-test Mockery expectations
│
└── NO, and the interface is third-party (Stripe, Twilio)
    └── Create an application-level interface + Fake
        `interface PaymentGateway` → `FakePaymentGateway`
        Don't mock Stripe SDK directly — mock your own abstraction
```

## Decision Tree 3: Interaction Verification vs State Verification

```
Should the test verify interactions or state?
│
├── Can the test observe the outcome of the behavior?
│   └── YES → Prefer STATE VERIFICATION
│       Example: Test that file was written → check file contents
│       `expect(File::get('report.txt'))->toContain('Total: $100')`
│       More robust — doesn't care HOW the file was written
│
└── Is the only observable effect the interaction itself?
    └── YES → Use INTERACTION VERIFICATION (spy/mock)
        Example: Dispatching a job, sending an email
        `Bus::assertDispatched(SendInvoiceJob::class)`
        Use spy (post-hoc) over mock (pre-configured) when possible
```
