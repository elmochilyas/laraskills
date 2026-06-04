# Encrypted Casts — Skills

---

## Skill 1: Configure Encrypted Casting for Sensitive Attributes

### Purpose
Register an encrypted cast on a sensitive attribute to automatically encrypt on write and decrypt on read using Laravel's application key.

### When To Use
- You store sensitive data (PII, API keys, tokens, payment details)
- You need encryption at rest for compliance (GDPR, HIPAA, PCI)
- You want transparent encryption without manual encrypt/decrypt calls

### When NOT To Use
- You need to search or index the column by value
- The data is not sensitive — encryption adds overhead without benefit
- You need column-level access control (encryption is all-or-nothing)

### Prerequisites
- Application encryption key (`APP_KEY`) configured in `.env`
- Database column type is `TEXT` or `BLOB`

### Inputs
- Attribute name
- Encrypted cast variant (`encrypted`, `encrypted:array`, `encrypted:collection`, `encrypted:object`)
- Whether column needs to be searchable (requires hash column)

### Workflow

1. **Ensure the migration uses `text()`** — encrypted values are longer than plaintext:
   ```php
   Schema::table('users', function (Blueprint $table) {
       $table->text('ssn')->nullable();
   });
   ```

2. **Add to `$casts`** with the `encrypted` variant:
   ```php
   protected $casts = [
       'ssn' => 'encrypted',
       'api_key' => 'encrypted',
       'metadata' => 'encrypted:array',
   ];
   ```

3. **For searchable fields**, add a hash column for lookup:
   ```php
   // Migration adds indexed hash
   $table->string('email_hash', 64)->nullable()->index();
   
   // Model sets hash on save
   protected static function booted(): void
   {
       static::saving(function (User $user) {
           if ($user->isDirty('email')) {
               $user->email_hash = hash('sha256', $user->email);
           }
       });
   }
   ```

4. **Document APP_KEY dependency** — rotating the key makes data unrecoverable

5. **Never encrypt primary/foreign keys** — breaks relationships and joins

### Validation Checklist
- [ ] Encrypted columns use `TEXT` or `BLOB` database type
- [ ] Searchable fields have a hash column for WHERE queries
- [ ] No primary/foreign keys are encrypted
- [ ] APP_KEY rotation procedures are documented

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Data truncation | VARCHAR column too short for ciphertext | Always use TEXT |
| Cannot query by encrypted field | Encrypted values are non-deterministic | Add hash column |
| Data unrecoverable | APP_KEY rotated | Document rotation procedures |

### Decision Points
- **Scalar sensitive value?** → Use `encrypted`
- **JSON array of sensitive data?** → Use `encrypted:array` or `encrypted:collection`
- **Needs WHERE lookup?** → Add separate hash column
- **Searchable hash needed?** → Use SHA-256 in indexed column

### Performance Considerations
- Encryption/decryption adds ~1-5ms per attribute access
- Encrypted columns cannot participate in sorting, filtering, or joining
- Cache decrypted values if accessed multiple times per request

### Security Considerations
- APP_KEY is critical — if compromised, all encrypted data is readable
- Encrypted casts use AES-256 — ensure `config('app.cipher')` uses modern algorithm
- Never commit APP_KEY to version control

### Related Rules
| Rule | Reference |
|---|---|
| Use TEXT or BLOB column type | `05-rules.md` |
| Store searchable hash alongside encrypted fields | `05-rules.md` |
| Never encrypt primary/foreign keys | `05-rules.md` |
| Document APP_KEY dependency | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Cast a JSON Column to a Typed Collection | Encrypted collection variants |
| Configure Hashed Casting for Passwords | Alternative for one-way hashing |
| Configure Primitive Casts for Type Safety | Foundation before adding encryption |

### Success Criteria
- Sensitive attributes are transparently encrypted at rest
- Decrypted values are returned on read
- Searchable fields have indexed hash columns for lookup
- Primary/foreign keys remain unencrypted
