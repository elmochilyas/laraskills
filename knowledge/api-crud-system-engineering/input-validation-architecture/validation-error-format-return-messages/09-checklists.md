# Validation Error Format & Return Messages — Checklists

## Format Consistency
- [ ] Base FormRequest class enforces consistent error format across all endpoints
- [ ] Error format matches API contract specification
- [ ] Same format used for validation, business, and system errors
- [ ] Request/correlation ID included in error responses
- [ ] No stack traces or internal paths exposed in production

## Security
- [ ] No validation rule internals leaked in error messages
- [ ] Authentication endpoints use first-error-only mode
- [ ] Generic messages used instead of rule-specific details
- [ ] `APP_DEBUG=false` in production environment
- [ ] Error response size is bounded (no unbounded error lists)

## Implementation
- [ ] `messages()` overridden with custom, client-actionable messages
- [ ] `:attribute` placeholder used for field name references
- [ ] Internationalization support via lang files if multi-language required
- [ ] All-form-errors mode for UI clients (forms)
- [ ] First-error-only mode for programmatic clients

## Testing
- [ ] Contract tests validate error response shape
- [ ] Test that custom messages replace default messages
- [ ] Test that no validation rule details leak in messages
- [ ] Test that error format is consistent across all endpoints
- [ ] Test that correlation ID is present in error responses
- [ ] Test both single-error and all-errors modes
