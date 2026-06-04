# Anti-Patterns: Laravel Cloud

## AP-CLOUD-001: Cloud for Custom Infrastructure
**Description:** Using Cloud but needing extensive custom infrastructure configuration not supported by the platform.
**Consequences:** Fighting the platform. Custom requirements that Cloud doesn't support require workarounds that are harder than self-managed infrastructure.
**Remediation:** If Cloud doesn't support your requirements (custom Nginx config, specific PHP extensions), use Forge or K8s instead.

## AP-CLOUD-002: Hibernation on Production
**Description:** Enabling hibernation on production environments to save costs.
**Consequences:** Production application becomes unavailable during idle periods. Users experience downtime.
**Remediation:** Use hibernation only for non-production environments. Production should always be active or auto-scale from minimum replicas.
