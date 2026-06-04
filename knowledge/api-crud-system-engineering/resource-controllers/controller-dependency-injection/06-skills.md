# Skill: Implement Controller Dependency Injection

## Purpose
Inject dependencies (actions, services, repositories) into controllers via constructor or method injection for testability and loose coupling.

## When To Use
- Controllers calling actions/services
- Dependency-laden controllers
- Testable controller design

## When NOT To Use
- Simple CRUD with no injected dependencies
- Static method calls

## Prerequisites
- Laravel service container
- Action/Service class patterns

## Inputs
- Controller dependency specifications

## Workflow
1. Inject shared dependencies in constructor: `public function __construct(private UserService $service)`
2. Inject per-method dependencies via method injection: `public function store(StoreUserRequest $request, CreateUserAction $action)`
3. Type-hint interfaces for dependency inversion
4. Register bindings in service provider: `$this->app->bind(UserServiceInterface::class, UserService::class)`
5. Keep constructor injected dependencies under 3
6. Use method injection for action-specific dependencies
7. Avoid injecting Request — use method injection
8. Test controller with mocked dependencies
9. Document injected dependencies in controller docblock
10. Use autowiring for simple dependencies

## Validation Checklist
- [ ] Constructor injection for shared deps
- [ ] Method injection for per-action deps
- [ ] Interface type-hinting for DI
- [ ] Under 3 constructor deps
- [ ] Register bindings in service provider
- [ ] Tested with mocked dependencies

## Related Skills
- Action Class Design
- Service Class Design
- Repository Pattern Design
