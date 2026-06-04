# Rules: validate_timestamps=0 Tradeoff

---

### Rule 1: Always Set opcache.validate_timestamps=0 in Production Environments

**Category:** Performance

**Rule:** Set `opcache.validate_timestamps=0` in all production php.ini configurations. Never leave the default value of 1 in production environments.

**Reason:** validate_timestamps=1 calls stat() on every cached file for every request — a 500-file request incurs 500 stat() syscalls costing 1-2.5ms. Setting it to 0 eliminates this overhead entirely, saving 0.5-1% CPU on typical applications. This is the single highest-ROI OpCache tuning change.

**Bad Example:**
```ini
; Production — default, wasteful
opcache.validate_timestamps=1
opcache.revalidate_freq=60
```

**Good Example:**
```ini
; Production — optimal
opcache.validate_timestamps=0
```

**Exceptions:** Shared hosting environments where the deployment process cannot perform explicit cache invalidation.

**Consequences Of Violation:** Unnecessary CPU consumption on stat() syscalls scales linearly with request rate and file count. At 1000 RPS with 500 files, 500,000 stat() calls are made per second that could be eliminated.

---

### Rule 2: Keep opcache.validate_timestamps=1 in Development Environments

**Category:** Maintainability

**Rule:** Set `opcache.validate_timestamps=1` with `opcache.revalidate_freq=0` in all development environments. Never use validate_timestamps=0 in development.

**Reason:** Developers need code changes to appear immediately without manual cache invalidation. validate_timestamps=0 makes all code changes invisible until opcache_reset() or restart, confusing developers, breaking workflow, and slowing iteration.

**Bad Example:**
```ini
; Development — changes invisible without manual reset
opcache.validate_timestamps=0
```

**Good Example:**
```ini
; Development — changes appear immediately
opcache.validate_timestamps=1
opcache.revalidate_freq=0
```

**Exceptions:** None — development and production should always use different validate_timestamps settings.

**Consequences Of Violation:** Developers make code changes, reload the page, see no difference, and waste time debugging phantom issues caused by stale OpCache.

---

### Rule 3: Integrate Explicit OpCache Invalidation Into the Deployment Pipeline

**Category:** Reliability

**Rule:** Every deployment pipeline must include an explicit OpCache invalidation step (opcache_reset() or cachetool) after code deployment. Never rely on timestamp validation or manual invalidation.

**Reason:** With validate_timestamps=0, PHP never automatically detects code changes. The only way new code takes effect is through explicit invalidation. Without it in the pipeline, deployments silently serve stale code until someone manually triggers cache invalidation.

**Bad Example:**
```bash
# Deploy without cache invalidation — code never takes effect
rsync -a --delete /build/ /app/
systemctl reload php8.3-fpm
# opcache_reset() not called — stale code served
```

**Good Example:**
```bash
# Full pipeline with invalidation
rsync -a --delete /build/ /app/
systemctl reload php8.3-fpm
cachetool opcache:reset --all
for url in / /api/health; do curl -s -o /dev/null http://localhost$url; done
```

**Exceptions:** None — explicit cache invalidation is mandatory when validate_timestamps=0.

**Consequences Of Violation:** Deployments appear successful but application behavior doesn't change. Hours or days may pass before someone realizes the new code never took effect.

---

### Rule 4: Never Toggle validate_timestamps for Individual Deployments — Keep It Permanent

**Category:** Maintainability

**Rule:** Set validate_timestamps=0 as a permanent production configuration. Never toggle it to 1 temporarily for a deployment and back to 0 afterwards.

**Reason:** Toggling validate_timestamps introduces risk of misconfiguration (forgetting to toggle back) and defeats the purpose of the setting. The correct approach is a fixed configuration with an invalidation step in the deployment pipeline, not runtime toggling.

**Bad Example:**
```bash
# Toggle for deployment
echo "opcache.validate_timestamps=1" >> /etc/php/8.3/fpm/conf.d/opcache.ini
systemctl reload php8.3-fpm
# Deploy code
rsync -a --delete /build/ /app/
# Later: toggle back — but what if someone forgets?
```

**Good Example:**
```bash
# Permanent configuration
# opcache.validate_timestamps=0 in php.ini
# Invalidation handled by pipeline
cachetool opcache:reset --all
rsync -a --delete /build/ /app/
systemctl reload php8.3-fpm
```

**Exceptions:** None — permanent configuration with pipeline-based invalidation is the only correct approach.

**Consequences Of Violation:** validate_timestamps left at 1 in production wastes CPU indefinitely. Conversely, left at 0 without pipeline invalidation causes stale code to persist.

---

### Rule 5: Document the Invalidation Requirement So Developers Understand Why Manual Steps Are Needed

**Category:** Maintainability

**Rule:** Document in the project's deployment guide that validate_timestamps=0 is enabled and all code changes require explicit cache invalidation. Ensure every developer who deploys to production understands this mechanism.

**Reason:** Developers accustomed to development environments where changes appear immediately will be confused when production deployments don't take effect. Without documentation, they may waste time debugging or incorrectly blame the deployment pipeline.

**Bad Example:**
```bash
# No documentation — developer assumes changes are detected automatically
./deploy.sh
# Developer: "I deployed but nothing changed!"
```

**Good Example:**
```bash
# Comment in deployment script explains the behavior
# Note: validate_timestamps=0 means OpCache must be explicitly invalidated.
# The cachetool command below is REQUIRED for code changes to take effect.
cachetool opcache:reset --all
./deploy.sh
```

**Exceptions:** Single-developer projects where the lone developer fully understands the mechanism.

**Consequences Of Violation:** Team members spend time debugging "deployment failures" that are actually stale cache serving old code.

---

### Rule 6: Use Environment-Specific PHP Configuration Files to Separate Dev and Prod Settings

**Category:** Maintainability

**Rule:** Maintain separate php.ini files or configuration directories for each environment. Use the deployment pipeline to apply the correct file based on the target environment.

**Reason:** validate_timestamps must differ between development (1) and production (0). A single shared configuration forces developers to manually toggle the setting, which is error-prone. Environment-specific files eliminate this risk.

**Bad Example:**
```bash
# Single php.ini for all environments
cp /build/php.ini /etc/php/8.3/fpm/conf.d/opcache.ini
# validate_timestamps=0 in all environments — bad for dev
```

**Good Example:**
```bash
# Environment-specific configuration
if [ "$ENVIRONMENT" = "production" ]; then
    cp /build/php.production.ini /etc/php/8.3/fpm/conf.d/opcache.ini
else
    cp /build/php.development.ini /etc/php/8.3/fpm/conf.d/opcache.ini
fi
```

**Exceptions:** None — environment-specific configuration is a fundamental deployment best practice.

**Consequences Of Violation:** Production performance degradation from validate_timestamps=1, or development confusion from validate_timestamps=0, depending on which environment inherited the wrong configuration.
