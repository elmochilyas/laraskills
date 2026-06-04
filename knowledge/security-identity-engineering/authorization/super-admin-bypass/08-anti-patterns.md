# Anti-Patterns: Super-Admin Bypass (Gate::before)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Super-Admin Bypass (Gate::before) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SA-01 | Returning false From Gate::before | Critical | Medium | Low |
| AP-SA-02 | Multiple Gate::before Registrations | High | Medium | Low |
| AP-SA-03 | Database Queries in before() Closure | High | Medium | Low |
| AP-SA-04 | No Super-Admin Audit Trail | High | High | Medium |
| AP-SA-05 | Returning true for All Authenticated Users | Critical | Low | Low |

---

## Repository-Wide Anti-Patterns

- **Email-Based Super-Admin Identification**: Using `$user->email === config(...)` which breaks on email change
- **Bypassing Gate::before() Entirely**: No super-admin bypass at all, requiring explicit permission for every action
- **Super-Admin Assignment Without Approval**: Any admin can self-grant super-admin status

---

## 1. Returning false From Gate::before()

### Category
Security · Critical

### Description
Returning `false` from `Gate::before()` instead of `true|null`, causing all authorization checks to be denied for non-super-admin users.

### Why It Happens
The ternary operator `$user->isSuperAdmin() ?: false` is the most common cause. Developers expect `false` to mean "skip the bypass, run the normal check." In reality, `false` means "deny this action," which blocks all non-super-admin users from everything.

### Warning Signs
- `Gate::before()` uses the ternary operator `?:` or explicit `return false`
- Non-super-admin users receive 403 Forbidden on every route
- `Gate::before()` callback contains `return false;`
- All authorization checks fail for non-super-admin users
- Registration/login may still work (if they don't go through authorization checks)

### Why Harmful
The application is completely broken for non-super-admin users. No authorization check can succeed because `false` takes priority over the normal gate/policy logic. Every feature that uses authorization is blocked.

### Real-World Consequences
- All users except the developer's super-admin account get 403 on every page
- Production: all customers unable to access any feature
- Hours of debugging because the `Gate::before()` registration was forgotten about
- Emergency rollback required

### Preferred Alternative
Return `true` for super-admin, `null` for everyone else.

### Refactoring Strategy
1. Change `return $user->isSuperAdmin() ?: false;` to:
   ```php
   if ($user->isSuperAdmin()) { return true; }
   ```
2. The implicit return `null` handles non-super-admin delegation
3. Test that non-admin users can access authorized routes

### Detection Checklist
- [ ] Does `Gate::before()` ever return `false`?
- [ ] Is the ternary operator `?:` used in the return?
- [ ] Do non-super-admin users receive 403 unexpectedly?
- [ ] Does registration create users that can't access any page?
- [ ] Are all authorization checks failing simultaneously?

### Related Rules/Skills/Trees
- Return true|null From Gate::before(), Never false (05-rules.md)
- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)

---

## 2. Multiple Gate::before Registrations

### Category
Architecture · Maintainability

### Description
Registering `Gate::before()` in multiple locations, causing only the last registration to take effect because subsequent registrations silently override previous ones.

### Why It Happens
Different developers add bypass logic in different service providers. One developer adds super-admin bypass in `AppServiceProvider`, another adds support-team bypass in `AuthServiceProvider`. Neither knows about the other's registration. Only the last to register takes effect, but there's no error or warning.

### Warning Signs
- `Gate::before()` call appears in multiple service providers
- One bypass rule works but another doesn't
- Service provider registration order in `config/app.php` determines which bypass works
- Removing one service provider causes a different bypass to activate

### Why Harmful
The overridden bypass silently stops working. If the super-admin bypass is registered first and the support-team bypass registers second, the support-team bypass works but the super-admin bypass does not. No error indicates this.

### Real-World Consequences
- Super-admin bypass stops working after support-team bypass added
- Developer removes `Gate::before()` from one provider, and a different bypass "appears"
- Security audit finds overridden registration — unintended bypass behavior
- Confusion about which bypass is actually active

### Preferred Alternative
Register `Gate::before()` exactly once. Combine all bypass conditions into a single closure.

### Refactoring Strategy
1. Find all `Gate::before()` registrations
2. Centralize them in `AuthServiceProvider::boot()`
3. Combine into a single closure:
   ```php
   Gate::before(function (User $user) {
       if ($user->isSuperAdmin() || $user->hasRole('support')) {
           return true;
       }
   });
   ```

### Detection Checklist
- [ ] How many `Gate::before()` registrations exist?
- [ ] Are there `Gate::before()` calls in multiple service providers?
- [ ] Does removing one service provider change authorization behavior?
- [ ] Is there a single, central `Gate::before()` registration?
- [ ] Is there documentation about where bypass logic resides?

### Related Rules/Skills/Trees
- Register Only One Gate::before() Callback (05-rules.md)
- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)

---

## 3. Database Queries in before() Closure

### Category
Performance

### Description
Executing database queries inside the `Gate::before()` closure, causing N+1 query overhead on every authorization check throughout the application.

### Why It Happens
The most natural way to check super-admin status is to query the database: `$user->roles()->where('name', 'super-admin')->exists()`. This is a lazyloaded relationship query. It runs every time `before()` is called — which is every authorization check in every request. If a page has 20 authorization checks, the same role query executes 20 times.

### Warning Signs
- `Gate::before()` closure contains Eloquent queries
- Database query log shows repeated super-admin role checks
- Page with many authorization checks is slow
- N+1 query pattern visible for role relationships in queries
- `$user->roles()` lazy-loading inside `before()`

