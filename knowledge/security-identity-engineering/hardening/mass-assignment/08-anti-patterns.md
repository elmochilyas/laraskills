# Anti-Patterns: Mass Assignment Protection ($fillable/$guarded)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Mass Assignment Protection ($fillable/$guarded) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-MA-01 | Empty $guarded | Critical | Medium | Low |
| AP-MA-02 | is_admin in $fillable | Critical | Medium | Low |
| AP-MA-03 | $request->all() with create/update | High | High | Medium |
| AP-MA-04 | forceCreate/forceFill Without Audit | High | Low | Medium |
| AP-MA-05 | No $fillable on Model | Medium | Low | Low |

---

## Repository-Wide Anti-Patterns

- **Model::unguard() in Application Code**: Disables mass assignment protection globally
- **Relying on Frontend for Mass Assignment Protection**: Disabled inputs or client-side validation
- **No Form Requests**: Inline validation in controllers, no consistent input filtering

---

## 1. Empty $guarded

### Category
Security · Critical

### Description
Setting `protected $guarded = [];` on a model, which means no attributes are guarded and all columns are mass-assignable.

### Why It Happens
Laravel's earlier versions had `$guarded = []` as the default. Developers may leave the model unconfigured. Others intentionally set `$guarded = []` thinking it's "simpler" than maintaining `$fillable`.

### Warning Signs
- `$guarded = []` on any model
- All model attributes are mass-assignable
- No `$fillable` defined on the model
- `is_admin`, `role_id`, etc. can be set via mass assignment
- User can escalate privileges by sending extra POST fields

### Why Harmful
Every column on the model can be set via mass assignment. If a user sends `is_admin=true` in a registration request, they become an admin. The application depends entirely on form fields not being present in the HTML — trivial to bypass.

### Real-World Consequences
- User registers and includes `is_admin=true` — becomes admin
- Attacker escalates from regular user to super-admin via API call
- Data breach through privilege escalation

### Preferred Alternative
Use `$fillable` whitelist to explicitly list assignable attributes.

### Refactoring Strategy
1. Replace `$guarded = []` with `$fillable = ['col1', 'col2']`
2. Ensure sensitive fields (`is_admin`, `role_id`) are NOT in `$fillable`
3. Test that mass assignment of sensitive fields is blocked

### Detection Checklist
- [ ] Are there models with `$guarded = []`?
- [ ] Are all attributes mass-assignable on any model?
- [ ] Can `is_admin` or similar fields be set via mass assignment?
- [ ] Is there an explicit `$fillable` list?
- [ ] Has a mass assignment attack been attempted?

### Related Rules/Skills/Trees
- Define $fillable on Every Eloquent Model (05-rules.md)
- Never Add is_admin, role_id, or Similar Privilege Fields to $fillable (05-rules.md)
- Protect Against Mass Assignment Vulnerabilities (06-skills.md)
- $fillable Whitelist vs $guarded Blacklist decision tree (07-decision-trees.md)

---

## 2. is_admin in $fillable

### Category
Security · Critical

### Description
Including privilege-escalating attributes like `is_admin`, `role_id`, or `permissions` in the `$fillable` array.

### Why It Happens
Developers list all columns in `$fillable` to suppress mass assignment exceptions without considering which columns should be mass-assignable. Admin-only fields are added to `$fillable` because "the admin needs to set them."

### Warning Signs
- `is_admin`, `role_id`, `permissions`, `is_super_admin` in `$fillable`
- Any boolean flag that grants privileges in `$fillable`
- Admin-only fields settable via mass assignment
- User registration can set privilege flags

### Why Harmful
Any user can send `is_admin: true` in their registration or profile update request to gain admin privileges. Privilege fields must only be set through controlled, audited code paths.

### Real-World Consequences
- Attacker escalates to admin during registration
- User updates profile and sets `role_id` to 1 (admin)
- Data breach: attacker accesses all user data

### Preferred Alternative
Keep privilege fields out of `$fillable`. Set them explicitly in controlled admin code.

### Refactoring Strategy
1. Remove privilege fields from `$fillable`
2. Set them explicitly: `$user->is_admin = $request->boolean('is_admin')`
3. Ensure admin UI uses explicit assignment

### Detection Checklist
- [ ] Is `is_admin` in any `$fillable`?
- [ ] Are `role_id` or `permissions` in `$fillable`?
- [ ] Can privilege-escalating fields be mass-assigned?
- [ ] Are privilege fields only set via explicit, audited code?
- [ ] Is there a code review gate for privilege field assignment?

### Related Rules/Skills/Trees
- Never Add is_admin, role_id, or Similar Privilege Fields to $fillable (05-rules.md)
- Protect Against Mass Assignment Vulnerabilities (06-skills.md)

---

## 3. $request->all() with create/update

### Category
Security · High

### Description
Passing `$request->all()` directly to `Model::create()` or `Model::update()`, bypassing validation-based input filtering.

### Why It Happens
`$request->all()` is the simplest way to get all input. Combined with `$fillable`, it seems safe — `$fillable` will block unauthorized fields. But this relies entirely on `$fillable` being correctly configured, with no defense-in-depth.

