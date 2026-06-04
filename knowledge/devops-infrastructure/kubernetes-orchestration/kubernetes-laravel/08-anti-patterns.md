# Anti-Patterns: Kubernetes Laravel

## AP-K8SL-001: Database in K8s
**Description:** Running MySQL/PostgreSQL as a StatefulSet in the Kubernetes cluster.
**Consequences:** Database performance is inconsistent. Pod restarts cause data loss without careful PVC management. Backup and recovery are more complex.
**Remediation:** Use managed database services (RDS, Cloud SQL) external to the K8s cluster.

## AP-K8SL-002: ConfigMap for Secrets
**Description:** Storing database passwords and API keys in ConfigMaps instead of Secrets.
**Consequences:** ConfigMap values are not encrypted at rest. Any user with ConfigMap read access sees credentials.
**Remediation:** Use Secrets for sensitive values. Consider External Secrets Operator for cloud-native secret management.

## AP-K8SL-003: No Resource Limits
**Description:** Running Laravel pods without setting CPU/memory limits.
**Consequences:** A single pod can consume all cluster resources, starving other pods and potentially destabilizing the node.
**Remediation:** Always set resource requests and limits. Use LimitRange for namespace-wide defaults.
