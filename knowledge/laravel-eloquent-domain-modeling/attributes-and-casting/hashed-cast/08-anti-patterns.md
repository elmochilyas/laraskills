# Hashed Cast — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Hashed Cast |
| Focus | Anti-patterns in hashed cast configuration and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Hashed Cast on Reversible Data | Architecture | Critical |
| 2 | Plaintext Stored Alongside Hashed Value | Security | Critical |
| 3 | Direct Comparison Instead of Hash::check | Reliability | High |
| 4 | Truncated Hash Column | Reliability | Critical |
| 5 | Manual Hash::make When Cast Would Suffice | Maintainability | Medium |
| 6 | Re-assigning Unchanged Hashed Values | Performance | Medium |

## Repository-Wide Cross-Cutting Patterns

- The `hashed` vs `encrypted` cast confusion is the most common security misconfiguration in attribute casting — developers hash data that needs to be read back, permanently destroying the information
- Manual `Hash::make()` calls persist even after the cast is available because existing code patterns are copied without update
- Plaintext storage alongside hashed values is often added for "convenience" debugging or "just in case" scenarios, creating a direct security vulnerability

---

## 1. Hashed Cast on Reversible Data

### Category
Architecture

### Description
Using the `hashed` cast on an attribute whose original value needs to be retrieved later — such as OAuth access tokens used in API calls, encryption keys, or security question answers displayed to users. Hashing is one-way and permanently destroys the original value.

### Why It Happens
Developers see "token" or "key" in the attribute name and reach for hashing without considering whether the application needs to read the plaintext value. The cast is chosen by data category (password-like) rather than usage pattern.

### Warning Signs
- `'hashed'` cast on attributes whose values are used in API calls (`access_token`, `api_key`, `refresh_token`)
- Application code that needs to display or use the plaintext value but gets a hash instead
- Recent commits switching from working encrypted cast to broken hashed cast
- Error logs showing "hash does not match expected value" when the app tries to use the stored token
- Support tickets about broken API integrations after a schema change

### Why Harmful
- The original value is permanently destroyed — cannot be recovered from the database
- Features that require the plaintext value (API authentication, token display, value comparison) are broken
- Recovery requires restoring from backup or re-creating external credentials
- Users may need to re-link accounts or re-authenticate with external services
- Data loss is permanent and silent until the feature is used

### Consequences
- Broken external API integrations that need the stored token value
- Permanent data loss requiring backup restoration
- User-facing features that display or use the original value fail
- Hours or days to recover from a misconfigured cast that destroyed essential data
- Security incident if the loss involves critical credentials

### Preferred Alternative
```php
// Use encrypted for reversible data
protected $casts = [
    'access_token' => 'encrypted',  // Reversible — application can use the token
    'password' => 'hashed',         // One-way — only verification needed
];
```

### Refactoring Strategy
1. Identify all `hashed` cast attributes whose values are read back and used by the application
2. Determine if the stored data can be recovered (backups, external re-authentication)
3. Switch the cast to `encrypted` for reversible data
4. Re-populate the data from backups or external sources
5. Add documentation distinguishing hashed vs encrypted use cases

### Detection Checklist
- [ ] Review each `hashed` attribute — does any code read and use the stored value?
- [ ] Search for usage of `hashed` attributes in API calls, display logic, or comparisons
- [ ] Check error logs for "hash doesn't match" or authentication failures related to stored values
- [ ] Verify feature tests still pass after hashing — do any tests need plaintext access?
- [ ] Audit attribute names: `access_token`, `api_key`, `secret_key` should usually be encrypted, not hashed

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Use hashed Cast for Data Needing Reversal |
| Decision Tree | `07-decision-trees.md` — Decision 1: Hashed vs Encrypted |
| Knowledge | `04-standardized-knowledge.md` — When NOT To Use |

---

## 2. Plaintext Stored Alongside Hashed Value

### Category
Security

### Description
Storing the original plaintext value of a hashed attribute in a separate column, log entry, or backup export. This completely defeats the purpose of hashing — if the database is breached, both the hash and the original value are exposed.

