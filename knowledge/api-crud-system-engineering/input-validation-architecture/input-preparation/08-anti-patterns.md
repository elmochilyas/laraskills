# Anti-Patterns — Input Preparation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Input Preparation |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| prepareForValidation as Dumping Ground | High | Medium | Code review: all kinds of unrelated transformations in one hook |
| Modifying Input After authorize | Critical | Low | Code review: changing values that authorize() already evaluated |
| Sensitive Data Manipulation | High | Low | Code review: transforming passwords, tokens, secrets in preparation |
| Replacing Entire Input With replace | Medium | Medium | Code review: `$this->replace()` used instead of `$this->merge()` |
| Over-Sanitization | Medium | Low | Code review: removing characters users intentionally provided |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Side Effects in prepareForValidation | DB writes, job dispatches in preparation | Side effects happen even if validation fails |
| Type Coercing Without Validation | `(int)` on non-numeric = 0 | Silent data corruption |
| merge After validated Call | Merged data not reflected in validated() output | Data missing from downstream |

---

## Anti-Pattern Details

### AP-IPR-01: prepareForValidation as Dumping Ground

**Description**: The `prepareForValidation()` method accumulates every kind of input transformation — sanitization, type coercion, default injection, computed fields, audit fields, and data enrichment — all in one method. The method grows to 30+ lines with a dozen `merge()` calls, making it impossible to understand which transformations happen, in what order, and why.

**Root Cause**: Convenience. `prepareForValidation()` is the only pre-validation hook, so developers put everything there.

**Impact**:
- Transformations cannot be tested independently
- Order-dependent bugs: one `merge()` overwrites another
- New developers don't know where to add new transformations
- Audit trail lost: no documentation of what was transformed and why

**Detection**:
- Code review: `prepareForValidation()` with 5+ `merge()` calls
- Code review: method exceeds 20 lines for a single FormRequest
- Testing: no individual tests for specific transformations within the method

**Solution**:
- Extract each transformation concern to a named method
- Keep `prepareForValidation()` as a coordinator that calls named methods
- Document each transformation with a comment explaining what and why

**Example**:
```php
// BEFORE: Dumping ground
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'phone' => preg_replace('/[^0-9]/', '', $this->input('phone')),
        'slug' => Str::slug($this->input('title')),
        'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN) ?? false,
        'quantity' => (int) $this->input('quantity', 1),
        'page' => max(1, (int) $this->input('page', 1)),
        'created_by' => $this->user()->id,
    ]);
}

// AFTER: Named methods
protected function prepareForValidation(): void
{
    $this->sanitizeEmail();
    $this->sanitizePhone();
    $this->generateSlug();
    $this->coerceBooleans();
    $this->injectDefaults();
    $this->injectAuditFields();
}

protected function sanitizeEmail(): void
{
    $this->merge(['email' => strtolower(trim($this->input('email')))]);
}

protected function injectDefaults(): void
{
    $this->merge([
        'quantity' => (int) $this->input('quantity', 1),
        'page' => max(1, (int) $this->input('page', 1)),
    ]);
}
```

---

### AP-IPR-02: Modifying Input After authorize

**Description**: The `prepareForValidation()` method modifies the same input values that the `authorize()` method already used to make an access decision. For example, `authorize()` checks `$this->input('team_id')` to determine access, then `prepareForValidation()` overwrites `team_id` with a different value. The authorization decision was based on the original value, but downstream code uses the modified value.

**Root Cause**: Wrong method ordering. The developer adds authorization logic that reads input, then later adds preparation logic that changes the same input, not realizing the authorization decision is now invalid.

**Impact**:
- Authorization bypass: user can pass `team_id=1` (authorized), then preparation changes it to `team_id=2` (unauthorized)
- Audit records show the wrong actor for authorized actions
- Security policies based on input data are completely undermined
- Extremely hard to detect: the modification is "after" authorization but "before" the controller

**Detection**:
- Code review: `authorize()` reads `$this->input('team_id')` or similar, and `prepareForValidation()` modifies the same key
- Code review: `$this->merge()` overwriting a value that `authorize()` could have used
- Security audit: authorization and preparation touching the same input fields

**Solution**:
- Never modify existing input values in `prepareForValidation()` — only add new keys
- Use separate keys for user-provided vs system-generated values
- If input must be modified, restructure so authorization uses the final value

**Example**:
```php
// BEFORE: Modifying after authorize
public function authorize(): bool
{
    $teamId = $this->input('team_id'); // reads original value
    return $this->user()->teams()->where('id', $teamId)->exists();
}

protected function prepareForValidation(): void
{
    $this->merge([
        'team_id' => $this->user()->teams()->first()->id, // ❌ overwrites — auth decision now invalid
    ]);
}

// AFTER: Don't modify, use new keys
protected function prepareForValidation(): void
{
    $this->merge([
        'audit_team_id' => $this->user()->teams()->first()->id, // ✅ new key, doesn't overwrite
    ]);
}
```

---

### AP-IPR-03: Sensitive Data Manipulation

**Description**: The `prepareForValidation()` method transforms sensitive data — hashing passwords, decrypting tokens, normalizing secrets, or manipulating credit card numbers. These transformations should happen in dedicated security layers, not in request preparation. If the transformation is applied before validation, the validated data may contain manipulated values that are hard to trace.

