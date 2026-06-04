# ECC Anti-Patterns — Postman Collection Generation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Postman Collection Generation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hardcoded Environment Values in Collection
2. Collection Drift from OpenAPI Spec
3. Stale Auth Tokens in Environment Files
4. No Test Scripts — Collection as Documentation Only
5. Single Collection for All API Versions

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Copy-Paste Programming

---

## Anti-Pattern 1: Hardcoded Environment Values in Collection

### Category
Code Organization

### Description
Embedding environment-specific values — base URL, API tokens, API keys — directly in the Postman collection file instead of using variables and separate environment files.

### Why It Happens
The first consumer that creates the collection hardcodes their development URL and personal token to make it work quickly. The collection is shared as-is. No one creates environment variable templates because the initial setup works.

### Warning Signs
- Collection file contains `https://production.example.com` or `http://localhost:8000` in URL fields
- Authorization headers contain literal token values instead of `{{auth_token}}`
- Collection URL fields start with hardcoded protocol + host
- No environment JSON files exist alongside the collection
- Consumers must edit the collection file to change the target URL
- Multiple consumers have different modified versions of the same collection

### Why It Is Harmful
A hardcoded collection is usable in only one deployment context. Every new consumer must manually edit the collection to point to their target environment. Credential leaks occur when hardcoded production tokens are committed to version control. The collection cannot be used in CI/CD pipelines where environment context changes between runs.

### Real-World Consequences
A developer creates a Postman collection with `base_url` hardcoded to `https://staging.example.com/api` and a personal API token hardcoded in the Authorization header. They commit the collection to the repository. A new team member imports the collection and all requests fail because they are hitting staging with an expired personal token. The team member spends 30 minutes manually editing every endpoint's URL and header.

### Preferred Alternative
Store all environment-specific values as Postman variables. Create separate environment JSON files per deployment target (dev, staging, production) with placeholder values. Commit only the environment template with placeholder values.

### Refactoring Strategy
1. Replace all hardcoded URLs with `{{base_url}}` variable references
2. Replace all hardcoded tokens with `{{auth_token}}` variable references
3. Create an environment template file with empty/placeholder values for `base_url`, `auth_token`, etc.
4. Create separate environment files for each deployment target
5. Add the environment template to version control; add real-value environment files to `.gitignore`

