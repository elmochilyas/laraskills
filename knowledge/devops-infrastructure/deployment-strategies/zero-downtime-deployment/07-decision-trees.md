# Decision Trees: Zero-Downtime Deployment

## Strategy Selection

**Number of servers:**
- Single server → Symlink swap (Envoyer/Deployer) or Octane reload
- Multiple servers → Blue-green or Envoyer multi-server orchestration

**Budget:**
- $0 → Deployer PHP or Octane reload
- Willing to pay → Envoyer (managed) or Octane

**Is the application using Octane?**
- Yes → Use `octane:reload` (simplest ZDD, built-in)
- No → Use Envoyer or Deployer

**Database migration complexity:**
- Low (simple DDL) → Standard migrate-before-swap
- High (destructive, large datasets) → Expand-migrate-contract pattern across 3+ deployments

## Health Check Design

**What to validate:**
- Web server responds → Basic 200 check
- Application processes requests → Full stack (DB, Redis, queue)
- New release artifacts present → Verify deployment marker file

**On failure:**
- Auto-rollback → For standard deployments
- Manual intervention → For critical deployments requiring investigation
