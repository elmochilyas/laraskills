# Skill: Build Thin Presentation Layer with Controllers, Form Requests, and API Resources
## Purpose
Design a thin Presentation layer using invokable controllers that delegate to use cases, Form Request classes for validation and authorization, and API Resources for response serialization — containing zero business logic and zero direct Eloquent calls.
## When To Use
- Any layered architecture with explicit separation of concerns
- Form Requests for any endpoint with 3+ validation rules
- API Resources for any JSON response that differs from default model serialization
- Invokable controllers when each endpoint has distinct dependencies
## When NOT To Use
- Prototypes where speed trumps structure (inline `$request->validate()` is acceptable temporarily)
- Single-field validation (Form Request overhead exceeds benefit)
- API Resources for 2-3 field responses (returning directly from controller is simpler)
## Prerequisites
- Laravel routing and middleware understanding
- Use case/service classes in Application layer to delegate to
- LAP-06 Application layer (the layer controllers delegate to)
## Inputs
- HTTP request (URL parameters, body, headers)
- Authenticated user context (from Laravel auth middleware)
- Use case/DTO definitions from Application layer
## Workflow
1. Define routes grouped by concern (`web`, `api`, `admin`) with middleware at group level — never scatter route definitions
2. Create invokable controller per distinct operation: single `__invoke()` method with injected use case and Form Request
3. Create Form Request for each endpoint with 3+ validation rules: `rules()` method returns validation rules, `authorize()` method checks permissions via Policy/Gate
4. Extract validated data in controller: call `$request->toDto()` or pass relevant fields to use case DTO
5. Call use case: `$result = $this->useCase->execute(CreateInvoiceDto::fromRequest($request))` — never call Eloquent from controller
6. Create API Resource to control response shape: `InvoiceResource` exposes only intended fields with proper formatting
7. Return response: `return new InvoiceResource($result)` or `return redirect()->route('invoices.show', $result->id)` for web
8. Inject all dependencies via constructor or method injection — never use `app()`, Facades, or `resolve()` in controllers
## Validation Checklist
- [ ] Controllers contain zero business logic (no `if` statements about business rules)
- [ ] Controllers call zero Eloquent methods directly
- [ ] All validation with 3+ rules uses Form Request classes (not `$request->validate()`)
- [ ] Form Request `authorize()` method checks permissions
- [ ] Dependencies injected via constructor/injection (no `app()`, no Facades)
- [ ] Invokable controllers for distinct dependencies; resource controllers for standard CRUD
- [ ] API Resources control response serialization (no Eloquent models returned directly)
- [ ] Routes grouped by concern with middleware at group level
- [ ] API Resources never expose internal model attributes
- [ ] Controllers can be unit-tested with mocked use cases
## Common Failures
- **Business logic in controllers:** Controller checks invoice status or calculates totals. Fix: delegate to use case.
- **Direct Eloquent calls:** `Invoice::findOrFail()` in controller. Fix: call use case method.
- **Inline validation:** `$request->validate()` in controller body. Fix: create Form Request class.
- **Model exposure in responses:** `Invoice::with('user')->findOrFail($id)` returned as JSON — exposes all model attributes. Fix: use API Resource.
- **Constructor bloat:** Single multi-method controller with 10+ injected dependencies. Fix: split into invokable controllers.
## Decision Points
- **Invokable vs Resource controller:** Single endpoint with unique dependencies = invokable. Standard CRUD with shared dependencies = Resource controller.
- **Form Request vs inline validation:** 3+ rules = Form Request. 1-2 simple rules = inline is acceptable.
- **API Resource vs direct return:** Response shape differs from entity = Resource. Simple 2-3 field response = direct return is acceptable.
## Performance Considerations
- Form Request resolution by service container adds negligible overhead
- API Resource transformation on large collections may need pagination (`ResourceCollection`)
- Route caching (`php artisan route:cache`) improves Presentation layer routing performance
- Invokable controllers inject only what the single action needs — no wasted memory
## Security Considerations
- Authentication via middleware at route level (Presentation layer concern)
- Authorization in Form Request `authorize()` method (keeps permission logic at boundary)
- API Resources prevent over-exposure by controlling which fields are serialized
- Never leak model attributes — Resources are the serialization boundary
## Related Rules (from 05-rules.md)
- No Business Logic in Controllers
- Use Form Requests for All Validation
- Inject Dependencies in Controllers
- Use Invokable Controllers for Distinct Dependencies
- Use API Resources for Response Shape
- Never Call Eloquent from Controllers
- Keep Routes Focused and Grouped
## Related Skills
- Application Layer Orchestration (LAP-06)
- Infrastructure Adapters (LAP-07)
- Architecture Tests (LAP-13)
- Incremental Migration (LAP-12)
## Success Criteria
- All controllers contain zero business logic (verified by architecture tests)
- Zero Eloquent import/usage in any Presentation layer class
- All endpoints with 3+ validation rules have dedicated Form Request classes
- API responses use Resources that expose only intended fields
- Controllers delegate to use cases and can be tested with constructor mocks
