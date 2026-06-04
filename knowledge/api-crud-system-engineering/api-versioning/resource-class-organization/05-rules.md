# Phase 5: Rules — Resource Class Organization

## Use Versioned Namespace For API Resources
---
## Category
Code Organization
---
## Rule
Always place version-specific API resources in versioned namespaces (`App\Http\Resources\V1\`, `App\Http\Resources\V2\`) — never mix versions in a flat directory.
---
## Reason
A flat resource directory with suffix naming causes import ambiguity and does not scale beyond two versions.
---
## Bad Example
```
App/Http/Resources/UserResourceV1.php
App/Http/Resources/UserResourceV2.php
```
---
## Good Example
```
App/Http/Resources/V1/UserResource.php
App/Http/Resources/V2/UserResource.php
```
---
## Exceptions
Single-version APIs with no planned version within 12 months.
---
## Consequences Of Violation
Import confusion; namespace collisions; inconsistent organization as versions grow.
---

## Prefer Inheritance For Progressive Resource Enhancement
---
## Category
Maintainability
---
## Rule
Always extend the previous version's resource class for progressive field enhancement — V2 extends V1 and overrides `toArray()`.
---
## Reason
Inheritance ensures fields that haven't changed are identical across versions, preventing accidental divergence.
---
## Bad Example
```php
class V2UserResource extends JsonResource {
    public function toArray($request): array { /* full copy from V1 */ }
}
```
---
## Good Example
```php
class V2UserResource extends V1UserResource {
    public function toArray($request): array {
        return array_merge(parent::toArray($request), ['new_field' => $this->new_field]);
    }
}
```
---
## Exceptions
When V2 removes or fundamentally restructures fields — start fresh but document the divergence.
---
## Consequences Of Violation
V2 silently diverges from V1; consumers find the same field returns different values depending on which resource they hit.
---

## Use `$this->when()` For Version-Specific Optional Fields
---
## Category
Performance
---
## Rule
Always use `$this->when()` for fields that are present in one version but conditionally included in another.
---
## Reason
Conditional fields that are always serialized waste bandwidth and may expose information unnecessary for the requesting version.
---
## Bad Example
```php
return [...parent::toArray($request), 'admin_notes' => $this->admin_notes]; // always included
```
---
## Good Example
```php
return [...parent::toArray($request), 'admin_notes' => $this->when($request->user()?->isAdmin(), $this->admin_notes)];
```
---
## Exceptions
Fields that are part of the core contract for all versions — include unconditionally.
---
## Consequences Of Violation
Response bloat; sensitive data exposed to unauthorized versions.
---

## Never Remove Old Version Resources When Adding New Version
---
## Category
Maintainability
---
## Rule
Never delete or modify old version resource files when adding a new API version — old resources must remain untouched.
---
## Reason
Old version resources are still serving active consumers — any modification risks breaking them.
---
## Bad Example
```php
// Modified V1 resource when creating V2 — accidentally removed a field
```
---
## Good Example
```php
// V1 resource unchanged; V2 resource extends V1
// Both coexist and serve their respective versions
```
---
## Exceptions
When the old version is fully retired (all traffic zero for 90+ days).
---
## Consequences Of Violation
Accidental breaking changes to consumers still on the old version.
---

## Test Each Version's Resource Independently
---
## Category
Testing
---
## Rule
Always write independent tests for each version's API resource — never rely on the parent version's tests to cover child versions.
---
## Reason
Parent resource changes silently affect child resources via inheritance — parent tests don't verify child-specific fields.
---
## Bad Example
```php
// Only V1 resource tests exist
```
---
## Good Example
```php
class V1PostResourceTest extends TestCase { /* V1 fields */ }
class V2PostResourceTest extends TestCase { /* V2 fields + inherited fields */ }
```
---
## Exceptions
When the child version adds zero new fields and only inherits — document with explicit note.
---
## Consequences Of Violation
V2 response shape regressions undetected; consumers get wrong field structure.
---

## Automate Schema Diff In CI For Resource Changes
---
## Category
Reliability
---
## Rule
Always run automated schema comparison in CI when a pull request modifies a resource class file.
---
## Reason
A resource change in any version can accidentally alter the response shape for consumers — automated diff catches this.
---
## Bad Example
```php
// No CI check — resource change approved without schema review
```
---
## Good Example
```yaml
# CI: if any App/Http/Resources/** file changed, run schema diff
- run: php artisan api:resource-schema-diff
```
---
## Exceptions
Documentation-only changes or formatting-only changes within resource classes.
---
## Consequences Of Violation
Response shape changes reach production unseen; consumers break silently.
---

## Use `->additional()` For Version-Specific Metadata
---
## Category
Code Organization
---
## Rule
Always use the `->additional()` method on resources to inject version-specific metadata (deprecation notices, pagination links) instead of embedding them in `toArray()`.
---
## Reason
Metadata is structurally separate from resource data — embedding it in `toArray()` mixes concerns and complicates field inheritance.
---
## Bad Example
```php
public function toArray($request): array {
    return ['data' => [...], 'deprecated' => true]; // metadata mixed with data
}
```
---
## Good Example
```php
return V2\PostResource::make($post)->additional(['version' => 'v2']);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Metadata fields inherited by child versions accidentally; metadata treated as data by consumers.
---

## Monitor Response Size Growth Across Versions
---
## Category
Performance
---
## Rule
Always monitor the response payload size across versions and alert when a version's responses exceed 2x the previous version's size.
---
## Reason
Unchecked field accumulation leads to bloated responses that slow consumer applications and increase bandwidth costs.
---
## Bad Example
```php
// No size tracking — V4 response is 500KB vs V1's 50KB
```
---
## Good Example
```php
// CI check: fail if new fields increase average response by >20%
public function test_response_size_budget(): void {
    $response = $this->getJson('/api/v2/posts');
    $this->assertLessThan(50000, strlen($response->content()));
}
```
---
## Exceptions
When the new version intentionally includes richer data and consumers were notified of the size increase.
---
## Consequences Of Violation
Bloated responses slow consumer apps; increased bandwidth bills; consumer complaints about performance.
