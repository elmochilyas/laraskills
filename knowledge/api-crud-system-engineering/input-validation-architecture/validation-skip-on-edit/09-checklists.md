# Validation Skip on Edit — Checklists

## Endpoint Semantics
- [ ] PATCH endpoints use `sometimes` for all optional fields
- [ ] PUT endpoints use `required` for all mandatory fields
- [ ] API documentation clearly states PUT vs PATCH semantics
- [ ] Clients receive consistent error messages for missing required fields

## Implementation
- [ ] `sometimes` added as first rule element for all PATCH fields
- [ ] `Rule::unique()->ignore()` used for unique fields on update
- [ ] Route parameter name matches between route and FormRequest
- [ ] Custom skip logic (if used) is in `prepareForValidation()`, not controller
- [ ] Authorization checks always run regardless of field changes
- [ ] `offsetUnset()` used to remove unchanged fields in skip logic

## Testing
- [ ] PATCH with single field succeeds
- [ ] PATCH with all fields succeeds
- [ ] PUT with missing required fields returns 422
- [ ] PUT with all required fields succeeds
- [ ] Update with unchanged unique field passes validation
- [ ] Update with changed unique field (no collision) passes
- [ ] Update with changed unique field (collision) fails
- [ ] Authorization runs on every update request regardless of field changes
- [ ] Update with invalid route parameter fails gracefully