### Why It Happens
"Just in case" mentality: developers want a fallback if hashing breaks something. Debugging requirements: seeing the plaintext during development seems helpful. Legacy schemas that had plaintext columns before hashing was implemented.

### Warning Signs
- Table columns like `password_plain`, `password_original`, `token_raw` alongside the hashed column
- Log entries that output the plaintext value of a hashed attribute
- Database exports or backups containing both hash and plaintext columns
- API responses that include the original value alongside the hashed value
- Code comments like "TODO: remove this after testing" on plaintext storage

### Why Harmful
- A database breach exposes all credentials in plaintext despite the hash being present
- Compliance violations: GDPR, PCI-DSS, and other regulations explicitly forbid plaintext password storage
- User trust is completely undermined if plaintext credentials are discovered in a breach
- The hashing cast provides a false sense of security while the plaintext column exposes everything

### Consequences
- Complete security failure in the event of a data breach
- Compliance violations with regulatory penalties
- Legal liability for storing plaintext credentials
- Erosion of user trust and potential public disclosure
- The hashing effort is entirely wasted — the plaintext column bypasses all protection

### Preferred Alternative
```php
// Only the hashed value is stored — never a plaintext column
Schema::table('users', function (Blueprint $table) {
    $table->string('password', 60);
});
```

### Refactoring Strategy
1. Identify any columns storing plaintext versions of hashed attributes
2. Run a migration to drop the plaintext columns
3. Delete any log entries or exports containing plaintext values
4. Update any code that reads the plaintext column
5. Notify security team and compliance officers if plaintext was stored historically

### Detection Checklist
- [ ] Search for column names containing `plain`, `original`, `raw`, `_text` alongside hashed columns
- [ ] Search for log statements that output the plaintext of a hashed attribute
- [ ] Check API responses for plaintext values of hashed attributes
- [ ] Review database backup procedures for plaintext exposure
- [ ] Audit exports and data dumps for plaintext credential columns

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Store Plaintext Alongside Hashed Values |
| Skill | `06-skills.md` — Step 5: Never store plaintext alongside |
| Knowledge | `04-standardized-knowledge.md` — Never store plaintext |

---

## 3. Direct Comparison Instead of Hash::check

### Category
Reliability

### Description
Using `===` or `==` to compare a plaintext input against a hashed attribute value. Since bcrypt includes a random salt, each hash is unique — direct comparison always fails, preventing successful verification.

### Why It Happens
Developers unfamiliar with bcrypt's salted output assume the hash is deterministic. The `===` operator is the natural comparison in PHP. This mistake is especially common when migrating from plaintext storage to hashing.

### Warning Signs
- Code like `$input === $user->password` for password verification
- Authentication always failing after hashing was introduced
- Login broken when credentials are correct
- Tests that directly compare hash values instead of using `Hash::check()`
- Code comments saying "hash comparison not working" or "always returns false"

### Why Harmful
- Authentication is completely broken — no user can log in
- Every password verification attempt fails because the hash includes a random salt
- The application becomes unusable for all users requiring authentication
- Emergency hotfixes may accidentally bypass security by removing the hash check entirely
- Developers waste hours debugging why a seemingly correct comparison fails

### Consequences
- Complete authentication failure for all users
- Emergency deployment required to fix verification logic
- Potential security bypass if the hotfix removes hashing instead of fixing comparison
- User frustration from inability to log in
- Development time wasted debugging the incorrect comparison

### Preferred Alternative
```php
if (Hash::check($input, $user->password)) {
    // Grant access
}
```

### Refactoring Strategy
1. Search for `===` or `==` comparisons involving hashed attributes
2. Replace all direct comparisons with `Hash::check()`
3. Verify authentication flows still work correctly
4. Add tests that verify password verification with `Hash::check()`

