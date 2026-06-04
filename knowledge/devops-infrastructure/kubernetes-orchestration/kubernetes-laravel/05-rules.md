# Rules: Kubernetes Laravel

## K8SL-001: Graceful Shutdown
**Condition:** Laravel pod termination configured
**Action:** Set `terminationGracePeriodSeconds` to 30s minimum
**Rationale:** In-flight requests need time to complete before pod termination
**Consequences:** Violation drops active requests on pod scale-down or rolling update

## K8SL-002: Pod Disruption Budget
**Condition:** Production Laravel deployment
**Action:** Create PodDisruptionBudget allowing max 1 unavailable pod
**Rationale:** Cluster autoscaling and node maintenance can terminate pods without PDB
**Consequences:** Violation causes full application outage during node maintenance

## K8SL-003: Migration Tracking
**Condition:** Migration Job runs on K8s
**Action:** Track last successful migration by commit SHA to prevent re-migration
**Rationale:** Migration Job runs on every deployment without tracking
**Consequences:** Violation retries already-applied migrations on every deploy

## K8SL-004: OPcache on Image Build
**Condition:** Dockerfile for K8s deployment
**Action:** Warm OPcache during image build, not at pod startup
**Rationale:** Cold OPcache on new pods causes performance degradation for first N requests
**Consequences:** Violation causes latency spikes during rolling updates
