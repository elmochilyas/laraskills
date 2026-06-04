# Rules: Ploi Server Management

## PLOI-001: Agent Connectivity Monitoring
**Condition:** Server provisioned or managed via Ploi
**Action:** Monitor Ploi agent connectivity separately from application health checks
**Rationale:** A disconnected agent makes the server unmanageable through Ploi dashboard
**Consequences:** Violation leads to unplanned server management outage

## PLOI-002: SSH Fallback Preparedness
**Condition:** Ploi agent is the primary server management interface
**Action:** Maintain documented SSH access as fallback for agent-down scenarios
**Rationale:** Agent crashes, network partitions, or updates can disable remote management
**Consequences:** Violation forces hard server reboot through cloud provider console

## PLOI-003: Docker Image Security
**Condition:** Docker-based site deployed via Ploi
**Action:** Run containers as non-root user with minimal Linux capabilities
**Rationale:** Ploi Docker support runs containers with root access by default
**Consequences:** Violation enables container escape on compromised application

## PLOI-004: Staging Data Isolation
**Condition:** Staging site created in Ploi
**Action:** Verify staging database does not share credentials or data with production
**Rationale:** Ploi staging sites run on same server as production by default
**Consequences:** Violation risks production data exposure through staging breach

## PLOI-005: Recipe Version Control
**Condition:** Ploi recipe created for server provisioning
**Action:** Store recipe definition in version control alongside deployment scripts
**Rationale:** Ploi dashboard does not version recipe history
**Consequences:** Violation creates unrecoverable recipe state on accidental modification

## PLOI-006: Server Sizing for Agent Overhead
**Condition:** Selecting server size for Ploi-managed VPS
**Action:** Add 128MB RAM to calculated requirements for Ploi agent overhead
**Rationale:** Agent consumes memory that is unavailable to application and services
**Consequences:** Violation causes OOM on small servers (< 1GB RAM)

## PLOI-007: Production Free Tier Prohibition
**Condition:** Ploi used for production Laravel deployment
**Action:** Use paid Ploi tier appropriate for number of servers and team size
**Rationale:** Free tier limits servers, features, and collaborator accounts
**Consequences:** Violation creates blockers at critical growth junctures
