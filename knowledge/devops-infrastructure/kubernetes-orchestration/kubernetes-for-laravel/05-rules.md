# Rules: Kubernetes for Laravel

## K8S-001: Migrations as Jobs
**Condition:** Database migrations on Kubernetes
**Action:** Run migrations as Kubernetes Job, not init container
**Rationale:** Init container failure causes pod restart loop; Job handles retry and failure reporting
**Consequences:** Violation creates pod restart loop on migration failure

## K8S-002: Stateless Pods
**Condition:** Laravel application pods on Kubernetes
**Action:** Store sessions, cache, and file uploads externally (Redis, S3)
**Rationale:** K8s pods are ephemeral; local storage is lost on pod restart
**Consequences:** Violation causes data loss and user session logout on pod rescheduling

## K8S-003: Readiness Probe for Traffic
**Condition:** Laravel pod readiness probe configured
**Action:** Use HTTP readiness probe on health check endpoint, not TCP probe
**Rationale:** TCP probe only checks port listening; HTTP probe validates application health
**Consequences:** Violation routes traffic to pods that accept connections but serve errors

## K8S-004: Resource Limits Required
**Condition:** Laravel pods in namespace
**Action:** Set resource requests AND limits for all pods
**Rationale:** Unlimited pods can starve other pods and destabilize the cluster
**Consequences:** Violation allows noisy neighbor resource consumption

## K8S-005: HPA Based on Custom Metrics
**Condition:** Autoscaling Laravel web pods
**Action:** Configure HPA based on requests/second custom metric in addition to CPU
**Rationale:** CPU-based scaling responds too slowly to traffic spikes
**Consequences:** Violation causes latency spikes during traffic bursts before HPA reacts
