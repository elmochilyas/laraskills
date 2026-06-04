# Anti-Patterns â€” Pagination Metadata Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Pagination Metadata Design |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Returning Total for Cursor Pagination | High | High | Cursor response includes 	otal requiring expensive COUNT |
| Missing has_more for Cursor | High | Medium | Cursor response doesn't indicate if more records exist |
| Including All Fields (current_page, last_page) for Cursor | High | Medium | Cursor response includes offset-specific fields that don't apply |
| Inconsistent Metadata Across Pagination Methods | Medium | Medium | Offset and cursor pagination return different metadata shapes |
| Metadata That Duplicates HTTP Headers | Low | Medium | Pagination body fields duplicate Link header information |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Pagination Metadata Standard | No defined standard for pagination response metadata | Clients must handle multiple metadata shapes |
| Mixing Offset and Cursor metadata | Same response includes fields from both pagination methods | Confusing, bloated response |

## Anti-Pattern Details

### AP-PMD-01: Returning Total for Cursor Pagination
**Description**: Cursor pagination response includes 	otal field that requires an expensive COUNT query.
**Root Cause**: Using default paginate() serialization for cursor responses.
**Impact**: COUNT query defeats cursor pagination's performance advantage.
**Detection**: Cursor response includes total or last_page fields.
**Solution**: Only include has_more and 
ext_cursor fields for cursor pagination.

### AP-PMD-02: Missing has_more for Cursor
**Description**: Cursor pagination response doesn't include has_more to indicate if additional results exist.
**Root Cause**: Assuming clients can infer has_more from data array length.
**Impact**: Clients can't determine when to stop paginating.
**Detection**: Cursor response lacks has_more field.
**Solution**: Always include has_more boolean in cursor pagination responses.

### AP-PMD-03: Including All Fields (current_page, last_page) for Cursor
**Description**: Cursor pagination response includes offset-specific metadata fields.
**Root Cause**: Default Laravel pagination serialization used for both methods.
**Impact**: Response includes irrelevant fields, confusing clients.
**Detection**: Cursor response includes current_page, last_page.
**Solution**: Customize cursor pagination serialization to include only relevant fields.
