# Anti-Patterns â€” JSON API Resource Structure
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | JSON API Resource Structure |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Missing Resource Identifier in Response | High | Medium | Resource response missing 	ype and id fields |
| Inconsistent Resource Type Names | Medium | Medium | Resource type names differ across endpoints (users vs people) |
| Attributes at Wrong Nesting Level | High | Medium | Attributes placed at root instead of under ttributes key |
| Missing Relationship Section | Medium | Medium | Resource has relationships but no elationships object |
| Non-standard Resource Object Shape | High | Medium | Resource object doesn't follow JSON:API spec structure |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Partial JSON:API Compliance | Some JSON:API conventions followed, others ignored | Clients can't rely on spec compliance |
| No Resource Type Registry | Resource types not documented or registered | Type naming inconsistency |

## Anti-Pattern Details

### AP-JRS-01: Missing Resource Identifier in Response
**Description**: Resource response doesn't include a 	ype field or consistent identifier structure.
**Root Cause**: Developer serializes model directly without JSON:API resource structure.
**Impact**: Clients can't identify resource types generically.
**Detection**: Response has id but no 	ype field.
**Solution**: Always include 	ype and id as resource identifier object.

### AP-JRS-02: Inconsistent Resource Type Names
**Description**: Resource 	ype values vary between endpoints: users on one, people on another.
**Root Cause**: No resource type registry or convention.
**Impact**: Clients can't reliably identify resource types.
**Detection**: Same domain model has different type names in different endpoints.
**Solution**: Define and document resource type names per domain model.

### AP-JRS-03: Attributes at Wrong Nesting Level
**Description**: Resource attributes placed at the root of the resource object instead of under ttributes.
**Root Cause**: Not using JSON:API resource classes correctly.
**Impact**: Violates JSON:API spec, confuses clients.
**Detection**: Resource object has attributes directly at top level.
**Solution**: Wrap all attributes in an ttributes key within the resource object.
