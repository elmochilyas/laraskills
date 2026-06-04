# Decomposition: Hashed Cast

## Boundary Analysis
The `hashed` cast covers the inbound-only hashing of attribute values via `Hash::make()` on write, with double-hash prevention and read-through of stored hashes. It includes the `$casts` resolution with `'hashed'` string and interaction with `Hash::isHashed()`. It does not cover password validation, password confirmation, password reset flows, or hashing algorithm configuration (covered in Security domain).

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The hashed cast is a single-purpose transformer: hash on write, pass through on read. No meaningful decomposition exists.

## Dependency Graph
```
Hashed Cast
  ├── depends on: Laravel Hash facade / HashingManager
  ├── depends on: Model $casts resolution system
  ├── depends on: Primitive Casts (same $casts mechanism)
  ├── replaces: Legacy hashing mutator pattern
  ├── related to: Encrypted Casts (complementary: one-way vs two-way)
  └── related to: Password Validation (separate concern)
```

## Follow-up Opportunities
- **Per-attribute cost configuration:** A syntax like `'password' => 'hashed:rounds=15'` to control hashing cost per attribute.
- **Algorithm migration support:** Automatically detecting old algorithm hashes on login and re-hashing with the new algorithm.
- **Bulk hashing support:** Efficiently hashing many values in a batch operation without sequential `Hash::make()` calls.
- **Hash verification on write:** Optionally verifying that the plaintext meets password policy before hashing.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization