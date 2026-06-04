---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K082 — Horizon Dashboard Authorization
Knowledge ID: K082
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | No Auth Configured in Production | Security | Critical |
| 2 | Auth Callback Always Returns `true` | Security | Critical |
| 3 | Throwing Exception Instead of Returning `false` | Implementation | Medium |
| 4 | Heavy Compute/DB Queries in Auth Callback | Performance | Low |
| 5 | Sharing Dashboard URL Publicly | Security | Low |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Unauthenticated Dashboard | Critical — job payloads with PII, retry/delete capabilities exposed | Mandatory auth callback in production deployment checklist |
| Always-True Auth | Critical — effectively no access control | Code review must reject unconditional `true` returns |
| Unauthenticated 500 Error | Medium — leaks stack trace, confusing UX | Enforce `return false` pattern for unauthorized |

---

## 1. No Auth Configured in Production

### Category
Security

### Description
Deploying Horizon to production without configuring `Horizon::auth()`. The default behavior allows all access in `local` environment and denies all in other environments — but only if the auth callback is configured. Without any callback, the dashboard may be accessible or allow default fallback behavior that grants access.

### Why It Happens
- Developer Horizon setup only runs in `local` where no auth is needed
- Production deployment checklist missing Horizon security
- Assuming Horizon automatically blocks production access (it does not without auth callback)
- Not reading Horizon security documentation
- Copying development Horizon config to production

### Warning Signs
- `/horizon` is accessible without authentication in production
- Anyone with the URL can see queue metrics, job payloads, and management controls
- No `Horizon::auth()` call in `AppServiceProvider`
- Security audit flags unauthenticated dashboard access
- Job payloads containing API keys, PII, or business data are visible

### Why Harmful
- Complete exposure of all job payloads (may contain PII, secrets, business data)
- Attacker can view failed job details with full payload data
- Attacker can retry or delete failed jobs
- Attacker can pause/resume supervisors and terminate Horizon
- Full operational control over the queue system

### Consequences
- Data breach (PII in job payloads exposed)
- Operational sabotage (all queues paused, jobs deleted)
- Compliance violation (GDPR, HIPAA, PCI)
- Financial loss from disrupted queue processing
- Reputation damage from security incident

### Alternative
- Always configure `Horizon::auth()` before deploying to production:
  ```php
  Horizon::auth(function ($request) {
      return $request->user() && $request->user()->hasRole('admin');
  });
  ```

### Refactoring Strategy
1. Add `Horizon::auth()` callback in `AppServiceProvider::boot()`
2. Implement role/permission check (not unconditional `true`)
3. Deploy and verify `/horizon` returns 403 without auth
4. Verify authorized users can access dashboard
5. Add security scan that checks for missing Horizon auth

### Detection Checklist
- [ ] `Horizon::auth()` configured in production environment
- [ ] Dashboard returns 403 without valid authentication
- [ ] No unconditional `true` in auth callback
- [ ] Security scan checks for Horizon auth configuration
- [ ] Job payloads are not publicly accessible

### Related Rules
- configure-horizon-auth-production

### Related Skills
- Authorize Horizon Dashboard Access

### Related Decision Trees
- Horizon Dashboard Access Control Strategy

---

## 2. Auth Callback Always Returns `true`

### Category
Security

### Description
Configuring `Horizon::auth()` to return `true` unconditionally in production. This effectively disables all access control — anyone who reaches the dashboard URL can view and manage the queue system.

### Why It Happens
- Developer adds auth callback as a placeholder and never implements real logic
- Misunderstanding that `return true` is a "temporary" measure that stays in production
- Copying local environment config where `return true` is acceptable
- Not considering that even "internal" URLs can be discovered or accessed
- Assuming network-level security (VPN) is sufficient without application-level auth

### Warning Signs
- Auth callback body is `return true;` with no checks
- Dashboard accessible to any authenticated user (no role check)
- All employees can see job payloads with sensitive data
- No granular access control — everyone has full access
- Code review passes unconditional `true` in auth callback

### Why Harmful
- Auth callback exists but provides no security
- False sense of security — "we have Horizon auth configured"
- Anyone who can log into the application can access dashboard
- No audit trail of who accessed the dashboard
- Compliance requirements for access control are not met

