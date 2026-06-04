# Anti-Patterns â€” Zero Result Pagination
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Zero Result Pagination |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Empty Array Treated as Paginator | High | Medium | Returning [] instead of empty paginator, breaking client response shape |
| Inconsistent Empty Response Shape | Medium | High | Different endpoints return different structures for empty results |
| Missing Meta on Empty Results | Medium | Medium | Empty paginator strips meta and links |
| 404 Instead of Empty Paginator | High | Low | Endpoint returns 404 when no results match filters |
| Ignoring Empty State in Tests | Medium | High | No test for zero-result scenario |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Empty Response Contract | Different structures for empty results | Client-side parsing errors |
| No Empty State Documentation | API docs don't specify empty pagination shape | Client integration errors |

## Anti-Pattern Details

### AP-ZRP-01: Empty Array Treated as Paginator
**Description**: Returning [] instead of empty paginator when no results match.
**Root Cause**: Guard clause returns [] as optimization, breaking response contract.
**Impact**: Client pagination component crashes. SDK deserialization fails.
**Detection**: Early return of [] for empty results.
**Solution**: Always return paginator instance, even for empty results.

### AP-ZRP-02: Inconsistent Empty Response Shape
**Description**: Different endpoints return different shapes for empty results.
**Root Cause**: No standardized response contract.
**Impact**: Conditional parsing needed per endpoint.
**Detection**: API responses show varying shapes for empty results.
**Solution**: Standardize response structure across all endpoints.

### AP-ZRP-03: Missing Meta on Empty Results
**Description**: Meta and links stripped from paginated response when empty.
**Root Cause**: Custom serialization conditionally includes fields.
**Impact**: Null checks needed for every pagination field.
**Detection**: isEmpty() conditions in pagination serialization.
**Solution**: Always include meta and links. Laravel default handles empty correctly.

### AP-ZRP-04: 404 Instead of Empty Paginator
**Description**: HTTP 404 returned when paginated query returns zero results.
**Root Cause**: Confusing no results with resource not found.
**Impact**: Monitoring flags 404s as errors. Caches error responses.
**Detection**: abort(404) when paginated results empty.
**Solution**: Return 200 with empty paginator. Use 404 only when resource doesn't exist.

### AP-ZRP-05: Ignoring Empty State in Tests
**Description**: No test cases for empty results. All tests seed at least one record.
**Root Cause**: Happy-path only testing.
**Impact**: Empty state bugs reach production.
**Detection**: No zero-result test case for paginated endpoints.
**Solution**: Add empty state tests. Verify JSON structure of empty responses.
