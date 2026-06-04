# Skill: Run Log/Assertion After Validation Passes
## Purpose
Execute side effects — logging, audit trails, event dispatch, post-processing — only after validation fully succeeds, keeping side-effect logic separate from validation rules.
## When To Use
When validation rules need to be followed by logging, event dispatching, or audit trail creation; when keeping Form Requests free of side-effect logic.
## When NOT To Use
Side effects that are part of the domain operation (handled by the controller/service); when validation failure also requires logging (use Form Request's `failedValidation` method instead).
## Prerequisites
Form Request classes; validation lifecycle understanding; PHP/Service container.
## Inputs
Validated input data; logger/audit service; optional: list of actions to perform post-validation.
## Workflow
1. Accept validated input array (from `validated()` or `validatedWithCasts()`)
2. Define a `passedValidation()` method on the Form Request
3. Inside `passedValidation()`, call logger, event dispatcher, or audit service
4. Pass only the data that was validated — never raw request input
5. Keep `passedValidation()` focused on side effects — do not modify request data here
## Validation Checklist
- [ ] `passedValidation()` is defined on the Form Request, not in the controller
- [ ] Side-effect logic references validated data only
- [ ] Logging messages include correlation ID and timestamp
- [ ] No data transformation occurs in `passedValidation()`
- [ ] Audit events are dispatched when required by compliance rules
## Common Failures
- Performing side effects in `after()` hook — runs on every validation pass, chaotic
- Using raw `$this->input()` inside `passedValidation()` — bypasses validation
- Adding controller logic to `passedValidation()` — violates separation of concerns
## Decision Points
- Form Request `passedValidation()` vs controller action
- Single event dispatch vs multiple small events
## Performance/Security Considerations
Keep `passedValidation()` synchronous to avoid returning response before side effects complete. Security: never log raw passwords or secrets; use audit-level logging for sensitive operations.
## Related Rules/Skills
Form Request Design; Validation Hook Strategy; Event Dispatching.
## Success Criteria
All post-validation side effects are defined inside the Form Request, reference only validated data, and are triggered exactly once per successful validation.
