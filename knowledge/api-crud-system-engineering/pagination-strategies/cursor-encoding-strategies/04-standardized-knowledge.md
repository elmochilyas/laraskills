| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Cursor Encoding Strategies |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Cursor Pagination Design, API Security |
| **Metadata** | Standards | RFC 5988, OWASP Token Handling |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Cursor encoding strategies determine how pagination cursors are formatted, secured, and transmitted. The choice of encoding — base64 JSON, encrypted tokens, HMAC-signed payloads, or compact binary — affects cursor debuggability, tamper resistance, payload size, cacheability, and compatibility across API versions. The strategy must balance transparency for debugging against security requirements such as tamper prevention and data confidentiality.

## Core Concepts

- **Opaque Token**: Cursors must be opaque to clients; they cannot derive meaning or infer relationships between cursor values.
- **Deterministic Encoding**: The same record position always produces the same cursor value, enabling caching and idempotent retries.
- **Decode/Encode Round-Trip**: Encoding must preserve all fields needed to reconstruct the SQL WHERE clause. Lossy encoding produces incorrect pagination.
- **Key Rotation**: Encryption keys must be rotated periodically; old keys must still decrypt existing cursors until they expire.
- **Cursor Versioning**: A version field allows forward compatibility when encoding format changes.

## When To Use

- **Base64 JSON**: Internal APIs, debugging allowed, no security concerns, maximum transparency.
- **Encrypted Cursor**: Public APIs, cursor contains sensitive data, must prevent any tampering.
- **Signed Cursor (HMAC)**: Public APIs, need tamper detection but don't need secrecy of cursor contents.
- **Binary Encoding**: Mobile APIs, bandwidth-constrained environments, minimum payload size required.

## When NOT To Use

- **Encrypted cursors** when cursors contain only record IDs and timestamps already visible in responses — encryption adds complexity and prevents caching with no security benefit.
- **Base64 plaintext** when cursor values include authorization-relevant data (e.g., user_id, role) — base64 is not encryption and exposes data to anyone who decodes it.
- **Binary encoding** when cursor format needs to change frequently — binary formats are harder to version and migrate.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always version cursors from day one | Without a version field, changing the encoding strategy breaks all in-flight cursors |
| Keep cursors under 256 characters | Large cursors bloat response payloads and may exceed URL length limits |
| Never include sensitive data in base64 cursors | Base64 is encoding, not encryption — cursors are visible to anyone |
| Use HMAC signing for integrity, encrypt only when confidentiality needed | Signing is cheaper and allows caching; encryption prevents caching and adds size |
| Encode only sort column values, not full records | Smaller cursors, less sensitive data exposure, faster encode/decode |
| Include a key identifier (kid) when using encryption | Enables key rotation without breaking existing cursors |

## Architecture Guidelines

- Prefer Laravel's built-in cursor encoding (`Illuminate\Pagination\Cursor`) for consistency and automatic handling.
- For custom encoding, create a dedicated `CursorEncoder` class with `encode()` and `decode()` methods, isolating encoding logic from pagination logic.
- Support both old and new cursor formats during migration periods by checking the version field and dispatching to the appropriate decoder.
- Use a try-catch around cursor decode operations; return HTTP 400 with a clear message for malformed cursors, never exposing internal error details.
- For APIs with multiple clients, choose the encoding strategy that satisfies the most restrictive client's security requirements.

## Performance Considerations

- Encode/decode overhead is negligible for all strategies (<0.1ms) compared to database query time (1–100ms).
- Base64 JSON and binary encoding produce deterministic cursors, enabling response caching at CDN and reverse proxy layers.
- Encrypted cursors produce unique values per encoding (due to IV/nonce), making response caching impossible.
- Cursor size impacts URL length for GET requests; very large cursors (300+ chars) may approach 2048-char URL limits in some clients and proxies.
- Binary encoding is fastest (~0.001ms encode/decode) but least debuggable; reserved for high-throughput, bandwidth-sensitive endpoints.

