# ECC Anti-Patterns — Versioned Resources

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Versioned Resources |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Modifying Old Version Resources After Release
2. Deep Inheritance Chain for Versioned Resources (V5 extends V4 extends V3...)
3. Breaking Changes Without Version Bump (Field Rename/Delete in Same Version)
4. No Deprecation Headers on Old Versions

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files (N/A)
- Premature Abstraction (versioning before the first API consumer)

---

## Anti-Pattern 1: Modifying Old Version Resources After Release

### Category
Reliability

### Description
Changing a V1 resource after it has been released to external consumers, silently breaking clients that depend on the original shape.

### Why It Happens
A bug fix or feature request seems "small" and the developer modifies V1 instead of creating V2. "It's just adding a field."

### Warning Signs
- V1 resource files have recent git history changes
- Clients report unexpected fields in old version responses
- No CI enforcement freezing old version resources

### Preferred Alternative
Freeze old version resources after release. Additive changes may be non-breaking; any structural change (rename, type change, removal) requires a new version.

### Related Rules
- Rule: Freeze Old Version Resources After Release

---

## Anti-Pattern 2: Deep Inheritance Chain

### Category
Maintainability

### Description
V5 extends V4 extends V3 extends V2 extends V1, creating an unreadable inheritance chain where no single file shows the complete resource structure.

### Why It Happens
Each version only adds minor changes to the previous version. Inheritance seems like the DRY approach.

### Warning Signs
- Inheritance chain is 3+ levels deep
- Tracing a field requires opening 3+ files
- `parent::toArray()` calls span multiple levels

### Preferred Alternative
Cap inheritance at 2 levels (base + version-specific). Use copy-and-modify for major versions.

### Related Rules
- Rule: Cap Inheritance at 2 Levels for Versioned Resources