### Why Harmful
`before()` executes on every authorization check. A database query inside it adds overhead to every Gate evaluation, Policy method call, `@can` directive, and `$this->authorize()` call. A page with 30 authorization checks executes 30 redundant queries.

### Real-World Consequences
- Page load time proportional to number of authorization checks
- Database server sees repeated identical queries — poor cache utilization
- 30 extra queries per page load for role checking
- Performance degradation as authorization checks increase

### Preferred Alternative
Cache super-admin status. Use a method on the User model that checks a cached/loaded value.

### Refactoring Strategy
1. Move the check to a User model method
2. Eager-load the role relationship or use a cached column
3. Cache the super-admin status (remember until role changes)
4. Example:
   ```php
   // User model
   public function isSuperAdmin(): bool {
       return $this->is_super_admin; // cached column
       // or: return Cache::remember("user:{$this->id}:super-admin", 3600, function () {
       //     return $this->hasRole('super-admin');
       // });
   }
   ```

### Detection Checklist
- [ ] Does `Gate::before()` contain database queries?
- [ ] Are there repeated role/status queries in the query log?
- [ ] Is authorization slow on pages with many checks?
- [ ] Is super-admin status cached?
- [ ] Does the User model have a lightweight `isSuperAdmin()` method?

### Related Rules/Skills/Trees
- Keep Gate::before() Logic Simple — Single Boolean Method Call (05-rules.md)
- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)

---

## 4. No Super-Admin Audit Trail

### Category
Security · Audit

### Description
Failing to log super-admin actions on resources they would not normally have access to, creating blind spots in audit trails.

### Why It Happens
Developers focus on implementing the bypass itself, not on auditing bypassed actions. The assumption is that super-admins are trustworthy — their actions don't need special logging. But the super-admin bypass exists specifically because super-admins can access resources they don't own. Those accesses are invisible in standard audit logs because authorization checks never fail.

### Warning Signs
- Super-admin bypass implemented, no audit logging added
- Audit log only shows authorization failures — super-admins never fail
- No way to answer "which super-admin accessed which user's data?"
- Compliance requirements for privileged access monitoring are unmet

### Why Harmful
Without audit trails, super-admin abuse or mistakes go undetected. A super-admin accessing sensitive data (customer records, financial information) leaves no trace. Compliance frameworks (SOC2, HIPAA, PCI DSS) require logging privileged access.

### Real-World Consequences
- Compliance audit fails — no privileged access logging
- Super-admin deletes user data — no record of who did it
- Insider threat: super-admin exports customer database — no audit trail
- Legal discovery: "Show all super-admin access to protected data" — cannot comply

### Preferred Alternative
Log super-admin actions on resources not owned by the super-admin.

### Refactoring Strategy
1. Identify actions where super-admins act on non-owned resources
2. Log super-admin actions, recording user, resource, action, timestamp
3. Integrate with Spatie Activitylog or a custom audit table
4. Example:
   ```php
   Gate::before(function (User $user) {
       if ($user->isSuperAdmin()) {
           activity()->log('super_admin_bypass');
           return true;
       }
   });
   ```

### Detection Checklist
- [ ] Are super-admin actions logged?
- [ ] Can you audit which super-admin accessed which resource?
- [ ] Are compliance requirements for privileged access met?
- [ ] Is there a log query for super-admin activity?
- [ ] Does the audit trail include super-admin identification?

### Related Rules/Skills/Trees
- Log Super-Admin Actions on Restricted Resources (05-rules.md)
- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)
- Audit Trail for Super-Admin Actions decision tree (07-decision-trees.md)

---

## 5. Returning true for All Authenticated Users

### Category
Security · Critical

### Description
`Gate::before()` returns `true` for all authenticated users instead of only super-admins, completely defeating the authorization system.

### Why Happens
A naive implementation: `Gate::before(fn ($user) => true)`. This is sometimes done during development to "disable authorization temporarily" and forgotten in production. Alternatively, the check is incorrectly scoped: `Gate::before(fn ($user) => Auth::check())` which returns `true` for all authenticated users.

### Warning Signs
- `Gate::before()` returns a hardcoded `true`
- `Gate::before()` checks `Auth::check()` and returns `true`
- Every logged-in user can access every feature regardless of permissions
- Authorization changes have no effect — Gates and Policies are never evaluated
- Spatie `*` wildcard permission assigned to every user

### Why Harmful
The entire authorization system is disabled for authenticated users. Every user can perform every action. This is equivalent to having no authorization at all. The application depends entirely on obscurity.

### Real-World Consequences
- Any authenticated user can delete any resource
- Any authenticated user can access admin panels
- Users can escalate privileges by accessing higher-level routes
- Data breach: unauthorized users access sensitive data
- Security audit: "Why does everyone have admin access?"

### Preferred Alternative
Restrict `true` return to only verified super-admin users.

### Refactoring Strategy
1. Remove the blanket `return true`
2. Implement a proper super-admin check:
   ```php
   Gate::before(function (User $user) {
       return $user->isSuperAdmin() ?: null;
   });
   ```
3. Verify authorization works for non-admin users
4. Check all routes and features for proper permission enforcement

### Detection Checklist
- [ ] Does `Gate::before()` return `true` unconditionally?
- [ ] Is there a super-admin check before returning `true`?
- [ ] Can non-admin users access admin features?
- [ ] Are all users effectively super-admins?
- [ ] Is authorization testing failing because it always passes?

### Related Rules/Skills/Trees
- Return true|null From Gate::before(), Never false (05-rules.md)
- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)
