# Rules: Laravel Cloud

## CLOUD-001: Git-Based Deployments Only
**Condition:** Deploying to Laravel Cloud
**Action:** Use Git push for deployments; never use manual file uploads
**Rationale:** Cloud expects Git-based workflow for deployment tracking and rollback
**Consequences:** Violation bypasses Cloud's deployment pipeline and audit trail

## CLOUD-002: Enable Hibernation for Dev
**Condition:** Non-production environment on Cloud
**Action:** Enable hibernation to reduce costs when environment is idle
**Rationale:** Development environments are inactive most hours; hibernation saves significant cost
**Consequences:** Violation incurs unnecessary compute costs for idle environments

## CLOUD-003: Monitor Scaling Limits
**Condition:** Application expecting traffic spikes
**Action:** Verify Cloud account scaling limits before launch
**Rationale:** Cloud has per-account limits on concurrent deployments and resources
**Consequences:** Violation causes failed deployments or throttled scaling during traffic spikes
