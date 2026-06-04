# Anti-Patterns: Form Request Validation Rules

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Form Request Validation |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-FV-01 | authorize() Returns false by Default | Critical | High | Low |
| AP-FV-02 | $request->all() Instead of validated() | High | High | Low |
| AP-FV-03 | Single Form Request for Create and Update | Medium | High | Medium |
| AP-FV-04 | Inline Validation in Controllers | Medium | High | Medium |
| AP-FV-05 | no nullable When Null Is Valid | Medium | High | Low |

---

## Repository-Wide Anti-Patterns

- **No Form Requests at All**: All validation in controllers
- **authorize() Always Returns true**: No authorization checks
- **Validation Logic Duplicated**: Same rules repeated across multiple form requests

---

## 1. authorize() Returns false by Default

### Category
Security · Critical

### Description
Failing to implement the `authorize()` method in Form Requests, which defaults to `false`, denying all requests.

### Why It Happens
Forgetting to add `authorize()` — the developer creates the Form Request, defines `rules()`, and assumes `authorize()` defaults to `true`. In reality, the default is `false`.

### Warning Signs
- All Form Request-based actions return 403
- `authorize()` method not present in Form Request class
- `authorize()` inherited from parent and returns `false`
- Developer confused by "random" 403 errors

### Why Harmful
Every request processed through the Form Request returns 403 Forbidden. The application appears broken. Debugging may take hours because the 403 is treated as an authorization issue rather than a missing `authorize()`.

### Real-World Consequences
- All API endpoints using Form Requests return 403
- Production deployment: entire application appears broken
- Hours debugging until discovering the missing `authorize()` method

### Preferred Alternative
Always implement `authorize()` and return `true` (or proper authorization check).

### Refactoring Strategy
1. Add `authorize()` method to the Form Request
2. Return `true` for public endpoints, or `$this->user()->can(...)` for protected ones

### Detection Checklist
- [ ] Does every Form Request have an `authorize()` method?
- [ ] Is the default `false` overridden?
- [ ] Are there unexplained 403 errors?
- [ ] Do new Form Requests always include `authorize()`?

### Related Rules/Skills/Trees
- Implement authorize() to Gate Access Before Validation (05-rules.md)
- Centralize Input Validation with Form Requests (06-skills.md)
- authorize() Placement decision tree (07-decision-trees.md)

---

## 2. $request->all() Instead of validated()

### Category
Security · High

### Description
Using `$request->all()` instead of `$request->validated()` to get input data from a Form Request, passing unvalidated fields to mass assignment.

### Why It Happens
Developers may not know about `validated()` method, or they use `all()` out of habit. The Form Request validates input, but `all()` returns the raw request data including fields not in the validation rules.

### Warning Signs
- `$request->all()` used in controller after Form Request dependency injection
- `Model::create($request->all())` in controller with Form Request
- Extra fields in request data are stored despite not being in validation rules
- Unknown fields appear in database

### Why Harmful
`$request->all()` returns every field in the request, including any the attacker adds that are not in the validation rules. `$request->validated()` returns only the fields that passed validation, filtering out unexpected fields.

### Real-World Consequences
- Attacker adds `is_admin=true` to request — field not in validation rules but passes because it's not rejected by `all()`
- Extra fields stored in database despite not being in form
- Mass assignment protection (`$fillable`) is the only defense — single misconfiguration causes vulnerability

### Preferred Alternative
Always use `$request->validated()` for data passed to create/update.

### Refactoring Strategy
1. Replace `$request->all()` with `$request->validated()` in all controllers
2. Ensure all create/update operations use validated data only

### Detection Checklist
- [ ] Is `$request->validated()` used instead of `$request->all()`?
- [ ] Are there any `all()` calls on Form Request instances?
- [ ] Could unexpected fields reach model create/update?
- [ ] Is there defense-in-depth with `$fillable`?

### Related Rules/Skills/Trees
- Create One Form Request per Controller Method (05-rules.md)
- Centralize Input Validation with Form Requests (06-skills.md)
- Input Filtering Strategy decision tree (07-decision-trees.md)

---

## 3. Single Form Request for Create and Update

### Category
Architecture · Medium

### Description
Using one Form Request class for both store and update operations, creating conditional logic that is fragile and hard to maintain.

### Why It Happens
Creating one Form Request per action seems like duplication. A single `PostRequest` handles both `POST /posts` (create) and `PUT /posts/{id}` (update) with conditional rules based on route parameter presence.

