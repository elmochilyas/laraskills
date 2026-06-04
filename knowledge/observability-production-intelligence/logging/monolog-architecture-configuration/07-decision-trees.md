# Decision Trees: Monolog Architecture & Channel Configuration

## Decision D-01: Channel Destination Selection

**Question:** What type of handler should a new channel use?

```mermaid
flowchart TD
    A[Need new log channel] --> B{Purpose?}
    B -->|Persistent storage| C{Scale?}
    B -->|Real-time notification| D{Severity?}
    B -->|Centralized aggregation| E{Protocol?}
    C -->|Low volume| F[StreamHandler - single file]
    C -->|High volume, rotating| G[RotatingFileHandler - daily]
    C -->|Compliance, append-only| H[SyslogHandler]
    D -->|Critical/emergency| I[SlackHandler or PagerDuty]
    D -->|Warning/error| J[SlackHandler or Telegram]
    D -->|Information only| K[No notification - use file]
    E -->|syslog protocol| L[SyslogHandler]
    E -->|HTTP/HTTPS| M[Custom handler or webhook]
```

---

## Decision D-02: Stack Composition Strategy

**Question:** How should the production stack be composed?

```mermaid
flowchart TD
    A[Design production stack] --> B{Format requirements?}
    B -->|Machine-parseable| C[Add JSON channel at debug level]
    B -->|Human-readable| D[Add LineFormatter channel]
    C --> E{Notification needed?}
    D --> E
    E -->|Yes - errors only| F[Add Slack channel at warning+ level]
    E -->|Yes - all critical| G[Add PagerDuty at critical+ level]
    E -->|No| H[File-only stack is fine]
    F --> I{Fallback needed?}
    G --> I
    H --> J[Single channel stack]
    I -->|Yes| K[Add syslog or secondary file as fallback]
    I -->|No| L[Current channels are sufficient]
    K --> M[Name: production.stack]
    L --> M
    J --> M
```

**Recommendation:** Standard production stack: JSON file (debug) + Slack (warning+) + syslog (emergency fallback).

---

## Decision D-03: Formatter Selection

**Question:** Which formatter should a channel use?

```mermaid
flowchart TD
    A[Choose formatter] --> B{Environment?}
    B -->|Local development| C[LineFormatter - human readable]
    B -->|Staging| D[JsonFormatter - match production format]
    B -->|Production| E{Consumed by?}
    E -->|ELK/Loki/Datadog| F[JsonFormatter or LogstashFormatter]
    E -->|Human via file viewers| G[LineFormatter - but reconsider]
    E -->|Both| H[JsonFormatter + log viewer UI]
    C --> I[Append newline: true]
    D --> J[Configure depth limits]
    F --> K[Set appendNewline: true]
    H --> L[Use JSON as canonical, view via aggregator]
```

**Recommendation:** JSON for all production channels. Use `LineFormatter` only in local development. If humans must read production logs, use a log viewer UI (Kibana, Grafana Loki Explore) rather than changing the format.
