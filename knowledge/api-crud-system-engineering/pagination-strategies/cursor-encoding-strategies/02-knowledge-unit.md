# Cursor Encoding Strategies

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Cursor Encoding Strategies
- **Last Updated:** 2026-06-02

---

## Executive Summary

A cursor is an opaque token that encodes the position of a record in a sorted dataset. The encoding strategy determines the cursor's debuggability, security properties, size, and compatibility across API versions. Common approaches include base64-encoded JSON (readable, debuggable), encrypted tokens (secure, tamper-proof), hashed/signed cursors (integrity-checked), and compact binary encodings (small payloads). The choice depends on whether clients need to inspect cursors, whether cursor tampering is a threat, and how large cursors can be.

---

## Core Concepts

### Opaque Token
The cursor must be opaque to clients — they cannot derive meaning from its content or infer relationships between cursors. Opaqueness prevents clients from manipulating the cursor to access unauthorized data or skip records.

### Deterministic Encoding
The same record position must always produce the same cursor value (within the same encoding session). Determinism enables caching, idempotent retries, and consistent bookmarking.

### Decode/Encode Round-Trip
The encoding must preserve all fields needed to reconstruct the SQL `WHERE` clause. Lossy encoding (e.g., truncating timestamps) produces incorrect pagination results.

---

## Mental Models

### The Voucher Model
A cursor is like a store voucher with an encoded value. The customer doesn't know (or need to know) how much is on it — they just present it and get the next page. The store validates the voucher's authenticity.

### The Envelope Model
The cursor is an envelope containing the position data. You can either seal it with tape (base64 — easy to open), lock it with a key (encryption — secure), or stamp it with a wax seal (signature — tamper-evident).

### The Ticket Stub Model
Like a numbered ticket stub that identifies your place in line. The number alone is meaningless to others, but the system can look up where you are. The stub format determines how easy it is to forge a different position.

---

## Internal Mechanics

### Base64-Encoded JSON (Laravel Default)
```php
// Encoding
$cursor = [
    'id' => 15,
    'created_at' => '2026-06-01T00:00:00Z',
];
$encoded = base64_encode(json_encode($cursor));
// => "eyJpZCI6MTUsImNyZWF0ZWRfYXQiOiIyMDI2LTA2LTAxVDAwOjAwOjAwWiJ9"

// Decoding
$decoded = json_decode(base64_decode($encoded), true);
// => ['id' => 15, 'created_at' => '2026-06-01T00:00:00Z']
```

Size overhead: ~50% larger due to base64. JSON keys add bytes. A typical 3-field cursor is ~80–120 characters.

### Encrypted Cursor
```php
use Illuminate\Support\Facades\Crypt;

// Encoding
$cursor = Crypt::encryptString(json_encode([
    'id' => 15, 'created_at' => '2026-06-01T00:00:00Z'
]));

// Decoding
$decoded = json_decode(Crypt::decryptString($cursor), true);
```

Size: ~200–300 characters due to encryption overhead + IV. Tamper-proof — decryption fails on modification.

### Signed Cursor (HMAC)
```php
$payload = json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z']);
$signature = hash_hmac('sha256', $payload, config('app.key'));
$cursor = base64_encode($payload . '.' . $signature);

// Verify
[$data, $sig] = explode('.', base64_decode($cursor), 2);
if (!hash_equals(hash_hmac('sha256', $data, config('app.key')), $sig)) {
    abort(400, 'Invalid cursor');
}
```

Size: ~base64 payload + 44-char signature. Tamper-evident (detectable).

### Binary Encoding
```php
// Pack integers and timestamps as binary
$binary = pack('Q', $record->id) . pack('J', $record->created_at->timestamp);
$cursor = base64_encode($binary);
// Size: 8 bytes (int) + 8 bytes (timestamp) = 16 bytes → ~24 base64 chars
```

Fastest encode/decode, smallest size. Not human-readable. Requires fixed-field format.

---

## Patterns

### Laravel-Compatible Cursor
Use Laravel's built-in cursor encoding for consistency:
```php
$paginator = Post::cursorPaginate(15);
$nextCursor = $paginator->nextCursor(); // Illuminate\Pagination\Cursor instance
(string) $nextCursor; // base64-encoded
```

### Custom Encoder Class
```php
class CursorEncoder
{
    public function encode(array $position): string
    {
        return base64_encode(json_encode($position));
    }

    public function decode(string $cursor): array
    {
        $decoded = json_decode(base64_decode($cursor), true);
        if (!$decoded || !isset($decoded['id'])) {
            throw new InvalidCursorException();
        }
        return $decoded;
    }
}
```

### Versioned Cursor Format
Include a version byte/field for forward compatibility:
```php
$cursor = [
    'v' => 2,
    'id' => 15,
    'created_at' => '2026-06-01T00:00:00Z',
    'sort_order' => 'desc',
];
```
Old cursors can be decoded by checking the version field and applying the appropriate format.

---

## Architectural Decisions

### Base64 vs Encrypted vs Signed

| Strategy | Use Case |
|---|---|
| Base64 (plain) | Internal APIs, debugging allowed, no security concerns |
| Encrypted | Public APIs, cursor contains sensitive data, must prevent tampering |
| Signed | Public APIs, need tamper detection but don't need secrecy |
| Binary | Mobile APIs, bandwidth-constrained, minimum payload size |

