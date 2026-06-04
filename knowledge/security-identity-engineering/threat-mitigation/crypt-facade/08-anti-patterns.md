# Anti-Patterns: Laravel Crypt Facade

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Laravel Crypt Facade |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-CF-01 | Crypt for Password Hashing | Critical | Low | Low |
| AP-CF-02 | Weak or Shared APP_KEY | Critical | Medium | Medium |
| AP-CF-03 | Unhandled DecryptException | High | Medium | Low |
| AP-CF-04 | APP_KEY in Version Control | Critical | High | Low |
| AP-CF-05 | Unnecessary Encryption | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **No Try-Catch Around Decrypt**: All decrypt calls missing exception handling
- **Same APP_KEY Across Environments**: Dev can decrypt production data
- **Encrypted Data in VARCHAR(255)**: Payload truncated, data corrupted

---

## 1. Crypt for Password Hashing

### Category
Security · Critical

### Description
Using `Crypt::encryptString()` or `Crypt::encrypt()` to store passwords instead of `Hash::make()`.

### Why It Happens
Encryption and hashing are both "security transformations." Developers who don't understand the difference may use `Crypt::encryptString($password)` thinking it's secure. It is reversible, unlike hashing.

### Warning Signs
- `Crypt::encryptString($request->password)` in user creation/update
- Password column contains decryptable values
- `Auth::attempt()` may still work if login decrypts and compares
- Password retrieval possible via `Crypt::decryptString($user->password)`
- Login compares decrypted password with input (custom auth)

### Why Harmful
Encrypted passwords can be decrypted. If an attacker gains access to the APP_KEY, they can decrypt all user passwords. Unlike bcrypt/argon2 hashing (which is one-way), encryption provides no protection against a key compromise.

### Real-World Consequences
- Database breach + APP_KEY leak = all passwords exposed
- Compliance violation: passwords must be hashed, not encrypted
- Mass credential compromise: attacker decrypts all user passwords

### Preferred Alternative
Use `Hash::make()` for passwords.

### Refactoring Strategy
1. All users must reset passwords
2. Migrate password column to bcrypt hash
3. Hash new passwords with `Hash::make()`

### Detection Checklist
- [ ] Are passwords encrypted with `Crypt` instead of hashed with `Hash`?
- [ ] Can passwords be decrypted?
- [ ] Is `Auth::attempt()` working correctly with bcrypt?
- [ ] Is APP_KEY protected from unauthorized access?

### Related Rules/Skills/Trees
- Never Use Crypt for Password Hashing (05-rules.md)
- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)

---

## 2. Weak or Shared APP_KEY

### Category
Security · Critical

### Description
Using a weak, short, or non-random APP_KEY, or sharing the same APP_KEY across multiple environments.

### Why It Happens
Developers may copy `.env` from one environment to another without regenerating the key. A manually typed key may be too short or predictable. The key may be the same in development, staging, and production.

### Warning Signs
- `APP_KEY` length less than 32 bytes (base64 decoded)
- `APP_KEY` contains dictionary words or common patterns
- Same `APP_KEY` in `.env.dev` and `.env.production`
- `php artisan key:generate` has never been run
- `APP_KEY` is `SomeRandomString` or similar placeholder

### Why Harmful
A weak APP_KEY means encrypted data can be brute-forced. A shared key across environments means a developer with dev access can decrypt production data.

### Real-World Consequences
- Weak key: encrypted data brute-forced in hours
- Dev/prod same key: developer with dev database access decrypts production PII
- Short key: insufficient entropy for AES-256

### Preferred Alternative
Generate a unique, cryptographically random APP_KEY per environment.

### Refactoring Strategy
1. Run `php artisan key:generate` per environment
2. Ensure keys are stored in `.env` (not version controlled)
3. Rotate keys periodically

### Detection Checklist
- [ ] Is `APP_KEY` unique per environment?
- [ ] Was it generated with `key:generate`?
- [ ] Is it at least 32 bytes (base64 decoded)?
- [ ] Is it in version control?
- [ ] Could dev data be used to decrypt production?

### Related Rules/Skills/Trees
- Set APP_KEY to a Secure 32-Byte Random String (05-rules.md)
- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)
- Key Rotation Strategy decision tree (07-decision-trees.md)

---

## 3. Unhandled DecryptException

### Category
Security · High

### Description
Not catching `DecryptException` when calling `Crypt::decryptString()` or `Crypt::decrypt()`, causing 500 errors or exposing internal state.

### Why It Happens
Developers assume the data they encrypted can always be decrypted. Rotating APP_KEY, data corruption, or manual database edits can cause decryption to fail.

