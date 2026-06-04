# Rules: Envoyer Zero-Downtime Deployments

## ENVOYER-001: Health Check Required
**Condition:** Envoyer deployment configured for production
**Action:** Configure health check URL that validates full application stack (not just HTTP 200)
**Rationale:** Health check is the only automated gate preventing bad releases from serving traffic
**Consequences:** Violation allows broken deployments to reach production users

## ENVOYER-002: Migration Before Swap
**Condition:** Deployment includes database migrations
**Action:** Run `artisan migrate --force` before the atomic symlink swap
**Rationale:** New code expects new schema; traffic hits new code immediately after swap
**Consequences:** Violation causes application errors between swap and migration completion

## ENVOYER-003: Separate Environment Projects
**Condition:** Envoyer used for multiple environments
**Action:** Create separate Envoyer projects for staging and production
**Rationale:** Shared project configuration risks accidental production deployment
**Consequences:** Violation enables human error deployment to wrong environment

## ENVOYER-004: Rollback Testing
**Condition:** Envoyer deployment pipeline established
**Action:** Test rollback procedure in staging before production deployment
**Rationale:** Rollback fails when previous releases are cleaned up or migrations are irreversible
**Consequences:** Violation removes the primary benefit of Envoyer (instant rollback)

## ENVOYER-005: No Manual Symlink Changes
**Condition:** Server managed by Envoyer
**Action:** Do not manually modify the `current` symlink or release directories
**Rationale:** Envoyer tracks release state; manual changes cause inconsistent deployment state
**Consequences:** Violation breaks Envoyer's ability to manage future deployments and rollbacks