**Root Cause**: Applying the same normalization pattern to all fields regardless of sensitivity.

**Impact**:
- Password hashing before validation: validated data contains a hash that hashes again downstream
- Credit card masking before validation: validation checks the masked value, not the real one
- Token manipulation in preparation: security tokens are decoded/altered in a non-security layer
- Security audit gaps: sensitive data transformations not tracked

**Detection**:
- Code review: `Hash::make()`, `Crypt::encrypt()`, or `Str::mask()` on sensitive fields in `prepareForValidation()`
- Code review: transformations on fields named `password`, `secret`, `token`, `credit_card`
- Bug reports: double-hashed passwords, encrypted tokens that can't be decrypted

**Solution**:
- Keep `prepareForValidation()` focused on non-sensitive normalization (trim, lowercase)
- Handle sensitive data transformations in dedicated security layers or model mutators
- Never hash, encrypt, or mask in request preparation

**Example**:
```php
// BEFORE: Sensitive data manipulation
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'password' => Hash::make($this->input('password')), // ❌ double-hash risk
        'credit_card' => Str::mask($this->input('credit_card'), '*', 0, 12), // ❌ validation sees masked value
    ]);
}

// AFTER: Sensitive data handled elsewhere
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))), // ✅ only non-sensitive normalization
    ]);
}

// Password hashing in model mutator or service layer:
class User extends Authenticatable
{
    protected function password(): Attribute
    {
        return Attribute::make(set: fn(string $value) => Hash::make($value));
    }
}
```

---

### AP-IPR-04: Replacing Entire Input With replace

**Description**: The `$this->replace()` method is used in `prepareForValidation()` instead of `$this->merge()`. `replace()` destroys the entire request input and substitutes a new array, losing any original input values that weren't explicitly carried over. This makes debugging difficult (original input is gone), prevents logging of original values, and risks removing data that downstream code expects.

**Root Cause**: Misunderstanding the difference between `merge()` (additive) and `replace()` (destructive). The developer thinks both are equivalent.

**Impact**:
- Original input values lost — cannot audit what the user submitted
- Fields not explicitly included in replace() are silently removed
- Debugging impossible: logs show only the replaced values
- Downstream middleware or code that reads the original request gets empty data

**Detection**:
- Code review: `$this->replace([...])` in `prepareForValidation()`
- Code review: `replace()` with a subset of input fields (others dropped)
- Bug reports: "missing field" errors where the field was dropped during replace

**Solution**:
- Always use `$this->merge()` instead of `$this->replace()`
- Use `replace()` only when you explicitly intend to discard all original input (rare)
- If you need to remove specific fields, use `$request->except()` downstream

**Example**:
```php
// BEFORE: Destructive replace
protected function prepareForValidation(): void
{
    $this->replace([ // ❌ destroys all original input
        'email' => strtolower(trim($this->input('email'))),
        'name' => $this->input('name'),
    ]); // ❌ original 'role', 'metadata', etc. are gone
}

// AFTER: Additive merge
protected function prepareForValidation(): void
{
    $this->merge([ // ✅ preserves original input, adds/overwrites specific keys
        'email' => strtolower(trim($this->input('email'))),
    ]);
}
```

---

### AP-IPR-05: Over-Sanitization

**Description**: The `prepareForValidation()` method applies aggressive sanitization that removes characters users intentionally provided — stripping all non-alphanumeric characters from names (removing hyphens, apostrophes, accents), removing HTML from fields where formatting is valid, or truncating fields to a fixed length. Over-sanitization destroys user intent and may corrupt data before it's validated.

**Root Cause**: Security-first thinking without considering data integrity. The developer applies the most aggressive sanitization possible to "be safe."

**Impact**:
- User names like "O'Brien" become "OBrien" (apostrophe removed)
- Addresses with hyphens become concatenated strings
- Multi-language characters (accents, umlauts) stripped or corrupted
- Users cannot save data they intentionally formatted

**Detection**:
- Code review: aggressive regex replacements like `preg_replace('/[^a-zA-Z0-9]/', '', $value)`
- Code review: `strip_tags()` on fields that accept formatting (markdown, simple HTML)
- Bug reports: user data corrupted after saving through the API

**Solution**:
- Sanitize only for safety (trim whitespace, strip dangerous HTML tags if not intended)
- Validate format, don't mangle it — let the user know their format is wrong instead of silently changing it
- Use targeted sanitization: strip only what's genuinely dangerous, preserve intentional characters

**Example**:
```php
// BEFORE: Over-sanitization
protected function prepareForValidation(): void
{
    $this->merge([
        'name' => preg_replace('/[^a-zA-Z\s]/', '', $this->input('name')), // ❌ removes O'Brien -> OBrien
        'bio' => strip_tags($this->input('bio')), // ❌ removes intentional formatting
        'phone' => preg_replace('/[^0-9]/', '', $this->input('phone')), // ❌ removes + (country code)
    ]);
}

// AFTER: Targeted sanitization
protected function prepareForValidation(): void
{
    $this->merge([
        'name' => trim($this->input('name')), // ✅ preserves characters, just trims whitespace
        'bio' => strip_tags($this->input('bio')), // ✅ OK for plain-text bio
        'phone' => preg_replace('/[^\d+]/', '', $this->input('phone')), // ✅ preserves + for country codes
    ]);
}
```
