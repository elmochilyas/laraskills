# Laravel 13 Internal Microservices — Boundaries, Communication & Event-Driven Architecture

## When to Use

Use this skill when designing internal microservice architectures in Laravel 13. Covers service boundaries, database ownership, inter-service communication strategies (events, gRPC, REST), saga patterns for distributed transactions, service discovery, observability, and deployment strategies. Every microservice must own its domain and database — shared databases are forbidden.

---

## Service Boundaries

### Domain Ownership

Each service owns exactly one domain. Never create "Everything Service."

```text
✓ User Service        — users, profiles, authentication
✓ Billing Service     — payments, invoices, subscriptions
✓ Notification Service — email, SMS, push, in-app
✓ Search Service      — Elasticsearch, Meilisearch, Algolia
✓ Order Service       — orders, carts, checkout
✓ Product Service     — catalog, inventory, pricing

✗ Everything Service  — users, billing, orders, products all in one
```

### Bounded Context Principles

```php
// User Service owns:
// - User model and its database table
// - Authentication logic
// - Profile management
// - Password hashing

// User Service does NOT own:
// - Order history (owned by Order Service)
// - Payment methods (owned by Billing Service)
// - Notifications (owned by Notification Service)
```

### Service Template Structure

```
services/
  user-service/
    app/
      Modules/
        User/
          Actions/
          DTOs/
          Models/
          Controllers/
          Events/
          Grpc/          # gRPC service implementations
          Listeners/
      database/
        migrations/
      routes/
        api.php
        grpc.php
    proto/               # Shared proto files
    tests/
    composer.json
    .rr.yaml             # RoadRunner config for gRPC
    Dockerfile

  billing-service/
    ...
```

---

## Database Ownership Rule

### Forbidden: Direct Database Access Across Services

```php
// FORBIDDEN — Billing Service querying User database directly
class InvoiceService
{
    public function generate(int $userId): void
    {
        // Direct query to another service's database
        $user = DB::connection('user_database')
            ->table('users')
            ->find($userId);

        // ...
    }
}

// FORBIDDEN — Shared database between services
// MariaDB/PostgreSQL database "main" accessed by both UserService and BillingService
```

### Required: Service API Access

```php
// CORRECT — Billing Service calls User Service via API/gRPC
class InvoiceService
{
    public function __construct(
        private readonly UserServiceClient $users, // gRPC client
    ) {}

    public function generate(int $userId): void
    {
        $user = $this->users->findUser($userId);

        // Only work with the data returned by the API
        // Never access the user's database directly
    }
}

// CORRECT — Event-driven integration
class InvoiceService
{
    public function onUserCreated(UserCreated $event): void
    {
        // Only use data from the event payload
        // No database access to user tables
    }
}
```

### Database Ownership Rules

```text
✓ Each service has its own database (or schema)
✓ Services communicate only through APIs/gRPC/Events
✓ A service's database is its private implementation detail
✓ Schema changes in one service never affect another
✓ Data duplication is acceptable (eventual consistency)
```

---

## Communication Strategy Hierarchy

### Preferred Communication Methods

```text
1st Choice:  Events (async, decoupled)
2nd Choice:  gRPC (sync, high-performance)
3rd Choice:  REST (sync, simpler but slower)
Last Choice: Shared database (FORBIDDEN)
```

### Decision Matrix

```php
// EVENT (async) — Use when:
// - The consumer doesn't need an immediate response
// - Multiple consumers need to react
// - Workflow continuation is acceptable later
// - Example: UserRegistered → send email, create profile, log analytics

// gRPC (sync) — Use when:
// - Immediate response required
// - High throughput needed
// - Strong typing important
// - Example: ValidatePayment, GetUserDetails

// REST (sync) — Use when:
// - Non-critical paths
// - External partner integrations
// - Simple CRUD operations
// - Example: Webhook callbacks, health checks
```

---

## Event-Driven Integration

### Defining Events

```php
namespace App\Modules\User\Events;

use App\Modules\User\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $userId,
        public readonly string $name,
        public readonly string $email,
        public readonly array $metadata = [],
    ) {}

    public static function fromUser(User $user): self
    {
        return new self(
            userId: (string) $user->id,
            name: $user->name,
            email: $user->email,
            metadata: [
                'source' => 'registration',
                'ip' => request()->ip(),
            ],
        );
    }
}

class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $orderId,
        public readonly string $userId,
        public readonly int $total,
        public readonly array $items,
    ) {}
}
```

### Publishing Events

```php
class PlaceOrderAction
{
    public function __construct(
        private readonly EventDispatcherInterface $events,
    ) {}

    public function execute(PlaceOrderDTO $dto): Order
    {
        $order = Order::create([...]);

        // Publish event for other services
        $this->events->dispatch(new OrderPlaced(
            orderId: (string) $order->id,
            userId: $dto->userId,
            total: $dto->total,
            items: $dto->items,
        ));

        return $order;
    }
}
```

### Listening Across Services

