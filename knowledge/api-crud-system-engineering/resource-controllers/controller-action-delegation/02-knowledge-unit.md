# Controller Action Delegation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Action Delegation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Controller action delegation is the practice of keeping controller methods to a single line that delegates to an action class, service, or command. Instead of containing business logic, the controller method extracts validated data, passes it to a dedicated class, and returns the result. This produces the thinnest possible controllers—often 5–7 single-line methods that serve as an HTTP-to-application adapter.

The delegation pattern enforces separation of concerns: the controller handles HTTP concerns (status codes, headers, response format), and the action class handles business logic (validation orchestration, database operations, side effects). This makes both layers independently testable and maintainable.

---

## Core Concepts

- **Single-Line Methods**: Each controller method consists of a single return statement that delegates to an action or service.
- **Action Classes**: Dedicated classes (e.g., `CreatePhotoAction`) that encapsulate a single use case.
- **Service Layer**: Broader service classes that group related actions (e.g., `PhotoService`).
- **Command Bus**: Dispatching commands to a command bus for complex workflows.
- **Response Boundary**: The controller is the only place where HTTP responses are constructed; actions never return responses.

---

## Mental Models

- **Controller as Translator**: The controller translates HTTP input into application input and application output into HTTP responses. It does nothing else.
- **One-Line Rule**: If a controller method needs more than one line, the logic should be extracted.
- **Thin Wafer**: The controller should be thin—a wafer-thin layer between HTTP and the domain.

---

## Internal Mechanics

Delegation is a design pattern, not a Laravel feature. It relies on injecting action classes or services into the controller via constructor dependency injection. The action class is typically an invokable class or a class with a descriptive method (`execute()`, `handle()`, `run()`).

Typical flow:

```
Controller::store($request) → $request->validated() → Action::execute($data) → return Response
```

The action class itself is resolved by the container, so it can have its own dependencies injected:

```php
class CreatePhotoAction
{
    public function __construct(
        private PhotoRepository $photos,
        private PhotoProcessor $processor,
        private Notifier $notifier,
    ) {}

    public function execute(array $data): Photo
    {
        $photo = $this->photos->create($data);
        $this->processor->process($photo);
        $this->notifier->notifyNewPhoto($photo);
        return $photo;
    }
}
```

---

## Patterns

- **Action Class Delegation**:
  ```php
  class PhotoController extends Controller
  {
      public function __construct(
          private CreatePhotoAction $createPhoto,
          private UpdatePhotoAction $updatePhoto,
          private DeletePhotoAction $deletePhoto,
      ) {}

      public function store(StorePhotoRequest $request)
      {
          return new PhotoResource($this->createPhoto->execute($request->validated()));
      }

      public function update(UpdatePhotoRequest $request, Photo $photo)
      {
          return new PhotoResource($this->updatePhoto->execute($photo, $request->validated()));
      }

      public function destroy(Photo $photo)
      {
          $this->deletePhoto->execute($photo);
          return response()->noContent();
      }
  }
  ```
- **Service Delegation**:
  ```php
  public function store(StorePhotoRequest $request)
  {
      return new PhotoResource($this->photos->create($request->validated()));
  }
  ```
- **Command Bus Delegation**:
  ```php
  public function store(StorePhotoRequest $request)
  {
      return $this->commandBus->dispatch(new CreatePhotoCommand($request->validated()));
  }
  ```

---

## Architectural Decisions

- **Why action classes over a service class?** Action classes are more granular and single-responsibility. A service class tends to grow with related methods; an action class cannot grow because it does one thing.
- **Why always return a response from the controller?** Actions should not know about HTTP. They return domain objects (models, DTOs, results); the controller transforms those into responses.
- **Why inject actions instead of instantiating them?** Injection allows the container to resolve the action's dependencies and enables testing with mocked actions.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Extremely thin, readable controllers | Proliferation of action classes | One action class per controller method per resource |
| Business logic is independently testable | Boilerplate for simple CRUD | For pure CRUD, delegation is over-engineering |
| Clear failure boundaries (action throws, controller catches) | Action classes need their own testing | Additional test files, but each test is simpler |

