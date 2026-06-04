# Cursor Encoding Strategies — Phase 5 Rules

## Version Cursors From Day One
---
## Category
Maintainability | Scalability
---
## Rule
Always include a version field in every cursor payload before deploying to production.
---
## Reason
Without a version field, changing the encoding strategy breaks all in-flight cursors, forcing clients to re-paginate from the start or experience errors.
---
## Bad Example
```php
// Unversioned cursor — impossible to change format later
$cursor = base64_encode(json_encode(['id' => 15, 'created_at' => '2026-01-01']));
```
---
## Good Example
```php
// Versioned cursor — supports future format migrations
$cursor = base64_encode(json_encode(['v' => 1, 'id' => 15, 'created_at' => '2026-01-01']));
```
---
## Exceptions
Internal-only APIs where all clients are deployed simultaneously can skip versioning.
---
## Consequences Of Violation
Breaking existing pagination sessions on format change; forced simultaneous client updates.
---

## Keep Cursors Opaque to Clients
---
## Category
Security
---
## Rule
Never rely on clients to preserve cursor integrity; always validate and verify cursors server-side before decoding.
---
## Reason
Base64 is encoding, not encryption. Clients can decode, modify, and re-encode cursors. Without server-side validation, manipulated cursors can bypass pagination boundaries or probe data.
---
## Bad Example
```php
// Blindly decoding without validation
$decoded = json_decode(base64_decode($request->cursor));
$results = Post::where('id', '>', $decoded->id)->limit(15)->get();
```
---
## Good Example
```php
// Validate structure and integrity before use
try {
    $decoded = json_decode(base64_decode($request->cursor), flags: JSON_THROW_ON_ERROR);
} catch (JsonException) {
    abort(400, 'Malformed cursor.');
}
if (! isset($decoded->v, $decoded->id)) {
    abort(400, 'Invalid cursor structure.');
}
```
---
## Exceptions
Internal APIs on trusted networks with no sensitive data may skip validation for performance.
---
## Consequences Of Violation
Cursor manipulation attacks; data enumeration; authorization bypass.
---

## Never Encode Sensitive Data in Base64 Cursors
---
## Category
Security
---
## Rule
Never include PII, credentials, roles, or authorization-relevant data in plaintext base64 cursors.
---
## Reason
Base64 is trivially decoded by any client. Sensitive data in cursors is a data leak equivalent to putting it in a URL query string.
---
## Bad Example
```php
$cursor = base64_encode(json_encode(['user_id' => auth()->id(), 'role' => 'admin', 'id' => 15]));
```
---
## Good Example
```php
// Encrypt the cursor if it must carry sensitive context
$cursor = Crypt::encryptString(json_encode(['scope' => 'admin', 'id' => 15]));

// Or better: encode only sort values, never auth data
$cursor = base64_encode(json_encode(['id' => 15, 'created_at' => now()]));
```
---
## Exceptions
When cursors are encrypted (not base64) and decryption keys are properly managed.
---
## Consequences Of Violation
Data exposure; regulatory non-compliance (GDPR, HIPAA); reputational damage.
---

## Sign for Integrity, Encrypt Only When Necessary
---
## Category
Performance | Security
---
## Rule
Prefer HMAC signing over full encryption for cursors when integrity is the only concern.
---
## Reason
Encrypted cursors produce unique values per encoding (due to IV/nonce), making response caching impossible. HMAC signing produces deterministic values, preserving cacheability while still detecting tampering.
---
## Bad Example
```php
// Full encryption when only tamper detection is needed
$cursor = Crypt::encryptString(json_encode(['id' => 15, 'created_at' => '2026-01-01']));
// Cache layer never matches — every response has a unique cursor
```
---
## Good Example
```php
// HMAC signing for tamper detection; encrypt only if cursor contains sensitive data
$payload = base64_encode(json_encode(['id' => 15, 'created_at' => '2026-01-01']));
$signature = hash_hmac('sha256', $payload, config('app.cursor_key'));
$cursor = $payload . '.' . $signature;
```
---
## Exceptions
Encrypt when the cursor itself carries data that must remain confidential (authorization scopes, internal IDs).
---
## Consequences Of Violation
Prevented response caching; increased latency; unnecessary encryption overhead.
---

## Use Laravel's Built-in Cursor Encoding by Default
---
## Category
Framework Usage | Maintainability
---
## Rule
Prefer `Illuminate\Pagination\Cursor` and `cursorPaginate()` for cursor encoding unless there is an explicit security or bandwidth requirement for a custom strategy.
---
## Reason
Laravel's built-in encoding handles base64 JSON format, versioning, and decode validation. Custom encoding adds maintenance burden, testing surface, and potential for implementation bugs.
---
## Bad Example
```php
// Custom encoding for every project from scratch
class CustomCursorEncoder {
    public function encode(array $params): string { /* manual impl */ }
    public function decode(string $cursor): array { /* manual impl */ }
}
```
---
## Good Example
```php
// Laravel handles encoding, decoding, and validation automatically
$posts = Post::orderBy('created_at', 'desc')->cursorPaginate(15);
$nextCursor = $posts->nextCursor(); // Managed by Laravel
```
---
## Exceptions
Custom encoding is justified when: (a) encryption is required, (b) binary encoding is needed for bandwidth, (c) backward compatibility with an existing custom format.
---
## Consequences Of Violation
Unnecessary code maintenance; higher bug surface; inconsistent encoding behavior across the API.
---

