# Hashed Cast

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Hashed Cast |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

The `hashed` cast (inbound only) automatically hashes attribute values using bcrypt when they are set on the model. This is a `CastsInboundAttributes` implementation — the hash is stored in the database and returned as-is on read. It eliminates manual `Hash::make()` or `bcrypt()` calls in controllers, actions, and mutators for password-like attributes.

## Core Concepts

- **Inbound-only**: Hashing happens on write; the stored hash is returned on read (no reverse operation)
- **Bcrypt default**: Uses Laravel's `Hash::make()` which defaults to bcrypt with cost factor 10
- **Automatic hashing**: Any value assigned to the attribute is automatically hashed — no explicit `bcrypt()` call needed
- **Read behavior**: The stored hash string is returned on read — not the original plaintext

## When To Use

- Password-like attributes that should always be stored hashed
- You want to eliminate manual `Hash::make()` calls throughout the codebase
- The attribute should never be retrievable in plaintext

## When NOT To Use

- The attribute should be reversible (use `encrypted` cast for encryption)
- You need to compare the original value (hashing is one-way)
- The hashing algorithm needs to vary per attribute (configure globally instead)

## Best Practices

- **Use `hashed` for passwords and sensitive tokens**: Any value that only needs verification (not retrieval) should be hashed. This includes passwords, API tokens, and security questions.
- **Never store plaintext alongside hashed values**: Don't keep a `password_original` column for "emergencies" — this defeats the purpose of hashing.
- **Combine with `Hash::check()` for verification**: The stored hash can be verified with `Hash::check($plaintext, $model->password)` but the original value cannot be recovered.

## Architecture Guidelines

- Register as `$casts = ['password' => 'hashed']` in the model
- The column type should be `string` with sufficient length (60+ characters for bcrypt)
- Combined with password confirmation validation in FormRequests

## Performance Considerations

- Bcrypt hashing is intentionally slow (~50-200ms per hash) — avoid calling it repeatedly
- Each assignment triggers a new hash — don't reassign the same value unnecessarily
- Consider using the `Hashed` cast only for initial set; use model events for updates

## Security Considerations

- Bcrypt includes built-in salting — no additional salt handling needed
- The `hashed` cast prevents accidental plaintext logging (if the attribute is logged, the hash is logged, not the plaintext)
- Password rotation policies should be handled at the application level, not by the cast

## Examples

```php
class User extends Model
{
    protected $casts = [
        'password' => 'hashed',
        'api_token' => 'hashed',
    ];
}

// Usage
$user = new User();
$user->password = 'plaintext'; // Automatically hashed
$user->save();

// verify
Hash::check('plaintext', $user->password); // true
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Primitive Casts |
| Prerequisite | CastsInboundAttributes Interface |
| Closely Related | Encrypted Casts |
| Closely Related | Mutator Patterns |

## AI Agent Notes

- Inbound-only — hashes on write, returns hash on read
- Uses bcrypt by default via `Hash::make()`
- Never reversible — use `encrypted` cast if you need decryption

## Verification

- [ ] Column type is `string` with sufficient length (60+ for bcrypt)
- [ ] No plaintext storage alongside hashed column
- [ ] Password verification uses `Hash::check()`, not comparison
- [ ] Hashed cast is registered for password-like attributes only