---

## Performance Considerations

- Each delegation adds one additional PHP method call and class autoload. Negligible (sub-millisecond).
- Action classes can be cached by the opcode cache after the first request.
- If actions are expensive to construct (many dependencies), mark them as singletons in the container to reuse instances.

---

## Production Considerations

- Name action classes with verbs: `CreatePhotoAction`, not `PhotoCreator` or `PhotoAction`.
- Keep action classes stateless; pass all data via method parameters.
- Write tests for action classes without HTTP concerns (unit tests, not feature tests).
- Ensure action classes throw specific exceptions that the controller can catch and map to HTTP responses.
- Use `__invoke` for single-method action classes to simplify the interface: `$action->execute(...)` vs `$action->__invoke(...)`.

---

## Common Mistakes

- **Delegating to another method in the same controller**: `$this->doStore($data)` instead of an external class.
  - *Why it happens:* Believing this is "delegation" without creating a new file.
  - *Why it's harmful:* The controller still contains the logic; SRP is not improved.
  - *Better approach:* Extract to a separate action class.

- **Action classes returning HTTP responses**: `CreatePhotoAction` returns a `JsonResponse` instead of a model.
  - *Why it happens:* Developer treats the action as a "sub-controller."
  - *Why it's harmful:* Actions are not reusable outside HTTP context (e.g., CLI commands).
  - *Better approach:* Actions return domain objects; controllers build responses.

- **Over-delegation for simple CRUD**: Creating action classes for every `index` method that is just `Photo::all()`.
  - *Why it happens:* Applying the pattern dogmatically.
  - *Why it's harmful:* Unnecessary abstraction, increased file count.
  - *Better approach:* Delegate only when the method exceeds one line or has business logic beyond a simple query.

---

## Failure Modes

- **Action class constructor explosion**: An action that takes 6+ injected dependencies. *Detection:* Long constructor signature. *Mitigation:* Review if the action does too much; split into multiple actions.

- **Controller that still imports domain classes**: A controller that imports both action classes and domain repositories, doing partial delegation. *Detection:* Controller has 4 injected actions + 2 repositories. *Mitigation:* Enforce: "Controller constructors should only contain action classes, not repositories or services."

- **Exception handling scattered between controller and action**: Some exceptions caught in the action, some in the controller. *Detection:* Inconsistent error responses. *Mitigation:* Define a clear contract: actions throw domain exceptions, controllers catch and map to HTTP responses.

---

## Ecosystem Usage

- **Laravel Spark (Subscriptions)**: Subscription controllers delegate to `CreateSubscriptionAction`, `CancelSubscriptionAction`, etc.
- **Laravel Cashier**: Invoice and payment controllers delegate to action classes that wrap Stripe API calls.
- **Domain-Driven Design Laravel projects**: The action delegation pattern is the standard approach for maintaining a thin HTTP layer with rich domain logic.

---

## Related Knowledge Units

### Prerequisites
- Controller Dependency Injection
- Single-Action Invokable Controllers

### Related Topics
- Thin Controller Enforcement
- Controller Response Selection

### Advanced Follow-up Topics
- Controller Testing Strategies
- Command Bus Integration

---

## Research Notes

### Source Analysis
- No specific Laravel source; this is an application architecture pattern.
- Related: Laravel's `app/Actions` convention popularized by Laravel Jetstream.

### Key Insight
Action delegation is the most effective technique for achieving thin controllers. A controller method with one delegation line is indisputably simple; any complexity is forced into the action class where it belongs.

### Version-Specific Notes
- No Laravel version dependency.
- The `app/Actions` directory convention became popular with Laravel Jetstream (Laravel 8).
- Laravel 11's streamlined app skeleton encourages action/service organization.