```php
// In Notification Service
namespace App\Modules\Notification\Listeners;

use App\Modules\User\Events\UserCreated;

class SendWelcomeEmail
{
    public function __construct(
        private readonly MailService $mail,
    ) {}

    public function handle(UserCreated $event): void
    {
        // React to event from User Service
        $this->mail->sendWelcome(
            userId: $event->userId,
            email: $event->email,
            name: $event->name,
        );
    }
}
```

### Event Catalog

```text
┌─────────────────────┬──────────────────────────────────┬───────────────┐
│ Event               │ Trigger                          │ Consumers     │
├─────────────────────┼──────────────────────────────────┼───────────────┤
│ UserCreated         │ User registration                │ Notification  │
│                     │                                  │ Analytics     │
│                     │                                  │ Billing       │
├─────────────────────┼──────────────────────────────────┼───────────────┤
│ OrderPlaced         │ Checkout completed               │ Inventory     │
│                     │                                  │ Notification  │
│                     │                                  │ Analytics     │
│                     │                                  │ Shipping      │
├─────────────────────┼──────────────────────────────────┼───────────────┤
│ OrderPaid           │ Payment confirmed                │ Fulfillment   │
│                     │                                  │ Notification  │
│                     │                                  │ Loyalty       │
├─────────────────────┼──────────────────────────────────┼───────────────┤
│ OrderCancelled      │ Order cancelled by user          │ Inventory     │
│                     │                                  │ Billing       │
│                     │                                  │ Notification  │
├─────────────────────┼──────────────────────────────────┼───────────────┤
│ PaymentFailed       │ Payment declined                 │ Notification  │
│                     │                                  │ Fraud         │
└─────────────────────┴──────────────────────────────────┴───────────────┘
```

---

## Saga Pattern — Distributed Transactions

### The Problem

```text
Order Service               Billing Service           Inventory Service
    │                           │                           │
    ├── Create Order ──────────►│                           │
    │                           ├── Charge Payment ────────►│
    │                           │                           ├── Reserve Item
    │                           │                           │
    │                    ⚠ Payment Fails                    │
    │                           │                           │
    │              ┌────────────┘                           │
    │              ▼                                        │
    │         Item is reserved but                          │
    │         payment failed — INCONSISTENT STATE           │
```

### Solution: Saga Pattern with Compensating Actions

```php
class PlaceOrderSaga
{
    public function __construct(
        private readonly EventDispatcherInterface $events,
        private readonly LoggerInterface $logger,
    ) {}

    public function execute(PlaceOrderDTO $dto): Order
    {
        // Step 1: Create order
        $order = $this->createOrder($dto);

        try {
            // Step 2: Reserve inventory
            $this->reserveInventory($order);
        } catch (\Throwable $e) {
            // Compensate: Cancel order
            $this->cancelOrder($order);
            throw $e;
        }

        try {
            // Step 3: Process payment
            $this->processPayment($order);
        } catch (\Throwable $e) {
            // Compensate: Release inventory + cancel order
            $this->releaseInventory($order);
            $this->cancelOrder($order);
            throw $e;
        }

        // Step 4: Confirm order
        $this->confirmOrder($order);

        return $order;
    }

    private function createOrder(PlaceOrderDTO $dto): Order
    {
        return Order::create([...]);
    }

    private function reserveInventory(Order $order): void
    {
        // Publish event — Inventory Service handles reservation
        $this->events->dispatch(new ReserveInventory(
            orderId: (string) $order->id,
            items: $order->items->toArray(),
        ));
    }

    private function cancelOrder(Order $order): void
    {
        $order->update(['status' => 'cancelled']);
        $this->events->dispatch(new OrderCancelled(
            orderId: (string) $order->id,
            reason: 'saga_compensation',
        ));
    }

    private function releaseInventory(Order $order): void
    {
        $this->events->dispatch(new ReleaseInventory(
            orderId: (string) $order->id,
            items: $order->items->toArray(),
        ));
    }

    private function processPayment(Order $order): void
    {
        $this->events->dispatch(new ProcessPayment(
            orderId: (string) $order->id,
            amount: $order->total,
        ));
    }

    private function confirmOrder(Order $order): void
    {
        $order->update(['status' => 'confirmed']);
        $this->events->dispatch(new OrderConfirmed(
            orderId: (string) $order->id,
        ));
    }
}
```

### Saga Patterns Comparison

```text
┌────────────────────┬──────────────────────────────────┬──────────────────────────────┐
│ Pattern            │ Approach                         │ When to Use                  │
├────────────────────┼──────────────────────────────────┼──────────────────────────────┤
│ Choreography Saga  │ Each service publishes events     │ Simple workflows,            │
│                    │ and listens for compensations     │ few services, low complexity │
├────────────────────┼──────────────────────────────────┼──────────────────────────────┤
│ Orchestration Saga │ Central orchestrator manages     │ Complex workflows,           │
│                    │ steps and compensations           │ many services, high risk     │
└────────────────────┴──────────────────────────────────┴──────────────────────────────┘
```

---

## Service Discovery

### DNS-Based Discovery (Simplest)

```text
user-service.service.consul:9001
billing-service.service.consul:9002
notification-service.service.consul:9003
```

### Configuration-Based Discovery

