# Phase 5: Rules — Scribe Integration

## Annotate Every Public Controller Method With @group
---
## Category
Code Organization
---
## Rule
Add a `@group` annotation with a resource name to every public controller method. Never leave endpoints ungrouped or in the default "General" group.
---
## Reason
Ungrouped endpoints appear under a "General" or "Other" section in the generated documentation, producing a disorganized, alphabetically-sorted mess. Consumers navigate docs by resource group; missing `@group` makes the documentation unusable for reference.
---
## Bad Example
```php
// No @group — endpoint appears in "General"
public function index() { ... }
```
---
## Good Example
```php
/**
 * @group User Management
 */
public function index() { ... }
```
---
## Exceptions
Health-check and meta-endpoints that do not belong to any resource group; group them under "System" or "Meta."
---
## Consequences Of Violation
Generated docs are unorganized; consumers cannot find endpoints by resource; documentation is not navigable.
---

## Document Error Responses Explicitly With @response Status
---
## Category
Documentation
---
## Rule
Add `@response status=4xx` annotations for every error scenario alongside the happy-path `@response` on each controller method.
---
## Reason
Scribe documents only what is explicitly annotated. Without error response annotations, consumers see only success responses and have no documented error shapes. Happy-path-only documentation is not usable for building robust clients.
---
## Bad Example
```php
/**
 * @response { "id": 1, "name": "John" }
 * No error responses documented
 */
```
---
## Good Example
```php
/**
 * @response { "id": 1, "name": "John", "email": "john@example.com" }
 * @response status=422 scenario="validation error" {
 *   "message": "The name field is required.",
 *   "errors": { "name": ["The name field is required."] }
 * }
 * @response status=401 scenario="unauthenticated" {
 *   "message": "Unauthenticated."
 * }
 */
```
---
## Exceptions
No common exceptions. Every endpoint needs at minimum 422 and 401 error response annotations.
---
## Consequences Of Violation
Error documentation is absent; consumers cannot build error handling from documentation alone.
---

## Seed Database Before Running Call Mode Generation
---
## Category
Reliability
---
## Rule
Run `php artisan db:seed --class=DemoDataSeeder` before executing `php artisan scribe:generate` in call mode to ensure representative, realistic response examples.
---
## Reason
Call mode makes real HTTP requests to the application. Without seeded data, responses are empty arrays, 404 errors, or skeleton records with `null` fields. Generated examples are useless as reference material and may even mislead consumers about response shapes.
---
## Bad Example
```bash
php artisan scribe:generate --type=call
# No seed data; response example: { "data": [], "meta": {"current_page": 1, "total": 0} }
```
---
## Good Example
```bash
php artisan db:seed --class=DocsDemoDataSeeder
php artisan scribe:generate --type=call
# Response example: { "data": [{"id": 1, "name": "Demo User 1", ...}], "meta": {"current_page": 1, "total": 25} }
```
---
## Exceptions
Extract mode where examples come from `@response` annotations, not live requests.
---
## Consequences Of Violation
Generated examples are empty or skeleton data; consumers cannot use examples as integration templates.
---

## Configure Auth In scribe.php For Call Mode
---
## Category
Framework Usage
---
## Rule
Set up authentication configuration in `config/scribe.php` including a test token or test credentials so call-mode requests are authenticated.
---
## Reason
Without auth configuration, call-mode requests hit endpoints as unauthenticated users and receive 401 responses instead of real data examples. The generated documentation shows error responses where it should show working endpoint examples.
---
## Bad Example
```php
// config/scribe.php — auth not configured
// Call mode: every authenticated endpoint returns 401
```
---
## Good Example
```php
// config/scribe.php
'auth' => [
    'enabled' => true,
    'in' => 'bearer',
    'token' => env('SCRIBE_TEST_TOKEN', 'test-token-for-docs'),
],
```
---
## Exceptions
APIs with public-only endpoints that require no authentication.
---
## Consequences Of Violation
Call-mode documented endpoints show 401 responses instead of actual data; consumers cannot see working example responses.
---

## Never Run Call Mode Against Production
---
## Category
Security
---
## Rule
Execute `php artisan scribe:generate` only in local or CI environments with a dedicated testing database. Never run call mode against the production database.
---
## Reason
Call mode executes real controller logic, creates database records, and sends real emails or notifications. Running against production would create, modify, or delete real user data, send emails to real users, and potentially trigger side effects like billing charges.
---
## Bad Example
```bash
# Production server — generates docs by hitting live endpoints
php artisan scribe:generate --type=call
# Creates test records in production DB, sends real emails
```
---
## Good Example
```yaml
# CI pipeline
- run: cp .env.ci .env
- run: php artisan migrate --force
- run: php artisan db:seed --class=DocsDemoDataSeeder
- run: php artisan scribe:generate --type=call
```
---
## Exceptions
Extract mode (reading `@response` annotations) is safe in any environment because it makes no HTTP requests.
---
## Consequences Of Violation
Test data pollutes production database; real users receive test emails; billing side effects occur.
---

## Keep Annotations In Sync With Code During Code Review
---
## Category
Maintainability
---
## Rule
Require PHPDoc annotation updates alongside controller changes in every code review. Treat annotation drift as a blocking issue.
---
## Reason
Scribe annotations are documentation source code. Without code review enforcement, annotations silently drift from implementation. A `@response` showing a `name` field while the actual response returns `full_name` is worse than no documentation — it actively misleads consumers.
---
## Bad Example
```php
// Controller updated: name field changed to first_name/last_name
// @response annotation still shows name — reviewer approves
// Consumers see documented name field that no longer exists
```
---
## Good Example
```php
// Code review checklist includes: "Does @response match actual response?"
// PR rejected until @response annotations are updated to reflect first_name/last_name
```
---
## Exceptions
No common exceptions. Annotations are code; treat them with the same review rigor.
---
## Consequences Of Violation
Documentation actively misleads consumers; trust in documentation erodes; consumers send payloads based on outdated annotations.
---
