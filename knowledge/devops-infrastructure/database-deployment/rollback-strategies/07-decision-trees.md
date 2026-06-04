# Decision Trees: Rollback Strategies

## Rollback Approach

**Migration type:**
- Add column (nullable) → Simple rollback, just migrate:rollback
- Add column (NOT NULL with default) → Simple rollback
- Remove column → Rollback restores column, existing code may fail if it references removed code
- Rename column → Expand-migrate-contract: 3 separate deployments
- Data transformation → Requires data backup before migration; rollback restores from backup

## Automation Level

**Deployment frequency:**
- Multiple times daily → Fully automated rollback
- Daily → Automated with manual confirmation
- Weekly+ → Manual rollback with documented procedure
