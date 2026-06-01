---
paths:
  - "**/*.php"
---

# Laravel 13 Architecture Flow Rules

> This file extends [common/patterns.md](../common/patterns.md) with architecture rules.

## Required Flow

```
Controller (thin)
    ↓
Action (orchestration)
    ↓
Domain Service (business logic)
    ↓
Contract (interface)
    ↓
Infrastructure (Stripe, Eloquent, Mailgun)
    ↓
Database / External API
```

## Forbidden Flows

```
Controller
    ↓
Model (direct query)
    ↓
Database
```

```
Controller (with business logic, email sending, DB queries)
```

## Thin Controllers

Controllers may:
- Receive and validate requests
- Authorize requests
- Dispatch actions
- Return responses

Controllers must NOT:
- Contain business logic
- Query databases directly
- Send emails
- Handle payments

## Actions

Complex business operations belong in Actions:

```
CreateOrderAction
ProcessRefundAction
GenerateInvoiceAction
CompleteCheckoutAction
```

## Response Generation

Always use API Resources instead of returning models:

```php
// GOOD
return new UserResource($user);
return UserResource::collection($users);

// FORBIDDEN
return $user;
return User::all();
```

## API Versioning

```
/api/v1/users
/api/v2/users
```

## See Also

- Skill: `laravel-core-internals` for architecture patterns
- Skill: `laravel-patterns` for Actions, DTOs, and Services
- Skill: `laravel-eloquent` for advanced Eloquent patterns and domain modeling
- Skill: `laravel-database` for database architecture and scaling strategies
- Skill: `laravel-api-rest` for REST architecture and API design
- Skill: `laravel-api-jsonapi` for JSON:API specification resources
- Skill: `laravel-api-graphql` for GraphQL with Lighthouse
- Skill: `laravel-api-grpc` for gRPC service implementation
- Skill: `laravel-api-microservices` for internal service boundaries
- Rule: `rules/laravel/eloquent.md` for enforced Eloquent rules
- Rule: `rules/laravel/database.md` for enforced database engineering rules
- Rule: `rules/laravel/middleware.md` for middleware pipeline
- Rule: `rules/laravel/api-rest.md` for enforced REST API rules
- Rule: `rules/laravel/api-jsonapi.md` for enforced JSON:API rules
- Rule: `rules/laravel/api-graphql.md` for enforced GraphQL rules
- Rule: `rules/laravel/api-grpc.md` for enforced gRPC rules
- Rule: `rules/laravel/api-microservices.md` for enforced microservices rules
