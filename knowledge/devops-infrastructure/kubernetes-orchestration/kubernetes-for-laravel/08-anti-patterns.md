# Anti-Patterns: Kubernetes for Laravel

## AP-K8S-001: Init Container Migrations
**Description:** Running database migrations as an init container.
**Consequences:** Migration failure causes pod restart loop. All application pods attempt migrations simultaneously, causing database lock contention.
**Remediation:** Run migrations as a Job. Use Helm pre-upgrade hook or ArgoCD post-sync hook to run migration before deployment update.

## AP-K8S-002: Stateful Laravel on K8s
**Description:** Storing uploaded files and sessions on pod local storage.
**Consequences:** Pod restart or reschedule loses user sessions and uploaded files. Scaling up creates pods with empty storage.
**Remediation:** Use S3 for file storage, Redis for sessions. All storage must be external to pods.

## AP-K8S-003: Over-privileged Pods
**Description:** Pods running as root with privileged security context.
**Consequences:** Container escape from a compromised pod grants host-level access to the K8s node and all pods on it.
**Remediation:** Run pods as non-root user. Set `securityContext.runAsNonRoot: true`. Use Pod Security Admission.