## Security Considerations

- **Tampering**: Plain base64 cursors can be decoded and modified by clients. Use HMAC signing to detect manipulation or encryption to prevent it.
- **Exposure**: Cursor values may reveal internal record IDs, timestamps, or ordering. If the sort order or record count is sensitive, encrypt the cursor or use opaque values.
- **Enumeration**: Sequential or predictable cursors enable clients to enumerate all records. Use opaque tokens or include multiple fields to prevent enumeration.
- **Logging**: Log cursor decode failure rates; a spike may indicate client bugs, CSRF/enumeration attacks, or format mismatch after deployment.
- **Key Management**: Rotate encryption keys periodically. Maintain previous keys in a key ring for a grace period to avoid breaking in-flight cursors.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Storing sensitive data in cursors | Convenience — including user IDs, emails, roles | Base64 is not encryption; data is exposed to anyone | Never include sensitive data; encrypt cursor if necessary |
| Using unversioned cursor formats | Assuming the format is permanent | Changing encoding breaks all outstanding cursors | Include a version field from day one |
| Over-engineering cursor security | Security team mandates encryption for all tokens | Prevents caching, adds complexity for no benefit | Sign for integrity; encrypt only if cursor contains sensitive data |
| Platform-dependent binary encoding | Using pack('L') with platform-dependent size | Cursors fail on systems with different integer sizes | Always use 64-bit big-endian platform-independent formats |

## Anti-Patterns

- **Using sequential integers as cursors**: Enables enumeration; use opaque multi-field cursors instead.
- **Applying encryption to all cursors indiscriminately**: Prevents caching and bloats payloads without security benefit when cursor data is already in the response.
- **Mixing encoding strategies across endpoints without documentation**: Confuses clients; standardize one strategy per API version.
- **Relying on client to preserve cursor integrity**: Clients can decode and modify base64 cursors; always validate on the server.

## Examples

- **Base64 JSON encoding (Laravel default)**: `base64_encode(json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z']))`
- **Encrypted cursor using Laravel Crypt**: `Crypt::encryptString(json_encode(['id' => 15]))` — tamper-proof, ~200-300 chars.
- **HMAC signed cursor**: `base64_encode(json_encode($payload) . '.' . hash_hmac('sha256', $payload, $key))` — tamper-evident.
- **Binary packed cursor**: `base64_encode(pack('Q', $id) . pack('J', $timestamp))` — ~24 chars.
- **Versioned cursor format**: Include `'v' => 2` in the cursor payload for forward compatibility.

## Related Topics

- Cursor Pagination Design — Where cursors are used and how they drive API pagination
- API Security — Token handling, encryption, key management
- Multi-Column Cursor Pagination — Composite cursor contents for multi-column sorts

## AI Agent Notes

- When generating cursor encoding code, always include validation on decode and return 400 for malformed cursors.
- Prefer Laravel's built-in cursor encoding unless there is an explicit security requirement for encryption or binary encoding.
- For new APIs, start with base64 JSON encoding and add signing/encryption only when justified by security requirements.
- If implementing custom encoding, create a dedicated service class with unit tests for encode/decode round-trip and invalid cursor handling.

## Verification

- [ ] Encode/decode round-trip works correctly for all cursor field types (int, string, datetime, uuid)
- [ ] Invalid/malformed cursors return HTTP 400 with clear error message, not 500
- [ ] Tampered signed cursors are detected and rejected (400 response)
- [ ] Encrypted cursors with expired/rotated keys return appropriate error
- [ ] Cursor versioning allows coexistence of old and new formats during migration
- [ ] URL encoding of cursors in query strings handles special characters (=, &, +)
- [ ] Maximum cursor size does not exceed documented limit (256 chars recommended)
- [ ] No sensitive data (PII, credentials, roles) is present in decoded cursor contents
