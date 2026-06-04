# Anti-Patterns: Zero-Downtime Deployment

## AP-ZDD-001: ZDD Theater
**Description:** Using a ZDD tool but deploying during peak hours, skipping health checks, and never testing rollback.
**Why it happens:** Organizations adopt ZDD tools for compliance checklists without understanding the operational discipline required.
**Consequences:** Bad releases go live without detection. Rollback attempts fail when needed. The "zero-downtime" deployment causes more downtime than a simple planned pause.
**Remediation:** Health checks, rollback testing, and deployment timing discipline are prerequisites for ZDD, not optional extras.

## AP-ZDD-002: ZDD Without Database Backward Compatibility
**Description:** Deploying database migrations that make rollback impossible — dropping columns or tables that old code references.
**Why it happens:** Teams design migrations for forward compatibility only.
**Consequences:** When the code release fails, rollback is impossible. The application is stuck between incompatible code and schema.
**Remediation:** Every migration must be reversible and backward-compatible with the previous two code versions.

## AP-ZDD-003: The Deploy-and-Hope
**Description:** Running ZDD without monitoring the deployment outcome, assuming that because no errors appeared in the first 30 seconds, the deployment was successful.
**Why it happens:** Confidence in the ZDD mechanism replaces confidence in the release itself.
**Consequences:** Silent errors (wrong branch deployed, missing configuration, cache corruption) remain undetected until users report them.
**Remediation:** Monitor deployment outcome actively: compare error rates before and after deployment, verify database migration status, and check feature availability.
