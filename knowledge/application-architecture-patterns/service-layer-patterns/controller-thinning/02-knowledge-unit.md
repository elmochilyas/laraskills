# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Controller thinning: what to extract and what to keep
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Controller thinning is the practice of extracting business logic from controllers into dedicated classes (services, actions, use cases), leaving controllers responsible only for HTTP concerns: receiving requests, calling services, and returning responses. The rule is: if code doesn't involve HTTP request/response handling, it doesn't belong in a controller. Validation belongs in Form Requests. Business logic belongs in Services/Actions. Response formatting belongs in API Resources. Controllers should be thin enough that they're boring to read.

---

# Core Concepts

**What stays in controllers:**
- Calling the service/action/use case
- Passing validated data from Form Request
- Returning a response (Resource, JsonResponse, Redirect)

**What gets extracted:**
- Business logic → Service or Action
- Validation → Form Request
- Authorization → Policy or Form Request's `authorize()` method
- Response transformation → API Resource
- Query logic → Repository, Query Object, or model scope
- Complex calculations → Domain service or value object

---

# Mental Models

**The "Three-Line Controller" model:** A controller should be at most three lines: receive validated request, call service, return response. If the controller is longer, extract.

**The "HTTP Brain" model:** The controller's only "knowledge" is about HTTP. It knows how to read a request, how to send a response. It knows nothing about business rules or data access.

**The "Clean Slate" test:** When testing a controller, the test should only verify it calls the correct service with correct data and returns the correct response. If the test needs to verify business logic, that logic is in the wrong place.

---

# Internal Mechanics

**Thin controller example:**
```php
class UserController {
    public function __construct(
        private UserRegistrationService $service,
    ) {}

    public function store(StoreUserRequest $request): UserResource {
        $user = $this->service->register($request->validated());
        return new UserResource($user);
    }
}
```

**Fat controller (before thinning):**
```php
public function store(Request $request) {
    $validated = $request->validate([...]);
    $user = User::create($validated);
    Mail::to($user)->send(new WelcomeMail($user));
    $workspace = Workspace::create(['user_id' => $user->id, ...]);
    event(new UserRegistered($user));
    Log::info('User registered', ['id' => $user->id]);
    return response()->json($user->toArray(), 201);
}
```

---

# Patterns

**Thin controller + Form Request + Service:** The most common pattern. Form Request handles validation and authorization. Service handles business logic. Controller delegates and responds.

**Thin controller + Action:** For single operations. Controller instantiates action via container, calls `execute()`, returns response.

**Resource controller with method-level extraction:** A `UserController` with `index`, `store`, `show`, `update`, `destroy`. Each method is 3-5 lines, delegating to services.

---

# Architectural Decisions

**Extract to service when:** Multiple controller methods share the same business logic, or a single method has logic beyond 3-5 lines.

**Keep in controller when:** The method is a simple proxy to a model method with no additional logic: `return User::find($id)`.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Controllers are testable by mocking | More files per endpoint | Each endpoint = controller + service + test |
| Business logic is centralized | Logic indirection | New devs must trace through 3+ files |
| Controllers are boring to read | Can over-extract | Simple logic extracted unnecessarily |

---

# Performance Considerations

No significant performance impact. Extra method calls in the controller chain are negligible.

---

# Production Considerations

Establish a team standard for controller max lines. Common: 50 lines per controller, 10 lines per method. Enforce via code review or PHP_CodeSniffer.

---

# Common Mistakes

**Over-extraction:** Extracting every conditional to a separate class. Simple logic (3-4 lines) doesn't need extraction. The cost of indirection exceeds the benefit.

**Under-extraction:** Keeping business logic in controllers "because it's small." Small logic grows. Extract early.

**Validation in controller body:** Using `$request->validate()` instead of Form Request classes. Makes validation logic untestable and unreusable.

---

# Failure Modes

**Inconsistent thinning:** Some controllers are thin, others are fat. New developers don't know which pattern to follow. Establish a rule: all non-trivial controllers use services.

**Service layer returns response objects:** A service that returns `response()->json(...)` ties business logic to HTTP. Services should return data, not responses.

---

# Ecosystem Usage

Benjamin Crozat's 2026 Laravel architecture guide: "Keep controllers thin. The controller's only job is to glue the request to the business logic and back." This is the universal recommendation.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-02 Action classes | SLP-10 Service vs Action decision |
| COS-02 Layer-based organization | SLP-05 DTO pattern | SLP-17 Service layer testing |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