### Detection Checklist
- [ ] Search collection for hardcoded URLs (http://, https://)
- [ ] Check for literal token values in header definitions
- [ ] Verify all environment-specific values use `{{variable}}` syntax
- [ ] Confirm environment template files exist
- [ ] Test collection import + environment switch across dev/staging/production

### Related Rules
- Separate Collection Definition From Environment Variables (05-rules.md)

### Related Skills
- Generate Postman Collections (06-skills.md)

### Related Decision Trees
- Environment vs Collection Separation Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Collection Drift from OpenAPI Spec

### Category
Reliability

### Description
Maintaining the Postman collection by hand instead of generating it from the OpenAPI spec, causing the collection to describe endpoints that differ from the actual API.

### Why It Happens
The collection is initially generated from the spec. Developers make manual edits to the collection — adding endpoints, fixing parameters, updating examples. When the spec changes, no one remembers to regenerate the collection. The manual edits create a fear of regeneration ("I'll lose my changes"), so the collection stays hand-maintained and gradually diverges.

### Warning Signs
- Collection has endpoints that no longer exist in the spec
- Collection is missing new endpoints that exist in the spec
- Parameters in the collection differ from spec parameters
- No CI step regenerates the collection from the spec
- Developers say "I'd regenerate but I'll lose my test scripts"
- Collection last modified date is months older than spec last modified date

### Why It Is Harmful
A stale collection is worse than no collection. Consumers discover endpoints in the collection that return 404 because they were removed from the API. They miss new endpoints that were added to the API but never added to the collection. Manual edits lost on regeneration create a cycle of "never regenerate" that guarantees drift.

### Real-World Consequences
The Users API adds a bulk-import endpoint. The spec is updated. The Postman collection is hand-maintained. The bulk-import endpoint is never added to the collection. A consumer evaluating the API imports the collection, sees no import endpoint, and assumes the API doesn't support bulk operations. They choose a competitor. The collection cost a customer.

### Preferred Alternative
Generate the collection from the OpenAPI spec using `openapi-to-postman` or Scribe's built-in export. Apply manual enhancements (test scripts, pre-request scripts) as separate post-processing scripts, not by editing the generated file.

### Refactoring Strategy
1. Set up automatic collection generation from the OpenAPI spec in CI
2. Extract any manual edits (test scripts, authentication flows) into a post-processing script
3. Verify the post-processing script re-applies after each regeneration
4. Add the generation step to the deployment pipeline
5. Remove the hand-maintained collection file; only the generated artifact exists

### Detection Checklist
- [ ] Compare collection endpoints against spec endpoints — find missing/extra entries
- [ ] Check if collection generation is automated in CI
- [ ] Verify post-processing scripts exist for manual enhancements
- [ ] Confirm regeneration does not destroy test scripts and auth flows
- [ ] Test that spec changes propagate to the collection within one deployment cycle

### Related Rules
- Generate Collection From Spec Not By Hand (05-rules.md)

### Related Skills
- Generate Postman Collections (06-skills.md)

### Related Decision Trees
- Collection Update Strategy — Regenerate vs Manual Enhancement (07-decision-trees.md)

---

## Anti-Pattern 3: Stale Auth Tokens in Environment Files

### Category
Security

### Description
Hardcoding authentication tokens in environment JSON files that expire, causing collection requests to fail with 401 errors until tokens are manually refreshed.

### Why It Happens
During initial setup, a developer generates a token and saves it in the environment file for convenience. The token has a long expiry (24 hours, 7 days). The developer forgets about it until it expires. Instead of implementing automated token acquisition, they generate a new token and repeat the cycle.

### Warning Signs
- Environment file contains `auth_token` or `token` with a literal value
- Collection requests return 401 after a predictable time period
- Developers manually copy tokens from admin panel to environment file
- No pre-request script for token acquisition exists
- Token expiry causes CI/CD pipeline (Newman) runs to fail intermittently

### Why It Is Harmful
Stale tokens make the collection unreliable. Automated test runs fail unpredictably. New team members cannot use the collection until they generate their own token. The collection becomes a support burden instead of a self-service tool.

### Real-World Consequences
A Newman CI job runs the Postman collection as part of the deployment pipeline. The hardcoded token expires over the weekend. Monday morning's deployment pipeline fails because every collection request returns 401. The on-call engineer spends 45 minutes debugging before finding the expired token. The deployment is delayed by an hour.

### Preferred Alternative
Write a pre-request script that automates token acquisition by calling the login endpoint, extracting the token, and storing it in the environment variable.

### Refactoring Strategy
1. Write a collection-level pre-request script that calls the auth/login endpoint
2. Configure the script to store the token in `pm.environment.set('auth_token', token)`
3. Remove hardcoded token values from environment files
4. Set test email/password as environment variables with placeholder values
5. Verify the collection works end-to-end with automated auth

### Detection Checklist
- [ ] Search environment files for literal token values
- [ ] Check for pre-request scripts on the collection or folder level
- [ ] Test collection after token expiry — does it refresh automatically?
- [ ] Verify Newman CI runs do not fail due to token expiry
- [ ] Confirm test credentials are stored separately from the collection

### Related Rules
- Automate Token Acquisition With Pre-Request Scripts (05-rules.md)

### Related Skills
- Generate Postman Collections (06-skills.md)

### Related Decision Trees
- Collection Update Strategy — Regenerate vs Manual Enhancement (07-decision-trees.md)

---

## Anti-Pattern 4: No Test Scripts — Collection as Documentation Only

### Category
Testing

### Description
Using the Postman collection exclusively for documentation and manual exploration without adding test scripts, wasting the opportunity to use Newman for automated regression testing.

### Why It Happens
Collections are created for documentation purposes. Test scripts require additional effort. Teams may not know about Newman or may not consider the collection as a testing artifact. Documentation-focused teams create collections without test engineering involvement.

### Warning Signs
- Collection `event` arrays are empty on all endpoints
- No test scripts exist anywhere in the collection
- CI/CD pipeline has no Newman step
- Regression testing for API endpoints is done manually or via separate test suites
- Collection is used only for "try it out" in documentation
- No status code assertions exist

### Why It Is Harmful
A collection without test scripts is a single-use artifact. It documents the API but cannot validate it. Every time the API changes, the collection must be manually checked for accuracy. The opportunity to have a free, spec-aligned regression test suite is entirely wasted, and API regressions go undetected until a consumer reports them.

### Real-World Consequences
A deployment introduces a regression: the User list endpoint returns `{data: [...]}` instead of the previous `{users: [...]}`. The Postman collection (no test scripts) shows the old format but has no assertions. The change is deployed. Consumers notice their integrations break. A support ticket is filed three days later. If the collection had a simple status-200 test, it would have been caught in CI.

### Preferred Alternative
Add at minimum a status code assertion test script on every endpoint in the collection. Run the collection via Newman in CI for automated regression testing.

### Refactoring Strategy
1. Add `pm.test('Status code is 200', () => { pm.response.to.have.status(200); })` to every endpoint
2. Add response structure assertions for critical endpoints
3. Set up a Newman CI job that runs the collection against a test environment
4. Configure the CI job to fail on test failures
5. Add the Newman run to the deployment pipeline as a smoke test

### Detection Checklist
- [ ] Count endpoints with test scripts vs. without
- [ ] Verify every endpoint has at minimum a status code assertion
- [ ] Check CI pipeline for Newman execution
- [ ] Test that a regression causes Newman to fail
- [ ] Confirm Newman failure blocks deployment

### Related Rules
- Add Test Scripts For Status Code Assertions (05-rules.md)

### Related Skills
- Generate Postman Collections (06-skills.md)

### Related Decision Trees
- Collection Update Strategy — Regenerate vs Manual Enhancement (07-decision-trees.md)

---

## Anti-Pattern 5: Single Collection for All API Versions

### Category
Code Organization

### Description
Maintaining one Postman collection that contains endpoints from all API versions (v1, v2, v3) mixed together, forcing consumers on older versions to navigate deprecated endpoints.

### Why It Happens
When the API has one version, a single collection is natural. When version 2 is released, it is added to the existing collection because "it's all the same API." Over time, version 1 endpoints are deprecated but never removed. The collection becomes a disorganized archive of every endpoint ever created.

### Warning Signs
- Single collection file contains endpoints with different API version prefixes
- Collection has folders named "V1" and "V2" indicating version mixing
- Deprecated endpoints share folders with active endpoints
- Consumers on older API versions must skip irrelevant folders
- New consumers are confused about which version to use
- Collection file name has no version identifier

### Why It Is Harmful
A monolithic version-mixed collection forces every consumer to navigate deprecated endpoints. Consumers on v1 must avoid v2 endpoints interspersed in the same folder structure. New consumers cannot easily identify which endpoints belong to the current version. The collection becomes harder to maintain, harder to import, and harder to understand.

### Real-World Consequences
A consumer is migrating from API v1 to v2. They import the single collection. The v1 and v2 endpoints are mixed in the same folders. The consumer accidentally sends a request to the v1 version of the Users create endpoint (which returns a different response format). Their migration code processes the v1 response as v2 and crashes. The error is attributed to "API v2 is broken" but it was a collection usability issue.

### Preferred Alternative
Maintain separate Postman collection files for each supported API version: `collection-v1.json`, `collection-v2.json`, `collection-v3.json`.

### Refactoring Strategy
1. Identify the version of each endpoint in the existing collection
2. Create separate collection files per active version
3. Remove deprecated versions that are past sunset
4. Update documentation links to point to version-specific collections
5. Add a version identifier to collection filename and `info.name` field

### Detection Checklist
- [ ] Check collection for mixed version prefixes in URLs
- [ ] Count number of collection files — should match number of active API versions
- [ ] Verify each version's collection contains only its endpoints
- [ ] Confirm deprecated endpoints are absent from current version collection
- [ ] Test that consumers can import only the version they need

### Related Rules
- Version Collections Alongside API Versions (05-rules.md)

### Related Skills
- Generate Postman Collections (06-skills.md)

### Related Decision Trees
- Environment vs Collection Separation Strategy (07-decision-trees.md)

---