### Consequences
- Unauthorized users can view failed job payloads
- Unauthorized users can retry/delete jobs
- No access control despite "configured" auth
- Compliance audit failure
- Data exposure from job payloads

### Alternative
- Implement actual access control:
  ```php
  Horizon::auth(function ($request) {
      return app()->environment('local')
          || ($request->user() && $request->user()->hasRole('admin'));
  });
  ```

### Refactoring Strategy
1. Review `Horizon::auth()` implementation
2. Replace `return true` with actual role/permission check
3. Add environment check — `local` can be open, production must be restricted
4. Deploy and test: unauthorized users get 403
5. Add code review rule: no unconditional `true` in Horizon auth

### Detection Checklist
- [ ] Auth callback does not unconditionally return `true`
- [ ] Environment-specific logic: `local` open, production restricted
- [ ] Role/permission check for authorization
- [ ] Unauthorized access returns 403
- [ ] No "temporary" `return true` in production

### Related Rules
- configure-horizon-auth-production

### Related Skills
- Authorize Horizon Dashboard Access

### Related Decision Trees
- Horizon Dashboard Access Control Strategy

---

## 3. Throwing Exception Instead of Returning `false`

### Category
Implementation

### Description
Writing the auth callback in a way that throws an exception for unauthenticated users instead of returning `false`. For example, calling `$request->user()->isAdmin()` when `user()` is `null` — this throws an error and returns a 500 response with error details instead of a clean 403.

### Why It Happens
- Not handling the case where `$request->user()` can be `null`
- Assuming authentication middleware runs before Horizon auth (it may not)
- Using method chaining without null safety
- Not testing with unauthenticated requests
- Copying code that assumes authenticated users

### Warning Signs
- Unauthenticated access to `/horizon` returns 500 error
- Stack trace visible in the 500 response (debug mode)
- Error log contains "Call to a member function isAdmin() on null"
- `Horizon::auth()` callback doesn't handle `null` user
- `$request->user()->isAdmin()` without null check

### Why Harmful
- 500 error may leak file paths, class names, and code structure in stack trace
- Unauthenticated users see a server error instead of access denied
- Confusing UX: "is the dashboard broken or am I not authorized?"
- Error monitoring is polluted with auth failures
- May reveal internal implementation details to attackers

### Consequences
- Information leakage from stack traces (if debug mode)
- Confusing error responses for legitimate users
- Increased error count in monitoring (masking real errors)
- Poor user experience — no clear access denied message
- Potential security information disclosure

### Alternative
- Use null-safe operator and return `false`:
  ```php
  Horizon::auth(function ($request) {
      return $request->user()?->isAdmin() ?? false;
  });
  ```
- Or explicitly check:
  ```php
  Horizon::auth(function ($request) {
      if (! $request->user()) return false;
      return $request->user()->isAdmin();
  });
  ```

### Refactoring Strategy
1. Review all `Horizon::auth()` callbacks for null safety
2. Ensure `$request->user()` is checked before method calls
3. Return `false` for unauthenticated — never throw
4. Test with unauthenticated request — verify 403 response
5. Test with authenticated non-admin — verify 403 response

### Detection Checklist
- [ ] Auth callback handles `null` user gracefully
- [ ] Unauthenticated request returns 403 (not 500)
- [ ] No exceptions thrown in auth callback
- [ ] `$request->user()` check before method calls
- [ ] Error log is clean of auth-related exceptions

### Related Rules
- return-false-not-exception

### Related Skills
- Authorize Horizon Dashboard Access

### Related Decision Trees
- Horizon Dashboard Access Control Strategy

---

## 4. Heavy Compute/DB Queries in Auth Callback

### Category
Performance

### Description
Performing database queries, API calls, or heavy computation inside the `Horizon::auth()` callback. The callback runs on every dashboard page load — heavy operations degrade page load times and add unnecessary load to backend systems.

### Why It Happens
- Building complex authorization logic directly in the callback
- Not considering that dashboard page loads are many (especially with auto-refresh)
- Copy-paste from controller authorization where DB queries are acceptable
- Over-engineering auth: checking multiple permission tables, calling external APIs
- Not caching authorization results

