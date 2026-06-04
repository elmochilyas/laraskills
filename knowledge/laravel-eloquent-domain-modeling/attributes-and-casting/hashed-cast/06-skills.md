# Hashed Cast — Skills

---

## Skill 1: Configure Hashed Casting for Passwords and Tokens

### Purpose
Register the `hashed` cast on a password-like attribute to automatically bcrypt-hash the value on write, eliminating manual `Hash::make()` calls throughout the codebase.

### When To Use
- Password-like attributes that should always be stored hashed
- You want to eliminate manual `Hash::make()` calls
- The attribute should never be retrievable in plaintext

### When NOT To Use
- The attribute should be reversible (use `encrypted` cast instead)
- You need to compare the original value (hashing is one-way)
- The hashing algorithm needs to vary per attribute

### Prerequisites
- String column with sufficient length (60+ characters for bcrypt)

### Inputs
- Attribute name
- Value to be hashed

### Workflow

1. **Add to `$casts`** using `'hashed'`:
   ```php
   protected $casts = [
       'password' => 'hashed',
       'api_token' => 'hashed',
   ];
   ```

2. **Ensure the column type is `string` with length ≥ 60**:
   ```php
   Schema::table('users', function (Blueprint $table) {
       $table->string('password', 60);
   });
   ```

3. **Assign plaintext values directly** — hashing happens automatically:
   ```php
   $user->password = 'plaintext'; // Automatically hashed
   ```

4. **Verify with `Hash::check()`**, never direct comparison:
   ```php
   Hash::check('plaintext', $user->password);
   ```

5. **Never store plaintext alongside** the hashed value

### Validation Checklist
- [ ] Column type is `string` with sufficient length (60+ for bcrypt)
- [ ] No plaintext storage alongside hashed column
- [ ] Password verification uses `Hash::check()`, not comparison
- [ ] Hashed cast is registered for password-like attributes only

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Authentication always fails | Direct comparison with `===` instead of `Hash::check()` | Always use `Hash::check()` |
| Password truncated | Column length < 60 for bcrypt hash | Use `string(60)` or longer |
| Token unrecoverable | Hashed cast used on reversible data | Use `encrypted` for reversible data |

### Decision Points
- **One-way hashing needed?** → Use `hashed` cast
- **Reversible storage needed?** → Use `encrypted` cast instead
- **Searchable encrypted value?** → Use `encrypted` with hash column

### Performance Considerations
- Bcrypt hashing is intentionally slow (~50-200ms per hash)
- Each assignment triggers a new hash — avoid reassigning unchanged values
- Consider using `hashed` only for initial set; use model events for updates

### Security Considerations
- Bcrypt includes built-in salting — no additional salt handling needed
- The `hashed` cast prevents accidental plaintext logging
- Password rotation policies should be handled at application level, not by the cast

### Related Rules
| Rule | Reference |
|---|---|
| Use `hashed` for passwords and non-reversible tokens | `05-rules.md` |
| Never store plaintext alongside hashed values | `05-rules.md` |
| Verify with `Hash::check`, not direct comparison | `05-rules.md` |
| Use string column with sufficient length | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Configure Encrypted Casting | Alternative for reversible encryption |
| Configure Primitive Casts for Type Safety | Foundation for all casting |
| Define a Multi-Attribute Mutator | Combine hashed password with updated_at |

### Success Criteria
- Password attribute is automatically bcrypt-hashed on write
- `Hash::check()` successfully verifies the plaintext against the stored hash
- Original plaintext is not recoverable from the attribute
- No plaintext value is stored alongside the hash
