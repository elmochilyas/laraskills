# Resource Class Organization: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Resource Class Organization |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Field Bleed** — V2 resource accidentally inherits V1-only deprecated field
2. **N+1 in Resources** — Version-specific eager loading not updated for new version, causing N+1 queries
3. **Resource Mismatch** — Controller returns V1 resource for V2 endpoint
4. **Silent Field Removal** — V1 resource field removed without breaking change notice
5. **Deep Resource Inheritance** — V1 → V2 → V3 resource inheritance chain

## Repository-Wide Anti-Patterns

- Not testing each version's resource independently
- Using `$this->when()` for fields that are always included
- Mixing version-specific and shared resources in the same directory
- Forgetting to update old version resource tests when the model changes

---

## 1. Field Bleed

### Category
Data Leak

### Description
V2 resource extends V1 resource and inherits a field that was deprecated or intentionally removed in V2. The V1-only field appears in V2 responses.

### Why It Happens
V2 extends V1's `toArray()` and adds new fields without removing the old ones. The old field's data is still available and may contain information not intended for V2 consumers.

### Warning Signs
- V2 response includes fields that were supposed to be removed
- Deprecated field names appear in V2 documentation
- V2 consumers depend on fields that should be V1-only
- `parent::toArray()` is called and the result includes deprecated fields
- No explicit field selection in V2 resource

### Why Harmful
V2 consumers may depend on fields that the team intended to remove. Once consumers depend on a field, it cannot be removed without a breaking change.

### Real-World Consequences
V1 has `author_name` (string). V2 changes to nested `author` object but extends V1's `toArray()` without removing `author_name`. V2 returns both `author_name` and `author`. Clients depend on `author_name`, and it can never be removed from V2.

### Preferred Alternative
Build V2 resources independently from V1. Inherit only when fields are genuinely identical. Explicitly include desired fields.

### Refactoring Strategy
1. Decouple V2 resources from V1 inheritance
2. Build V2 `toArray()` with explicit field selection
3. Remove deprecated or V1-only fields from V2
4. Test that V2 responses don't contain V1-only fields
5. Document field differences between versions

### Detection Checklist
- [ ] V2 response contains V1-only fields
- [ ] V2 extends V1 without removing deprecated fields
- [ ] Consumers depend on fields intended for removal
- [ ] No explicit field selection in V2

### Related Rules/Skills/Trees
- Rule: API-RESOURCE-001 (Version-Specific Response Shape)
- Skill: resource-class-organization
- Tree: api-versioning

---

## 2. N+1 in Resources

### Category
Performance Regression

### Description
V2 resource accesses relationships that weren't eager-loaded by the controller. The V2 resource adds a new relationship field but the controller wasn't updated to eager-load it, causing N+1 queries.

### Why It Happens
The controller's eager loading is tied to V1's resource requirements. V2 adds a relationship in the resource but the controller is not updated.

### Warning Signs
- V2 endpoint is slower than V1 endpoint
- Query count increases significantly with response size
- N+1 detection tool flags V2 resource queries
- Controller `with()` doesn't include relationships used by V2 resource
- Performance test shows O(n) query growth for V2

### Why Harmful
Version migration silently degrades performance. V2 is supposed to be the "better" version but performs worse. The N+1 problem may go unnoticed in development with small datasets.

