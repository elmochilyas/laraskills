```yaml
name: health-check-endpoint-setup
description: >
  Guide an AI agent through implementing a health check endpoint for a Laravel
  application — differentiating liveness from readiness, adding dependency
  checks, configuring Kubernetes probes, and avoiding common pitfalls.
workflow:
  steps:
    - name: determine-probe-types
      description: >
        Identify target environment (Kubernetes, Docker Swarm, load balancer).
        Decide which probe types are needed:
        - Liveness: lightweight process ping only
        - Readiness: comprehensive dependency check
        - Startup: for slow-starting applications

    - name: implement-liveness-check
      description: >
        Create a lightweight liveness endpoint (GET /healthz or /ping).
        Should only verify PHP-FPM responds. No database, cache, or file
        system checks. Returns 200 if process responds.

    - name: implement-readiness-check
      description: >
        Create a readiness endpoint (GET /readyz or /health).
        Checks database, cache, queue, and critical external services.
        Returns 200 if all critical checks pass, 503 otherwise.
        Returns component-level JSON status.

    - name: add-caching
      description: >
        Cache each component check result for 5-10 seconds.
        Use Laravel cache with short TTL. Invalidate on explicit request
        (e.g., query parameter to bypass cache for manual debugging).

    - name: configure-kubernetes-probes
      description: >
        Add probe configuration to deployment.yaml:
        - livenessProbe: httpGet path /healthz, period 15s
        - readinessProbe: httpGet path /readyz, period 10s
        - startupProbe: httpGet path /readyz, initialDelay 60s

    - name: verify-probes
      description: >
        Test each probe independently. Simulate dependency failure
        (stop database, kill Redis) and verify readiness returns 503
        while liveness still returns 200.

  triggers:
    - User asks "How do I add health checks to my Laravel app?"
    - User reports "Kubernetes is restarting my pods for no reason"
    - User asks "What's the difference between liveness and readiness?"
```
