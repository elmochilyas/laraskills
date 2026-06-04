# Anti-Patterns â€” Service Vs Action Decision
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Service Vs Action Decision |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Always Using Services (Never Actions) | High | Medium | Every operation goes in a service, no action classes used |
| Always Using Actions (Never Services) | High | Medium | Every operation gets its own action class, even related operations |
| Service for Single Operation | Medium | Medium | Service with one method that should be an action |
| Action for Multiple Related Operations | Medium | Medium | Action class with multiple public methods that should be a service |
| No Decision Criteria | High | High | No documented guidelines for when to use service vs action |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Mixed Pattern Without Rationale | Both services and actions used without clear decision criteria | Inconsistent architecture, confusing to developers |
| Pattern Chosen by Developer Preference | Each developer uses their preferred pattern | No architectural consistency |

## Anti-Pattern Details

### AP-SVAD-01: Always Using Services (Never Actions)
**Description**: Every operation â€” related or not â€” goes into a service class.
**Root Cause**: Developer comfortable with service pattern and sees no need for actions.
**Impact**: Service classes grow large. Single operations can't be tested independently.
**Detection**: Codebase has no action classes. All logic in services.
**Solution**: Use action classes for single, independent operations. Reserve services for related operations.

### AP-SVAD-02: Always Using Actions (Never Services)
**Description**: Every operation gets its own action class, including related operations.
**Root Cause**: Dogmatic application of action pattern.
**Impact**: Excessive file count. Related operations scattered across files.
**Detection**: Two actions that share dependencies and are always called together.
**Solution**: Group related operations that share dependencies into a service.

### AP-SVAD-03: Service for Single Operation
**Description**: Service class with exactly one public method that performs one operation.
**Root Cause**: Using service pattern by default without considering action pattern.
**Impact**: Extra file for a class that could be an action. Harder to test.
**Detection**: Service has one public method.
**Solution**: Convert to single-action class if no other methods will be added.

### AP-SVAD-04: Action for Multiple Related Operations
**Description**: Action class with 2+ public methods for related operations.
**Root Cause**: Starting as action then adding "one more" related operation.
**Impact**: Violates action pattern contract (single method). Should be a service.
**Detection**: Action class has more than one public method.
**Solution**: If operations are related and share dependencies, convert to service. If not, split into separate actions.

### AP-SVAD-05: No Decision Criteria
**Description**: No documented guidelines for when to use service vs action pattern.
**Root Cause**: Team hasn't defined architectural standards.
**Impact**: Inconsistent pattern usage. New developers don't know which to choose.
**Detection**: Codebase has both patterns without documentation of when to use each.
**Solution**: Document decision criteria: use action for single independent operations, service for related grouped operations.
