# Rules: Platform.sh Deployment

## PLATFORMSH-001: Use Managed Services
**Condition:** Platform.sh production deployment
**Action:** Use Platform.sh managed MariaDB/PostgreSQL and Redis
**Rationale:** Self-managed services on Platform.sh lose platform benefits (backup, monitoring)
**Consequences:** Violation requires manual service management

## PLATFORMSH-002: Environment Per Branch
**Condition:** Development workflow on Platform.sh
**Action:** Use Platform.sh development environments for each PR branch
**Rationale:** Platform.sh provides production-like environments per branch; ignoring this wastes platform value
**Consequences:** Violation underutilizes Platform.sh's primary feature

## PLATFORMSH-003: Resource Monitoring
**Condition:** Production deployment on Platform.sh
**Action:** Configure resource usage alerts
**Rationale:** Platform.sh bills on resource allocation; over-provisioning wastes budget
**Consequences:** Violation causes unexpected cost overruns
