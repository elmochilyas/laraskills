# Anti-Patterns â€” Service Layer Naming Conventions
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Service Layer Naming Conventions |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Inconsistent Suffix Usage | Medium | High | Some services suffixed Service, others Manager, Handler, Helper |
| Generic Names (Service, Manager, Helper) | Medium | High | Names so generic they reveal nothing about purpose |
| Name Doesn't Reflect Responsibility | High | Medium | Service name implies one thing but does another |
| No Namespace/Directory Organization | Medium | Medium | All services in flat directory without subdomain grouping |
| Service Name Duplicated Across Layers | Medium | Medium | Same service name exists in domain and application layers, causing confusion |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Naming Convention Documented | No documented standards for service naming | Inconsistent names across codebase |
| Verbs vs Nouns Confusion | Some services named by action (UserCreator), others by domain (UserService) | Can't predict naming pattern |

## Anti-Pattern Details

### AP-SNC-01: Inconsistent Suffix Usage
**Description**: Services use inconsistent suffixes: PaymentService, OrderManager, InvoiceHandler, MailHelper.
**Root Cause**: No team convention. Different developers choose different suffixes.
**Impact**: Unpredictable naming. Hard to find services.
**Detection**: Codebase has 4+ different service suffixes.
**Solution**: Standardize on one suffix (Service). Use Action for single-operation classes.

### AP-SNC-02: Generic Names (Service, Manager, Helper)
**Description**: Service named UserService or Helper without indicating specific responsibility.
**Root Cause**: Default naming without considering clarity.
**Impact**: Does too many things because the name is too broad.
**Detection**: UserService has methods for auth, profile, notifications, billing.
**Solution**: Name services by specific responsibility: UserAuthenticationService, UserProfileService.

### AP-SNC-03: Name Doesn't Reflect Responsibility
**Description**: Service named PaymentService but also handles invoicing, refunds, and reconciliation.
**Root Cause**: Broad services accumulate unrelated responsibilities.
**Impact**: SRP violation hidden by a generic name.
**Detection**: Service has methods covering multiple domains.
**Solution**: Split into focused services with precise names: PaymentProcessor, InvoiceGenerator.

### AP-SNC-04: No Namespace/Directory Organization
**Description**: All service classes in pp/Services without subdomain subdirectories.
**Root Cause**: Default structure never reorganized as application grew.
**Impact**: Dozens of service files in one directory. Hard to navigate.
**Detection**: 20+ service files in a single directory.
**Solution**: Organize by domain: Services/Payment/, Services/Notification/.
