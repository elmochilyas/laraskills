# Real Time Input Validation — Checklists

## Architecture
- [ ] Server-side validation on submit is the authoritative layer
- [ ] Client-side validation is used for UX only, never for security
- [ ] Appropriate debounce timing configured per validation type
- [ ] Submit button disabled until all real-time checks pass

## Implementation
- [ ] Livewire `updated` hook used for per-field validation
- [ ] Debounce 150-300ms for format-only checks
- [ ] Debounce 500-750ms for DB-backed checks
- [ ] `.blur` modifier considered for non-interactive fields
- [ ] Field-level error messages returned to UI
- [ ] Generic "already taken" message for uniqueness checks
- [ ] Rate limiting applied to uniqueness validation endpoints

## Security
- [ ] No DB state revealed through distinct error messages
- [ ] Client-side validation bypass does not affect data integrity
- [ ] Submit-time validation is always enforced
- [ ] Race conditions handled (data changed between real-time check and submit)

## Testing
- [ ] Test real-time validation passes with valid input
- [ ] Test real-time validation fails with invalid input
- [ ] Test submit-time validation catches bypassed real-time checks
- [ ] Test debounce reduces request volume
- [ ] Test uniqueness enumeration is prevented
