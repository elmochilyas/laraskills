# Encrypted Casts

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Encrypted Casts |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Encrypted casts automatically encrypt attribute values when stored and decrypt them on read using Laravel's application encryption key (`APP_KEY`). Variants include `encrypted`, `encrypted:array`, `encrypted:collection`, and `encrypted:object`. Encryption uses AES-256-CBC or AES-256-GCM, providing data-at-rest protection without application-level code changes. These casts are essential for PII, credentials, and sensitive configuration data.

## Core Concepts

- **encrypted cast**: Encrypts/decrypts a scalar value using the application cipher
- **encrypted:array cast**: JSON-encodes then encrypts on write; decrypts then JSON-decodes on read
- **encrypted:collection cast**: Same as `encrypted:array` but returns `Collection`
- **encrypted:object cast**: Same as `encrypted:array` but returns `stdClass`
- **APP_KEY dependency**: All encrypted casts depend on the application key; changing it makes existing data unrecoverable
- **No blind indexing**: Encrypted data is not searchable via `WHERE` clauses

## When To Use

- You need to store sensitive data (PII, API keys, tokens, payment details)
- You need encryption at rest for compliance (GDPR, HIPAA, PCI)
- You want transparent encryption without manual encrypt/decrypt calls

## When NOT To Use

- You need to search or index the column (use deterministic encryption or hashed searchable fields)
- The data is not sensitive — encryption adds overhead without benefit
- You need column-level access control (encryption is all-or-nothing per column)

## Best Practices

- **Encrypted columns must be `TEXT` or `BLOB`**: Ciphertext is longer than plaintext. Ensure migrations use the correct column type before deploying.
- **Store a searchable hash alongside encrypted data**: If you need to look up records by an encrypted field (email, SSN), store a SHA-256 hash in a separate column for `WHERE` queries.
- **Document APP_KEY dependency**: If the application key is rotated, all encrypted data becomes unreadable. Include this in runbooks and disaster recovery plans.
- **Avoid encrypted casts for data that needs reporting**: Encrypted columns cannot be used in aggregate queries, `GROUP BY`, `ORDER BY`, or JOIN conditions.

## Architecture Guidelines

- Use `encrypted:array` for JSON config data, `encrypted` for scalar secrets
- Store searchable hash in a separate column for lookup-required encrypted fields
- Never use encrypted casts on primary or foreign key columns
- Add application-level indexing of encrypted columns is impossible — plan queries accordingly

## Performance Considerations

- Encryption/decryption adds ~1-5ms per attribute access — negligible for single values, significant for bulk operations
- Each read of an encrypted attribute triggers decryption — accessing the same attribute multiple times is wasteful
- Encrypted casts cannot participate in database-level sorting, filtering, or joining

## Security Considerations

- **APP_KEY is a critical secret**: If compromised, all encrypted data can be decrypted. Store securely, rotate periodically, and never commit to version control.
- Key rotation: Laravel doesn't support automatic key rotation for encrypted casts. Plan for data migration when rotating keys.
- Encrypted casts use Laravel's `Crypt` facade — ensure `config('app.cipher')` uses a modern algorithm (AES-256-GCM preferred).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Encrypting searchable fields | Lack of planning | Can't query by encrypted field | Store searchable hash as separate column |
| TEXT column migration missing | Oversight | Data truncation on long ciphertext | Use `TEXT` or `LONGTEXT` |
| Multiple decrypt calls | Repeated access | Performance overhead | Cache decrypted value or eager-decrypt once |
| Encrypted JSON for relations | Misunderstanding | Can't use JSON path queries | Normalize related data into separate table |

## Anti-Patterns

- **Encrypted Primary Key**: Encrypting the `id` column makes joins and lookups impossible.
- **Encrypted Foreign Key**: Encrypting `user_id` prevents relationship loading. Foreign keys must never be encrypted.
- **Blind Encryption**: Encrypting every column "for security" without considering query implications. Only encrypt sensitive columns.

## Examples

```php
protected $casts = [
    'ssn' => 'encrypted',
    'api_key' => 'encrypted',
    'metadata' => 'encrypted:array',
    'permissions' => 'encrypted:collection',
];
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Primitive Casts |
| Closely Related | Collection Casts |
| Closely Related | Custom Casts |
| Cross-Domain | Security & Identity Engineering |

## AI Agent Notes

- Encrypted columns must be `TEXT` or `BLOB`
- Store searchable hash for lookup-required encrypted fields
- Never encrypt primary/foreign keys or indexed columns
- Document APP_KEY dependency and rotation procedures

## Verification

- [ ] Encrypted columns use correct database type (`TEXT`/`BLOB`)
- [ ] Searchable fields have a hash column for WHERE queries
- [ ] No primary/foreign keys are encrypted
- [ ] APP_KEY rotation procedures are documented
