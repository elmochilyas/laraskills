| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Action Delegation |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Controller Dependency Injection, Single-Action Invokable Controllers |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Controller action delegation is the practice of keeping controller methods to a single line that delegates to an action class, service, or command. Instead of containing business logic, the controller method extracts validated data, passes it to a dedicated class, and returns the result. This produces the thinnest possible controllers — often 5-7 single-line methods that serve as an HTTP-to-application adapter.

## Core Concepts

- **Single-Line Methods**: Each controller method consists of one return statement delegating to an action or service.
- **Action Classes**: Dedicated classes (`CreatePhotoAction`) encapsulating a single use case.
- **Service Layer**: Broader service classes grouping related actions (`PhotoService`).
- **Command Bus**: Dispatching commands to a bus for complex workflows.
- **Response Boundary**: Controllers construct HTTP responses; actions never return responses.

## When To Use

- Any controller method that contains business logic beyond a simple Eloquent query.
- When the same business logic is needed from multiple entry points (API, CLI, queue).
- When controller methods exceed 10-15 lines.
- When team standards require thin controllers with automated enforcement.

## When NOT To Use

- Pure CRUD controllers with no business logic (e.g., `Photo::all()` in index).
- Simple read-only endpoints that are truly one-liners.
- Prototypes where action classes would slow iteration.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Action classes return domain objects, never HTTP responses | Actions must be reusable outside HTTP context (CLI, queue) |
| Actions throw domain exceptions; controllers catch and map to HTTP | Clear separation between business logic errors and HTTP concerns |
| Name action classes with verbs: `CreatePhotoAction` | Self-documenting — the class name describes what it does |
| Inject actions via constructor, not instantiated inline | Enables mocking in tests and container dependency resolution |
| Keep action classes stateless; pass all data via method parameters | Stateless actions are testable and predictable |

## Architecture Guidelines

- One action class per controller method that needs business logic.
- Controller constructors should contain only action classes, not repositories or domain services directly.
- Use `__invoke` for single-method action classes, or `execute()` / `handle()` / `run()` for named methods.
- Write tests for action classes without HTTP concerns (pure unit tests).
- Over-delegation for simple CRUD is an anti-pattern — delegate only when the method exceeds one line or has logic beyond a simple query.

## Performance Considerations

- Each delegation adds one PHP method call and autoload — negligible (sub-millisecond).
- Opcode cache caches action classes after first request.
- Mark expensive-to-construct actions as singletons in the container.

## Security Considerations

- Actions should not receive the `Request` object directly; receive only validated data arrays.
- Authorization should happen before delegation (in form request's `authorize()` or policy).
- Actions are unaware of authentication context — pass user ID explicitly if needed.
- Ensure action exceptions don't leak sensitive information to HTTP responses.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Delegating to another method in the same controller | Believing `$this->doStore()` is delegation | Controller still contains the logic; SRP not improved | Extract to a separate action class |
| Action classes returning HTTP responses | Treating the action as a "sub-controller" | Actions not reusable outside HTTP context | Actions return domain objects; controllers build responses |
| Over-delegation for simple CRUD | Applying pattern dogmatically | Unnecessary abstraction and file count | Delegate only when the method exceeds one line |

## Anti-Patterns

- **Delegating to private methods within the same controller**: Doesn't improve SRP; just moves lines within the same file.
- **Action classes with 6+ constructor dependencies**: Indicates the action does too much; split into multiple actions.
- **Controllers that import both action classes and repositories**: Partial delegation indicates incomplete refactoring.
- **Actions named as nouns (PhotoCreator)**: Verb-first naming (`CreatePhotoAction`) is more descriptive.

## Examples

- **Store delegation**: `return new PhotoResource($this->createPhoto->execute($request->validated()));`
- **Update delegation**: `return new PhotoResource($this->updatePhoto->execute($photo, $request->validated()));`
- **Destroy delegation**: `$this->deletePhoto->execute($photo); return response()->noContent();`
- **Action class**: `class CreatePhotoAction { public function execute(array $data): Photo { ... } }`

## Related Topics

- Controller Dependency Injection — How actions are injected into controllers
- Single-Action Invokable Controllers — Controllers that are themselves single-action
- Thin Controller Enforcement — Automated rules enforcing delegation

## AI Agent Notes

- Generate action classes with constructor injection of dependencies.
- Ensure controller methods are single-line delegation calls.
- Never let action classes return HTTP responses; they should return domain objects.
- Include exception handling in controllers that catches action-specific domain exceptions.

## Verification

- [ ] No controller method contains inline business logic beyond a delegation call
- [ ] Action classes are injected via constructor (not instantiated inline)
- [ ] Action classes return domain objects (not HTTP responses)
- [ ] Action classes are testable without HTTP concerns
- [ ] Controller constructors contain only action classes, not repositories
