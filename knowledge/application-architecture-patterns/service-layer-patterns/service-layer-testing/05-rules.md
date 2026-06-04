## Mock The Boundaries, Not The Internals
---
## Testing
---
## Rule
Mock only the boundaries of the service under test — repositories, mailers, external APIs, and event dispatchers. Do not mock value objects, request data, or domain models.
---
## Reason
Mocking the boundaries isolates the service logic while keeping value objects and simple data as real objects. Over-mocking creates brittle tests that break on refactoring.
---
## Bad Example
```php
class UserServiceTest extends TestCase
{
    public function test_registers_user(): void
    {
        $mailer = $this->createMock(Mailer::class);
        $cache = $this->createMock(Cache::class);
        $logger = $this->createMock(Logger::class);
        $validator = $this->createMock(Validator::class);
        $data = $this->createMock(RegisterUserData::class); // Mocking value object — unnecessary

        $service = new UserService($mailer, $cache, $logger, $validator);

        $data->method('toArray')->willReturn(['name' => 'John']); // Too much mocking
        $result = $service->register($data);
    }
}
```
---
## Good Example
```php
class UserServiceTest extends TestCase
{
    public function test_registers_user(): void
    {
        $users = $this->createMock(UserRepository::class); // Boundary mock
        $mailer = $this->createMock(Mailer::class);        // Boundary mock

        $users->expects($this->once())
            ->method('create')
            ->willReturn(new User(['id' => 1]));

        $service = new UserService($users, $mailer);
        $data = new RegisterUserData('John', 'john@example.com'); // Real value object

        $result = $service->register($data);
        $this->assertInstanceOf(User::class, $result);
    }
}
```
---
## Exceptions
External services with expensive or unreliable side effects that must be mocked (payment gateways, SMS providers).
---
## Consequences Of Violation
Brittle tests that break on implementation changes, over-mocking hides real bugs, tests don't verify real behavior.

## Test Outcomes, Not Call Sequences
---
## Testing
---
## Rule
Test the outcomes and side effects of service methods, not the specific sequence of method calls. Assert on return values and observable state, not mock call order.
---
## Reason
Testing call sequences couples tests to implementation details. Refactoring the internal implementation breaks tests even when the behavior is correct.
---
## Bad Example
```php
class CheckoutServiceTest extends TestCase
{
    public function test_creates_order(): void
    {
        $orderRepo = $this->createMock(OrderRepository::class);
        $gateway = $this->createMock(PaymentGateway::class);
        $mailer = $this->createMock(Mailer::class);

        $service = new CheckoutService($orderRepo, $gateway, $mailer);

        // Testing call sequence — brittle!
        $orderRepo->expects($this->once())->method('create')->with($this->anything());
        $gateway->expects($this->once())->method('charge')->with($this->anything());
        $mailer->expects($this->once())->method('send')->with($this->anything());
        // If implementation changes order, test breaks
    }
}
```
---
## Good Example
```php
class CheckoutServiceTest extends TestCase
{
    public function test_creates_order(): void
    {
        $orderRepo = $this->createMock(OrderRepository::class);
        $gateway = $this->createMock(PaymentGateway::class);
        $mailer = $this->createMock(Mailer::class);

        $orderRepo->method('create')->willReturn(new Order(['id' => 1]));
        $gateway->method('charge')->willReturn(new PaymentResult(success: true));

        $service = new CheckoutService($orderRepo, $gateway, $mailer);
        $result = $service->checkout($this->getValidData());

        // Test outcomes, not call sequences
        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals(1, $result->id);
    }
}
```
---
## Exceptions
Interaction testing for side effects where the call itself is the behavior (e.g., verifying an email was sent to the correct address).
---
## Consequences Of Violation
Brittle tests that break on refactoring, false negatives, reduced confidence in the test suite.

## Use In-Memory Implementations For Contract Tests
---
## Testing
---
## Rule
Use in-memory implementations of interfaces (repositories, gateways) for contract tests that validate interaction patterns, especially for complex query logic.
---
## Reason
In-memory implementations are faster than mocks for testing complex logic and more reliable than mocked expectations. They validate that the service correctly uses the interface contract.
---
## Bad Example
```php
class InvoiceRepositoryTest extends TestCase
{
    public function test_finds_overdue(): void
    {
        $repo = $this->createMock(InvoiceRepository::class);

        // Mock returns what we tell it — doesn't test real query logic
        $repo->method('findOverdue')->willReturn(collect([
            new Invoice(['id' => 1, 'due_date' => now()->subDays(10)]),
        ]));
        // Test passes even if real query has wrong WHERE clause
    }
}
```
---
## Good Example
```php
// In-memory implementation for contract tests
class InMemoryInvoiceRepository implements InvoiceRepository
{
    private array $invoices = [];

    public function add(Invoice $invoice): void { $this->invoices[] = $invoice; }

    public function findOverdue(int $days): Collection
    {
        return collect($this->invoices)->filter(
            fn(Invoice $i) => $i->status === 'pending'
                && $i->due_date->lt(now()->subDays($days))
        );
    }
}

class InvoiceServiceTest extends TestCase
{
    public function test_processes_overdue(): void
    {
        $repo = new InMemoryInvoiceRepository();
        $repo->add(new Invoice(['status' => 'pending', 'due_date' => now()->subDays(40)]));
        $repo->add(new Invoice(['status' => 'paid', 'due_date' => now()->subDays(40)]));

        $service = new InvoiceService($repo);
        $result = $service->processOverdue(30);

        // Tests real query behavior with in-memory data
        $this->assertCount(1, $result);
    }
}
```
---
## Exceptions
Simple pass-through methods where mocks are more concise than building an in-memory implementation.
---
## Consequences Of Violation
Mock-based tests don't validate real query logic, false confidence in test coverage, integration bugs in production.