### Warning Signs
- Single Form Request used in both `store()` and `update()` methods
- `$this->route('post')` conditional checks in `rules()`
- `sometimes` vs `required` logic based on HTTP method
- Complex conditional validation that's hard to read
- Changes to create validation break update validation

### Why Harmful
Conditional validation logic is harder to read, test, and maintain. A change to create rules can break update rules. The `authorize()` method may need different logic for create vs update.

### Real-World Consequences
- Fixing "required password on create" accidentally makes it "required on update too"
- Tests for create/update share the same Form Request — hard to isolate
- New developer unsure which rules apply to which action

### Preferred Alternative
Create separate Form Requests per action (`StorePostRequest`, `UpdatePostRequest`).

### Refactoring Strategy
1. Split the combined Form Request into separate Store and Update classes
2. Move conditional logic into the appropriate class
3. Update controller method signatures

### Detection Checklist
- [ ] Are Form Requests shared between create and update?
- [ ] Is there conditional logic based on HTTP method?
- [ ] Could create/update rules be separated cleanly?
- [ ] Are tests isolated per action?

### Related Rules/Skills/Trees
- Create One Form Request per Controller Method (05-rules.md)
- Centralize Input Validation with Form Requests (06-skills.md)

---

## 4. Inline Validation in Controllers

### Category
Architecture · Medium

### Description
Using `$request->validate()` in controller methods instead of creating dedicated Form Request classes.

### Why It Happens
For simple validation, `$request->validate([...])` is quick and convenient. It's one line of code. Creating a Form Request class seems like unnecessary overhead for a few rules.

### Warning Signs
- `$request->validate([...])` in controller methods
- No Form Request classes in `app/Http/Requests/`
- Validation logic mixed with controller business logic
- Same validation rules duplicated across controllers
- Authorization handled separately from validation

### Why Harmful
Inline validation scatters validation logic across controllers, making it harder to audit, test, and maintain. Authorization is separated from validation (run in controller after validation). Reusable rules cannot be shared.

### Real-World Consequences
- Same email validation rules duplicated in 5 controllers
- Adding a new field requires updating validation in 3 places
- Authorization runs after validation — unauthorized users trigger validation errors

### Preferred Alternative
Create Form Request classes for all significant validation logic.

### Refactoring Strategy
1. Create Form Request per controller action
2. Move validation rules from controller to Form Request
3. Add `authorize()` method
4. Update controller to use Form Request

### Detection Checklist
- [ ] Are Form Requests used consistently?
- [ ] Is there inline `$request->validate()` in controllers?
- [ ] Is validation logic duplicated?
- [ ] Is authorization separated from validation?

### Related Rules/Skills/Trees
- Create One Form Request per Controller Method (05-rules.md)
- Centralize Input Validation with Form Requests (06-skills.md)
- Form Request vs Inline Validation decision tree (07-decision-trees.md)

---

## 5. No nullable When Null Is Valid

### Category
Architecture · Medium

### Description
Using `sometimes` instead of `nullable` for optional fields, causing validation errors when clients explicitly send `null`.

### Why It Happens
Developers confuse `sometimes` (validate only when field is present) with `nullable` (allow null values). When a client sends `null` explicitly, `sometimes` runs validation rules, and `string` fails on `null`.

### Warning Signs
- Optional fields use `sometimes` instead of `nullable`
- `null` sent by client fails validation
- API clients must omit the field entirely instead of sending `null`
- PATCH endpoint requires field absent for no change, null for clear

### Why Harmful
API clients cannot explicitly set a field to `null`. They must omit the field instead, making the API behavior inconsistent. The error message is unhelpful: "The bio must be a string" when the user clearly intended to clear their bio.

### Real-World Consequences
- Mobile app sends `null` for empty bio field — validation fails
- API client has to omit fields instead of sending `null`
- User tries to clear a field — request fails

### Preferred Alternative
Use `nullable` for optional fields that should accept `null`.

### Refactoring Strategy
1. Replace `sometimes` with `nullable` on optional fields
2. Add `nullable|string|max:1000` — null skips all validation

### Detection Checklist
- [ ] Are optional fields using `nullable` or `sometimes`?
- [ ] Does sending `null` cause validation errors?
- [ ] Are API clients forced to omit fields?
- [ ] Is there distinction between "not sent" and "set to null"?

### Related Rules/Skills/Trees
- Use nullable Instead of sometimes for Optional Fields (05-rules.md)
- Centralize Input Validation with Form Requests (06-skills.md)
