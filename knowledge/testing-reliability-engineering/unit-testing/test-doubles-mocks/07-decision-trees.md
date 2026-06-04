# Decision Trees — Test Doubles & Mocks

## Decision Tree 1: Which Double Type to Use

```
What is the role of this dependency in the test?
│
├── Is the dependency never used, but required by constructor?
│   └── DUMMY — fill the parameter, ignore it
│       `new NullLogger()` or `$this->createStub(LoggerInterface::class)`
│
├── Does the dependency return data that controls the test flow?
│   └── STUB — configure return values, ignore call count
│       `$repo->method('find')->willReturn($user)`
│       Only the return value matters
│
├── Does the test need post-hoc verification of interactions?
│   └── SPY — verify after the action
│       `$spy->shouldHaveReceived('send')->once()->with($user->email)`
│       Least brittle interaction verification
│
├── Does the test require pre-configured call expectations?
│   └── MOCK — expect before the action
│       `$mock->expects($this->once())->method('charge')->with(100)`
│       Most brittle — use only for critical orchestration
│
└── Is a working in-memory implementation available?
    └── FAKE — use Laravel's built-in fake
        `Http::fake()`, `Mail::fake()`, `Queue::fake()`, `Storage::fake()`
        Most preferred — balances realism with simplicity
```

## Decision Tree 2: Laravel Fake vs Mockery Mock

```
Is this a Laravel framework service?
│
├── YES — Use Laravel's built-in Fake (always preferred)
│   ├── HTTP calls → `Http::fake(['*' => Http::response(...)])`
│   ├── Mail sending → `Mail::fake()` + `Mail::assertSent(MailClass::class)`
│   ├── Queue dispatching → `Queue::fake()` + `Queue::assertPushed(Job::class)`
│   ├── Notifications → `Notification::fake()` + `Notification::assertSentTo(...)`
│   ├── Storage → `Storage::fake('s3')` + `Storage::assertExists('file.txt')`
│   ├── Events → `Event::fake()` + `Event::assertDispatched(Event::class)`
│   └── Bus → `Bus::fake()` + `Bus::assertDispatched(Command::class)`
│
├── NO — It's a custom application service
│   ├── Does it have an interface? → Mock the interface
│   │   `$this->createMock(App\Contracts\PaymentGateway::class)`
│   └── Does it need complex argument matching? → Use Mockery
│       `Mockery::mock(PaymentGateway::class)`
│       `->shouldReceive('charge')->with(Mockery::on(fn($amt) => $amt > 0))`
│
└── NO — It's a third-party SDK
    └── Create your own interface + Fake, don't mock SDK directly
        `interface PaymentGateway` → `FakePaymentGateway implements PaymentGateway`
```

## Decision Tree 3: Visible vs Hidden Mock Setup

```
Where should mock configuration live?
│
├── Is the mock configuration unique to this test method?
│   └── → Configure it inside the test method
│       Reader sees all expectations in one place
│       Changes don't affect other tests
│
├── Is the mock configuration identical across ALL tests in the class?
│   └── → setUp() is acceptable, but prefer inline for clarity
│       Consider if the mock is truly needed for every test
│       If yes, document in setUp() with clear comments
│
└── Is the mock configuration shared but slightly different per test?
    └── → Always inline — shared setup with variations causes confusion
        Each test should be self-contained and readable
```