## Add Integration Tests For Repositories
---
## Testing
---
## Rule
Write integration tests for every repository method against a real database. Mocked repositories can produce incorrect results that pass tests.
---
## Reason
A mocked repository returns what you tell it to return, not what the database would actually return. Integration tests verify SQL correctness, indexing, and data integrity.
---
## Bad Example
```php
class InvoiceServiceTest extends TestCase
{
    public function test_finds_overdue(): void
    {
        $repo = $this->createMock(InvoiceRepository::class);
        $repo->method('findOverdue')->willReturn(collect([new Invoice()]));

        $service = new InvoiceService($repo);
        $result = $service->processOverdue(30);

        // Passes — but if findOverdue has buggy SQL, we never know
    }
}
```
---
## Good Example
```php
class InvoiceRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_finds_overdue_invoices(): void
    {
        Invoice::factory()->create(['status' => 'pending', 'due_date' => now()->subDays(40)]);
        Invoice::factory()->create(['status' => 'pending', 'due_date' => now()->subDays(10)]);
        Invoice::factory()->create(['status' => 'paid', 'due_date' => now()->subDays(40)]);

        $repo = app(InvoiceRepository::class);
        $result = $repo->findOverdue(30);

        $this->assertCount(1, $result);
    }
}
```
---
## Exceptions
Read-only query objects that return arrays (integration test still recommended but with lighter setup).
---
## Consequences Of Violation
Untested SQL logic, bugs discovered in production, false confidence from passing tests.

## Avoid Over-Mocking
---
## Testing
---
## Rule
Do not mock dependencies that are value objects, simple data containers, or domain models. Mock only external boundaries that have side effects or alternative implementations.
---
## Reason
Over-mocking creates tests that verify mock configurations rather than real behavior. Each mock increases test complexity and reduces confidence in the test.
---
## Bad Example
```php
class UserServiceTest extends TestCase
{
    public function test_updates_profile(): void
    {
        $repo = $this->createMock(UserRepository::class);
        $mailer = $this->createMock(Mailer::class);
        $eventDispatcher = $this->createMock(EventDispatcher::class);
        $user = $this->createMock(User::class); // Mocking domain model
        $data = $this->createMock(ProfileData::class); // Mocking value object

        $data->method('toArray')->willReturn(['name' => 'John']);
        $user->method('save')->willReturn(true); // Mocking model behavior

        $service = new UserService($repo, $mailer, $eventDispatcher);
        $service->updateProfile($user, $data);
    }
}
```
---
## Good Example
```php
class UserServiceTest extends TestCase
{
    public function test_updates_profile(): void
    {
        $mailer = $this->createMock(Mailer::class); // Only boundaries
        $eventDispatcher = $this->createMock(EventDispatcher::class);

        $user = new User(['id' => 1, 'name' => 'Old']); // Real model
        $data = new ProfileData('John'); // Real value object

        $service = new UserService($mailer, $eventDispatcher);
        $service->updateProfile($user, $data);

        $this->assertEquals('John', $user->name); // Test real behavior
    }
}
```
---
## Exceptions
Models with expensive side effects (e.g., email notifications triggered by model events).
---
## Consequences Of Violation
Brittle tests, false confidence, excessive setup code, tests that break on innocent refactoring.

## Prioritize Unit Tests For Coverage, Feature Tests For Critical Paths
---
## Testing
---
## Rule
Write the majority of tests as unit tests (fast, focused on services/actions). Reserve feature tests (slow, full-stack) for critical business journeys.
---
## Reason
Unit tests run in milliseconds and provide fast feedback. Feature tests take hundreds of milliseconds each. Prioritizing unit tests gives higher coverage with faster execution.
---
## Bad Example
```php
// Testing every service method through feature tests — slow
class RegistrationFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John',
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }

    public function test_register_validates_email(): void { /* Feature test */ }
    public function test_register_sends_email(): void { /* Feature test */ }
    public function test_register_assigns_role(): void { /* Feature test */ }
    // 20 feature tests for one feature — 10+ seconds per run
}
```
---
## Good Example
```php
// Unit test the service — fast
class RegistrationServiceTest extends TestCase
{
    public function test_registers_user(): void
    {
        // Unit test with mocked dependencies — milliseconds
    }

    public function test_sends_welcome_email(): void { /* Unit test */ }
    public function test_assigns_default_role(): void { /* Unit test */ }
    // 18 unit tests + 2 feature tests for critical paths
}

// Feature test only for the full journey
class RegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        // One feature test for the critical path — acceptable
    }
}
```
---
## Exceptions
Applications where the majority of logic is in database queries (integration tests may dominate).
---
## Consequences Of Violation
Slow test suite, reduced development velocity, tendency to skip tests due to slow execution.
