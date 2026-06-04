# Skill: Enforce Maximum Method Lines and Cyclomatic Complexity in Controllers
## Purpose
Keep controller methods small (typically <15 lines) and low in cyclomatic complexity (< 4) by delegating logic to services, actions, and Form Requests — preventing controllers from becoming god classes.
## When To Use
During code review of controllers; when setting up CI linting rules; when refactoring an existing "fat controller."
## When NOT To Use
Service/action classes (no controller involved); simple delegation methods that return directly (one-liners are fine).
## Prerequisites
Resource Controller Pattern; Service Layer Design; Action Classes.
## Inputs
Controller method body; cyclomatic complexity analyzer (PHPMD, PHPStan); line count threshold.
## Workflow
1. Set a maximum method line limit (e.g., 15 lines excluding braces/blank lines)
2. Run PHPMD or PHPStan with `cyclomatic_complexity` rule (threshold 4-5)
3. Identify controller methods exceeding the limit
4. Extract query logic into Query Builder scopes or repository methods
5. Extract business logic into Service classes or Action classes
6. Move validation to Form Requests
7. Move response formatting to API Resources
8. Re-run analysis until all controller methods pass
## Validation Checklist
- [ ] No controller method exceeds the line limit
- [ ] No controller method exceeds cyclomatic complexity threshold
- [ ] Query logic is delegated to scopes, repositories, or query builders
- [ ] Business logic is delegated to services or actions
- [ ] Validation is delegated to Form Requests
- [ ] Response formatting is delegated to API Resources
- [ ] CI pipeline includes a controller complexity check
- [ ] Exceptions (trivial delegation methods) are documented if any
## Common Failures
- Moving logic to services but still calling them from controller with if/else branching
- Extracting methods but keeping them in the controller (still one class)
- Using `@SuppressWarnings` instead of actually reducing complexity
- Setting threshold too low for inherently conditional endpoints (batch operations)
## Decision Points
- Service classes vs Action classes vs Repository pattern
- PHPMD thresholds vs PHPStan levels vs custom CI script
- Lines-based rule vs complexity-based rule vs both
## Performance/Security Considerations
No direct performance impact. Security: smaller methods are easier to audit for authZ leaks.
## Related Rules/Skills
Resource Controller Pattern; Controller Organization by Domain; Service Layer Design.
## Success Criteria
All controller methods pass automated line-count and complexity checks; logic is delegated to appropriate classes; CI fails on violations.