### Cursor Size Budget
Keep cursors under 256 characters. Large cursors bloat response payloads and may exceed URL length limits when used as query parameters (especially with other query params).

### Cacheability
If cursors are encrypted, caching paginated responses is impossible because each cursor is unique. Plain base64 cursors with the same position produce the same string, enabling response caching.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Base64 is human-readable and debuggable | Clients can decode and manipulate cursors | Manual cursor manipulation can cause unexpected behavior |
| Encryption prevents all tampering | Larger cursors, cannot cache responses | Each cursor request is uncacheable |
| Signatures detect tampering without encryption overhead | Signature verification adds CPU cost | Negligible (< 0.1ms per request) |
| Binary encoding is the smallest | Not debuggable, format changes require versioning | Harder to migrate cursor formats |

---

## Performance Considerations

### Encode/Decode Benchmarks
- Base64 JSON: ~0.01ms encode, ~0.01ms decode
- Encrypted (AES-256): ~0.1ms encode, ~0.1ms decode
- Signed (HMAC-SHA256): ~0.02ms sign, ~0.02ms verify
- Binary pack: ~0.001ms encode, ~0.001ms decode

All are negligible compared to database query time (1–100ms).

### Cursor Size Impact on URL Length
For `GET` requests, the cursor is in the query string. A 300-character cursor plus other parameters may approach URL length limits (2048 chars in some clients/proxies). Use `POST` for cursor pagination with very large cursors, or switch to binary encoding.

---

## Production Considerations

### Cursor Validation
Always validate cursor format on decode. Return 400 for malformed cursors:
```php
try {
    $position = $encoder->decode($cursor);
} catch (InvalidCursorException $e) {
    return response()->json(['message' => 'Invalid cursor'], 400);
}
```

### Cursor Rotation
Rotate encryption keys periodically. Old keys must still be able to decrypt existing cursors until they expire. Use key identifiers in the cursor:
```php
$cursor = [
    'kid' => '2026-q1',
    'id' => 15,
];
```

### Log Cursor Decode Failures
Monitor cursor decode failure rates. A spike may indicate:
- Client bugs constructing cursors manually
- CSRF / enumeration attacks
- Format mismatch after deployment

---

## Common Mistakes

### Storing Sensitive Data in Cursors
Why it happens: Developers include user IDs, email addresses, or roles in the cursor for convenience. Why it's harmful: Base64 is not encryption — cursors are visible to anyone who can make API requests. Better approach: Never include sensitive data in cursors. If necessary, encrypt the cursor.

### Using Unversioned Cursor Formats
Why it happens: The initial cursor format seems permanent. Why it's harmful: When the sort columns change or the encoding strategy is upgraded, all existing cursors become invalid, breaking clients with outstanding cursors. Better approach: Include a version field from day one.

### Over-Engineering Cursor Security
Why it happens: Security teams mandate encryption for all tokens. Why it's harmful: Encryption prevents caching and adds complexity for no benefit when the cursor contains only record IDs and timestamps — data already visible in the API response. Better approach: Sign cursors for integrity; encrypt only if the cursor contains sensitive data.

---

## Failure Modes

### Decryption Key Rotation Breakage
When encryption keys are rotated, old cursors fail to decrypt. Maintain previous keys in a key ring for a grace period.

### Cursor Format Migration
Changing from base64 to encrypted format breaks all in-flight cursors. Implement versioned cursors and support both formats during a transition period.

### Integer Overflow in Binary Encoding
Using platform-dependent integer sizes (pack('L') on 32-bit PHP) causes decode failures when cursors are created on 64-bit systems and decoded on 32-bit. Always use platform-independent formats (64-bit, big-endian).

---

## Ecosystem Usage

### Laravel
`Illuminate\Pagination\Cursor` — base64-encoded JSON with `order` and `parameters` fields. Uses `cursor()` helper and `forPageAfterId()` / `forPageBeforeId()` for simple ID-based pagination.

### Stripe
Stripe uses raw record IDs as cursor values (`starting_after=cus_xxx`). No encoding or encryption. Relies on record IDs being non-sequential and opaque.

### GitHub
GitHub uses record IDs directly in `?page=1&per_page=30` for most endpoints. For event streams, uses `?since=epoque_timestamp` — effectively a cursor.

---

## Related Knowledge Units

### Prerequisites
- Cursor Pagination Design — The cursor concept and where it fits

### Related Topics
- API Security — Token handling, encryption, key management
- Data Serialization — JSON encoding/decoding best practices

### Advanced Follow-up Topics
- Multi-Column Cursor Pagination — Composite cursor contents
- Pagination Link Headers — Encoding cursors in HTTP Link headers

---

## Research Notes

### Source Analysis
- Laravel source: `Illuminate/Pagination/Cursor.php` — demonstrates base64 JSON encoding
- Stripe API reference: Cursor-based pagination with opaque strings
- OWASP: Token handling guidelines

### Key Insight
The best cursor encoding strategy is the simplest one that meets your security requirements. For most APIs, plain base64-encoded JSON is sufficient. Add signatures only when cursor tampering is a real threat (e.g., cursors encode pricing tiers or access levels). Add encryption only when cursors contain data that must not be visible.

### Version-Specific Notes
- Laravel 9–11: Cursor format unchanged
- Laravel cursor uses ordered parameters with the sort column as a key
