# Anti-Patterns: Blue-Green Deployment

## AP-BG-001: Blue-Green on Single Server
**Description:** Simulating blue-green on a single server by running two application instances on different ports.
**Why it happens:** Budget constraints push teams to approximate blue-green without additional infrastructure.
**Consequences:** No actual fault isolation. A server outage takes down both environments. Resource contention between instances causes performance degradation.
**Remediation:** Use symlink-swap deployment (Envoyer/Deployer) instead of pretending blue-green on single server.

## AP-BG-002: Database Coupled Blue-Green
**Description:** Each environment has its own database. Migration runs on the blue database, then on switch, green database is out of sync.
**Why it happens:** Misunderstanding that blue-green applies at all infrastructure layers.
**Consequences:** Data loss on switchover. Writes to blue database during migration are lost when switching to green.
**Remediation:** Shared database layer. Environments share the same database cluster. Migrate once, not per environment.

## AP-BG-003: Unilateral Blue-Green
**Description:** One team adopts blue-green for their service without ensuring downstream dependencies support the pattern.
**Why it happens:** Team-level optimization without cross-team coordination.
**Consequences:** Switchover causes cascading failures when downstream services can't handle dual-version load.
**Remediation:** Verify all service-to-service dependencies support dual-version coexistence.
