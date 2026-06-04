# Skill: Thin Controllers by Extracting Business Logic

## Purpose
Keep controllers responsible only for HTTP concerns — receive validated request, call service, return response — by extracting business logic to services/actions, validation to Form Requests, authorization to Policies, and response formatting to API Resources.

## When To Use
- Always — every non-trivial controller should follow the thinning pattern

## When NOT To Use
- Prototype-stage applications
- Controller is already a simple proxy with no additional logic to extract

## Prerequisites
- Understanding of Form Requests, Policies, API Resources, and Services
- Max lines per controller standard (50 lines per controller, 10 lines per method)

## Inputs
- Current controller code with business logic
- Defined service classes or actions

## Workflow
1. **Aim for the Three-Line Controller pattern.** Each controller method should: (1) receive validated request, (2) call a service/action, (3) return a response. If the method is longer, extract the logic.

2. **Always use Form Requests for validation.** Replace `$request->validate()` in controllers with type-hinted Form Request classes. This makes validation testable and reusable.

3. **Move business logic to Services or Actions.** If code doesn't involve HTTP request/response handling, it doesn't belong in a controller. Extract to Service (grouped by entity) or Action (single-operation).

4. **Use API Resources for response transformation.** Replace inline response formatting (`response()->json([...])` in controllers with dedicated Resource classes. This centralizes transformation logic.

5. **Put authorization in Policies.** Use Policy classes with Form Request's `authorize()` method. Never put authorization checks (`if ($post->user_id !== auth()->id())`) in controllers.

6. **Establish max lines limits.** Enforce maximum 50 lines per controller and 10 lines per method. Line limits provide a clear signal that logic needs extraction.

7. **Avoid over-extraction.** Don't extract every conditional to a separate class. Keep simple 3-4 line code blocks inline. Over-extraction creates indirection without benefit.

## Validation Checklist
- [ ] No business logic in controllers (only HTTP concerns)
- [ ] Form Requests handle all validation
- [ ] Policies handle all authorization
- [ ] API Resources handle response formatting
- [ ] Controller methods follow Three-Line pattern
- [ ] Controller methods are ≤ 10 lines
- [ ] Controller total is ≤ 50 lines
- [ ] No over-extraction (simple conditionals kept inline)

## Common Failures
- **Over-extraction.** Extracting every conditional to a separate class — indirection without benefit.
- **Validation in controller body.** Using `$request->validate()` instead of Form Request.
- **Inconsistent thinning.** Some controllers thin, others fat — establish and enforce a team standard.
- **Service returning response objects.** Service method returns `response()->json(...)` — business logic coupled to HTTP.

## Decision Points
- **Extract to Service vs Action?** Extract to Service for entity-grouped operations; extract to Action for isolated single operations.
- **Inline response vs API Resource?** Use inline for simple scalar responses; use API Resource for structured object responses.

## Performance Considerations
- No significant performance impact. Extra method calls are negligible.
- Form Request, Policy, and Resource resolution via container adds negligible overhead.

## Security Considerations
- Authorization belongs in Policies or Form Request's `authorize()` method, not in controllers.
- Validated data comes from Form Requests, reducing risk of invalid input processing.

## Related Rules
- Rule: Three-Line Controller Pattern (SLP-03/05-rules.md)
- Rule: Always Use Form Requests (SLP-03/05-rules.md)
- Rule: No Business Logic in Controllers (SLP-03/05-rules.md)
- Rule: API Resources for Response Transformation (SLP-03/05-rules.md)
- Rule: Authorization in Policies (SLP-03/05-rules.md)
- Rule: Max Lines Limits (SLP-03/05-rules.md)
- Rule: Avoid Over-Extraction (SLP-03/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Build Form Request Validation (LAP-12/06-skills.md)
- Implement DTOs and Transformers (LAP-14/06-skills.md)

## Success Criteria
- Controllers contain zero business logic — only HTTP orchestration.
- Controller methods follow the Three-Line pattern (request, service, response).
- Validation, authorization, and response formatting are in dedicated classes.
- Controller and method line limits are established and enforced.