## Isolate Custom Encoding Behind a Dedicated Service Class
---
## Category
Code Organization
---
## Rule
When implementing custom cursor encoding, encapsulate `encode()` and `decode()` in a dedicated `CursorEncoder` service class with unit tests.
---
## Reason
Isolating encoding logic from pagination logic enables independent testing, simplifies format migrations, and prevents encoding concerns from leaking into controllers or models.
---
## Bad Example
```php
// Encoding logic scattered in the controller
public function index(Request $request) {
    $decoded = json_decode(base64_decode($request->cursor));
    // pagination logic mixed with encoding logic
    $cursor = base64_encode(json_encode(['id' => $lastId]));
}
```
---
## Good Example
```php
class EncryptedCursorEncoder {
    public function encode(array $params): string { /* ... */ }
    public function decode(string $cursor): array { /* ... */ }
}

public function index(Request $request, EncryptedCursorEncoder $encoder) {
    $params = $encoder->decode($request->cursor);
    // controller only handles pagination
}
```
---
## Exceptions
Laravel's built-in `Cursor` class is already a dedicated service — no wrapper needed.
---
## Consequences Of Violation
Scattered encoding logic; difficult to test; high-risk when format changes.
---

## Encode Only Sort Column Values, Not Full Records
---
## Category
Performance | Security
---
## Rule
Include only the sort column values needed for the WHERE clause in the cursor payload, never full record data.
---
## Reason
Smaller cursors reduce URL length and response size; encoding less data exposes less surface for information leakage.
---
## Bad Example
```php
$cursor = base64_encode(json_encode(Post::find($lastId)->toArray()));
// Entire record serialized into cursor — bloated and insecure
```
---
## Good Example
```php
$cursor = base64_encode(json_encode([
    'id' => $lastId,
    'created_at' => $lastRecord->created_at->toIso8601String(),
]));
// Only sort columns needed for the WHERE clause
```
---
## Exceptions
When the cursor is encrypted and full-record preloading provides measurable performance benefit.
---
## Consequences Of Violation
Cursor bloat; unnecessary data exposure; increased bandwidth usage.
---

## Include a Key Identifier When Using Encryption
---
## Category
Maintainability | Security
---
## Rule
Always include a `kid` (key identifier) field in encrypted cursors to support key rotation.
---
## Reason
Without a key identifier, rotating encryption keys breaks all in-flight cursors. With `kid`, the decoder can select the correct key from a key ring, enabling graceful rotation.
---
## Bad Example
```php
// No key identifier — rotating the key breaks all cursors
$cursor = Crypt::encryptString(json_encode(['id' => 15]));
```
---
## Good Example
```php
// Key identifier enables rotation — old keys still decrypt existing cursors
$cursor = Crypt::encryptString(json_encode([
    'kid' => 1,
    'id' => 15,
]));
// During rotation, keep key 1 active; new cursors use key 2
```
---
## Exceptions
When cursors have a very short TTL (minutes) and keys are never rotated.
---
## Consequences Of Violation
All in-flight cursors become undecodable after key rotation; forced client interruption.
---

## Handle Decode Failures Gracefully With 400 Responses
---
## Category
Reliability | Security
---
## Rule
Wrap cursor decode operations in try-catch and return HTTP 400 with a clear error message for malformed cursors, never exposing internal error details.
---
## Reason
Exposing decode internals (stack traces, encryption key hints, format details) aids attackers. A consistent 400 response tells clients their cursor is invalid without revealing implementation details.
---
## Bad Example
```php
try {
    $data = $this->decodeCursor($request->cursor);
} catch (\Exception $e) {
    abort(500, 'Decryption failed: ' . $e->getMessage()); // Leaks internals
}
```
---
## Good Example
```php
try {
    $data = $this->decodeCursor($request->cursor);
} catch (\Exception $e) {
    Log::warning('Cursor decode failed', ['error' => $e->getMessage()]);
    abort(400, 'The provided cursor is invalid or expired.');
}
```
---
## Exceptions
Development environments may expose details for debugging.
---
## Consequences Of Violation
Information leakage; attacker reconnaissance; inconsistent error responses confuse clients.
---

## Keep Cursor Size Under 256 Characters
---
## Category
Performance | Reliability
---
## Rule
Design cursor encoding to keep payloads under 256 characters to avoid URL length limits and response bloat.
---
## Reason
Large cursors (>300 chars) can approach URL length limits in some clients and proxies (IE 2083 chars, some CDNs 2048). Cursors also appear in Link headers where header size limits may apply.
---
## Bad Example
```php
// Cursor with excessive data — bloated to 400+ characters
$cursor = Crypt::encryptString(json_encode([
    'id' => 15,
    'created_at' => '2026-01-01T00:00:00Z',
    'updated_at' => '2026-01-02T00:00:00Z',
    'user_id' => 42,
    'category' => 'technology',
    'status' => 'published',
    'sort_order' => 3,
]));
```
---
## Good Example
```php
// Compact cursor — only essential sort columns
$cursor = base64_encode(json_encode([
    'id' => 15,
    'created_at' => '2026-01-01T00:00:00Z',
]));
```
---
## Exceptions
Encrypted cursors may exceed 256 chars; document the maximum expected size and test with target clients.
---
## Consequences Of Violation
Truncated URLs; header parsing failures; increased response size and latency.
