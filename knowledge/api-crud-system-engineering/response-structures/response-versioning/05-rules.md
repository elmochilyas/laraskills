# response-versioning Rules

## Rule 1: Use Separate Resource Classes per Version
---
## Category
Code Organization
---
## Rule
Always create separate resource classes for each API version (`UserResourceV1`, `UserResourceV2`), never branch on version inside a single resource.
---
## Reason
Conditional branching (`if version === 'v1'`) scatters version logic across files, creates cross-version mutation risk (changing V1 code affects V2), and makes both versions harder to test independently.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        if ($request->segment(2) === 'v1') {
            return ['name' => $this->name, 'email' => $this->email];
        }
        return ['full_name' => $this->full_name, 'email_address' => $this->email];
    }
}
```
---
## Good Example
```php
class UserResourceV1 extends JsonResource
{
    public function toArray($request)
    {
        return ['name' => $this->name, 'email' => $this->email];
    }
}

class UserResourceV2 extends JsonResource
{
    public function toArray($request)
    {
        return ['full_name' => $this->full_name, 'email_address' => $this->email];
    }
}
```
---
## Exceptions
Additive-only changes (new fields only) can share a base class with extensions, but removal/rename requires a fork.
---
## Consequences Of Violation
V1 code changes accidentally affect V2. Cannot fully remove V1 code without auditing all branches. Tests for V1 and V2 are interleaved.

## Rule 2: Require Explicit Version Specification
---
## Category
Reliability
---
## Rule
Always reject requests that omit API version specification with a clear error — never silently default to the latest version.
---
## Reason
Silent defaulting creates ambiguity. A client that omits version today receives V3 responses. When V4 is released, the same client silently receives V4 responses and breaks. Explicit version errors make the contract clear.
---
## Bad Example
```php
// Defaults to latest if version omitted
$version = $request->header('Accept') ?? 'v3'; // client meant v2 but gets v3
```
---
## Good Example
```php
$accept = $request->header('Accept');
if (! $accept || ! preg_match('/version=v(\d+)/', $accept, $matches)) {
    return response()->json([
        'error' => 'API version is required. Specify Accept: application/vnd.api.v2+json',
    ], 400);
}
$version = (int) $matches[1];
```
---
## Exceptions
Internal APIs where all consumers are updated synchronously.
---
## Consequences Of Violation
Clients silently receive wrong API version. Breaking changes deployed as new version break existing clients that didn't specify version. Mobile apps with app store delays crash.

## Rule 3: Include `Deprecation` and `Sunset` Headers on Deprecated Versions
---
## Category
Maintainability
---
## Rule
Always include `Deprecation: true` and `Sunset` headers with a concrete date on every response from deprecated API versions.
---
## Reason
Programmatic deprecation headers notify automated clients and monitoring tools that a version is deprecated and will be removed. Without headers, clients have no machine-readable signal and discover deprecation only when the version is removed.
---
## Bad Example
```php
// Deprecated version — no deprecation headers
return UserResourceV1::collection($users);
```
---
## Good Example
```php
return UserResourceV1::collection($users)
    ->header('Deprecation', 'true')
    ->header('Sunset', 'Sat, 31 Dec 2025 23:59:59 GMT');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients continue using deprecated versions indefinitely. Version removal surprises clients who received no advance warning. Support burden grows linearly with version count.

## Rule 4: Keep Database Schema Version-Agnostic
---
## Category
Architecture
---
## Rule
Never add version-specific columns, tables, or schema structures — the database layer must remain independent of API versioning.
---
## Reason
Database schema is an internal implementation detail. Tying it to API versions creates complex migration paths where removing a V1 column requires waiting for V1 to be sunset, and every version adds permanent schema debt.
---
## Bad Example
```php
// Migration adds version-specific column
Schema::table('users', function ($table) {
    $table->string('name_v1')->nullable();
    $table->string('full_name_v2')->nullable(); // two columns for two versions
});
```
---
## Good Example
```php
// Single database column — versioning at response layer only
Schema::table('users', function ($table) {
    $table->string('full_name');
});

// V1 resource transforms the single DB field
'name' => $this->full_name

// V2 resource uses it directly
'full_name' => $this->full_name
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Database schema accumulates columns for every past version. Schema becomes impossible to refactor. Version sunset requires risky database migrations.

## Rule 5: Share Base Logic via Inheritance, Not Conditional Branches
---
## Category
Code Organization
---
## Rule
Always share common serialization logic between versioned resources through inheritance, never through copy-paste or conditional branching.
---
## Reason
Copy-pasted code between versions drifts apart — a bug fix applied to V2 is missed in V3. Shared base classes ensure common fields are defined once and tested in one place.
---
## Bad Example
```php
class UserResourceV1 extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,         // same logic as V2 — duplicated
            'email' => $this->email,        // same logic as V2 — duplicated
            'role' => $this->role,          // V1 only
        ];
    }
}

class UserResourceV2 extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,         // same logic as V1 — duplicated
            'email' => $this->email,        // same logic as V1 — duplicated
            'profile_url' => $this->profileUrl(),  // V2 only
        ];
    }
}
```
---
## Good Example
```php
class BaseUserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}

class UserResourceV1 extends BaseUserResource
{
    public function toArray($request)
    {
        return parent::toArray($request) + ['role' => $this->role];
    }
}

class UserResourceV2 extends BaseUserResource
{
    public function toArray($request)
    {
        return parent::toArray($request) + ['profile_url' => $this->profileUrl()];
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Bugs fixed in one version remain in another. Each version's resource file grows independently. Adding a common field requires editing every versioned resource.

## Rule 6: Test All Supported Versions in a Single CI Run
---
## Category
Testing
---
## Rule
Always run the full test suite for every supported API version in every CI pipeline to catch version-specific regressions.
---
## Reason
A change that fixes V3 may break V2's response contract. Without per-version testing, regressions go undetected until the version is deprecated or a client reports the issue.
---
## Bad Example
```php
// Tests only the latest version
public function test_user_index(): void
{
    $response = $this->getJson('/api/v3/users');
    $response->assertJsonStructure(['data' => [['id', 'full_name']]]);
}
```
---
## Good Example
```php
public function test_user_index_v1(): void
{
    $response = $this->getJson('/api/v1/users');
    $response->assertJsonStructure(['data' => [['id', 'name', 'email', 'role']]]);
}

public function test_user_index_v2(): void
{
    $response = $this->getJson('/api/v2/users');
    $response->assertJsonStructure(['data' => [['id', 'name', 'email', 'profile_url']]]);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
V1/V2 responses silently change shape due to refactored shared code. Clients running older versions break without any CI signal.

## Rule 7: Sunset Old Versions on a Documented Timeline
---
## Category
Maintainability
---
## Rule
Always define and publish a sunset date when creating a new API version, and enforce removal on that date.
---
## Reason
Indefinite version support multiplies maintenance burden linearly. Without a documented sunset timeline, versions accumulate and every change requires testing against N versions.
---
## Bad Example
```php
// V1 created in 2020 — still supported in 2026 with no sunset plan
// Supporting V1, V2, V3, V4 simultaneously — quadruple testing burden
```
---
## Good Example
```php
// V3 release notes:
// Version 3 released 2026-06-01.
// Version 1 sunset date: 2026-12-31 (6 months overlap, 18 months total support).
// Version 2 sunset date: 2027-06-01 (12 months overlap).
```
---
## Exceptions
Enterprise contracts with negotiated multi-year support terms.
---
## Consequences Of Violation
Five supported versions with different response shapes. Every database schema change must consider all versions. Support team handles issues for versions released years ago.
