# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service layer testing strategies
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Service layer testing strategies depend on which service pattern is used. Services (multi-method) require integration tests with mocked dependencies for isolation. Actions (single-method) are easily unit-testable with constructor-injected mocks. Use cases (Clean Architecture) are unit-testable without Laravel bootstrap. The rule: test the service/action/use case as the unit, mock its external dependencies, and verify the orchestration logic.

---

# Core Concepts

**Testing Service classes:** Inject mocked repositories and services. Test each method's orchestration logic. Verify that the correct methods are called with correct arguments.

**Testing Action classes:** Inject mocked repositories. Test the single `execute()` or `handle()` method. Verify the complete operation.

**Testing Use Case classes:** Inject mocked port interfaces. Test the `execute()` method with input DTOs. Verify output DTOs and side effects (events dispatched, repositories called).

---

# Mental Models

**The "Mock the Boundaries" model:** Mock anything the service depends on (repositories, other services, mailers). Test only the service's orchestration logic—the "glue" between dependencies.

**The "Integration at Boundaries" model:** Test the service with real dependencies at the integration level (real database, real mail driver) only for critical paths. Unit tests with mocks cover most cases.

**The "Command/Query Separation" model:** Test commands (write operations) by their side effects: did the database get updated? Was the event dispatched? Test queries (read operations) by their return values.

---

# Internal Mechanics

```php
// Service test with mocked dependencies
test('register creates user and sends welcome email', function () {
    $userRepository = Mockery::mock(UserRepository::class);
    $userRepository->shouldReceive('create')->once()->andReturn($user);

    $mailer = Mockery::mock(WelcomeMailer::class);
    $mailer->shouldReceive('sendWelcome')->once()->with($user);

    $service = new UserService($userRepository, $mailer);
    $result = $service->register(['email' => 'test@example.com']);

    expect($result)->toBe($user);
});
```

---

# Patterns

**Repository mock factory:** Create helper methods that return pre-configured mock repositories:
```php
function mockInvoiceRepository(?Invoice $return = null): InvoiceRepository {
    $repo = Mockery::mock(InvoiceRepository::class);
    $repo->shouldReceive('save')->byDefault();
    $repo->shouldReceive('find')->byDefault()->andReturn($return);
    return $repo;
}
```

**In-memory implementation for contracts:** Instead of mocks, create lightweight in-memory implementations:
```php
class InMemoryUserRepository implements UserRepository {
    public array $users = [];
    public function save(User $user): void {
        $this->users[$user->id()->toString()] = $user;
    }
    public function find($id): ?User {
        return $this->users[(string)$id] ?? null;
    }
}
```

**Feature test for critical paths:** A few integration tests that boot the service container and test the full stack:
```php
test('registration flow end-to-end', function () {
    $response = $this->post('/api/register', [
        'email' => 'test@example.com',
        'password' => 'Password123!',
    ]);
    $response->assertStatus(201);
    $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
});
```

---

# Architectural Decisions

**Unit test services with mocked dependencies:** The majority of tests. Fast, isolated, and focused on orchestration logic.

**Integration test repositories/adapters:** Test that the repository actually saves to the database correctly. Few tests per repository.

**Feature test critical controllers:** Test the full stack for critical user journeys. Small number of tests.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Fast, focused tests | Mock setup is verbose | Factory helpers reduce boilerplate |
| Isolated failures | Mocks can be wrong | Mocked behavior doesn't match reality |
| Tests document orchestration logic | Refactoring requires mock updates | Changing dependencies breaks tests |

---

# Performance Considerations

Service unit tests with mocks run in milliseconds. Feature tests with database run in hundreds of milliseconds.

---

# Production Considerations

Test the service layer thoroughly—it's where orchestration bugs live. Integration test each repository method against a real database.

---

# Common Mistakes

**Testing implementation details:** Verifying that specific methods were called in specific order. This couples tests to implementation. Test outcomes, not call sequences.

**Over-mocking:** Mocking every dependency including value objects. Only mock external boundaries (repositories, mailers, APIs).

**No integration tests for repositories:** Relying only on mocked repository tests. The mock says "save works" but the real database interaction may fail.

---

# Failure Modes

**Mock/reality mismatch:** The mock repository returns a value that the real repository never would. Tests pass but production fails.

**Brittle tests due to tight coupling:** Every change to the service constructor requires updating all its tests. This is a signal the service has too many dependencies.

---

# Ecosystem

Pest for testing, Mockery for mocking, `RefreshDatabase` for integration tests. PHPUnit's `createMock()` for simpler mocking needs.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-02 Action classes | MMD-16 Testing strategies |
| SLP-09 Dependency injection | LAP-13 Architecture tests | AEG-01 Architecture testing |

---

## Ecosystem Usage



---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
