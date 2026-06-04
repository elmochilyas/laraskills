# Anti-Patterns â€” Pagination Information Customization
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Pagination Information Customization |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Inconsistent Customization Across Endpoints | High | Medium | Different endpoints customize pagination metadata differently |
| Removing Critical Pagination Fields | Medium | Medium | Custom pagination removes fields clients depend on |
| Over-customizing Pagination Output | Medium | Medium | Complex pagination customization that's hard to maintain |
| No Pagination Customization Convention | Medium | High | Each endpoint customizes pagination metadata independently |
| Breaking Change to Pagination Shape | High | Low | Customization changes pagination field names in a minor version |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Pagination Metadata Standard | No standard pagination response shape | Clients must handle multiple pagination formats |
| Over-engineered Pagination Customization | More customization than needed for the use case | Maintenance burden, confusion |

## Anti-Pattern Details

### AP-PIC-01: Inconsistent Customization Across Endpoints
**Description**: Some endpoints use default Laravel pagination metadata, others have custom fields with different names.
**Root Cause**: Different developers customize pagination independently.
**Impact**: Clients must handle multiple pagination response shapes.
**Detection**: Different endpoints return different pagination metadata keys.
**Solution**: Define a standard pagination metadata format. Apply it globally via a pagination resource.

### AP-PIC-02: Removing Critical Pagination Fields
**Description**: Custom pagination removes fields like 	otal or last_page that some clients rely on.
**Root Cause**: Assuming all clients need the same reduced set.
**Impact**: Client integration breaks when expected fields are missing.
**Detection**: Pagination customization omits fields from the default set.
**Solution**: Document which fields are removed and why. Provide migration path for affected clients.

### AP-PIC-03: Over-customizing Pagination Output
**Description**: Extensive pagination customization with complex mapping, renaming, and restructuring.
**Root Cause**: Trying to make pagination metadata fit a specific frontend library.
**Impact**: Hard to maintain, fragile to Laravel version upgrades.
**Detection**: Custom pagination resource with extensive field mapping.
**Solution**: Keep customization minimal. Adapt client to standard format where possible.
