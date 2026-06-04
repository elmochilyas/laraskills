# Anti-Patterns — Cursor Encoding Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Cursor Encoding Strategies |
| Difficulty | Intermediate |
| Category | Security Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Sequential Integers as Cursors | Critical | Medium | Code review: cursor is a plain incrementing integer |
| Encryption Applied to All Cursors | Medium | Medium | Code review: encrypted cursors used when base64 would suffice |
| Mixing Encoding Strategies Without Documentation | Medium | High | Code review: different encoding per endpoint with no documentation |
| Relying on Client to Preserve Cursor Integrity | Critical | High | Code review: no server-side cursor validation |
| Unversioned Cursor Formats | High | Medium | Code review: cursor format has no version field |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Storing Sensitive Data in Cursors | Including user IDs, emails, roles in plain base64 cursors | Data leak via base64 decoding |
| Platform-Dependent Binary Encoding | Using `pack()` with platform-specific sizes | Cursors fail on systems with different integer sizes |
| Over-Engineering Cursor Security | Encrypting all cursors when data is already in response | Prevents caching; adds overhead with no benefit |

---

## Anti-Pattern Details

### AP-CES-01: Sequential Integers as Cursors

**Description**: The cursor is a plain sequential integer — usually the primary key — sent as-is in the response and accepted directly in the next request. Clients can increment the integer to enumerate all records in the dataset, bypassing any authorization or visibility scoping. Sequential cursors also reveal the rate of growth (new signups, orders, posts) by comparing cursor values over time.

**Root Cause**: Convenience. The primary key is already unique and sequential, so it seems natural to use it as the cursor.

**Impact**:
- Complete dataset enumeration: client can fetch every record sequentially
- Growth rate leakage: cursor value differences reveal insertion rates
- No opacity: client knows exact record positions and IDs
- Authorization bypass if cursor is used without ownership validation

**Detection**:
- Code review: cursor is passed directly as `$request->input('cursor')` and used in `WHERE id > ?`
- Code review: no encoding, signing, or encryption layer around the cursor value
- Response inspection: cursor field in response is a small integer

**Solution**:
- Use opaque multi-field cursors (encode sort column values)
- Never expose raw primary keys as cursors
- Sign or encrypt the cursor to prevent client manipulation

**Example**:
```php
// BEFORE: Sequential integer cursor
public function index(Request $request): JsonResponse
{
    $cursor = $request->input('cursor', 0);
    $posts = Post::where('id', '>', $cursor)->orderBy('id')->take(15)->get(); // ❌ enumerable
    return response()->json([
        'data' => $posts,
        'meta' => ['next_cursor' => $posts->last()?->id],
    ]);
}

// AFTER: Opaque encoded cursor
public function index(Request $request): JsonResponse
{
    $posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
    return response()->json([
        'data' => PostResource::collection($posts),
        'meta' => [
            'next_cursor' => $posts->nextCursor()?->encode(), // ✅ opaque
            'has_more' => $posts->hasMorePages(),
        ],
    ]);
}
```

---

### AP-CES-02: Encryption Applied to All Cursors

**Description**: Every cursor is encrypted using a strong cipher regardless of whether the cursor contains sensitive data. Since encrypted cursors produce unique values per encoding (due to initialization vectors/nonces), responses cannot be cached at the CDN or reverse proxy layer. For cursors that only contain record IDs and timestamps — data already visible in the response body — encryption adds overhead with zero security benefit.

**Root Cause**: Security over-application. "Encrypt everything" policies applied without considering the actual threat model.

**Impact**:
- CDN and reverse proxy caching is impossible (encrypted cursors differ per response)
- Response payload size increases by 100-200 bytes per cursor
- Key rotation complexity: old cursors become invalid when keys rotate
- No performance benefit over HMAC signing for integrity-only requirements

**Detection**:
- Code review: `Crypt::encryptString()` or `openssl_encrypt()` used for cursor encoding
- Code review: cursors contain only `id` and `created_at` but are encrypted
- Performance testing: cache hit ratio is zero for paginated responses

**Solution**:
- Use base64 JSON encoding (opaque but cacheable) for cursors with non-sensitive data
- Use HMAC signing for integrity when caching is needed
- Reserve encryption for cursors that contain sensitive data (authorization scopes, user IDs)

**Example**:
```php
// BEFORE: Over-encrypted cursor
$cursor = Crypt::encryptString(json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z'])); // ❌ prevents caching

// AFTER: Appropriate strategy based on content
// For non-sensitive data (IDs, timestamps already in response):
$cursor = base64_encode(json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z'])); // ✅ cacheable

// For integrity-only requirement:
$cursor = base64_encode(json_encode($payload) . '.' . hash_hmac('sha256', json_encode($payload), $key)); // ✅ cacheable, tamper-proof

// Only encrypt if cursor contains sensitive data:
$cursor = Crypt::encryptString(json_encode(['user_id' => $user->id, 'scope' => 'admin']));
```

---

### AP-CES-03: Mixing Encoding Strategies Without Documentation

**Description**: Different endpoints use different cursor encoding strategies — one uses base64 JSON, another uses encrypted tokens, a third uses HMAC-signed values — with no documentation or consistency. Clients must guess or reverse-engineer the encoding format per endpoint. The API contract is implicit, undocumented, and inconsistent.

