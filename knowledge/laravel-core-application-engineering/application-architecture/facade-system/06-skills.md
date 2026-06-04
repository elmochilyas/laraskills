# Skill: Choose Between Facades and Constructor Injection

## Purpose
Determine when to use facades vs constructor injection in Laravel code, applying the correct pattern based on class role and dependency type.

## When To Use
- Writing new controllers, services, actions, or domain classes
- Reviewing existing code for dependency access patterns
- Evaluating whether to create a custom facade
- Onboarding developers to team conventions

## When NOT To Use
- When a project-wide convention is already established — consistency trumps individual choice
- In package code (must use constructor injection only)
- In service provider `register()` methods (facades unavailable)

## Prerequisites
- Understanding of facade mechanics (`__callStatic`, `getFacadeAccessor`)
- Understanding of constructor injection and auto-resolution
- Familiarity with the class role (controller vs service vs action)

## Inputs
- Class being written or reviewed
- List of dependencies the class needs
- Role of the class (HTTP entry point, business logic, infrastructure)

## Workflow
1. Identify the class role:
   - **Controller or View**: facades are acceptable
   - **Service, Action, Domain Object**: prefers constructor injection
   - **Event Listener or Route Closure**: either is acceptable
2. For each dependency, classify it:
   - **Framework infrastructure service** (Cache, Log, Config, DB): facade may be acceptable in controllers
   - **Application service** (PaymentService, UserRepository): constructor injection required in business logic
3. Apply the pattern:
   - Controllers: use facades for framework services, injection for application services
   - Services/Actions: use constructor injection for all dependencies
   - Views: use helpers and facades
4. Ensure consistent pattern within the class — do not mix facades and injection for the same dependency category
5. If using facades in a class that also uses injection, keep facades only for stable framework services

## Validation Checklist
- [ ] Business logic classes (services, actions, domain) use constructor injection for all dependencies
- [ ] Controllers may use facades for framework services but not for application services
- [ ] No class mixes facades and injection for the same dependency category
- [ ] No facade calls exist in service provider `register()` methods
- [ ] No facade calls exist in class constructors
- [ ] Package code uses constructor injection, never facades
- [ ] Custom facades (if used) are registered in `config/app.php` `aliases` array
- [ ] `php artisan ide-helper:generate` has been run for facade autocompletion

## Common Failures
- Using facades in service classes — creates hidden dependencies
- Using facades in constructors — freezes values at construction time
- Mixing patterns in the same class — inconsistent dependency visibility
- Not registering custom facade aliases — `Class not found` errors
- Not resetting facade mock state between tests — flaky test suites

## Decision Points
- Custom facade or injection? Create a custom facade only if the service is used pervasively across controllers and views
- Exceptions to the pattern? Controllers may pragmatically mix facades and injection

## Related Rules
- Use Facades for Framework Services, Injection for Application Services (05-rules.md)
- Never Use Facades in Service Provider register() Methods (05-rules.md)
- Avoid Facade Calls in Class Constructors (05-rules.md)
- Reset Facade State Between Tests (05-rules.md)
- Use IDE Helper for Facade Autocompletion (05-rules.md)
- Never Use Facades in Package Code (05-rules.md)
- Avoid Mixed Access Patterns in the Same Class (05-rules.md)

## Related Skills
- Skill: Test Classes That Use Facades
- Skill: Use Helpers in Controllers and Views
- Skill: Bind and Resolve Services in Container

## Success Criteria
- Dependencies are accessed via the appropriate pattern for each class role
- No hidden dependencies exist in business logic classes
- Facade state is properly reset between tests
- IDE helper provides autocompletion for all facade calls
