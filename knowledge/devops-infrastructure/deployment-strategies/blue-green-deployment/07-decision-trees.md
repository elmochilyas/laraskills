# Decision Trees: Blue-Green Deployment

## Strategy Selection

**Is zero-downtime deployment required?**
- No → Standard rolling update or simple deploy
- Yes → Proceed

**Can the application run two full production stacks simultaneously?**
- Yes (budget permits) → Use blue-green
- No (cost-constrained) → Evaluate canary or rolling update

**Is instant rollback critical?**
- Yes → Blue-green (true instant rollback, no redeploy)
- No → Rolling update or canary (rollback requires re-deploy)

**Are database changes backward-compatible?**
- Yes → Blue-green is safe
- No → Use 3-deploy phased approach (expand, switch, contract)

## Health Check Design

**What should be validated?**
- Web server responds → Basic 200 check
- Application processes requests → Full stack health check (DB, Redis, queue)
- External dependencies → Check critical API availability
- Recent deploy artifacts present → Verify release tag file exists

**Gateway:**
- Manual approval → For critical production deployments
- Fully automated → For standard deployments with low risk
