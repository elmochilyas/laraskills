# Form Request Organization: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Form Request Organization |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Rule Leak** — V2 inherits outdated V1 validation rules, allowing invalid data
2. **Authorization Gap** — V2 removes an `authorize()` check that existed in V1
3. **Silent Rule Removal** — V2 drops a validation rule, allowing bad data into the database
4. **Same Request for Store and Update** — Using identical form requests for creation and modification
5. **Modifying Parent Rules Directly** — Changing V1's rules through V2's inheritance

## Repository-Wide Anti-Patterns

- Not testing each version's form request independently
- Using `$request->all()` instead of `$request->validated()`
- Overriding `authorize()` in a version without calling `parent::authorize()`
- Adding a required field in a new version without a default in the old version

---

## 1. Rule Leak

### Category
Validation Regression

### Description
V2 extends V1's form request and inherits outdated or incorrect validation rules from V1. V1 has a bug in its validation — V2 inherits the bug. Or V1 had rules that are no longer appropriate for V2's data model.

### Why It Happens
Rule inheritance is implicit — V2 calls `parent::rules()` and merges. A bug fix or improvement applied to V1's rules automatically changes V2's behavior, potentially in undesirable ways.

### Warning Signs
- V2 inherits rules that don't apply to V2's data model
- Fixing a V1 validation rule breaks V2 validation
- V2 tests fail after V1 rule changes
- V2 accepts invalid data that V1 correctly rejects (or vice versa)
- No independent test suite for V2's form request

### Why Harmful
Inheritance coupling means V1 changes silently affect V2. A V1 bug fix can introduce a V2 regression. The validation behavior of each version is not independently controlled.

### Real-World Consequences
V1 has a rule `'email' => 'required|email'`. V2 extends V1 and adds `'phone' => 'required'`. A bug fix in V1 changes `'email' => 'required|email:rfc,dns'`. Now V2 also enforces DNS validation on email, which the V2 team never reviewed. V2 consumers with valid non-DNS emails are rejected.

### Preferred Alternative
Build rules independently per version, not through inheritance. Use traits for genuinely shared rule groups.

### Refactoring Strategy
1. Decouple V2 rules from V1 — build V2 rules independently
2. Extract genuinely shared rules into traits
3. Test each version's validation independently
4. Add a rule diff report to detect unintended inheritance

### Detection Checklist
- [ ] V2 rules inherited from V1
- [ ] V2 tests don't exist or are inherited
- [ ] V1 rule changes affect V2
- [ ] Rule inheritance is the only sharing mechanism

### Related Rules/Skills/Trees
- Rule: API-VALIDATION-001 (Independent Version Validation)
- Skill: form-request-organization
- Tree: input-validation

---

## 2. Authorization Gap

### Category
Security Vulnerability

### Description
V2 overrides the `authorize()` method from V1's form request and removes or weakens authorization checks. Users who should be denied access can now perform operations through V2.

### Why It Happens
The developer overrides `authorize()` for V2 without calling `parent::authorize()`, or writes a weaker check. They may not realize V1 had authorization logic.

### Warning Signs
- V2's `authorize()` returns `true` unconditionally
- V2's `authorize()` doesn't call `parent::authorize()`
- V2 has different authorization requirements than V1
- Security audit shows different access rules per version
- V1 and V2 have different `authorize()` implementations

### Why Harmful
Authorization gaps between versions create security vulnerabilities. An attacker can access the more permissive version to bypass restrictions enforced in the stricter version.

### Real-World Consequences
V1's form request requires admin role for deleting posts. V2 overrides `authorize()` to check for "editor" role but forgets to also check for "admin." Editors can now delete posts, but V1 editors still can't — inconsistent authorization.

### Preferred Alternative
Base authorization checks should be shared. Per-version authorization should only ADD restrictions, never remove them. Test authorization for every version independently.

### Refactoring Strategy
1. Audit all version overrides of `authorize()`
2. Ensure base authorization is always called via `parent::authorize()`
3. Add architecture test that V2 authorization is at least as strict as V1
4. Test authorization for each version's endpoints
5. Document authorization requirements per version

### Detection Checklist
- [ ] V2's `authorize()` doesn't call `parent::authorize()`
- [ ] V2 has weaker authorization than V1
- [ ] Authorization tests don't cover all versions
- [ ] Security audit not run per version

### Related Rules/Skills/Trees
- Rule: API-SEC-007 (Per-Version Authorization)
- Skill: authorization-in-form-requests
- Tree: security

---

## 3. Silent Rule Removal

### Category
Data Integrity

### Description
V2 removes a validation rule that existed in V1, allowing data that was previously validated to enter the system without checks.

### Why It Happens
The V2 developer thinks the rule is unnecessary or too strict. They remove it from the rules array without documenting why or assessing the data quality impact.

