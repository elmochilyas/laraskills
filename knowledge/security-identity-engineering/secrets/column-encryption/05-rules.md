# Rules: Column Encryption (Laravel Model Encryption)

## Mark Encrypted Columns in $casts as 'encrypted'
---
## Category
Architecture
---
## Rule
Add `protected $casts = ['ssn' => 'encrypted']` for each column that should be encrypted at rest. Use the `encrypted` cast type provided by Laravel.
---
## Reason
Laravel's built-in `encrypted` cast automatically encrypts the value when setting and decrypts when reading. This uses the application's `APP_KEY`. Manual encryption (calling `Crypt::encrypt` in mutators and `Crypt::decrypt` in accessors) is repetitive and error-prone.
---
## Bad Example
```php
class User extends Model {
    public function setSsnAttribute($value) {
        $this->attributes['ssn'] = Crypt::encryptString($value);
    }
    public function getSsnAttribute($value) {
        return $value ? Crypt::decryptString($value) : null;
    }
}
```
---
## Good Example
```php
class User extends Model {
    protected $casts = ['ssn' => 'encrypted'];
}
```
---
## Exceptions
Columns that need custom encryption logic (e.g., different key, different algorithm) — use explicit mutators.
---
## Consequences Of Violation
Repetitive mutator/accessor code, inconsistent encryption handling.
---

## Encrypt Only Truly Sensitive Columns
---
## Category
Architecture
---
## Rule
Encrypt only columns that contain PII, secrets, or regulated data (SSN, credit card, API tokens). Do not encrypt display names, email addresses, or other non-sensitive fields.
---
## Reason
Encrypted columns cannot be searched with standard `WHERE` clauses, cannot be indexed efficiently, and cannot be used in `LIKE` queries or `ORDER BY`. Over-encrypting creates performance and query limitations without meaningful security benefit.
---
## Bad Example
```php
protected $casts = ['display_name' => 'encrypted', 'email' => 'encrypted']; // Email is used for login
```
---
## Good Example
```php
protected $casts = ['ssn' => 'encrypted', 'tax_id' => 'encrypted']; // Only truly sensitive fields
// email is not encrypted — needed for login and search
```
---
## Exceptions
No common exceptions — over-encrypting hinders application functionality.
---
## Consequences Of Violation
Inability to search or sort by encrypted columns, unnecessary performance overhead.
---

## Use Deterministic Encryption for Searchable Encrypted Columns
---
## Category
Architecture
---
## Rule
If encrypted columns need to be searchable, implement deterministic encryption (same plaintext → same ciphertext) with a dedicated key (not the default APP_KEY). Never search by decrypting all rows.
---
## Reason
Laravel's default `encrypted` cast is non-deterministic (uses random IV per encryption operation). The same value encrypts to different ciphertext each time, making `WHERE encrypted_column = 'value'` impossible. Deterministic encryption (e.g., AES-SIV) allows exact-match searches without decrypting all records.
---
## Bad Example
```php
// Cannot search — different ciphertext each time
$users = User::where('ssn', '123-45-6789')->get(); // Never matches
```
---
## Good Example
```php
// Use a separate deterministic encryption mechanism for searchable encrypted columns
$users = User::where('ssn_hash', hash('sha256', $ssn))->get(); // Searchable hash
```
---
## Exceptions
No common exceptions — searching encrypted columns requires special handling.
---
## Consequences Of Violation
`WHERE` queries on encrypted columns never match.
---

## Never Log or Dump Encrypted Column Values
---
## Category
Security
---
## Rule
Exclude encrypted columns from logging, error reporting, and debug dumps. Use `$hidden` on models or explicitly redact them.
---
## Reason
When Laravel's `encrypted` cast decrypts a column value, the plaintext is in memory. Logging or dumping the model in a controller or exception handler may expose decrypted data in log files. `$hidden` prevents serialization of encrypted columns.
---
## Bad Example
```php
Log::info('User created', $user->toArray()); // Encrypted column values logged in plaintext
```
---
## Good Example
```php
class User extends Model {
    protected $hidden = ['ssn']; // Excluded from serialization
}
```
---
## Exceptions
No common exceptions — encrypted column values must not appear in logs.
---
## Consequences Of Violation
Encrypted data exposed in plaintext in log files.
---

## Test Encryption Round-Trip in Feature Tests
---
## Category
Testing
---
## Rule
Write a feature test that creates a model with encrypted data, reads it back, and asserts the value matches. Verify that the database stores ciphertext (not plaintext).
---
## Reason
Encryption misconfiguration (wrong cast type, missing `$casts`, database column too small for ciphertext) can silently store plaintext. A round-trip test catches both encryption and decryption failures. Verifying database content confirms the value is actually encrypted.
---
## Bad Example
```php
// No encryption test — plaintext may be stored silently
```
---
## Good Example
```php
public function test_encrypted_column_roundtrip(): void {
    $user = User::factory()->create(['ssn' => '123-45-6789']);
    $this->assertEquals('123-45-6789', $user->ssn);
    // Verify ciphertext in database
    $raw = DB::table('users')->where('id', $user->id)->value('ssn');
    $this->assertNotEquals('123-45-6789', $raw); // Must not be plaintext
    $this->assertStringStartsWith('eyJ', $raw); // Likely base64-encoded encrypted value
}
```
---
## Exceptions
No common exceptions — encryption round-trip tests are essential.
---
## Consequences Of Violation
Plaintext stored in database, data breach exposure.
---

## Ensure Encrypted Column Size Accommodates Ciphertext
---
## Category
Architecture
---
## Rule
Set encrypted column types to `text` or a sufficiently large `varchar` (at least 500 characters). Never use `string` (varchar 255 default) for encrypted columns.
---
## Reason
Ciphertext is significantly longer than the original plaintext. A Laravel `string` column (varchar 255) may silently truncate the ciphertext, making decryption impossible. Ciphertext for a short value can be 200-300 base64 characters. `text` is the safest default.
---
## Bad Example
```php
Schema::table('users', function ($table) {
    $table->string('ssn', 255)->nullable(); // May be too short for ciphertext
});
```
---
## Good Example
```php
Schema::table('users', function ($table) {
    $table->text('ssn')->nullable(); // Sufficient for ciphertext
});
```
---
## Exceptions
No common exceptions — column type must accommodate ciphertext expansion.
---
## Consequences Of Violation
Silent ciphertext truncation, permanent data loss.
