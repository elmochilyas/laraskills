# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Database Query Count Expectations

---

### Rule 1: Call `expectsDatabaseQueryCount()` before the act phase

| Field | Value |
|-------|-------|
| **Name** | Set query count expectation before executing queries |
| **Category** | Assertion Placement |
| **Rule** | Call `$this->expectsDatabaseQueryCount($count)` immediately before the HTTP request or action, after all setup is complete. |
| **Reason** | The expectation is registered at the time of the call and validated at teardown. If any queries have already executed (setup, auth, data creation), they are NOT counted against the expectation. Placing it after setup but before the act ensures only the action's queries are measured. |
| **Bad Example** | `Post::factory()->create(); $this->get('/posts'); $this->expectsDatabaseQueryCount(3);` — too late, expectation not registered. |
| **Good Example** | `Post::factory()->create(); $this->expectsDatabaseQueryCount(3); $this->get('/posts');` — correct placement. |
| **Exceptions** | None. Placement before the act is a hard requirement. |
| **Consequences Of Violation** | Expectation is registered after queries execute. Count is 0, causing test failure. |

---

### Rule 2: Use in every feature test that touches the database

| Field | Value |
|-------|-------|
| **Name** | Query count expectations are mandatory for database tests |
| **Category** | Coverage |
| **Rule** | Include `expectsDatabaseQueryCount()` in every feature test that makes database queries. This should be the default for all feature tests. |
| **Reason** | Without query count expectations, query inflation goes unnoticed. A new event listener, middleware, relationship, or N+1 bug can add queries without any test failing. Query count expectations are the performance regression gate. |
| **Bad Example** | Feature test with `assertOk()` but no `expectsDatabaseQueryCount()` — query inflation undetected. |
| **Good Example** | Every database test includes a documented query count budget. |
| **Exceptions** | Tests for reporting or dashboard endpoints with inherently variable query counts. |
| **Consequences Of Violation** | Query counts inflate silently over time. Performance degrades gradually across multiple PRs. |

---

### Rule 3: Document the expected query count with a comment

| Field | Value |
|-------|-------|
| **Name** | Document what each query in the budget is for |
| **Category** | Documentation |
| **Rule** | Add a comment explaining what contributes to the expected query count: `// 1 auth + 1 user load + 1 post list + 1 eager-loaded comments = 4`. |
| **Reason** | A bare `expectsDatabaseQueryCount(4)` provides no information when it fails. A documented budget tells the developer which queries are expected and helps identify the unexpected one when the count changes. |
| **Bad Example** | `$this->expectsDatabaseQueryCount(4)` — no explanation of what the 4 queries are. |
| **Good Example** | `$this->expectsDatabaseQueryCount(4); // 1 auth + 1 posts + 1 comments (eager) + 1 count` |
| **Exceptions** | Obvious query patterns (e.g., a simple `show` endpoint with one query). |
| **Consequences Of Violation** | When the count changes, developers don't know which queries are expected. Debugging requires reverse-engineering the expected pattern. |

---

### Rule 4: Use zero-query expectations for cached endpoints

| Field | Value |
|-------|-------|
| **Name** | Verify cache effectiveness with zero-query tests |
| **Category** | Cache Verification |
| **Rule** | For cached endpoints, write a test that pre-populates the cache and asserts `expectsDatabaseQueryCount(0)`. |
| **Reason** | Zero-query tests provide definitive proof that the cache is working. If the cache breaks or the cache key changes, the zero-query test immediately fails, catching the regression before any performance impact. |
| **Bad Example** | Testing only the cold-cache path — warm cache may actually execute queries despite caching. |
| **Good Example** | `$this->get('/posts'); $this->expectsDatabaseQueryCount(0); $this->get('/posts')` — warm cache hits zero queries. |
| **Exceptions** | Endpoints where some queries are unavoidable (e.g., auth/session checks that must run on every request). |
| **Consequences Of Violation** | Cache is not actually serving responses. All requests hit the database, but no test catches it. |

---

### Rule 5: Review and update budgets deliberately during code review

| Field | Value |
|-------|-------|
| **Name** | Update query budgets when adding features |
| **Category** | Code Review |
| **Rule** | When adding features that increase query counts, update the expected count in the same PR. Review query budget changes during code review — a budget increase is a performance decision. |
| **Reason** | Query count is a performance metric. Increasing it should be a deliberate decision, not an accidental side effect. Code review is the right place to discuss and approve budget changes. |
| **Bad Example** | PR adds a new event listener that adds 2 queries — test fails, developer removes `expectsDatabaseQueryCount()` instead of updating it. |
| **Good Example** | PR adds 2 queries → budget updated from 4 to 6 → reviewer discusses whether the 2 new queries are justified. |
| **Exceptions** | Trivial query additions that are justified by the feature (e.g., adding a new relationship to the response). |
| **Consequences Of Violation** | Query budgets are silently removed or inflated without discussion. Performance gradually degrades. |

---

### Rule 6: Establish middleware query baseline and account for it

| Field | Value |
|-------|-------|
| **Name** | Account for middleware queries in budgets |
| **Category** | Baseline |
| **Rule** | Run an empty authenticated request to establish the middleware query baseline (auth, session, CSRF). Account for these queries in every endpoint's budget. |
| **Reason** | Middleware queries (authenticating the user, loading session data, checking CSRF) are not visible in the endpoint logic but count toward `expectsDatabaseQueryCount()`. Without accounting for them, budgets are always too low. |
| **Bad Example** | `expectsDatabaseQueryCount(2)` for an endpoint — fails because auth + session middleware add 2 more queries. |
| **Good Example** | Baseline: empty request uses 3 queries. Endpoint adds 2 queries. Budget = 5. |
| **Exceptions** | None. Every authenticated endpoint has middleware query overhead. |
| **Consequences Of Violation** | Query count assertions consistently fail. Developers may remove the assertions instead of fixing the budget. |
