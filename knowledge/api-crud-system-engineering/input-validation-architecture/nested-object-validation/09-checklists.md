# Nested Object Validation — Checklists

## Structure Design
- [ ] Nesting limited to 2 levels maximum
- [ ] Dot notation used for named nested properties
- [ ] Wildcard notation (`*`) used for uniform array items
- [ ] Array parent field has explicit `array` rule
- [ ] Array min/max size enforced with `min:N` and `max:N`

## Implementation
- [ ] All nested property paths use dot notation (no manual concatenation)
- [ ] Wildcard rules validate fields across all items uniformly
- [ ] `present` rule used for nested fields that must exist but may be null
- [ ] Error messages use full dotted paths for client mapping
- [ ] Update requests use `sometimes` for optional array fields

## Testing
- [ ] Test that nested object validation passes with valid structure
- [ ] Test that nested object validation fails with missing properties
- [ ] Test that array item validation fails for all items, not just first
- [ ] Test that error messages contain the correct dotted path
- [ ] Test that validation rejects payloads exceeding max array size
- [ ] Test null values in nested fields behave as expected
