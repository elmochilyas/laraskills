# Validation Skip on Null Update — Checklists

## Null Semantics
- [ ] Null semantics defined per field: "clear" vs "don't update"
- [ ] API documentation explicitly states null behavior for each nullable field
- [ ] DB column nullability matches API null semantics
- [ ] No ambiguity between null-as-action and null-as-omission

## Implementation
- [ ] `nullable` used for fields where null is a valid value (clears the field)
- [ ] `sometimes` without `nullable` used for optional fields where null is not valid
- [ ] `present` used for fields that must be explicitly included even if null
- [ ] Null-to-absent conversion in `prepareForValidation()` only for fields with "don't update" semantics
- [ ] `offsetUnset()` used for null-to-absent conversion
- [ ] Empty string vs null normalization consistent across all endpoints

## Protection
- [ ] No blanket null-to-absent conversion — per-field semantics respected
- [ ] No `nullable` on NOT NULL DB columns
- [ ] Null-to-absent conversions logged in development
- [ ] Clients are explicitly told to omit fields rather than send null when null means "don't update"
- [ ] Null updates on nested objects follow same semantic rules

## Testing
- [ ] Test null update on nullable field stores null correctly
- [ ] Test null update on non-nullable field returns validation error
- [ ] Test absent field on optional field passes validation
- [ ] Test null-to-absent conversion skips field update
- [ ] Test `present` rule requires field presence even if null
- [ ] Test empty string normalization (if applicable)
- [ ] Test nested null handling matches field-level semantics
