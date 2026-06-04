# Skill: Name Service Classes and Methods by Convention

## Purpose
To assign predictable, domain-meaningful names to all service classes and methods following the `{Entity}Service` pattern with business-verb method names.

## When To Use
- When creating a new service class
- When renaming legacy services that violate naming conventions
- When reviewing PRs for naming consistency

## When NOT To Use
- Action classes (use `{Verb}{Entity}Action` pattern instead)
- Services wrapping external APIs where matching the API terminology is clearer

## Prerequisites
- Knowledge of the business domain entity model
- Understanding of service-layer responsibilities
- Team-agreed convention documented in ADR or contributing guide

## Inputs
- List of service classes needing names (new creation or rename)
- Entity/capability names from the domain model

## Workflow
1. Identify the primary entity or capability the service operates on. For entity-oriented services, use `{Entity}Service` (e.g., `UserService`). For capability-oriented services, use `{Capability}Service` (e.g., `AuthenticationService`).
2. Verify the chosen name is specific and descriptive — never use `HelperService`, `UtilityService`, `ManagerService`, or other generic terms.
3. Place the service under the `App\Services` namespace. If the project has 20+ service files, organize into domain subdirectories (`App\Services\Sales\OrderService`).
4. Name each method using a business-domain verb that describes the operation: `register()`, `place()`, `cancel()`, `suspend()`, `activate()`. Never use HTTP verb names (`store()`, `update()`, `destroy()`, `index()`).
5. Verify method names do not repeat the entity name that is already in the class name. Use `$orderService->place()` not `$orderService->placeOrder()`.
6. For methods that could be ambiguous without the entity name (e.g., `$userService->registerDevice()`), add the disambiguating noun. Otherwise keep names concise.

## Validation Checklist
- [ ] Class name follows `{Entity}Service` or `{Capability}Service` pattern
- [ ] Class name ends with `Service` suffix
- [ ] No generic names: `HelperService`, `UtilityService`, `ManagerService`, `CommonService`
- [ ] Namespace is `App\Services\{Domain}\{Entity}Service`
- [ ] Domain subdirectories used when 20+ service files exist
- [ ] Method names are business verbs, not HTTP verbs (`register()` not `store()`)
- [ ] Method names do not repeat the entity name (`$order->place()` not `$order->placeOrder()`)
- [ ] All developers on the team use the same naming convention
- [ ] Naming convention is documented

## Common Failures
- Using `store()`, `update()`, `destroy()` in service methods
- `HelperService` or `ManagerService` accumulating unrelated operations
- `UserManagementService` instead of `UserService`
- Inconsistent naming across modules (some use `place()`, others use `create()` for same concept)
- Services living outside `App\Services` namespace (e.g., `App\Http\Services`)

## Decision Points
- Entity-oriented name (`OrderService`) vs capability-oriented name (`NotificationService`)? → Choose entity first; capability only if no single entity exists
- Business verb ambiguous without entity? → Add disambiguating noun to method name
- Flat or domain subdirectories? → Use subdirectories at 20+ files or anticipated growth

## Performance Considerations
- Naming has no runtime performance impact
- Predictable names reduce developer search time, improving team velocity

## Security Considerations
- Service names should not expose implementation details (e.g., avoid `AdminUserService` vs `UserService` — authorization is handled elsewhere)

## Related Rules
- **Rule 1**: Use `{Entity}Service` Class Naming Pattern
- **Rule 2**: Use Business Verbs, Not HTTP Verbs, for Method Names
- **Rule 3**: Do Not Repeat the Entity Name in Method Names
- **Rule 4**: Use Domain Subdirectories When Exceeding 20 Service Files
- **Rule 5**: Avoid Generic or Ambiguous Service Names
- **Rule 6**: Namespace Services Under `App\Services`
- **Rule 7**: Maintain Consistent Naming Across the Team

## Related Skills
- Design Service Class
- Classify Service as Application or Domain Service

## Success Criteria
- Every service class can be located by knowing only the entity name
- Method names convey business meaning without reading implementation
- No service uses HTTP verbs in method names
- All services follow the same naming convention across the entire team
