# Decomposition: Laravel Cloud Managed Websockets

## Topic Overview
Laravel Cloud is Laravel's official platform-as-a-service offering that includes fully managed WebSocket infrastructure powered by Laravel Reverb clusters. It eliminates the operational overhead of running Reverb—there is no need to configure Supervisor, Nginx, or process management. Connection scaling is handled automatically. Pricing is based on connections and bandwidth rather than server instances. Deploying a Reverb-enabled application to Laravel Cloud requires minimal configuration be...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K28-laravel-cloud-managed-websockets/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Cloud Managed Websockets
- **Purpose:** Laravel Cloud is Laravel's official platform-as-a-service offering that includes fully managed WebSocket infrastructure powered by Laravel Reverb clusters. It eliminates the operational overhead of running Reverb—there is no need to configure Supervisor, Nginx, or process management. Connection scaling is handled automatically. Pricing is based on connections and bandwidth rather than server instances. Deploying a Reverb-enabled application to Laravel Cloud requires minimal configuration be...
- **Difficulty:** Foundation
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K27: Supervisor & Production Process Management
  - K04: Reverb Horizontal Scaling via Redis
  - K33: Dedicated Reverb Fleet Architecture

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K27: Supervisor & Production Process Management
  - K04: Reverb Horizontal Scaling via Redis
  - K33: Dedicated Reverb Fleet Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Zero-ops WebSocket infrastructure**: No Supervisor, Nginx, or server configuration needed**Automatic scaling**: Connection capacity adjusts based on demand without capacity planning**Unified platform**: Application hosting, queue workers, and WebSocket server in one managed environment**Usage-based pricing**: Pay for connections and bandwidth, not provisioned server capacity**Managed Reverb clusters**: Laravel Cloud runs Reverb internally, abstracting version management, patching, and updates**Platform integration**: Tight integration with Laravel Cloud's deployment pipeline, environment management, and monitoring**Auto-scaling**: Scaling decisions are handled by the platform based on connection metrics and traffic patterns**Platform lock-in**: Managed WebSockets are tied to Laravel Cloud; migrating off requires Reverb self-hosting**Pricing uncertainty**: Usage-based pricing may be less predictable than fixed-cost self-hosting**Less operational control**: Cannot tune Reverb settings beyond what the platform exposes**Limited debugging access**: Reduced visibility into the underlying WebSocket server internals**Emerging service**: As of 2026, Laravel Cloud's managed WebSocket offering is relatively new; production patterns and pricing at scale are still maturingEdge delivery via Laravel Cloud's global network (lower latency than single-region self-hosted)Auto-scaling handles traffic spikes without manual capacity planningBandwidth costs for high-volume applications may exceed self-hosted alternativesConnection limits per plan tier require monitoring and upgrades as usage growsEnsure broadcasting configuration uses standard Reverb environment variables (Laravel Cloud reads these to configure the managed backend)Test connection latency from various geographic regions if user base is globalMonitor connection pricing to avoid unexpected costs from scaling eventsUnderstand the platform's idle timeout and reconnection behaviorConfigure proper channel authorization—the platform handles WebSocket infrastructure, but auth logic remains application responsibilityHave a fallback plan if migrating off Laravel Cloud to self-hosted ReverbAssuming managed WebSockets means no broadcasting configuration needed (auth, channels, Echo still require setup)Not monitoring connection counts against plan limits, causing unexpected throttlingOverlooking geographic latency for global user bases (edge distribution may vary by plan)Not understanding the pricing model for connections vs messages vs bandwidthExpecting the same level of Reverb configuration control as self-hosted deployments**Platform outage**: Laravel Cloud infrastructure issue affects all WebSocket connections globally**Rate limiting**: Managed WebSocket service enforces per-application connection/message limits**Pricing shock**: Unexpected traffic spike leads to high usage-based charges**Configuration limitations**: Platform may not expose advanced Reverb settings needed for specific use cases**Migration complexity**: Moving from managed to self-hosted Reverb requires reconfiguration of deployment and infrastructureNew Laravel applications wanting zero-infrastructure WebSocket deploymentTeams already using Laravel Cloud for hosting, wanting unified platform managementPrototypes and MVPs that need real-time features without operational overheadApplications expecting variable traffic patterns that benefit from auto-scalingOrganizations without dedicated DevOps resources for WebSocket infrastructure managementK03: Reverb Installation & ConfigurationK27: Supervisor & Production Process ManagementK04: Reverb Horizontal Scaling via RedisK33: Dedicated Reverb Fleet Architecture

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization