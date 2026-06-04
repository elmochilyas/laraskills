# ECC Anti-Patterns — Scribe Integration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Scribe Integration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Missing @group Annotations — Endpoints Ungrouped
2. Running Call Mode on Production Database
3. Undocumented Error Responses
4. Stale @response Examples Not Updated with Code
5. Extract Mode Only for Rapidly Changing APIs

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Divergent Change

---

## Anti-Pattern 1: Missing @group Annotations — Endpoints Ungrouped

### Category
Code Organization

### Description
Omitting `@group` PHPDoc annotations on controller methods, causing all endpoints to appear under a default "General" section in the generated documentation with no resource-based organization.

### Why It Happens
`@group` is optional. Adding it requires remembering to include it on every method. Early in development, teams focus on functionality and defer documentation organization. By the time the API grows beyond 10 endpoints, retroactively adding `@group` annotations feels like busywork.

### Warning Signs
- Generated Scribe docs show all endpoints under "General" or "Other"
- Endpoints are sorted alphabetically with no logical grouping
- Consumers cannot find endpoints by resource (User, Post, Auth)
- Navigation sidebar in HTML docs is a flat list of 50+ endpoints
- Some endpoints have `@group`, others don't — inconsistent
- API has more than 10 endpoints and none are grouped

### Why It Is Harmful
An ungrouped documentation site is unusable. Consumers scanning for "Create User" must read through every endpoint alphabetically. The documentation fails its primary purpose: enabling consumers to quickly find and understand the endpoints they need. Flat navigation for APIs with 50+ endpoints creates a poor developer experience that drives consumers away.

### Real-World Consequences
A consumer visits the API docs for a 60-endpoint API. All endpoints are listed alphabetically under "General." They need to find "Update User." The list includes "Activate User," "Add User Role," "Approve User," "Archive User," "Assign User," "Authenticate User"... The consumer must scan 15 endpoints starting with 'A' before finding "Update User" near the end. They spend 5 minutes navigating instead of 10 seconds.

### Preferred Alternative
Add a `@group` annotation with a resource name to every public controller method. Group endpoints by resource (User Management, Post Management, Authentication).

### Refactoring Strategy
1. Identify all controller methods missing `@group` annotations
2. Add `@group ResourceName` to each (e.g., `@group User Management`)
3. Use consistent group names across controllers — standardize on plural resource names
4. Add `@group` presence to the code review checklist
5. Add a CI lint rule that flags controller methods without `@group`

### Detection Checklist
- [ ] Count endpoints in "General" group after generation
- [ ] Check every public controller method for `@group` annotation
- [ ] Verify group names are consistent across the codebase
- [ ] Confirm generated docs have navigable sidebar with resource sections
- [ ] Add CI check for missing `@group` annotations

### Related Rules
- Annotate Every Public Controller Method With @group (05-rules.md)

### Related Skills
- Integrate Scribe for API Documentation (06-skills.md)

### Related Decision Trees
- Generation Mode — Extract vs Call (07-decision-trees.md)

---

## Anti-Pattern 2: Running Call Mode on Production Database

### Category
Security

### Description
Executing `php artisan scribe:generate --type=call` against the production database, creating test records, modifying real data, or triggering side effects like emails and billing charges.

### Why It Happens
Developers are under pressure to generate accurate documentation with real-looking data. Production has the most realistic data. The command is run "just once" to get good examples. The team may not have a dedicated testing database with seeded demo data.

### Warning Signs
- `php artisan scribe:generate` is run on production servers
- Call mode is configured without checking the APP_ENV
- No dedicated testing database exists for documentation generation
- Production database contains records with patterns matching "Demo User" or "Test"
- Real users receive test emails during documentation generation
- Billing records show unusual test-related entries

### Why It Is Harmful
Call mode executes real controller logic — it creates, reads, updates, and deletes real data. Running it on production can create fake user accounts, send welcome emails to nowhere, modify real user profiles, or trigger billing charges through payment gateways. Recovery requires database cleanup and, in worst cases, customer apologies.

### Real-World Consequences
A developer runs `php artisan scribe:generate --type=call` on the production server to get "accurate examples." The auth endpoint creates a real user account with test credentials. The welcome email goes to a real email address. The user creation triggers a downstream CRM sync. The marketing team sends a welcome campaign to the test user. The developer's test user is in the production system for six months before anyone notices.

### Preferred Alternative
Execute `php artisan scribe:generate` only in local or CI environments with a dedicated testing database.

### Refactoring Strategy
1. Create a dedicated `DocsDemoDataSeeder` with representative, realistic data
2. Configure the CI pipeline to use a fresh testing database for documentation generation
3. Add environment guards to prevent running call mode in production (check `APP_ENV`)
4. Set `'type' => 'extract'` in `config/scribe.php` as the default to prevent accidental call mode
5. Document the CI-only generation policy in the team's runbook

### Detection Checklist
- [ ] Check deployment scripts for `scribe:generate` commands
- [ ] Verify production `APP_ENV` prevents call mode execution
- [ ] Confirm a dedicated testing database exists for docs generation
- [ ] Test that call mode in CI uses the testing database, not production
- [ ] Review config/scribe.php for default generation mode

### Related Rules
- Never Run Call Mode Against Production (05-rules.md)

### Related Skills
- Integrate Scribe for API Documentation (06-skills.md)

### Related Decision Trees
- Generation Mode — Extract vs Call (07-decision-trees.md)

---

## Anti-Pattern 3: Undocumented Error Responses

### Category
Documentation

### Description
Writing `@response` annotations only for success responses and omitting `@response status=4xx` annotations for error scenarios, so consumers see only happy-path documentation.

### Why It Happens
Success responses are easier to write — they are the normal case. Error responses require thinking about failure modes and crafting example error payloads. Teams prioritize documenting "what works" over "what fails." Scribe's `@response` default shows success, making error annotations feel like extra work.

### Warning Signs
- Generated docs show only 200/201 responses
- No `@response status=4xx` annotations in any controller docblock
- Error sections in generated documentation are empty
- Consumers ask "what does a 422 look like?" after reading the docs
- Error handling code in consumer applications is written by trial and error
- Support tickets cite "undocumented error format" as the issue

### Why It Is Harmful
Happy-path-only documentation is not usable for building robust clients. Every consumer's first integration request will encounter an error — auth, validation, rate limiting — and they will have zero reference for how to handle it. The API appears to not care about consumer success, and error handling becomes a process of experimentation rather than reference.

### Real-World Consequences
A consumer reads the Scribe-generated docs for the Users API. Every endpoint shows a beautiful 200 response with full JSON. No 422, 401, or 429 responses are documented. The consumer builds their integration assuming success. In production, the first 422 response crashes their error handler because they expected a success-only response shape. They file a support ticket: "Your API returns errors I can't handle."

### Preferred Alternative
Add `@response status=4xx` annotations for every error scenario alongside the happy-path `@response` on each controller method.

### Refactoring Strategy
1. For each controller method, identify the possible error status codes
2. Add `@response status=422`, `@response status=401`, `@response status=403`, `@response status=404`, and `@response status=500` annotations
3. Include realistic error payloads with message, code, and errors fields
4. Add a scenario description to each error annotation
5. Add a CI check that flag controller methods missing error `@response` annotations

### Detection Checklist
- [ ] Count endpoints with error `@response` annotations vs. without
- [ ] Verify every endpoint has at minimum `@response status=422` and `@response status=401`
- [ ] Check that error examples include `message` and `code` fields
- [ ] Confirm generated documentation shows error responses alongside success responses
- [ ] Add CI lint rule for minimum error annotation coverage

### Related Rules
- Document Error Responses Explicitly With @response Status (05-rules.md)

### Related Skills
- Integrate Scribe for API Documentation (06-skills.md)

### Related Decision Trees
- Generation Mode — Extract vs Call (07-decision-trees.md)

---

## Anti-Pattern 4: Stale @response Examples Not Updated with Code

### Category
Maintainability

### Description
Leaving `@response` annotations unchanged after controller or API Resource modifications, so the documented response examples describe a different response structure than the actual API returns.

### Why It Happens
PHPDoc annotations are code comments — they are not compiled, not tested, and easy to forget during code changes. When a field name changes in the API Resource, the corresponding `@response` annotation is rarely updated. Extract mode (reading `@response` annotations) makes this worse because there is no runtime validation.

### Warning Signs
- `@response` annotations reference fields that no longer exist in the actual response
- Response examples have wrong field names or types
- Generated documentation examples do not match actual API output
- Code review does not check `@response` annotations for updates
- Controller changes are merged without updating PHPDoc blocks
- Consumers report "the example in your docs doesn't work"

