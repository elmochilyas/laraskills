# ECC Anti-Patterns — Resource Organization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Resource Organization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Premature Version Subdirectory Creation
2. Mixing Versioned and Non-Versioned Resources
3. Deep Nesting (4+ Directory Levels)
4. Inconsistent Suffix Usage Across Resource Variants

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files (N/A)
- Premature Abstraction (version directories before first release)

---

## Anti-Pattern 1: Premature Version Subdirectory Creation

### Category
Code Organization | Scalability

### Description
Creating version subdirectories (`V1/`, `V2/`) in resources before the first API version is released, adding complexity without benefit.

### Why It Happens
Developers anticipate future versioning and create the structure prematurely. "We'll need it eventually."

### Warning Signs
- `app/Http/Resources/V1/` exists but only one version has ever been deployed
- Empty `V2/` directories exist
- Resources in `V1/` are imported as `V1\UserResource` with no backing `V2` alternative

### Why It Is Harmful
Adds unnecessary namespace depth. Makes imports longer. Creates empty directories. Adds ceremony without value.

### Real-World Consequences
Every import requires `use App\Http\Resources\V1\UserResource` instead of `use App\Http\Resources\UserResource`. Developers add `V1/` to every new resource without thinking. The entire codebase has deep import paths for no reason.

### Preferred Alternative
Start flat. Add version subdirectories only when the first breaking API change is introduced.

### Refactoring Strategy
1. Move all resources from `V1/` back to the flat `app/Http/Resources/` directory.
2. Update all imports.
3. Document: "Version subdirectories will be introduced at the first breaking API change."

### Detection Checklist
- [ ] Does `app/Http/Resources/V1/` exist without a `V2/` in production?
- [ ] Is there only one version of the API in use?

### Related Rules
- Rule: Do Not Create Version Subdirectories Before the First Release

---

## Anti-Pattern 2: Mixing Versioned and Non-Versioned Resources

### Category
Code Organization

### Description
Some resources are in version subdirectories while others remain in the flat namespace, creating import confusion and namespace collisions.

### Why It Happens
Partial migration. Some resources were moved to versioning while others were missed. New resources are inconsistently placed.

### Warning Signs
- Both `app/Http/Resources/UserResource.php` and `app/Http/Resources/V1/UserResource.php` exist
- Controllers import from both `Resources\` and `Resources\V1\`
- No clear migration plan documented

### Why It Is Harmful
Namespace collisions — the same class name exists in two namespaces. Developers import the wrong version. Ambiguity forces aliasing.

### Real-World Consequences
A controller imports `UserResource` (flat) while another imports `V1\UserResource` (versioned). They have different field sets. A client developer notices inconsistent responses from different endpoints.

### Preferred Alternative
All resources are either all versioned or all non-versioned. Never mix.

### Refactoring Strategy
1. Decide: all versioned or all flat.
2. If all versioned, move remaining flat resources into version subdirectories.
3. If all flat, remove version subdirectories.
4. Update all imports.
5. Add CI check preventing mixed imports.

### Detection Checklist
- [ ] Are resources in both `Resources\` and `Resources\V1\` directories?

### Related Rules
- Rule: Do Not Mix Versioned and Non-Versioned Resources
