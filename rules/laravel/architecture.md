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
- Rule: `rules/laravel/middleware.md` for middleware pipeline