### Warning Signs
- V2's rules array has fewer rules than V1's
- A field that was validated in V1 is now accepted without checks
- Data quality issues appear in V2 that didn't exist in V1
- No `rules()` diff documented between versions
- V2 tests don't cover the missing validation

### Why Harmful
Data accepted by V2 may violate business rules that V1 correctly enforces. Inconsistent validation between versions means some data paths lack necessary checks, potentially leading to data corruption.

### Real-World Consequences
V1 requires `'price' => 'required|numeric|min:0'`. V2's developer removes `min:0` because "prices can be negative for coupons." V2 now accepts negative prices for all products, not just coupons. The accounting system shows negative revenue.

### Preferred Alternative
Document all rule changes between versions. Review rule removal with business stakeholders. Add tests for the removed rule's scenario.

### Refactoring Strategy
1. Run a diff between V1 and V2 validation rules
2. Review each removed rule for business impact
3. Restore rules that should apply to both versions
4. Document intentional rule changes with business justification
5. Add tests for removed rule scenarios in applicable versions

### Detection Checklist
- [ ] Rules removed from V2 without documentation
- [ ] Data quality difference between versions
- [ ] No rule diff tracking
- [ ] Business rules not consistently enforced

### Related Rules/Skills/Trees
- Rule: API-VALIDATION-002 (Consistent Validation Across Versions)
- Skill: form-request-organization
- Tree: input-validation

---

## 4. Same Request for Store and Update

### Category
Design Inconsistency

### Description
Using the same form request class for both `store` (POST) and `update` (PUT/PATCH) endpoints, without accounting for different validation needs (e.g., fields optional on update but required on create).

### Why It Happens
"Both operations validate the same fields." The developer creates one request class and applies it to both endpoints, not considering that partial updates require different rules.

### Warning Signs
- Same form request used for `store()` and `update()` methods
- PUT/PATCH requests fail with "field is required" errors
- Update operations require all fields when they should accept partial data
- Validation rules don't use `sometimes` for update scenarios
- No `Route::apiResource()` usage that could handle the distinction

### Why Harmful
Update endpoints become unnecessarily strict, requiring clients to send all fields every time. This defeats the purpose of PATCH (partial update) and makes PUT harder to use.

### Real-World Consequences
A mobile app uses PATCH to update user profiles, sending only the changed field. The form request has `'name' => 'required|string'`. The update fails with "name field is required" because the client only sent the email.

### Preferred Alternative
Create separate form requests for store and update, or use conditional `sometimes` rules based on the HTTP method.

### Refactoring Strategy
1. Create separate `Store*Request` and `Update*Request` classes
2. Make update requests use `sometimes` for all fields
3. Store requests keep `required` rules
4. Update controllers to use the appropriate request per method
5. Add tests for partial updates

### Detection Checklist
- [ ] Same request class for store and update
- [ ] PUT/PATCH requires all fields
- [ ] No `sometimes` rules in form request
- [ ] Update operations less flexible than intended

### Related Rules/Skills/Trees
- Rule: API-VALIDATION-003 (Method-Appropriate Validation)
- Skill: form-request-validation-logic
- Tree: input-validation

---

## 5. Modifying Parent Rules Directly

### Category
Side Effect Bug

### Description
V2's `rules()` method modifies the parent's rules array in-place (by reference) before returning it, causing the V1 rules to also change for subsequent requests.

### Why It Happens
Unfamiliarity with PHP array handling. The developer does `$rules = parent::rules(); $rules['new_field'] = 'required';` which is correct, but then accidentally modifies a shared object or reference.

### Warning Signs
- V2 modifies the array returned by `parent::rules()` by reference
- V1 validation behavior changes after V2 request is processed
- Race conditions in validation (order-dependent)
- Static or shared state used in rule construction
- `array_push` or `$rules[] =` on the parent rules array

### Why Harmful
PHP array operations can accidentally modify the parent's array if they share references. This creates non-deterministic validation behavior where V1 rules depend on whether a V2 request was processed first.

### Real-World Consequences
V2's `rules()` does `$rules = &parent::rules(); $rules['status'] .= '|in:active,inactive,disabled';`. The V1 rules now also include `disabled` in the status enum. V1 consumers can now set status to `disabled` which V1 is not designed to handle.

### Preferred Alternative
Always create a new array for rules. Never modify by reference. Use `array_merge()` for clean composition.

### Refactoring Strategy
1. Audit all version form request `rules()` methods
2. Ensure no by-reference operations on parent rules
3. Use `array_merge()` or `+` for clean rule composition
4. Add tests verifying V1 rules are unchanged after V2 request
5. Add static analysis rule preventing by-reference array modification

### Detection Checklist
- [ ] By-reference operations on parent rules
- [ ] V1 validation behavior changes after V2 requests
- [ ] Race conditions in validation
- [ ] No array merge strategy documented

### Related Rules/Skills/Trees
- Rule: API-VALIDATION-004 (Immutability in Rule Composition)
- Skill: form-request-organization
- Tree: input-validation
