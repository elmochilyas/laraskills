# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service classes: grouping operations by entity
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Service classes are the most common architectural extension in Laravel. They group related business operations by entity or domain, extracting logic from controllers into dedicated classes. A `UserService` handles user-related operations: registration, profile updates, password management. A `OrderService` handles ordering operations: creation, status transitions, cancellation. Services sit between controllers and models. They orchestrate business logic, manage transactions, and coordinate side effects. This KU covers the classic service class approach and its tradeoffs.

---

# Core Concepts

Service classes group operations by the entity they operate on:
```
app/Services/
├── UserService.php       # Register, update profile, change password, verify email
├── OrderService.php      # Create, cancel, update status, calculate totals
├── PaymentService.php    # Process, refund, void transactions
└── NotificationService.php # Send, broadcast, schedule notifications
```

Each method on a service class handles a complete business operation:
```php
class UserService {
    public function register(array $data): User { /* creates user, sends welcome email, creates workspace */ }
    public function updateProfile(User $user, array $data): User { /* validates, updates, logs */ }
}
```

Services are injected into controllers via dependency injection:
```php
class UserController {
    public function __construct(private UserService $service) {}
    public function store(StoreUserRequest $request): JsonResponse {
        $user = $this->service->register($request->validated());
        return response()->json($user, 201);
    }
}
```

---

# Mental Models

**The "Orchestrator" model:** The service class doesn't do the work itself—it delegates to models, events, jobs, and external services. Its role is to orchestrate the correct sequence of operations.

**The "Entity Service" model:** Each service class is paired with a primary entity. `UserService` + `User`, `OrderService` + `Order`. The service methods represent operations that the entity performs.

**The "Controller Brain Transplant" model:** Service classes exist because controllers should only handle HTTP concerns. The service receives the "brain" that the controller used to have.

---

# Internal Mechanics

Service classes are plain PHP classes resolved by the service container:
```php
class UserService {
    public function __construct(
        private UserRepository $users,
        private WelcomeMailer $mailer,
        private TeamService $teams,
    ) {}
}
```

Constructor dependencies are automatically injected when the service is resolved from the container.

---

# Patterns

**Single responsibility per method:** Each service method should do one complete business operation. `register()` registers a user. `changePassword()` changes a password. Methods should not have multiple use cases.

**Service returns domain objects:** Services return Eloquent models, collections, or DTOs—not responses. Response formatting belongs in the controller.

**Service methods are transactional:** Where an operation has multiple database writes, the service method wraps them in a transaction.

---

# Architectural Decisions

**Use service classes when:** Controllers contain logic beyond request handling. This is the first architectural pattern to adopt—almost all Laravel projects benefit from it.

**Don't use service classes when:** The application is prototype-stage or the controller is already thin (delegating to model methods).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Controllers become thin | Service classes can become god objects | UserService grows to 40 methods |
| Business logic is testable | Service often depends on Eloquent directly | Not framework-independent |
| Logic is reusable across controllers | Service construction requires DI setup | Simple operations need 3 files (controller, service, test) |

---

# Performance Considerations

Service class resolution via the container adds negligible overhead. Constructor dependencies are resolved once per request.

---

# Production Considerations

Service classes should be the default location for business logic in Laravel projects. If you don't know where to put logic, put it in a service class.

---

# Common Mistakes

**God service class:** UserService accumulates methods for registration, authentication, profile, billing, and notifications. Split domain concerns.

**Anemic service:** Service methods that just call model methods: `$this->user->create($data)`, `$this->user->update($id, $data)`. This is "service in name only"—it adds no value.

**Service calling service calling service:** Deep call chains where Service A calls Service B calls Service C. This creates implicit coupling.

---

# Failure Modes

**Fat service with many dependencies:** A service with 8+ constructor dependencies. It's doing too much. Split into separate services.

**Service that returns responses:** A service method that returns `response()->json(...)`. This couples business logic to HTTP.

---

# Ecosystem Usage

Almost every production Laravel codebase uses service classes. Community leaders (Benjamin Crozat, Laravel Daily, Spatie) all recommend services as the first architectural pattern.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-02 Layer-based organization | SLP-02 Action classes | SLP-10 Service vs Action vs Use Case |
| SLP-03 Controller thinning | SLP-07 Service naming | SLP-18 Anemic domain model |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