### Warning Signs
- `Model::create($request->all())` in controllers
- `Model::update($request->all())` in controllers
- No Form Request or validation before mass assignment
- Fields not validated before being passed to the model

### Why Harmful
If `$fillable` is misconfigured (missing a sensitive field from the list, or includes a privilege field), the entire request payload is written to the model. `$request->all()` includes all fields, including any the attacker adds.

### Real-World Consequences
- `$fillable` has `is_admin` accidentally — user registers as admin
- Unexpected field `biography` passed — stored despite not being in form
- Extra fields cause `MassAssignmentException` or unintended updates

### Preferred Alternative
Use `$request->validated()` from Form Requests to pass only validated fields.

### Refactoring Strategy
1. Replace `$request->all()` with `$request->validated()`
2. Create Form Request classes with validation rules
3. Verify only expected fields reach the model

### Detection Checklist
- [ ] Is `$request->all()` used in `create()` or `update()`?
- [ ] Are Form Requests used instead?
- [ ] Is there defense-in-depth beyond `$fillable`?
- [ ] Are all expected fields validated?
- [ ] Could extra fields in the request cause harm?

### Related Rules/Skills/Trees
- Use ->only() or ->validated() Instead of ->all() for Mass Assignment (05-rules.md)
- Use Form Requests for Create and Update Validation (05-rules.md)
- Protect Against Mass Assignment Vulnerabilities (06-skills.md)
- Input Filtering Approach decision tree (07-decision-trees.md)

---

## 4. forceCreate/forceFill Without Audit

### Category
Security · High

### Description
Using `forceCreate()` or `forceFill()` in production code to bypass mass assignment protection without adequate review or justification.

### Why It Happens
`forceCreate()` is the easiest workaround when a model has strict `$fillable` limits. Developers use it to "just make it work" without considering the security implications.

### Warning Signs
- `forceCreate()` or `forceFill()` in application code
- No comment explaining why force is necessary
- `forceFill($request->all())` pattern
- Seeders/tests using `forceCreate` — acceptable; production code using it — concern

### Why Harmful
`forceCreate()` and `forceFill()` completely bypass `$fillable` protection. If called with user-controlled data, all fields including privilege fields can be set.

### Real-World Consequences
- `forceFill($request->all())` in profile update — user sets `is_admin=true`
- Developer uses `forceCreate` to avoid configuring `$fillable` — massive vulnerability
- Security audit flags every `forceCreate` call

### Preferred Alternative
Configure `$fillable` correctly. Use explicit property assignment.

### Refactoring Strategy
1. Audit all `forceCreate()` and `forceFill()` calls
2. Replace with standard `create()` after adding missing fields to `$fillable`
3. For cases where force is genuinely needed, use explicit assignment
4. Add a comment justifying each remaining force call

### Detection Checklist
- [ ] Are there `forceCreate()` or `forceFill()` calls in production code?
- [ ] Are they called with user-controlled data?
- [ ] Is there a comment justifying each force call?
- [ ] Could they be replaced with `create()` after `$fillable` update?
- [ ] Have they been reviewed for security?

### Related Rules/Skills/Trees
- Unset Guarded Fields Before Explicit Assignment When Needed (05-rules.md)
- Protect Against Mass Assignment Vulnerabilities (06-skills.md)

---

## 5. No $fillable on Model

### Category
Security · Medium

### Description
Model has neither `$fillable` nor `$guarded` defined, meaning mass assignment is entirely blocked by default — but the developer may not realize this and attempt `create()` calls that fail.

### Why It Happens
In modern Laravel, models without `$fillable` or `$guarded` block all mass assignment. Developers may create a model, forget to add attributes, and then be puzzled by `MassAssignmentException`.

### Warning Signs
- Model has neither `$fillable` nor `$guarded`
- `MassAssignmentException` on model creation
- Exceptions only occur in production (dev has `unguard` in seeder)
- No documentation of which fields are mass-assignable

### Why Harmful
Mass assignment is completely blocked, which is safe (no vulnerability) but causes runtime exceptions. The fix may be rushed — developers may add `$guarded = []` (empty) to silence the exception, creating a vulnerability.

### Real-World Consequences
- New model creation throws `MassAssignmentException`
- Developer adds `$guarded = []` as quick fix — all attributes mass-assignable
- Rushed fix creates vulnerability that otherwise wouldn't exist

### Preferred Alternative
Define `$fillable` explicitly on every model.

### Refactoring Strategy
1. Add `$fillable` array with expected writable columns
2. Do not use `$guarded = []` as a workaround
3. Test that `create()` works with `$fillable`

### Detection Checklist
- [ ] Does every model have `$fillable` or `$guarded` defined?
- [ ] Are there models with neither?
- [ ] Is `$guarded = []` used anywhere?
- [ ] Are there `MassAssignmentException` issues?
- [ ] Is there a process for adding `$fillable` to new models?

### Related Rules/Skills/Trees
- Define $fillable on Every Eloquent Model (05-rules.md)
- Protect Against Mass Assignment Vulnerabilities (06-skills.md)
- $fillable Whitelist vs $guarded Blacklist decision tree (07-decision-trees.md)