### Detection Checklist
- [ ] Search for `=== $model->password`, `=== $user->password` patterns (and other hashed attributes)
- [ ] Review authentication controllers and services for comparison logic
- [ ] Check password reset and verification flows for direct comparisons
- [ ] Verify unit tests use `Hash::check()` not `assertEquals` on raw hashes
- [ ] Test that login works end-to-end

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Verify With Hash::check, Not Direct Comparison |
| Skill | `06-skills.md` — Step 4: Verify with Hash::check() |
| Knowledge | `04-standardized-knowledge.md` — Use Hash::check for verification |

---

## 4. Truncated Hash Column

### Category
Reliability

### Description
Using a database column with length less than 60 characters for an attribute with the `hashed` cast. Bcrypt produces a 60-character output, which is silently truncated when stored in a shorter column, making the hash unrecoverable.

### Why It Happens
Default `string()` column in Laravel migrations uses `VARCHAR(255)` — safe. But a developer specifying `string('password', 32)` or reusing an existing column type may create a truncation risk. The bcrypt output length isn't common knowledge.

### Warning Signs
- Migration uses `$table->string('password', 32)` or a length < 60
- Existing column type is `VARCHAR(40)` or other length < 60
- Authentication failing for users whose passwords were hashed after the column was shortened
- `Hash::check()` returning false for all password verification attempts
- Database showing truncated or incomplete hash strings

### Why Harmful
- Once a hash is truncated, the full hash is lost — the password it represents is permanently unrecoverable
- Every user with a password stored in the truncated column cannot log in
- Identifying affected users requires manual comparison of stored vs expected hash lengths
- Fixing requires password reset for all affected users
- The symptom (authentication failure) appears far from the cause (column length)

### Consequences
- All authentication broken for affected users after deployment
- Emergency password reset campaign required for all users
- Permanent loss of password hash integrity for truncated records
- User frustration and support team overload
- Data migration required to re-hash passwords after column is fixed

