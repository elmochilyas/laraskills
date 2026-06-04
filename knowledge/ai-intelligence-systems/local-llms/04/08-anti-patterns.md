# Anti-Patterns: Offline & Air-Gapped Deployment

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-04 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLMs |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Hope-Based Deployment](#1-hope-based-deployment)
2. [Sneakernet for Every Update](#2-sneakernet-for-every-update)
3. [No Monitoring for Air-Gapped Systems](#3-no-monitoring-for-air-gapped-systems)
4. [Single Point of Failure in Offline Stack](#4-single-point-of-failure-in-offline-stack)
5. [Stale Dependencies in Air-Gapped Environments](#5-stale-dependencies-in-air-gapped-environments)

---

## 1. Hope-Based Deployment

### Category
Deployment Reliability Failure

### Description
Deploying an AI system to an air-gapped environment without fully testing that all components work offline. The team assumes—hopes—that everything will work because it works on their internet-connected development machines. Inevitably, a dependency requires internet access (telemetry, license check, model download) and the deployment fails, requiring physical media transfer to fix.

### Why It Happens
- Air-gapped testing is difficult (requires dedicated offline sandbox)
- Development happens on internet-connected machines (convenience)
- Assumption that "it's all local" means no external dependencies
- Lack of full dependency inventory before deployment
- Time pressure to ship, skipping thorough offline validation

### Warning Signs
- No offline sandbox environment exists for testing
- Deployment dependencies are not fully inventoried
- Team has never tested the full system with internet disabled
- Model download is expected to happen "at deployment time"
- Docker images are pulled from the internet during deploy
- Telemetry or license check calls are not identified

### Why Harmful
- Deployment fails, requiring emergency fix via physical media (days delay)
- System partially works but crashes when certain code paths execute
- Security/compliance violation if system unexpectedly calls out to the internet
- No confidence that the system will work after deployment
- Emergency fixes require physical access to the air-gapped environment

### Real-World Consequences
- 2-week deployment delay because a Composer package required internet for post-install script
- Inference server crashes after 1 hour due to failed telemetry phone-home
- Model not pre-downloaded, deployment team must ship USB drive
- Application works but monitoring fails because Prometheus can't reach external NTP

### Preferred Alternative
Test the full deployment in a sandbox that mirrors the air-gapped environment: no internet access, same hardware, same network configuration. Inventorize every dependency before deployment. Verify no component makes unapproved external calls.

### Refactoring Strategy
1. Create an offline sandbox that mirrors the target air-gapped environment
2. Test the full deployment in the sandbox with internet disabled
3. Inventorize all dependencies: packages, images, models, system libraries
4. Verify no telemetry, license checks, or external calls exist
5. Document the deployment procedure step-by-step

### Detection Checklist
- [ ] Offline sandbox exists for pre-deployment testing
- [ ] Full dependency inventory is documented
- [ ] No component makes unapproved external calls
- [ ] Deployment procedure is tested in air-gapped conditions

### Related Rules/Skills/Trees
- Skill: Implement Offline & Air-Gapped Deployment

---

## 2. Sneakernet for Every Update

### Category
Operational Inefficiency

### Description
Requiring physical media transfer (USB drives, shipped hard drives) for every minor update to the air-gapped system. Configuration changes, prompt updates, dependency patches, and model tweaks all require physical access, causing update cycles of days or weeks instead of minutes. This discourages updates and leaves the system outdated.

### Why It Happens
- Air-gapped deployment designed without an update strategy
- No local package registry or artifact repository
- Every dependency change treated as equally difficult
- No automated update pipeline for the air-gapped environment
- "It's air-gapped, updates are hard" accepted as inevitable

### Warning Signs
- Minor prompt changes require physical media transfer
- Bug fixes take weeks to reach the air-gapped system
- Team batches updates into quarterly releases (too many changes per release)
- No local mirror of package registries (Composer, npm, Docker)
- Update process is manual and undocumented

### Why Harmful
- Security patches take weeks to apply
- Bug fixes are delayed, affecting operations
- Team avoids making necessary changes because the update process is painful
- Large batched updates increase risk (many changes deployed at once)
- Model improvements (new quantizations, fine-tunes) are delayed

### Real-World Consequences
- Critical security patch takes 3 weeks to deploy (physical media delay)
- Prompt optimization that improves accuracy by 15% sits on a shelf for 2 months
- Bug fix for production issue requires 2-week update cycle
- Model update available for 6 months, not deployed because "it's too hard"

### Preferred Alternative
Establish a local package registry and update pipeline. Set up local mirrors for all dependencies (Composer, npm, Docker). Design a process for frequent, small updates. Batch only low-risk changes; ship urgent fixes independently.

### Refactoring Strategy
1. Set up local package registries (Composer Satis, Docker registry, model repository)
2. Create a deployment artifact that can be transferred as a single package
3. Design update process for different change types: urgent (fast-track), scheduled (weekly), major (quarterly)
4. Automate artifact generation so updates are "download and deploy"
5. Document the update procedure for each change type

### Detection Checklist
- [ ] Local package registries exist for all dependency types
- [ ] Updates can be deployed as single artifacts
- [ ] Update process is documented for different change types
- [ ] Urgent updates can bypass batch cycles

### Related Rules/Skills/Trees
- Skill: Implement Offline & Air-Gapped Deployment

---

## 3. No Monitoring for Air-Gapped Systems

### Category
Operational Blindness

### Description
Assuming that air-gapped systems don't need monitoring because they're isolated from the internet. The team deploys the system without metrics collection, alerting, or dashboards, treating the air-gapped deployment as "fire and forget." When problems occur, there's no data to diagnose them, and no alerts notify the team.

### Why It Happens
- "No internet = no monitoring" false equivalence
- Cloud-based monitoring (Datadog, Sentry) doesn't work in air-gapped environments
- No experience setting up on-premise monitoring
- Assumption that air-gapped systems are stable (they're not)
- Monitoring is an afterthought for isolated deployments

### Warning Signs
- No monitoring infrastructure in the air-gapped environment
- No metrics collected: CPU, memory, disk, request latency
- Crash detection relies on users reporting problems
- No alerting for any failure mode
- Team has no visibility into system health post-deployment
- "It's air-gapped, so it should just work" mindset

### Why Harmful
- System failures go undetected for hours or days
- No data to diagnose performance degradation
- Crash loops waste compute resources without notification
- Cannot plan capacity upgrades without usage data
- Debugging requires physical access to the isolated environment

### Real-World Consequences
- Inference server crashed 3 days ago, nobody noticed
- Disk filled with logs, system went down, discovered by user complaint
- Memory leak causes weekly crashes, no data to identify the pattern
- Capacity planning impossible: no metrics on request volume or latency

### Preferred Alternative
Deploy a local monitoring stack in the air-gapped environment: Prometheus for metrics collection, Grafana for dashboards, Alertmanager for alerting. All monitoring runs 100% on-premise with no external dependencies.

### Refactoring Strategy
1. Deploy Prometheus + Grafana + Alertmanager in the air-gapped environment
2. Instrument the application to expose metrics (request count, latency, errors)
3. Monitor inference server: memory, GPU utilization, response time
4. Configure alerts for: crash, high latency, low disk space, OOM risk
5. Create a dashboard for system health overview

### Detection Checklist
- [ ] Local monitoring stack is deployed (Prometheus + Grafana)
- [ ] Application metrics are collected and visible
- [ ] Alerts exist for critical failure modes
- [ ] Team can access monitoring without internet

### Related Rules/Skills/Trees
- Skill: Implement Offline & Air-Gapped Deployment

---

## 4. Single Point of Failure in Offline Stack

### Category
Resilience Failure

### Description
Running the entire AI stack (inference server, vector DB, application server) as single instances in the air-gapped environment. When any component fails, the entire AI system is unavailable. Unlike cloud deployments where replacement instances can be spun up in seconds, air-gapped environments have no automatic recovery and no spare capacity.

### Why It Happens
- Hardware constraints: limited servers in air-gapped environments
- Cost: redundancy doubles hardware requirements
- Complexity: distributed systems are harder to deploy offline
- "It won't fail" optimism
- No fault tolerance requirements specified

### Warning Signs
- Single instance for each service (inference, vector DB, cache)
- No failover or standby instances
- Hardware failure means complete AI feature loss
- Recovery requires physical access and manual intervention
- No spare hardware available in the environment

### Why Harmful
- Any component failure takes down AI features
- Recovery time measured in days (physical access required)
- No redundancy for critical path components
- Hardware failure during operations (field work, remote location) is catastrophic
- Cannot perform maintenance without downtime

### Real-World Consequences
- GPU failure takes down inference server; 3-day replacement cycle
- Vector DB corruption requires restore from backup; no standby instance
- Disk failure on inference server requires complete redeployment
- Software update causes crash; no canary deployment possible

### Preferred Alternative
Design for high availability even in air-gapped environments. Run at least 2 instances of critical components. Use load balancing and failover. Maintain spare hardware for field deployments.

### Refactoring Strategy
1. Identify critical components: inference server, vector DB, application server, cache
2. Deploy at least 2 instances of each critical component
3. Implement health checks and automatic failover
4. Maintain spare hardware on-site for field deployments
5. Document recovery procedures for each component failure

### Detection Checklist
- [ ] Critical components have redundancy (≥2 instances)
- [ ] Automatic failover is configured
- [ ] Spare hardware is available on-site
- [ ] Recovery procedures are documented and tested

### Related Rules/Skills/Trees
- Skill: Implement Offline & Air-Gapped Deployment
- Decision Tree: Reliability & Error Handling

---

## 5. Stale Dependencies in Air-Gapped Environments

### Category
Security & Maintenance Debt

### Description
Never updating dependencies (Composer packages, Docker images, model files, system libraries) in the air-gapped environment because the update process is painful. Over time, the system accumulates unpatched security vulnerabilities, unsupported software versions, and model quality that falls behind the state of the art.

### Why It Happens
- Each update requires physical media transfer (high friction)
- "If it works, don't touch it" mentality is stronger for air-gapped systems
- No automated update pipeline
- Update process requires on-site personnel
- Team has competing priorities and updates are deprioritized
- No vulnerability scanning for air-gapped dependencies

### Warning Signs
- Dependencies are 1+ years out of date
- Known CVEs in the dependency tree are not patched
- Model is 3+ months behind latest release
- PHP or Laravel version is unsupported
- Team cannot remember when dependencies were last updated
- No package version tracking for air-gapped deployments

### Why Harmful
- Unpatched security vulnerabilities in an air-gapped system (still exploitable via physical access or USB)
- Bug fixes and performance improvements are missing
- Model quality falls behind newer releases
- Framework or language upgrades become increasingly difficult over time
- When an emergency update is finally needed, it's a major migration

### Real-World Consequences
- Laravel security patch for critical RCE not applied for 8 months
- Model from 2023 used in production; 2024 models are significantly better
- PHP 8.1 end-of-life; system running unsupported version
- Docker image contains critical OS-level vulnerabilities

### Preferred Alternative
Establish a scheduled update cadence for air-gapped dependencies. Maintain local mirrors for all registries. Automate artifact generation. Apply security patches on a accelerated schedule. Track dependency versions and vulnerabilities.

### Refactoring Strategy
1. Set up local mirrors for all dependency registries
2. Create a scheduled update cadence: critical (1 week), regular (monthly), major (quarterly)
3. Automate vulnerability scanning on mirrored dependencies
4. Automate artifact generation so updates are "download and apply"
5. Track dependency versions in a manifest file

### Detection Checklist
- [ ] Dependency update cadence exists and is followed
- [ ] Security patches are applied within 1 week
- [ ] Local mirrors are updated regularly
- [ ] Dependency versions are tracked and vulnerability-scanned
