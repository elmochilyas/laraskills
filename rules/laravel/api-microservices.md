---
paths:
  - "**/*.php"
  - "**/Events/**/*.php"
---

# Laravel 13 Microservices Rules

> Enforced microservice architecture standards. Violations require refactoring before merge.

## Service Boundaries

```text
✓ Each service owns one domain
✓ Domain = bounded context
✗ "Everything Service"
```

## Database Ownership

```php
// FORBIDDEN — direct cross-service database access
DB::connection('user_database')->table('users')->find($id);

// REQUIRED — communicate via API/gRPC/Events
$user = $this->userGrpcClient->findUser($id);
```

## Communication Hierarchy

```text
1st Choice:  Events (async)
2nd Choice:  gRPC (sync, fast)
3rd Choice:  REST (sync, simple)
FORBIDDEN:   Shared database
```

## No Distributed Transactions

```php
// FORBIDDEN — distributed transaction across services
DB::beginTransaction();
// Service A writes
// Service B writes
// Service C writes
DB::commit();

// REQUIRED — Saga pattern with compensating actions
```

## Event Design

```php
// REQUIRED — events use past tense, describe completed action
class OrderPlaced {}
class PaymentReceived {}

// Events carry data, never references to services
public readonly string $orderId;
public readonly int $total;
```

## See Also

- Skill: `laravel-api-microservices`
- Skill: `laravel-api-grpc`
- Skill: `laravel-api-rest`
- Rule: `rules/laravel/api-grpc.md`
