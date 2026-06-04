# Anti-Patterns â€” Single Action Invokable Controllers
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Single Action Invokable Controllers |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Overusing Single-Action Controllers | High | Medium | Invokable for every action including trivial |
| Inconsistent Controller Pattern | Medium | High | Mix of invokable and multi-action without rationale |
| Single-Action Does Too Much | High | Medium | Invokable handles multiple responsibilities |
| Naming Convention Confusion | Medium | Medium | Inconsistent naming (with/without Controller suffix) |
| Route Registration Clarity | Medium | Medium | __invoke less explicit than named methods |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Pattern Selection Guidelines | No criteria for invokable vs resource vs multi-action | Inconsistent architecture |
| Mixed Patterns Confusing Navigation | No documentation of when to use which | Unpredictable structure |

## Anti-Pattern Details

### AP-SAC-01: Overusing Single-Action Controllers
**Description**: Invokable controllers for every operation including trivial.
**Root Cause**: Dogmatic pattern adoption.
**Impact**: Excessive file count.
**Detection**: Invokable body is one line.
**Solution**: Use for meaningful operations only.

### AP-SAC-02: Inconsistent Controller Pattern
**Description**: Mixing invokable, resource, multi-action without rationale.
**Root Cause**: Different developer preferences.
**Impact**: Unpredictable architecture.
**Detection**: All three patterns exist without documentation.
**Solution**: Document selection criteria. Standardize.

### AP-SAC-03: Single-Action Does Too Much
**Description**: Invokable validates, authorizes, processes, formats.
**Root Cause**: Business logic not extracted.
**Impact**: Not thin. Logic untestable without HTTP.
**Detection**: Invokable body exceeds 20 lines.
**Solution**: Extract business logic to actions.

### AP-SAC-04: Naming Convention Confusion
**Description**: Some suffixed Controller, others not.
**Root Cause**: No naming convention.
**Impact**: Auto-discovery may fail.
**Detection**: Inconsistent suffix.
**Solution**: Standardize on [Action]Controller.

### AP-SAC-05: Route Registration Clarity
**Description**: __invoke hides method name in route files.
**Root Cause**: Invokable less explicit.
**Impact**: Must open class to know what's called.
**Detection**: Route to ::class without context.
**Solution**: Add comments documenting purpose.