```php
// config/services.php
return [
    'grpc' => [
        'user_service' => env('USER_SERVICE_ADDRESS', 'user-service:9001'),
        'billing_service' => env('BILLING_SERVICE_ADDRESS', 'billing-service:9002'),
        'notification_service' => env('NOTIFICATION_SERVICE_ADDRESS', 'notification-service:9003'),
    ],
];
```

---

## Observability

### Structured Logging

```php
class GrpcLoggingInterceptor implements \Spiral\RoadRunner\GRPC\InterceptorInterface
{
    public function __construct(
        private readonly \Psr\Log\LoggerInterface $logger,
    ) {}

    public function intercept(
        string $service,
        string $method,
        \Closure $handler,
        ContextInterface $ctx,
        ?string $input,
    ): string {
        $traceId = $ctx->getValue('trace-id') ?? uniqid();

        $this->logger->info('grpc.request.started', [
            'trace_id' => $traceId,
            'service' => $service,
            'method' => $method,
        ]);

        try {
            $result = $handler->handle($service, $method, $ctx, $input);

            $this->logger->info('grpc.request.completed', [
                'trace_id' => $traceId,
                'service' => $service,
                'method' => $method,
            ]);

            return $result;
        } catch (\Throwable $e) {
            $this->logger->error('grpc.request.failed', [
                'trace_id' => $traceId,
                'service' => $service,
                'method' => $method,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
```

### Distributed Tracing

```php
// Propagate trace context across services
class TraceInterceptor implements \Spiral\RoadRunner\GRPC\InterceptorInterface
{
    public function intercept(
        string $service,
        string $method,
        \Closure $handler,
        ContextInterface $ctx,
        ?string $input,
    ): string {
        $traceId = $ctx->getValue('trace-id') ?? $this->generateTraceId();

        // Attach to logger context
        Log::withContext(['trace_id' => $traceId]);

        return $handler->handle($service, $method, $ctx, $input);
    }
}
```

---

## Health Checks

```php
namespace App\Grpc\Services;

use App\Grpc\Health\V1\HealthServiceInterface;
use App\Grpc\Health\V1\HealthCheckRequest;
use App\Grpc\Health\V1\HealthCheckResponse;
use Spiral\RoadRunner\GRPC\ContextInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

final class HealthService implements HealthServiceInterface
{
    public function Check(ContextInterface $ctx, HealthCheckRequest $in): HealthCheckResponse
    {
        $response = new HealthCheckResponse();

        try {
            // Check database connectivity
            DB::connection()->getPdo()->query('SELECT 1');

            // Check cache connectivity
            Cache::store()->get('health-check');

            $response->setStatus(HealthCheckResponse\ServingStatus::SERVING);
        } catch (\Throwable $e) {
            $response->setStatus(HealthCheckResponse\ServingStatus::NOT_SERVING);
        }

        return $response;
    }
}
```

---

## Deployment & CI/CD

### Docker Compose (Local Dev)

```yaml
# docker-compose.yml
version: '3.8'

services:
  user-service:
    build: ./services/user-service
    ports:
      - "9001:9001"
    environment:
      - APP_ENV=local
      - DB_DATABASE=user_db
    depends_on:
      - user-db
      - rabbitmq

  billing-service:
    build: ./services/billing-service
    ports:
      - "9002:9002"
    environment:
      - APP_ENV=local
      - DB_DATABASE=billing_db
    depends_on:
      - billing-db
      - rabbitmq

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  user-db:
    image: postgres:16
    environment:
      - POSTGRES_DB=user_db
    ports:
      - "5432:5432"

  billing-db:
    image: postgres:16
    environment:
      - POSTGRES_DB=billing_db
    ports:
      - "5433:5432"
```

---

## Microservices Enterprise Checklist

- [ ] Each service owns exactly one domain
- [ ] Each service has its own database/schema
- [ ] No direct database access across services
- [ ] Communication via Events (preferred), gRPC, or REST
- [ ] Event catalog documented and versioned
- [ ] Saga pattern used for distributed transactions
- [ ] Compensating actions defined for every failure path
- [ ] Service discovery configured
- [ ] Health check endpoint implemented
- [ ] Structured logging with trace IDs
- [ ] Distributed tracing across services
- [ ] Timeouts configured on all sync calls
- [ ] Circuit breakers for downstream failures
- [ ] Retry with exponential backoff for transient failures
- [ ] gRPC contracts versioned (package per version)
- [ ] Proto files shared via git submodule or package registry
- [ ] Each service independently deployable
- [ ] Docker Compose for local development
- [ ] CI/CD pipeline per service
- [ ] Monitoring and alerting per service

---

## References

- See skill: `laravel-api-rest` for REST communication patterns
- See skill: `laravel-api-jsonapi` for JSON:API response standards
- See skill: `laravel-api-graphql` for GraphQL Federation
- See skill: `laravel-api-grpc` for gRPC service implementation
- See skill: `laravel-patterns` for Actions, DTOs, and Services
- See skill: `laravel-database` for database architecture and scaling
- See skill: `laravel-tdd` for testing microservices
- See rule: `rules/laravel/api-microservices.md` for enforced microservices rules