### Why It Is Harmful
Stale `@response` examples are worse than no examples. They train consumers on incorrect response structures. When a consumer copies an example that shows `name: string` but the actual API returns `full_name: string`, their deserialization code breaks. Trust in the documentation erodes with every stale example the consumer encounters.

### Real-World Consequences
A controller's `@response` annotation shows `{ "id": 1, "name": "John Doe", "email": "john@example.com" }`. Two months ago, the API Resource changed `name` to `full_name`. The annotation was never updated. A consumer copies the example into their Python integration, defining a `User` class with `name` field. Their first API call returns `full_name`. Python's deserializer raises a `KeyError` for `name`. The consumer assumes the API has a bug.

### Preferred Alternative
Keep `@response` annotations in sync with code during code review. Treat annotation drift as a blocking issue. Use call mode for frequently changing endpoints to bypass stale annotations.

### Refactoring Strategy
1. Add "Update @response annotations" to the code review checklist for controller changes
2. Use call mode for endpoints whose response structures change frequently
3. Set up CI to regenerate docs on every commit and compare against previous output
4. Periodically audit response examples against actual API output
5. Train the team to update annotations as part of the change, not as an afterthought

### Detection Checklist
- [ ] Compare `@response` annotations against actual API responses
- [ ] Check how many code changes in the last sprint included annotation updates
- [ ] Verify code review checklist includes annotation review
- [ ] Test that a controller response change without annotation update is caught during review
- [ ] Consider switching to call mode for high-change endpoints

### Related Rules
- Keep Annotations In Sync With Code During Code Review (05-rules.md)

### Related Skills
- Integrate Scribe for API Documentation (06-skills.md)

### Related Decision Trees
- Generation Mode — Extract vs Call (07-decision-trees.md)

---

## Anti-Pattern 5: Extract Mode Only for Rapidly Changing APIs

### Category
Reliability

### Description
Using Scribe's extract mode (relying solely on `@response` annotations) for an API whose response structures change frequently, producing stale examples that diverge from the actual implementation.

### Why It Happens
Extract mode is faster (5-15s), has no database dependency, and works without a seeded environment. Teams choose it for convenience. For APIs under active development, response structures change every sprint. Extract mode captures exactly what the annotation says — which is often outdated.

### Warning Signs
- Docs are regenerated frequently but examples still diverge from actual responses
- `@response` annotations are updated less frequently than response structures change
- Call mode is available but not used even for frequently changing endpoints
- Team spends significant time updating `@response` annotations
- Consumers report stale examples in documentation
- New endpoints have no `@response` annotations (only initial setup)

### Why It Is Harmful
Extract mode examples are only as accurate as the last manual annotation update. For rapidly changing APIs, annotations lag behind implementation by days or weeks. Consumers trust examples that are wrong, building integrations against outdated response structures. The documentation becomes a source of misinformation.

### Real-World Consequences
A team uses extract mode for their v2 API under active development. Response structures change every 2 weeks as they iterate. `@response` annotations are updated every 4-6 weeks. A consumer builds an integration based on the documented example showing `address` as a flat string. The actual API changed to `address: { street, city, zip }` three weeks ago. The consumer's integration fails on deserialization.

### Preferred Alternative
Use call mode for endpoints whose response structures change frequently. Reserve extract mode for stable endpoints with rarely-changing response shapes.

### Refactoring Strategy
1. Identify endpoints whose response structures change most frequently
2. Switch those endpoints to use call mode (requires seeded database)
3. For stable endpoints, keep extract mode with occasional `@response` updates
4. Create a demo data seeder that produces representative responses for call mode
5. Add CI step that runs call mode for high-change endpoints and extract mode for stable ones

### Detection Checklist
- [ ] Identify endpoints with frequent response structure changes
- [ ] Check if those high-change endpoints use extract or call mode
- [ ] Verify call mode examples match actual API output
- [ ] Confirm demo data seeder covers high-change endpoints
- [ ] Measure time between response change and annotation update in extract mode

### Related Rules
- Seed Database Before Running Call Mode Generation (05-rules.md)

### Related Skills
- Integrate Scribe for API Documentation (06-skills.md)

### Related Decision Trees
- Generation Mode — Extract vs Call (07-decision-trees.md)

---

