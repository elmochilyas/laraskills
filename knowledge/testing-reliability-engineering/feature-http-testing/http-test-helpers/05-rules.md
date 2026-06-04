# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: HTTP Test Helpers

---

### Rule 1: Always use named routes in HTTP tests

| Field | Value |
|-------|-------|
| **Name** | Use named routes, not hardcoded URLs |
| **Category** | Route References |
| **Rule** | Always use `route('users.show', $user)` instead of hardcoded URLs like `/users/1` in HTTP test assertions. |
| **Reason** | Named routes survive URL structure changes. Hardcoded URLs break when route definitions change (e.g., adding a prefix, changing parameter names, restructuring routes). |
| **Bad Example** | `$this->get('/users/1')->assertOk()` — breaks if URL changes to `/admin/users/1`. |
| **Good Example** | `$this->get(route('users.show', $user))->assertOk()` — survives URL structure changes. |
| **Exceptions** | When testing URL structure explicitly (e.g., SEO URL format tests). |
| **Consequences Of Violation** | Tests break when URL structure changes. Routes are refactored less frequently, accruing technical debt. |

---

### Rule 2: Never use `withoutMiddleware()` in feature tests

| Field | Value |
|-------|-------|
| **Name** | Keep middleware active in feature tests |
| **Category** | Test Fidelity |
| **Rule** | Never use `$this->withoutMiddleware()` in feature tests. Only use it in isolated controller unit tests. |
| **Reason** | `withoutMiddleware()` bypasses auth, CSRF, rate limiting, and other important middleware. Feature tests must verify the full request pipeline — skipping middleware defeats the purpose of feature testing. |
| **Bad Example** | `$this->withoutMiddleware()->post('/api/orders', [...])` — bypasses auth, CSRF, throttle. |
| **Good Example** | `$this->actingAs($user)->postJson('/api/orders', [...])` — goes through full middleware pipeline. |
| **Exceptions** | Isolated controller unit tests where the middleware pipeline is tested separately. |
| **Consequences Of Violation** | Tests pass without auth, CSRF protection, or rate limits. Real vulnerabilities go undetected. |

---

### Rule 3: Test both success and error responses for every endpoint

| Field | Value |
|-------|-------|
| **Name** | Test error responses for every endpoint |
| **Category** | Coverage |
| **Rule** | For every endpoint, write tests for at least: happy path (200/201/302), validation errors (422), authentication errors (401/403), and not-found (404). |
| **Reason** | Error handling code is the least exercised and most likely to have bugs. Production errors may leak stack traces or return wrong status codes if error paths are untested. |
| **Bad Example** | Testing only `test_user_can_view_profile()` — error paths (not found, unauthenticated) untested. |
| **Good Example** | Four tests: success, unauthorized, not found, and validation error (for write endpoints). |
| **Exceptions** | Public endpoints with no authentication or validation requirements. |
| **Consequences Of Violation** | Error responses leak stack traces or sensitive data. Unauthenticated requests return 500 instead of 401. |

---

### Rule 4: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes

| Field | Value |
|-------|-------|
| **Name** | Use correct HTTP helper for content type |
| **Category** | Request Simulation |
| **Rule** | Use `$this->getJson()`/`$this->postJson()` for API routes returning JSON responses. Use `$this->get()`/`$this->post()` for web routes returning HTML/Blade responses. |
| **Reason** | JSON variants set proper `Accept: application/json` and `Content-Type: application/json` headers, which trigger Laravel's JSON error formatting and proper request parsing. Non-JSON helpers may return HTML error pages instead of JSON. |
| **Bad Example** | `$this->post('/api/users', $data)` — validation errors return HTML redirect instead of JSON. |
| **Good Example** | `$this->postJson('/api/users', $data)` — validation errors return 422 with JSON errors. |
| **Exceptions** | Routes that accept both JSON and form-encoded requests. |
| **Consequences Of Violation** | API tests receive HTML error pages instead of JSON responses. `assertJson()` fails with confusing HTML parsing errors. |

---

### Rule 5: Follow Arrange-Act-Assert structure in every test

| Field | Value |
|-------|-------|
| **Name** | Use AAA structure |
| **Category** | Test Readability |
| **Rule** | Structure every HTTP test with clear Arrange (create data, set auth), Act (make request), and Assert (verify response) sections separated by blank lines. |
| **Reason** | AAA structure makes tests readable and maintainable. A developer reading the test immediately understands the setup, the action, and the expected outcome without parsing the entire method. |
| **Bad Example** | Setup, request, and assertions mixed together without clear separation. |
| **Good Example** | Three clear sections: `// Arrange` → `// Act` → `// Assert` with blank line separators. |
| **Exceptions** | One-liner tests where AAA structure adds more lines than logic. |
| **Consequences Of Violation** | Tests are harder to read and maintain. Debugging requires parsing the entire method. |

---

### Rule 6: Don't use `withoutCSRF()` — include CSRF tokens or test with middleware active

| Field | Value |
|-------|-------|
| **Name** | Test with CSRF protection active |
| **Category** | Security |
| **Rule** | Do not use `$this->withoutCSRF()` in feature tests. Instead, test that forms include CSRF tokens and that requests without tokens are rejected. |
| **Reason** | CSRF protection is a critical security boundary. Disabling it in tests means CSRF vulnerabilities go undetected. Forms that don't include CSRF tokens will fail in production. |
| **Bad Example** | `$this->withoutCSRF()->post('/orders', [...])` — CSRF bypass untested. |
| **Good Example** | `$this->post('/orders', [...])` — CSRF middleware active. Or testing that the form includes `@csrf` via `assertSee('_token')`. |
| **Exceptions** | API routes using token-based auth (Sanctum) where CSRF is not applicable. |
| **Consequences Of Violation** | CSRF vulnerabilities reach production. Users are vulnerable to cross-site request forgery attacks. |