**Root Cause**: No API-wide encoding standard. Different developers implement cursor pagination independently.

**Impact**:
- Clients need endpoint-specific cursor parsing logic
- Debugging is harder: each endpoint's cursors look different
- New endpoints may choose yet another encoding strategy
- No centralized cursor decode/validation logic

**Detection**:
- Code review: cursor encoding logic repeated differently in multiple controllers
- Code review: no shared cursor encoder class or service
- Integration tests: different cursor formats across endpoints

**Solution**:
- Standardize one encoding strategy per API version
- Create a shared `CursorEncoder` class used by all endpoints
- Document the encoding strategy in the API reference

**Example**:
```php
// BEFORE: Inconsistent encoding across endpoints
// PostsController: base64_encode(json_encode($data))
// UsersController: Crypt::encryptString(json_encode($data))
// CommentsController: custom binary pack format

// AFTER: Centralized encoder
class CursorEncoder
{
    public function encode(array $data): string
    {
        return base64_encode(json_encode(['v' => 1] + $data));
    }

    public function decode(string $cursor): array
    {
        $decoded = json_decode(base64_decode($cursor), true);
        if (!$decoded || !isset($decoded['v'])) {
            throw new InvalidCursorException('Invalid cursor format.');
        }
        return $decoded;
    }
}

// All endpoints use the same encoder:
$cursor = app(CursorEncoder::class)->encode(['id' => $post->id, 'created_at' => $post->created_at]);
```

---

### AP-CES-04: Relying on Client to Preserve Cursor Integrity

**Description**: The server sends a cursor to the client but performs no validation when the client returns it. The cursor is accepted as-is, decoded, and used in a SQL WHERE clause. Since base64 is trivially decoded and modified, any client can alter cursor values to manipulate pagination — skipping records, enumerating data, or probing for access control bypasses.

**Root Cause**: Trusting the client. The developer assumes clients will not modify cursor values.

**Impact**:
- Clients can manipulate cursor values to skip or repeat pages
- Tampered cursors may cause SQL errors or unexpected results
- No mechanism to detect cursor tampering
- Attackers can probe for authorization bypasses via cursor manipulation

**Detection**:
- Code review: cursor decoded and used without integrity check
- Code review: no HMAC, signature, or encryption on cursor values
- Security testing: modifying cursor value and observing unexpected results

**Solution**:
- Always validate cursor format and integrity on the server
- Use HMAC signing or encryption to prevent tampering
- Return 400 for invalid or tampered cursors, never 500

**Example**:
```php
// BEFORE: No integrity check
public function index(Request $request): JsonResponse
{
    $cursor = $request->input('cursor');
    $data = json_decode(base64_decode($cursor), true); // ❌ no tamper detection
    // ...
}

// AFTER: Integrity validation
public function index(Request $request): JsonResponse
{
    try {
        $cursor = $this->cursorEncoder->decode($request->input('cursor'));
    } catch (InvalidCursorException $e) {
        return response()->json(['error' => 'Invalid cursor'], 400); // ✅ detected tampering
    }
    // ... use validated cursor data
}

// With HMAC signing:
public function encode(array $data): string
{
    $payload = base64_encode(json_encode($data));
    $signature = hash_hmac('sha256', $payload, config('app.key'));
    return $payload . '.' . $signature;
}

public function decode(string $cursor): array
{
    $parts = explode('.', $cursor);
    if (count($parts) !== 2) {
        throw new InvalidCursorException('Invalid cursor format');
    }
    [$payload, $signature] = $parts;
    if (!hash_equals(hash_hmac('sha256', $payload, config('app.key')), $signature)) {
        throw new InvalidCursorException('Tampered cursor');
    }
    return json_decode(base64_decode($payload), true);
}
```

---

### AP-CES-05: Unversioned Cursor Formats

**Description**: The cursor encoding format has no version field. When the encoding strategy needs to change — different sort columns, different encryption key, different serialization format — all in-flight cursors from clients become invalid. Clients that cached cursors or stored them in bookmarks will receive errors when using old cursors after the format change.

**Root Cause**: Short-term thinking. The developer assumes the encoding format will never change.

**Impact**:
- Every format change breaks all outstanding client cursors
- Clients with cached cursors (browser storage, mobile app state) get errors
- Cannot gradually migrate from one format to another
- All clients must be updated simultaneously with the format change

**Detection**:
- Code review: cursor encoder has no version field in the encoded payload
- Code review: cursor decode logic has only one code path — no version dispatching
- Bug reports: "pagination broke after the last deployment"

**Solution**:
- Always include a version field (`v`) in the cursor payload from day one
- Support decoding multiple versions during migration periods
- Version the cursor encoder interface for future extensibility

**Example**:
```php
// BEFORE: Unversioned cursor
$cursor = base64_encode(json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z']));
// ❌ no version — can't tell which format this is

// AFTER: Versioned cursor from day one
$cursor = base64_encode(json_encode([
    'v' => 1,
    'id' => 15,
    'created_at' => '2026-06-01T00:00:00Z',
]));

// Decode with version support:
public function decode(string $cursor): array
{
    $data = json_decode(base64_decode($cursor), true);
    return match ($data['v'] ?? 1) {
        1 => $this->decodeV1($data),
        2 => $this->decodeV2($data),
        default => throw new InvalidCursorException('Unknown cursor version'),
    };
}
```
