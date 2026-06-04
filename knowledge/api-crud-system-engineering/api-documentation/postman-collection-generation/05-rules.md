# Phase 5: Rules — Postman Collection Generation

## Separate Collection Definition From Environment Variables
---
## Category
Code Organization
---
## Rule
Store all environment-specific values (base URL, API tokens) as Postman variables. Create separate environment JSON files per deployment target. Never hardcode values in the collection.
---
## Reason
Hardcoded environment values make the collection usable in only one deployment context. Variable-based collections can be shared across dev, staging, and production by switching the environment file. Hardcoded tokens also create credential leak risks.
---
## Bad Example
```json
{
  "item": [{
    "request": {
      "url": "https://production.example.com/api/users",
      "header": [{ "key": "Authorization", "value": "sk_live_abc123" }]
    }
  }]
}
```
---
## Good Example
```json
{
  "item": [{
    "request": {
      "url": "{{base_url}}/users",
      "header": [{ "key": "Authorization", "value": "{{auth_token}}" }]
    }
  }],
  "variable": [{ "key": "base_url", "value": "http://localhost:8000/api" }]
}
```
---
## Exceptions
No common exceptions. Always separate collection from environment.
---
## Consequences Of Violation
Collection cannot be reused across environments; credentials are exposed in the collection file; consumers must edit the collection itself to point to their target.
---

## Automate Token Acquisition With Pre-Request Scripts
---
## Category
Design
---
## Rule
Write a Postman pre-request script that calls the login endpoint, extracts the token from the response, and stores it in the `auth_token` environment variable.
---
## Reason
Hardcoded or manually refreshed tokens are the most common source of "my API calls are failing" support tickets. Automated token acquisition ensures that every collection run starts with a fresh, valid token without developer intervention.
---
## Bad Example
```javascript
// No pre-request script; token is hardcoded in environment file
// Token expires; every request returns 401
```
---
## Good Example
```javascript
// Pre-request script on the collection
const loginRequest = {
  url: pm.variables.get('base_url') + '/auth/login',
  method: 'POST',
  header: { 'Content-Type': 'application/json' },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      email: pm.environment.get('test_email'),
      password: pm.environment.get('test_password')
    })
  }
};
pm.sendRequest(loginRequest, (err, res) => {
  const json = res.json();
  pm.environment.set('auth_token', json.token);
});
```
---
## Exceptions
API keys that do not expire and are manually provisioned per consumer.
---
## Consequences Of Violation
Collection returns 401 errors after token expiry; developers must manually refresh tokens; automated test runs fail intermittently.
---

## Add Test Scripts For Status Code Assertions
---
## Category
Testing
---
## Rule
Include at minimum a status code assertion test script on every endpoint in the collection. Extend to response body structure validation for critical endpoints.
---
## Reason
A collection without test scripts is a documentation-only artifact. Test scripts transform the collection into a reusable integration test suite that can be run via Newman in CI, catching regressions with minimal additional effort.
---
## Bad Example
```json
{
  "item": [{
    "name": "List Users",
    "event": []
    // No test scripts; only documentation
  }]
}
```
---
## Good Example
```json
{
  "item": [{
    "name": "List Users",
    "event": [{
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 200', () => { pm.response.to.have.status(200); });",
          "pm.test('Response is an array', () => { pm.expect(pm.response.json().data).to.be.an('array'); });"
        ]
      }
    }]
  }]
}
```
---
## Exceptions
No common exceptions. Every endpoint in the collection should have at least a status code assertion.
---
## Consequences Of Violation
Collection is not usable for regression testing; API regressions go undetected until a consumer reports them.
---

## Generate Collection From Spec Not By Hand
---
## Category
Reliability
---
## Rule
Generate the Postman collection from the OpenAPI spec using `openapi-to-postman` or Scribe's built-in export. Apply manual enhancements as separate post-processing scripts, not by editing the generated file.
---
## Reason
Manually maintained collections drift from the spec within days. Auto-generating from the spec guarantees the collection always reflects the current API surface. Manual edits to the generated file are overwritten on the next regeneration, causing lost work and confusion.
---
## Bad Example
Developer manually adds a new endpoint to `collection.json`. Next `php artisan scribe:generate` overwrites the file. The endpoint disappears from the collection.
---
## Good Example
```bash
# Generate from spec
openapi-to-postman openapi.yaml -o collection.json
# Apply manual enhancements via post-processing script
node post-process-collection.js collection.json
```
---
## Exceptions
APIs that existed before OpenAPI adoption and have no spec; migrate to spec-first before maintaining a collection.
---
## Consequences Of Violation
Collection drifts from the spec; consumers see endpoints in the collection that no longer exist (or missing new endpoints); regeneration destroys manual edits.
---

## Version Collections Alongside API Versions
---
## Category
Code Organization
---
## Rule
Maintain separate Postman collection files for each supported API version and name them with the version identifier (`collection-v2.json`, `collection-v1.json`).
---
## Reason
A single collection for all versions forces consumers on older versions to navigate deprecated endpoints. Versioned collections allow each consumer to import only their relevant collection, reducing confusion and accidental use of deprecated endpoints.
---
## Bad Example
```bash
# Single collection for all versions
collection.json  # contains v1, v2, and v3 endpoints mixed together
```
---
## Good Example
```bash
collection-v3.json  # current version, recommended
collection-v2.json  # deprecated, maintained
collection-v1.json  # sunset, read-only
```
---
## Exceptions
APIs with only one active version.
---
## Consequences Of Violation
Consumers on older versions see endpoints they cannot use; new consumers are exposed to deprecated endpoints.
---
