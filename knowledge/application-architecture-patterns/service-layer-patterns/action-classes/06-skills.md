# Skill: Design Single-Operation Action Classes

## Purpose
Create action classes encapsulating one business operation per class with a single public `execute()` method, grouping by domain subdirectory, and keeping them as stateless leaf nodes in the call graph.

## When To Use
- Service classes are growing into god objects
- Operations are distinct enough to warrant individual classes
- Maximum testability per operation is desired

## When NOT To Use
- Operations are tightly related and share significant internal logic (use service classes)
- Application is simple CRUD with few operations

## Prerequisites
- Understanding of the Command pattern
- `app/Actions/` directory with domain subdirectories

## Inputs
- Identified single business operations
- List of dependencies per operation

## Workflow
1. **Create one action class per business operation.** Each class has exactly one public method: `execute()` or `handle()`. Name using Verb-Noun pattern: `RegisterUserAction`, `ProcessPaymentAction`.

2. **Group actions by domain subdirectory.** Use `app/Actions/User/`, `app/Actions/Billing/`, etc. A flat directory with 100+ action files is unmanageable.

3. **Keep actions stateless.** Pass all data as parameters to `execute()`. Never set mutable properties between construction and execution. Stateful actions cause cross-request contamination under Octane.

4. **Never call other actions from an action.** Actions are leaf nodes in the call graph. Composition of multiple actions belongs at the Service layer. Action-to-action calls create opaque call graphs.

5. **Keep constructor dependencies reasonable.** An action with many dependencies is doing too much. Prefer 1-3 dependencies. Additional concerns should be handled by the service orchestrating this action.

6. **Avoid anemic actions.** Don't extract to an action if it simply wraps a single model method without adding operation-specific logic. Only extract when orchestration or complexity justifies it.

7. **Keep actions focused.** An action with more than 100 lines or complex branching should be split into multiple actions or moved to a service.

## Validation Checklist
- [ ] Each action has exactly one public method (`execute` or `handle`)
- [ ] Actions don't call other actions (leaf nodes only)
- [ ] Actions are stateless (no mutable properties)
- [ ] Actions are organized by domain subdirectory
- [ ] No anemic actions (logicless model wrappers)
- [ ] No giant action classes (> 100 lines)
- [ ] Constructor dependencies are limited (1-3 typical)

## Common Failures
- **Actions calling actions.** Convenience creates opaque call graphs — service should orchestrate.
- **Actions with state.** Setting properties between construction and execution causes Octane cross-request leaks.
- **Anemic actions.** Action just calls `User::create($data)` — no added value over direct call.
- **Action explosion without organization.** 100 flat files in `app/Actions/` — group by domain subdirectory.

## Decision Points
- **Action vs Service vs Use Case?** Action for single leaf-node operations; Service for grouping related operations; Use Case for multi-step orchestration with DTOs.
- **execute() vs handle() naming?** Choose one convention and apply consistently. `execute()` is more common for Command pattern.

## Performance Considerations
- Action resolution adds negligible overhead. Each action resolved once per invocation.
- Actions are singletons by default — ensure they are stateless for Octane compatibility.

## Security Considerations
- Authorization belongs in policies/form requests, not in actions.
- Actions receive already-authenticated and validated data.

## Related Rules
- Rule: One Public Method Per Action (SLP-02/05-rules.md)
- Rule: Actions Must Not Call Other Actions (SLP-02/05-rules.md)
- Rule: Actions Must Be Stateless (SLP-02/05-rules.md)
- Rule: Group Actions By Domain (SLP-02/05-rules.md)
- Rule: Avoid Anemic Actions (SLP-02/05-rules.md)
- Rule: Verb-Noun Naming (SLP-02/05-rules.md)
- Rule: Limit Constructor Dependencies (SLP-02/05-rules.md)
- Rule: Avoid Giant Action Classes (SLP-02/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Thin Controllers (SLP-03/06-skills.md)
- Build Service-Action-Repository Pyramid (SLP-04/06-skills.md)
- Design Single-Action Classes (LAP-15/06-skills.md)

## Success Criteria
- Each action class has exactly one public method and is organized by domain.
- Actions are stateless leaf nodes that never call other actions.
- No anemic or giant actions exist.
- Service layer orchestrates multiple actions without action-to-action coupling.
