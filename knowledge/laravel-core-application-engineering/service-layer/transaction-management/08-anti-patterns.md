# Anti-Patterns â€” Service Layer Transaction Management
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Service Layer Transaction Management |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Missing Transaction Wrapping | High | Medium | Multi-table writes not wrapped in DB::transaction() |
| Transaction Spread Across Multiple Methods | High | Medium | Transaction started in one method, commits in another method |
| Nested Transaction Confusion | Medium | Medium | Multiple DB::transaction() calls nested without understanding savepoint behavior |
| Transactions Held During External API Calls | High | Medium | API calls or long operations inside transaction, holding locks |
| No Retry Logic for Transaction Deadlocks | Medium | Medium | No retry mechanism for serialization failures or deadlocks |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Transaction Boundary Standard | No documented guidelines for where transactions should be placed | Inconsistent transaction usage, data inconsistency |
| Transaction at Wrong Layer | Transactions in controllers or repositories instead of service layer | Inconsistent boundaries, partial updates |

## Anti-Pattern Details

### AP-TM-01: Missing Transaction Wrapping
**Description**: Multiple database writes in a service method without wrapping in DB::transaction().
**Root Cause**: Developer assumes all writes succeed.
**Impact**: Partial writes on failure leave data in inconsistent state.
**Detection**: Service method has multiple create/update/delete calls without transaction.
**Solution**: Wrap multi-write operations in DB::transaction().

### AP-TM-02: Transaction Spread Across Multiple Methods
**Description**: Transaction started in one method, committed or rolled back in another.
**Root Cause**: Break down of a large transaction across methods for code organization.
**Impact**: Hard to trace transaction boundaries. Connections may not release properly.
**Detection**: DB::beginTransaction() and DB::commit() in different methods.
**Solution**: Keep transaction within a single method. Use DB::transaction(Closure) for clear boundaries.

### AP-TM-03: Nested Transaction Confusion
**Description**: Calling a service method that uses DB::transaction() from another method that also uses DB::transaction().
**Root Cause**: Not understanding that nested transactions in MySQL create savepoints, not true nested transactions.
**Impact**: Partial rollbacks may not behave as expected.
**Detection**: Nested DB::transaction() calls in call stack.
**Solution**: Design service methods to assume transaction is already active. Let the caller wrap in transaction.

### AP-TM-04: Transactions Held During External API Calls
**Description**: External HTTP API calls or long-running operations inside a database transaction.
**Root Cause**: Wrapping entire workflow including external calls in one transaction.
**Impact**: Database locks held during network I/O. Connection pool exhaustion.
**Detection**: External API call or sleep() inside DB::transaction() closure.
**Solution**: Keep transactions tight. Move external API calls before or after the transaction.
