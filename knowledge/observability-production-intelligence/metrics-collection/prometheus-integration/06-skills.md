```yaml
name: prometheus-laravel-integration
description: >
  Guide an AI agent through integrating a Laravel application with Prometheus
  for metrics collection — choosing between direct export and OTel Collector,
  configuring scrape endpoints, and setting up Pushgateway for batch jobs.
workflow:
  steps:
    - name: assess-infrastructure
      description: >
        Determine the existing metrics infrastructure. Does Prometheus exist?
        Is OpenTelemetry Collector deployed? What's the network topology?
        This decides between direct export and Collector-mediated export.

    - name: choose-integration-pattern
      description: >
        Select the integration model:
        - OTel → Collector → Prometheus: Preferred for OTel-instrumented apps
        - Direct Prometheus export: Simpler, for apps without OTel Collector
        - Pushgateway: Only for short-lived batch jobs

    - name: configure-prometheus-scrape
      description: >
        Add scrape target to prometheus.yml:
        - service discovery (kubernetes_sd_configs, static_configs)
        - metrics_path (/metrics by default)
        - scrape_interval (15-60s)
        - scrape_timeout (10s default)

    - name: verify-endpoint
      description: >
        Test the metrics endpoint: should return valid exposition format.
        Content-Type should be text/plain; version=0.0.4.
        Validate metric names, types, and label names.

    - name: setup-pushgateway
      description: >
        For batch jobs only: configure Pushgateway endpoint URL.
        Push metrics on job completion with job label.
        Set pushgateway_address and push_interval in job config.

    - name: configure-alerting
      description: >
        (Optional) Create Prometheus alert rules for key metrics:
        - high_error_rate: > 5% over 5m
        - request_slowdown: p99 > 1000ms over 5m
        - target_down: no metrics for 3x scrape interval

  triggers:
    - User asks "How do I get my Laravel metrics into Prometheus?"
    - User asks "Should I use Pushgateway or scrape?"
    - User reports "Prometheus can't scrape my app"
```
