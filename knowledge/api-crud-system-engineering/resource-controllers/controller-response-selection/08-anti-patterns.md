# Anti-Patterns â€” Controller Response Selection
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Response Selection |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Inconsistent Response Types | High | High | Some return models, some JSON, some collections |
| Manual JSON Response Construction | Medium | Medium | response()->json() built manually instead of API resources |
| Wrong HTTP Status Codes | High | Medium | 200 for create (should be 201) or delete (should be 204) |
| No Response Type Standardization | Medium | High | Each controller defines its own response format |
| Response Logic Mixed with Business Logic | Medium | Medium | Interleaved formatting and business operations |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Response Contract Standard | No defined standard for API response structure | Inconsistent shapes |
| No Response Helpers | No shared response macros | Code duplication |

## Anti-Pattern Details

### AP-CRS-01: Inconsistent Response Types
**Description**: Controller methods return different types inconsistently.
**Root Cause**: No standardized response convention.
**Impact**: Unpredictable response structure.
**Detection**: Mixed return types across methods.
**Solution**: Standardize on API Resources.

### AP-CRS-02: Manual JSON Response Construction
**Description**: response()->json() built manually instead of using Resources.
**Root Cause**: Fastest path to return data.
**Impact**: Response structure varies.
**Detection**: return response()->json([...]) in controllers.
**Solution**: Use API Resource classes.

### AP-CRS-03: Wrong HTTP Status Codes
**Description**: Wrong codes: 200 for creates, 200 for deletes.
**Root Cause**: Defaulting to 200 without considering semantics.
**Impact**: API doesn't follow HTTP semantics.
**Detection**: Store returns 200. Destroy returns 200.
**Solution**: 201 for store, 204 for destroy, 200 for index/show/update.

### AP-CRS-04: No Response Type Standardization
**Description**: No standard API response format.
**Root Cause**: No response design documentation.
**Impact**: Custom integration per endpoint.
**Detection**: Varying response structures.
**Solution**: Define and implement standard response format.

### AP-CRS-05: Response Logic Mixed with Business Logic
**Description**: Database operations and response formatting interleaved.
**Root Cause**: No separation of concerns.
**Impact**: Hard to test business logic.
**Detection**: Eloquent and response()->json() mixed.
**Solution**: Use actions for logic. Controllers handle response only.
