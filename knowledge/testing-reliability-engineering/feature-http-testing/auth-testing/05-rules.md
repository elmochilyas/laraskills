# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: Authentication & Authorization Testing

---

### Rule 1: Test every side of every authorization boundary

| Field | Value |
|-------|-------|
| **Name** | Test all authorization sides |
| **Category** | Authorization |
| **Rule** | For every protected endpoint, test four scenarios: guest access (401/redirect), wrong role (403), correct role (200), and ownership boundary (if applicable). |
| **Reason** | Each authorization side is an independent failure mode. Missing any side means a security gap that will reach production. The most common authorization bug is untested ownership boundaries. |
| **Bad Example** | Testing only that an admin can access `/admin/dashboard` without testing that a regular user gets 403 or that a guest gets redirected. |
| **Good Example** | Four tests: `test_guest_cannot_view_dashboard()`, `test_user_cannot_view_dashboard()`, `test_admin_can_view_dashboard()`, `test_user_cannot_access_another_users_data()`. |
| **Exceptions** | Public endpoints with no authorization requirements. |
| **Consequences Of Violation** | Unauthorized data access in production. Security vulnerabilities go undetected until exploitation. |

---

### Rule 2: Use `actingAs()` for authorization tests, actual POST for login flow tests

| Field | Value |
|-------|-------|
| **Name** | Distinguish auth tests from login flow tests |
| **Category** | Authentication |
| **Rule** | Use `$this->actingAs($user)` for authorization and authenticated-access tests (fast, bypasses login). Use actual `$this->post('/login', [...])` for testing the authentication mechanism itself (wrong password, lockout, CSRF). |
| **Reason** | `actingAs()` sets the user in the session directly without password verification. It's fast (<1ms) and focused on downstream behavior. Login flow tests must go through the actual authentication process to verify password hashing, CSRF protection, and brute force lockout. |
| **Bad Example** | `actingAs($user)` used to test login — misses password verification, CSRF, and lockout behavior. |
| **Good Example** | Separate tests: `test_authenticated_user_can_view_dashboard()` uses `actingAs()`; `test_login_with_wrong_password_fails()` uses actual POST. |
| **Exceptions** | None. These are distinct concerns requiring different approaches. |
| **Consequences Of Violation** | Login mechanism bugs (CSRF bypass, lockout failure, password hash issues) reach production undetected. |

---

### Rule 3: Test authorization for every HTTP verb on every resource

| Field | Value |
|-------|-------|
| **Name** | Test all HTTP verbs for authorization |
| **Category** | Authorization |
| **Rule** | For every RESTful resource, test authorization separately for GET, POST, PUT/PATCH, and DELETE. |
| **Reason** | Authorization is often implemented per-verb. A resource may allow GET for all users but restrict DELETE to admins. Testing only one verb leaves authorization gaps for other operations. |
| **Bad Example** | Testing only `GET /api/posts` — missing that `DELETE /api/posts/1` allows unauthorized deletion. |
| **Good Example** | Separate tests: `test_guest_cannot_list_posts()`, `test_guest_cannot_create_post()`, `test_guest_cannot_update_post()`, `test_guest_cannot_delete_post()`. |
| **Exceptions** | Resources where all verbs share identical authorization logic via middleware or route-level checks. |
| **Consequences Of Violation** | Unauthorized write or delete operations. Data integrity violations in production. |

---

### Rule 4: Test ownership boundaries for user-scoped resources

| Field | Value |
|-------|-------|
| **Name** | Test ownership-based authorization |
| **Category** | Authorization |
| **Rule** | For resources owned by users (e.g., posts, comments, orders), test that User A cannot access, modify, or delete User B's resources. |
| **Reason** | Ownership checks are the most commonly missed authorization boundary. Role-based checks alone allow User A to access User B's private data if both users have the same role. |
| **Bad Example** | Testing only that an admin can delete any post, but not that User A cannot delete User B's post. |
| **Good Example** | Two users, one post owned by User A. User B gets 403 for PUT, DELETE, or GET on that post. |
| **Exceptions** | Global resources not scoped to individual users (e.g., site-wide settings). |
| **Consequences Of Violation** | Users can access, modify, or delete other users' private data. GDPR/Privacy violations. Data integrity breaches. |

---

### Rule 5: Use `actingAsSanctum()` for Sanctum-guarded API routes

| Field | Value |
|-------|-------|
| **Name** | Use correct guard helper for API authentication |
| **Category** | Authentication |
| **Rule** | Use `$this->actingAsSanctum($user)` for routes guarded by Sanctum (API token auth). Use `$this->actingAs($user)` for session-guarded routes (web auth). |
| **Reason** | Sanctum and session authentication use different guard mechanisms. Using `actingAs()` on a Sanctum-guarded route results in the user appearing unauthenticated — all requests receive 401. |
| **Bad Example** | `$this->actingAs($user)->getJson('/api/users')` on a route using `auth:sanctum` middleware — user appears unauthenticated. |
| **Good Example** | `$this->actingAsSanctum($user)->getJson('/api/users')` — correctly authenticates via Sanctum token. |
| **Exceptions** | Routes using the default `web` guard should use `actingAs()`. |
| **Consequences Of Violation** | Authenticated API tests fail with 401. Tests pass only when `actingAs()` happens to work due to session sharing. |

---

### Rule 6: Test rate limiting on authentication endpoints

| Field | Value |
|-------|-------|
| **Name** | Test rate limiting on auth endpoints |
| **Category** | Security |
| **Rule** | Test that login, registration, and password reset endpoints enforce rate limits — exceeding the limit returns 429 and the limit resets after the decay window. |
| **Reason** | Authentication endpoints are the primary brute-force attack surface. Untested rate limits mean the application is vulnerable to credential stuffing and password spraying attacks. |
| **Bad Example** | Only testing successful login without verifying that N failed attempts trigger lockout. |
| **Good Example** | Three-phase test: within limit succeeds, exceeded limit returns 429, after decay window returns to success. |
| **Exceptions** | Auth endpoints with IP-based rate limiting require careful test design to avoid false failures in CI. |
| **Consequences Of Violation** | Application is vulnerable to brute-force attacks. Credential stuffing succeeds without detection. |

---

### Rule 7: Test that error responses do not reveal whether a resource exists

| Field | Value |
|-------|-------|
| **Name** | Use opaque 404 responses for unauthorized resources |
| **Category** | Security |
| **Rule** | Test that accessing a resource the user is not authorized to view returns 404 (not 403 or 200), preventing information disclosure about resource existence. |
| **Reason** | Returning 403 tells an attacker the resource exists but they don't have access. Returning 200 for "not found" tells them it doesn't exist. A 404 for both cases prevents enumeration. |
| **Bad Example** | `GET /api/users/999` returns 404 (not found). `GET /api/users/1` (someone else's user) returns 403 (exists but forbidden). |
| **Good Example** | Both cases return 404 — the attacker cannot distinguish "doesn't exist" from "exists but not yours." |
| **Exceptions** | Public resources where existence is not sensitive (product catalog, blog posts). |
| **Consequences Of Violation** | Attackers can enumerate valid resource IDs. Information disclosure enables targeted attacks. |
