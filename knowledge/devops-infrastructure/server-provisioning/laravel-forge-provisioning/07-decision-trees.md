# Decision Trees: Laravel Forge Provisioning

## Single vs Multi-Server Architecture

**Is traffic expected to exceed 10k DAU?**
- No → Use single-server architecture
- Yes → Proceed

**Does the application require dedicated background processing?**
- No → Two servers: App+Web+Redis + Database
- Yes → Three servers: App+Web + Worker + Database

**Is database write throughput a concern?**
- No → Shared database server
- Yes → Separate read replica for reporting queries

**Expected growth trajectory?**
- Gradual → Start with app+DB, add servers as needed
- Rapid → Full decomposition from day one with load balancer

## Forge vs Alternative

**Does the team have containers experience?**
- No → Choose Forge
- Yes → Evaluate Ploi (Docker support) or Kubernetes

**Is multi-server zero-downtime required?**
- Yes, simple → Forge + Envoyer
- Yes, complex → Forge + Deployer or Kubernetes
- No, single server → Forge alone

## PHP-FPM Configuration Decision

**Traffic pattern:**
- Consistent high traffic → pm = static
- Variable traffic (peaks and troughs) → pm = dynamic
- Low traffic with occasional spikes → pm = ondemand

**Server memory available for PHP:**
- < 1GB → Use ondemand to conserve memory
- 1-4GB → Use dynamic with calculated max_children
- > 4GB → Use static or dynamic with generous max_children

## Deployment Script Pattern

**Is this a new Forge site with built-in ZDD?**
- Yes → Use Forge-native deployment, no Envoyer needed
- No → Use symlink-swap pattern in deployment script

**Does the application use Octane?**
- Yes → Use `octane:reload` instead of PHP-FPM restart
- No → Standard Forge deploy with PHP-FPM reload