### Warning Signs
- Auth callback contains `DB::query()`, `Model::find()`, or HTTP calls
- Dashboard page takes >500ms to load (auth is the bottleneck)
- Database query count spikes when viewing Horizon dashboard
- API rate limits hit from dashboard page loads (auth checking external service)
- Multiple queries per page load for permission lookups

### Why Harmful
- Every dashboard page load triggers expensive operations
- With auto-refresh (every 5 seconds), auth queries run continuously
- Unnecessary load on database or external services
- Slow dashboard page loads degrade the monitoring experience
- In worst case: auth check cascading failure (slow DB → slow auth → timeout)

### Consequences
- Slow Horizon dashboard (10+ seconds to load)
- Database load from dashboard auth queries during incident response
- Operation team cannot use dashboard effectively during crises
- External API rate limits hit from auth checks
- Developer time wasted waiting for dashboard to load

### Alternative
- Keep auth callback fast — simple role/permission check:
  ```php
  Horizon::auth(function ($request) {
      return $request->user()?->isAdmin() ?? false;
  });
  ```
- Cache authorization decisions in session or request scope
- Use Gate with cached permissions

### Refactoring Strategy
1. Audit auth callback for heavy operations
2. Replace DB queries with cached role checks
3. If complex auth is needed, cache the result with session or Redis
4. Test page load time — should be under 200ms
5. Monitor database queries during dashboard usage

### Detection Checklist
- [ ] Auth callback contains no database queries
- [ ] Auth callback contains no external API calls
- [ ] Auth decision is fast (simple role/permission check)
- [ ] Dashboard page loads under 500ms
- [ ] No auth-related DB query spike when viewing dashboard
- [ ] Cached auth used if complex logic is required

### Related Rules
- keep-auth-callback-fast

### Related Skills
- Authorize Horizon Dashboard Access

### Related Decision Trees
- Horizon Dashboard Access Control Strategy

---

## 5. Sharing Dashboard URL Publicly

### Category
Security

### Description
Publicly sharing or documenting the Horizon dashboard URL, even with auth protection. The endpoint's existence is information that can aid attackers, and any vulnerability in the auth mechanism becomes exploitable.

### Why It Happens
- Not considering the dashboard URL as sensitive information
- Including the URL in internal documentation shared broadly
- Posting dashboard screenshots on social media or public forums (with URL visible)
- Adding bookmark links in shared browser profiles
- Not understanding security-by-obscurity risks

### Warning Signs
- Dashboard URL in public documentation or README files
- Screenshots of Horizon dashboard shared publicly
- URL hardcoded in monitoring tools with public access
- `/horizon` path used without prefix randomization
- Anyone on the corporate network can guess the URL

### Why Harmful
- Attackers probe for `/horizon` on known domains
- Knowing the endpoint exists is the first step in exploitation
- Any vulnerability in Horizon auth is exploitable because the route is known
- Social engineering: "click this link to see our queue dashboard"
- Even with auth, the URL discovery reduces security

### Consequences
- Increased attack surface (attackers know where to probe)
- Zero-day in Horizon auth becomes immediately exploitable
- Phishing target: "admin, click here to check queues" → auth bypass
- Compliance: security-by-obscurity is not acceptable control
- Reputation risk if dashboard screenshots leak internal operational data

### Alternative
- Change the default `/horizon` path to something unique:
  ```php
  // config/horizon.php
  'path' => env('HORIZON_PATH', 'admin-' . Str::random(8)),
  ```
- Disable routes in production if remote monitoring is not needed
- Use VPN-only access with IP-restricted auth
- Never share dashboard URL publicly or in documentation

### Refactoring Strategy
1. Change default `/horizon` path to a custom prefix
2. Or disable Horizon routes in production completely
3. Update internal documentation to not include the URL
4. Remove old URLs from README, wikis, and public documentation
5. Verify old `/horizon` endpoint returns 404

### Detection Checklist
- [ ] Dashboard URL is not in public documentation
- [ ] Default `/horizon` path is changed to a custom prefix
- [ ] No dashboard screenshots with visible URLs shared publicly
- [ ] Routes can be disabled in production if remote access not needed
- [ ] VPN or IP restriction in place for dashboard access

### Related Rules
- consider-removing-horizon-routes

### Related Skills
- Authorize Horizon Dashboard Access

### Related Decision Trees
- Horizon Dashboard Access Control Strategy