### Warning Signs
- `Crypt::decryptString()` called without try-catch
- APP_KEY rotated without data migration
- `DecryptException` appears in error logs
- 500 errors on pages that display encrypted data

### Why Harmful
An uncaught `DecryptException` returns a 500 error (or exposes a stack trace in debug mode). The operation fails silently for the user, and the cause is unclear.

### Real-World Consequences
- User profile page returns 500 because a single encrypted field is corrupted
- After key rotation, all pages with encrypted data error out
- Debug mode enabled: stack trace reveals encrypted payload structure

### Preferred Alternative
Wrap decrypt calls in try-catch, handle failures gracefully.

### Refactoring Strategy
1. Wrap all `Crypt::decryptString()` and `Crypt::decrypt()` in try-catch
2. Log the exception
3. Return a safe fallback value or error message

### Detection Checklist
- [ ] Are all decrypt calls wrapped in try-catch?
- [ ] Is `DecryptException` handled gracefully?
- [ ] What happens if APP_KEY is rotated?
- [ ] Are decryption failures logged?
- [ ] Could a corrupted database field break the application?

### Related Rules/Skills/Trees
- Rotate APP_KEY Only Through a Migration Script (05-rules.md)
- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)

---

## 4. APP_KEY in Version Control

### Category
Security · Critical

### Description
Committing the `.env` file containing `APP_KEY` to version control, exposing the master encryption key to anyone with repository access.

### Why It Happens
Developers may commit `.env` for convenience (sharing config with the team) or accidentally `git add .` without checking. The `.env` file should be in `.gitignore`.

### Warning Signs
- `.env` not in `.gitignore`
- `APP_KEY` visible in git history
- Repository contains `.env.example` with a real key
- CI/CD pipeline has `APP_KEY` hardcoded in config files

### Why Harmful
Anyone with repository access (including former employees, contractors, or attackers who breach the VCS) can decrypt all encrypted data. The APP_KEY is the root of trust for all Crypt operations.

### Real-World Consequences
- Former employee with repo access decrypts production PII
- Repository leaked on public GitHub — all encrypted data exposed
- Compliance violation: encryption key not protected

### Preferred Alternative
Never commit APP_KEY. Use environment-specific key management.

### Refactoring Strategy
1. Remove `.env` from version control (add to `.gitignore`)
2. Rotate the compromised APP_KEY (migrate all encrypted data)
3. Use environment variables or secret management for deployment

### Detection Checklist
- [ ] Is `.env` in `.gitignore`?
- [ ] Has APP_KEY ever been committed to git?
- [ ] Can repo access decrypt encrypted data?
- [ ] Is APP_KEY managed via environment variables?
- [ ] Is there a secret management strategy?

### Related Rules/Skills/Trees
- Set APP_KEY to a Secure 32-Byte Random String (05-rules.md)
- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)

---

## 5. Unnecessary Encryption

### Category
Architecture · Medium

### Description
Using Crypt to encrypt non-sensitive data (display names, preferences, settings), adding overhead and complexity without security benefit.

### Why It Happens
Developers apply encryption broadly "because it's more secure." Encrypting all database columns indiscriminately is seen as a best practice, but it adds significant operational complexity.

### Warning Signs
- All text columns in a table are encrypted
- Non-sensitive fields (display_name, bio, theme_preference) are encrypted
- Queries on encrypted fields require decrypting every row
- Reporting queries cannot filter on encrypted fields
- Indexes on encrypted columns are useless

### Why Harmful
Encrypted data is opaque — it cannot be searched, sorted, or indexed. Reporting requires decrypting every row, which is slow and expensive. Key rotation requires decrypting and re-encrypting all columns, including non-sensitive ones.

### Real-World Consequences
- "Search users by name" requires decrypting 10,000 records per query
- Monthly report on user locations cannot filter by country (field is encrypted)
- Key rotation takes 2 hours instead of 2 minutes

### Preferred Alternative
Encrypt only sensitive data (PII, credentials, tokens). Leave non-sensitive data unencrypted.

### Refactoring Strategy
1. Identify which fields actually need encryption
2. Decrypt non-sensitive fields
3. Remove encryption from non-sensitive columns

### Detection Checklist
- [ ] Are non-sensitive fields encrypted?
- [ ] Could the application function without encryption on specific fields?
- [ ] Are there performance issues due to encrypted field queries?
- [ ] Is there a clear data classification policy?

### Related Rules/Skills/Trees
- Use Crypt for Sensitive Data at Rest Only (05-rules.md)
- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)
- Encryption Granularity decision tree (07-decision-trees.md)
