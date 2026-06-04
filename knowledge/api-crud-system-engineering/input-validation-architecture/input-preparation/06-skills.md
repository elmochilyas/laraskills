# Skill: Prepare and Normalize Input Before Validation Rules Execute
## Purpose
Clean, transform, or add request data before validation runs — trimming strings, casting types, merging defaults — using a `prepareForValidation()` hook on the Form Request.
## When To Use
String normalization (trim, lowercase) before format validation; merging default values for optional fields; transforming input structure (rename keys, flatten nested data); injecting server-derived data (IP, user ID).
## When NOT To Use
Business logic transformation (use service layer); complex data enrichment that requires DB queries (use controller or action); filtering sensitive fields (use `$this->only()` in controller).
## Prerequisites
Form Request Design; understanding of `prepareForValidation()` and `validationData()` hooks.
## Inputs
Raw request input; normalization rules; default values; server-derived context.
## Workflow
1. Override `prepareForValidation()` in the Form Request
2. Inside it, mutate `$this->merge()` with cleaned/transformed values
3. For nullable fields, set sensible defaults before validation checks `filled`
4. For string fields, trim whitespace and normalize case as appropriate
5. For compound fields (full name, phone), split or merge as needed
6. Keep preparation stateless — do not call external services or DB
7. Place preparation logic before any custom rule that depends on it
## Validation Checklist
- [ ] All string inputs that accept user-entered text are trimmed
- [ ] Default values are merged for optional fields with fallbacks
- [ ] Server-derived data (IP, timestamp) is injected before validation
- [ ] No side effects (DB, API calls, events) in preparation
- [ ] Preparation is tested with both present and absent input values
- [ ] Normalization does not silently hide invalid data
## Common Failures
- Using `prepareForValidation()` for business logic transformation
- Mutating data that's already validated — creates inconsistency
- Forgetting that `prepareForValidation()` runs on every request, even invalid ones
- Not testing the prepared data shape alongside validation rules
## Decision Points
- `prepareForValidation()` vs `validationData()` (merge vs replace)
- Inline normalization vs dedicated Formatter/Value Object
## Performance/Security Considerations
Preparation runs on every request — keep it fast (no DB/API calls). Security: trim and sanitize before validation to prevent rule bypass (e.g., `"  "` passing `required`).
## Related Rules/Skills
Form Request Design; Validation Rule Array Design; After Validation Hooks; Input Sanitization.
## Success Criteria
All user-entered strings are normalized before validation; defaults are applied; derived data is available for rule evaluation; no side effects leak into the preparation phase.
