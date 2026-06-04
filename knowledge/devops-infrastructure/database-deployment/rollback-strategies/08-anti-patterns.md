# Anti-Patterns: Rollback Strategies

## AP-ROLLBACK-001: No Rollback Plan
**Description:** Deploying migrations with no plan for reverting if the deployment fails.
**Consequences:** Bad deployment cannot be rolled back. Data may be left in an inconsistent state.
**Remediation:** Every migration must have a tested rollback path before production deployment.

## AP-ROLLBACK-002: Data-Losing Rollbacks
**Description:** Rollback that drops a column, permanently deleting production data.
**Consequences:** Adding a column back after rollback does not restore the deleted data.
**Remediation:** Use expand-migrate-contract pattern. Keep old column until rollback window closes.
