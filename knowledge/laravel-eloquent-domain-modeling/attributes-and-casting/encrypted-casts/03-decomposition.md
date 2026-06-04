# Decomposition: Encrypted Casts

## Boundary Analysis
Encrypted casts cover the `encrypted`, `encrypted:array`, `encrypted:collection`, and `encrypted:object` cast types, including encryption/decryption mechanics, JSON serialization for complex types, and interaction with `APP_KEY`. It does not cover hashing (one-way), encryption infrastructure (Crypt facade config), or searchable encryption strategies.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The encrypted cast mechanism is a single pipeline: encrypt on write, decrypt on read. The JSON variants add a serialization step before encryption but follow the same pattern.

## Dependency Graph
```
Encrypted Casts
  ├── depends on: APP_KEY and cipher configuration
  ├── depends on: Laravel Crypt facade / Encrypter
  ├── depends on: Model $casts resolution system
  ├── related to: Primitive Casts (same $casts mechanism)
  ├── overlaps: Collection Casts (AsEncryptedCollection)
  ├── overlaps: Hashed Cast (both handle secrets; hash is one-way)
  └── related to: Key Rotation (operational concern)
```

## Follow-up Opportunities
- **Per-column encryption keys:** Allowing different encryption keys for different columns or models.
- **Deterministic encrypted cast:** A variant that produces the same ciphertext for the same plaintext (with tradeoffs) to enable equality lookups.
- **Blind index support:** Automatically maintaining a SHA-256 hash column for searching encrypted data.
- **Compression before encryption:** Automatically compressing large plaintext values before encryption to reduce storage.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization