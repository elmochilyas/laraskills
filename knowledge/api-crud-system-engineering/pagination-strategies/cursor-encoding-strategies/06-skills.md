# Skill: Encode Cursor Values as Opaque, Tamper-Evident Strings
## Purpose
Transform pagination cursor values into opaque, tamper-evident strings that conceal the underlying sort column and value, preventing clients from guessing or manipulating cursor ordering.
## When To Use
Cursor-based pagination on public APIs; when cursor values must not reveal DB column names or IDs; when cursor manipulation by clients must be detected.
## When NOT To Use
Internal APIs (trusted clients); offset pagination; when cursor transparency is acceptable (admin panels).
## Prerequisites
Cursor Pagination Design; PHP base64/JSON encoding; HMAC signing basics.
## Inputs
Sort column name; sort value (ID, timestamp, etc.); sorting direction; secret signing key (APP_KEY).
## Workflow
1. Build an associative array with `column`, `value`, and optional `direction`
2. JSON-encode the array into a string
3. Base64url-encode the JSON string (no padding, URL-safe)
4. Optionally append an HMAC signature to detect tampering
5. Combine encoded payload and signature with a delimiter
6. In the decode step, split, verify HMAC, base64-decode, JSON-decode
7. Extract `column`, `value`, and `direction` for the WHERE clause
8. Validate the decoded values against allowed sort columns whitelist
## Validation Checklist
- [ ] Cursor payload is JSON → base64url → (optionally HMAC-signed)
- [ ] Decoded cursor is validated against an allowed-column whitelist
- [ ] Tampered cursor (invalid HMAC, malformed JSON) returns 400 error
- [ ] Sorting direction is encoded in and decoded from the cursor
- [ ] Cursor does not expose raw DB column names in readable form
- [ ] Encoding/decoding is handled by a dedicated Cursor class or service
## Common Failures
- Base64 padding (`=`) breaks URL parameter parsing
- Missing HMAC verification — clients can forge cursors with arbitrary sort values
- Encoding without direction — cursor points to wrong position when sorting direction changes
- Storing raw column names in cursor without encoding
- Not validating decoded cursor values against allowed columns
## Decision Points
- HMAC-signed vs unsigned cursors (signed for public APIs, unsigned for internal)
- per-page encoding in cursor vs fixed server-side per-page
- Single-column vs multi-column cursor encoding
## Performance/Security Considerations
Encoding/decoding is sub-millisecond. Security: HMAC prevents cursor forgery; allowed-column whitelist prevents column injection; opaque encoding prevents information leakage.
## Related Rules/Skills
Cursor Pagination Design; Multi-Column Cursor Pagination; Pagination Parameter Validation.
## Success Criteria
Cursors are opaque, tamper-evident, decode correctly to the original column/value/direction, and reject malformed or tampered input with a 400 error.
