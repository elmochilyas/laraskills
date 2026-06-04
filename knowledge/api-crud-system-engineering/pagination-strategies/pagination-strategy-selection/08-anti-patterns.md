# Anti-Patterns â€” Pagination Strategy Selection

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Pagination Strategy Selection |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| One-Size-Fits-All Pagination | High | Medium | All endpoints use same pagination method regardless of data characteristics |
| Offset for Unbounded Datasets | High | High | paginate() on growing dataset without cursor |
| Strategy by Developer Preference | Medium | Medium | Strategy based on familiarity, not data characteristics |
| No Documentation of Pagination Behavior | Medium | High | Endpoint missing pagination parameters and strategy docs |
| No Growth Trajectory Consideration | High | Medium | Strategy based on current dataset size, not projected growth |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Strategy Inconsistency Across Resources | Different endpoints use different strategies without documentation | Confuses API consumers, increases integration errors |
| Missing Performance Testing | Strategy chosen without testing with production-scale data | Performance surprises at scale, emergency migrations |
| No Migration Plan | No plan for strategy transition as data grows | Painful forced migration under production pressure |

---

## Anti-Pattern Details

### AP-PSS-01: One-Size-Fits-All Pagination

**Description**: Applying the same pagination strategy to every endpoint regardless of data characteristics. An activity feed with high write concurrency, an admin list requiring random page access, and a search endpoint with scored results all use the same strategy.

**Root Cause**: Convenience and habit â€” the developer learns one method and applies it universally.

**Impact**: Feeds get phantom reads, admin panels lose page-jumping, performance degrades where strategy is a poor fit.

**Detection**: Code review reveals all endpoints use same pagination method.

**Solution**: Define strategy per resource based on data characteristics. Use a config mapping resources to their strategy.

### AP-PSS-02: Offset for Unbounded Datasets

**Description**: Using offset pagination for datasets expected to grow beyond 10K records. Offset performs O(N) scans at depth.

**Root Cause**: Works fine with 100 test records during development.

**Impact**: Deep-page queries degrade, database CPU spikes, emergency migrations.

**Detection**: paginate() on model with unbounded growth; performance test shows latency at page 500+.

**Solution**: Default to cursor for unbounded/growing datasets. Cap maximum page number if random access required.

### AP-PSS-03: Strategy by Developer Preference

**Description**: Choosing strategy based on developer convenience rather than data characteristics.

**Root Cause**: No systematic decision criteria for strategy selection.

**Impact**: Wrong strategies cause performance or usability problems.

**Detection**: Same developer uses same strategy everywhere regardless of data.

**Solution**: Implement decision matrix. Document rationale per endpoint.

### AP-PSS-04: No Documentation of Pagination Behavior

**Description**: Endpoints implement pagination without documenting strategy, parameters, or response structure.

**Root Cause**: Pagination treated as implementation detail rather than contract.

**Impact**: Clients reverse-engineer behavior, integration errors, support burden.

**Detection**: API doc audit shows missing pagination parameter docs.

**Solution**: Document per-endpoint: strategy, params, defaults, max, behavioral guarantees.

### AP-PSS-05: No Growth Trajectory Consideration

**Description**: Strategy selected based on current size without considering projected growth.

**Root Cause**: Developers optimize for present and underestimate future growth.

**Impact**: Performance degrades gradually, migration rushed under pressure.

**Detection**: Strategy selection considers only current record count.

**Solution**: Project dataset size 12-24 months ahead. Default to cursor for any dataset with growth potential.
