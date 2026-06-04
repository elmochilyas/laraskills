# Anti-Patterns: Canary Deployment

## AP-CANARY-001: The Superstitious Canary
**Description:** Running a 1% canary and declaring the deployment safe after 5 minutes with no errors, despite insufficient traffic to detect issues.
**Why it happens:** Teams follow the "canary" pattern without understanding statistical requirements.
**Consequences:** The canary provides false confidence. Issues that surface at higher traffic volumes go undetected until full rollout.
**Remediation:** Calculate minimum traffic for statistical significance. If traffic is insufficient, use blue-green instead.

## AP-CANARY-002: Canary Without Observability
**Description:** Deploying to a canary group without real-time metric comparison or automated rollback.
**Why it happens:** Observability infrastructure is immature or not integrated with the deployment pipeline.
**Consequences:** The canary provides no safety benefit — it's just a slow rollout with manual monitoring.
**Remediation:** Implement at minimum error rate and latency comparison before adopting canary deployment.

## AP-CANARY-003: The Eternal Canary
**Description:** Stuck at 5% for days because "we're being careful," never progressing to full rollout.
**Why it happens:** No defined rollout schedule or confidence threshold for progression.
**Consequences:** Most users never get the new features. The codebase splits between versions. Maintaining backward compatibility becomes costly.
**Remediation:** Define time-based or metric-based progression gates. If canary is healthy for X minutes, automatically progress to next stage.
