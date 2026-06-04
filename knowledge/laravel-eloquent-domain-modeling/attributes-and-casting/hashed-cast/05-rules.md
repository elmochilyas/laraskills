## Use hashed Cast for Passwords and Non-Reversible Tokens
---
## Category
Security
---
## Rule
Use the `hashed` cast for any attribute that stores secrets needing only verification (passwords, API tokens, security question answers). Do not use it for data that needs reversal.
---
## Reason
The `hashed` cast applies one-way bcrypt hashing on write. It is suitable for credentials that must never be recoverable as plaintext. Using it for reversible data permanently destroys the original value.
---
## Bad Example
```php
protected $casts = [
    'api_key' => 'encrypted',  // Reversible — but should be hashed for security
];
```
---
## Good Example
```php
protected $casts = [
    'password' => 'hashed',
    'api_token' => 'hashed',
    'recovery_code' => 'hashed',
];
```
---
## Exceptions
When the attribute needs to be retrieved in plaintext later (e.g., OAuth access token used by the application), use `encrypted` cast instead.
---
## Consequences Of Violation
Plaintext secrets stored in the database, security breach exposure of reversible credentials, compliance violations for password storage.

---
## Never Store Plaintext Alongside Hashed Values
---
## Category
Security
---
## Rule
Do not keep a separate column or log entry that stores the plaintext value of a hashed attribute. Hashing is defeated if the original value is preserved anywhere.
---
## Reason
Storing plaintext alongside a hashed value negates the security benefit of hashing. A database breach exposes both the hash and the original value, compromising all accounts.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('password');       // Hashed
    $table->string('password_plain'); // Plaintext — defeats hashing
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('password'); // Only hashed value stored
});
```
---
## Exceptions
No common exceptions. Plaintext must never be stored alongside hashed values.
---
## Consequences Of Violation
Complete security failure — data breach exposes both hash and plaintext, compliance violations (GDPR, PCI), user trust erosion.

---
## Verify With Hash::check, Not Direct Comparison
---
## Category
Security
---
## Rule
Always use `Hash::check($plaintext, $model->hashed_attribute)` to verify a value against a hashed attribute. Never use `===` or `==` comparison.
---
## Reason
Hashed values use bcrypt with random salts, producing different output each time. Direct comparison always fails. `Hash::check()` performs the proper bcrypt verification algorithm.
---
## Bad Example
```php
if ($input === $user->password) { // Always false — hash includes random salt
    // Grant access
}
```
---
## Good Example
```php
if (Hash::check($input, $user->password)) {
    // Grant access
}
```
---
## Exceptions
No common exceptions. Always use `Hash::check()` for verification.
---
## Consequences Of Violation
Authentication always fails, users cannot log in, security bypass if incorrect comparison accidentally returns true, hours of debugging.

---
## Use String Column With Sufficient Length for Hashed Values
---
## Category
Reliability
---
## Rule
Use `string` column type with length 60 or greater for attributes using the `hashed` cast. Hash::make() produces a 60-character bcrypt output.
---
## Reason
Bcrypt hashes are exactly 60 characters. Using a column shorter than 60 truncates the hash, making it unrecoverable and verification impossible. Using an excessively long type is acceptable but unnecessary.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('password', 32); // Truncates 60-char bcrypt hash
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('password', 60); // Exactly fits bcrypt output
});
```
---
## Exceptions
When the application uses a hashing algorithm with a different output length (e.g., Argon2), adjust the column length accordingly.
---
## Consequences Of Violation
Truncated hashes stored in the database, unrecoverable passwords, all authentication broken after deployment, emergency data migration required.

---
## Do Not Use hashed Cast for Data Needing Reversal
---
## Category
Security
---
## Rule
Use the `encrypted` cast, not `hashed`, when the original value must be retrievable (display to user, use in API calls, comparison with plaintext).
---
## Reason
Hashing is intentionally one-way — the original value cannot be recovered. Using `hashed` for reversible data permanently destroys the information, requiring database restoration to recover.
---
## Bad Example
```php
protected $casts = [
    'access_token' => 'hashed', // Token needed for API calls — now unrecoverable
];
```
---
## Good Example
```php
protected $casts = [
    'access_token' => 'encrypted', // Reversible — application can use the token
    'password' => 'hashed',        // One-way — only verification needed
];
```
---
## Exceptions
No common exceptions. Choose the cast based on whether the value needs to be read back as plaintext.
---
## Consequences Of Violation
Permanent loss of data that must be recovered, application features that require the plaintext value become broken, manual database restoration required.