### Real-World Consequences
V2 PostResource adds `'comments_count' => $this->comments->count()`. The V2 controller still only eager-loads `user` (V1's requirement). Each post now executes an additional query for comments. A page of 50 posts executes 50 extra queries.

### Preferred Alternative
Review eager loading requirements for each version independently. Add tests that verify query count per version.

### Refactoring Strategy
1. Add eager loading requirements for V2 resources
2. Create version-specific controller methods with appropriate `with()` calls
3. Add query count tests for each version
4. Use `when()` with loaded relationship check for optional relationships
5. Add N+1 detection to CI pipeline

### Detection Checklist
- [ ] V2 resource accesses unloaded relationships
- [ ] V2 endpoint has higher query count than V1
- [ ] Controller `with()` not updated for V2
- [ ] No query count tests per version

### Related Rules/Skills/Trees
- Rule: API-PERF-001 (Version-Specific Eager Loading)
- Skill: n-plus-one-detection
- Tree: performance

---

## 3. Resource Mismatch

### Category
Configuration Error

### Description
A controller returns a V1 resource class when serving a V2 endpoint. Clients receive V1 response shapes even though they requested V2.

### Why It Happens
The route file maps V2 endpoint to V2 controller, but the controller still returns `V1\PostResource` instead of `V2\PostResource`. The import statement was not updated.

### Warning Signs
- V2 endpoint returns V1 response shape
- New V2 fields are missing from V2 endpoint responses
- V2 controller imports V1 resource class
- Tests for V2 endpoint assert V2 fields but they're absent
- Version-specific tests pass but integration tests fail

### Why Harmful
Clients receive the wrong version's response. If they implemented their integration based on V2 documentation, their parser fails. If they implemented based on response inspection, they unknowingly use V1's contract.

### Real-World Consequences
A V2 endpoint returns V1 UserResource — missing the `phone` field that was added in V2. A client wrote code to parse `phone` from the response. The field is always null. The client's display shows "Phone: " for every user.

### Preferred Alternative
Use version-specific controller namespaces with explicit resource imports. Add tests verifying the correct resource class is returned for each version.

### Refactoring Strategy
1. Audit all V2 controllers for correct resource imports
2. Use version-specific base controller classes
3. Add integration tests that check response fields per version
4. Add architecture test that V2 controllers don't import V1 resource classes
5. Implement resource factory that resolves correct class per version

### Detection Checklist
- [ ] V2 controller returns V1 resource
- [ ] Import statement references wrong version
- [ ] V2 fields missing from response
- [ ] No version-specific resource resolution

### Related Rules/Skills/Trees
- Rule: API-RESOURCE-002 (Correct Version Resource Mapping)
- Skill: resource-class-organization
- Tree: api-versioning

---

## 4. Silent Field Removal

### Category
Breaking Change

### Description
A field is removed from V1 resource without documentation, version bump, or deprecation period. Consumers depending on the field receive `null` or missing data.

### Why It Happens
The field was deprecated in documentation but removal wasn't coordinated. A well-intentioned developer removes the field during refactoring.

### Warning Signs
- Field missing from V1 response without version bump
- V1 consumers report data loss
- No deprecation header was sent for the field
- Changelog doesn't mention the removal
- Field was removed in the same PR that added V2

### Why Harmful
Breaking change shipped to all V1 consumers without warning. This erodes trust and creates emergency work for consumers.

### Real-World Consequences
A developer removes `legacy_code` from V1 UserResource because "it's deprecated in the database." V1 consumers parse `legacy_code` for compliance reporting. The field is suddenly missing, breaking regulatory reports.

### Preferred Alternative
Deprecate fields with headers before removal. Only remove in a new major version. Keep deprecated fields in existing versions.

### Refactoring Strategy
1. Restore the removed field to V1 resource
2. Add deprecation notice in field description
3. Schedule removal for the next major version
4. Add tests verifying the field remains in V1
5. Document field lifecycle

### Detection Checklist
- [ ] Field removed from V1 without version bump
- [ ] No deprecation period for the field
- [ ] Consumers report missing data
- [ ] Field was in V1 documentation

### Related Rules/Skills/Trees
- Rule: API-RESOURCE-003 (Field Deprecation Process)
- Skill: backward-compatible-changes
- Tree: api-lifecycle

---

## 5. Deep Resource Inheritance

### Category
Structural Fragility

### Description
Resource inheritance chain beyond Base → Version: `V1\PostResource → V2\PostResource → V3\PostResource`. Each level adds complexity and hidden dependencies.

### Why It Happens
DRY principle taken too far. V3 "shares 90% with V2, so let's extend V2."

### Warning Signs
- Inheritance depth > 2 (V1 → V2 → V3)
- Understanding V3 response requires reading 3+ files
- V3 inherits V1 fields unintentionally
- Changes to V2 resource affect V3 unexpectedly
- Tests for V3 must account for V1 and V2 logic

### Why Harmful
Hidden coupling — V2 changes silently affect V3. The blast radius of a resource change is unpredictable. New developers cannot trace field origins.

### Real-World Consequences
A bug fix in V1 resource removes a deprecated field. V2 extends V1, so V2 also loses the field. V3 extends V2, losing it as well. Three versions are affected by a V1 bug fix.

### Preferred Alternative
Limit resource inheritance to 2 levels. Build V3 independently from V2. Use traits for genuinely shared attribute groups.

### Refactoring Strategy
1. Flatten resource inheritance to Base → Version
2. Extract shared attribute groups into traits
3. Build independent V3 resource
4. Add architecture test limiting inheritance depth
5. Document version-specific resource structure

### Detection Checklist
- [ ] Inheritance depth > 2
- [ ] V3 resource extends V2 resource
- [ ] V2 changes affect V3 unexpectedly
- [ ] Understanding a resource requires reading 3+ files

### Related Rules/Skills/Trees
- Rule: API-RESOURCE-004 (Flat Resource Inheritance)
- Skill: resource-class-organization
- Tree: code-organization