### Preferred Alternative
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('password', 60)->nullable()->change();
});
```

### Refactoring Strategy
1. Identify all hashed-cast columns with length < 60
2. Create a migration to change column length to at least 60
3. For truncated hashes, there is no recovery — affected users must reset passwords
4. Notify affected users and trigger password reset flow
5. Add test that verifies bcrypt hash output fits in the column

### Detection Checklist
- [ ] Cross-reference hashed-cast attributes with column definitions
- [ ] Search for `string(` with length < 60 on hashed attributes
- [ ] Check database schema for `VARCHAR` columns < 60 on password fields
- [ ] Verify bcrypt hash length (60) fits in the current column
- [ ] Profile stored hashes for truncation (compare length to expected 60)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use String Column With Sufficient Length for Hashed Values |
| Decision Tree | `07-decision-trees.md` — Decision 3: Column Length |
| Skill | `06-skills.md` — Step 2: Ensure column type is string with length ≥ 60 |

---

## 5. Manual Hash::make When Cast Would Suffice

### Category
Maintainability

### Description
Manually calling `Hash::make()`, `bcrypt()`, or `Hash::driver()->make()` on attributes that could use the `hashed` cast. The manual call must be repeated at every assignment point, creating risk of missed calls and plaintext storage.

### Why It Happens
Existing code patterns predate the `hashed` cast feature. Teams may not know the cast exists. Copy-pasted code from older tutorials or legacy codebases perpetuates the manual pattern.

### Warning Signs
- `Hash::make($value)` or `bcrypt($value)` called before assigning to a model attribute
- Mutator (`set{Attribute}Attribute`) that manually hashes instead of using `$casts`
- Controller code hashing the value before passing to the model
- Duplicate `Hash::make()` calls across registration, password update, and admin reset flows
- No `$casts` entry for the password attribute despite consistent hashing

### Why Harmful
- Every code path that assigns the attribute must remember to call `Hash::make()`
- One missed call in a registration, admin tool, or test fixture stores plaintext
- Duplicated hashing logic across controllers, services, and actions
- Code reviews must verify each assignment path for correct hashing
- Future developers may not know the attribute should be hashed — the cast makes it explicit

### Consequences
- Plaintext passwords stored in the database if any assignment path misses the hash call
- More code to maintain than a single `$casts` entry
- Inconsistent enforcement: some paths hash, others don't
- Higher risk of security vulnerabilities from forgotten hashing
- Onboarding friction: new developers must learn all the places where hashing occurs

### Preferred Alternative
```php
// One declarative cast — no manual hashing needed
protected $casts = [
    'password' => 'hashed',
];
```

### Refactoring Strategy
1. Identify all model attributes that are manually hashed before assignment
2. Register the `hashed` cast in the model's `$casts` array
3. Remove all manual `Hash::make()` and `bcrypt()` calls for those attributes
4. Verify manually with `Hash::check()` that stored hashes are unchanged
5. Add CI check to prevent new manual hashing for cast-eligible attributes

### Detection Checklist
- [ ] Search for `Hash::make(`, `bcrypt(` before model attribute assignments
- [ ] Search for mutators that hash values (check model accessor/mutator methods)
- [ ] Cross-reference with model `$casts` — do cast-eligible attributes have manual hashing?
- [ ] Count unique locations where hashing occurs for a single attribute
- [ ] Verify test fixtures don't bypass the cast with manual hashing

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Decision 2: Hashed Cast vs Manual Hash::make |
| Knowledge | `04-standardized-knowledge.md` — Eliminates manual Hash::make calls |
| Skill | `06-skills.md` — Step 3: Assign plaintext values directly |

---

## 6. Re-assigning Unchanged Hashed Values

### Category
Performance

### Description
Assigning the same plaintext value to a hashed-cast attribute multiple times within the same request or across requests, triggering expensive bcrypt re-hashing (~50-200ms per hash) for the same value.

### Why It Happens
Blade templates re-binding model attributes, form re-population, or unintended re-assignment in mutators can trigger hashing repeatedly. The hashing is transparent, so the performance cost is invisible to the developer.

### Warning Signs
- Slow model saves traced to repeated bcrypt hashing of unchanged passwords
- Debugging shows `Hash::make()` called multiple times for the same attribute in a single request
- Blade templates using `$model->fill($request->all())` which re-assigns all attributes
- Password field included in every form submission even when not changed
- Profile showing 50-200ms+ spent in bcrypt per unnecessary re-hash

### Why Harmful
- Bcrypt is intentionally slow — 50-200ms per hash adds noticeable latency per unnecessary call
- A form submission that re-assigns all attributes wastes hundreds of milliseconds re-hashing unchanged passwords
- Bulk operations (imports, batch updates) that touch the password column become prohibitively slow
- The performance cost is hidden — there's no explicit `Hash::make()` call visible to optimization

### Consequences
- Slow form submissions and API requests that re-assign password fields unnecessarily
- Bulk operations taking hours instead of minutes due to repetitive hashing
- Higher server CPU usage from redundant bcrypt computation
- Poor user experience from slow password-related operations
- Wasted cost for bcrypt computation that provides zero security benefit

### Preferred Alternative
```php
// Only hash when the value actually changes
$user->fill($request->except('password'));
if ($request->filled('password')) {
    $user->password = $request->password; // Single hash on intentional change
}
```

### Refactoring Strategy
1. Identify code paths that re-assign hashed attributes unnecessarily
2. Add `isDirty()` checks before assigning hashed values
3. Use `$request->except()` to avoid re-assigning password fields from forms
4. In bulk operations, only set hashed attributes when they change
5. Verify profile shows reduced bcrypt calls after optimization

### Detection Checklist
- [ ] Profile model saves with hashed attributes for repeated bcrypt calls
- [ ] Search for `$fill($request->all())` or similar that may include password fields
- [ ] Check Blade forms that include password fields in every submission
- [ ] Review bulk import logic for unnecessary re-hashing
- [ ] Measure save latency on models with hashed attributes

### Related
| Reference | Link |
|---|---|
| Knowledge | `04-standardized-knowledge.md` — Each assignment triggers a new hash |
| Skill | `06-skills.md` — Performance considerations: avoid reassigning unchanged values |
