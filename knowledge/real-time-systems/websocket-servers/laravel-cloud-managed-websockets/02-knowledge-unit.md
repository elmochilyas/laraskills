# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Laravel Cloud Managed WebSockets
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Laravel Cloud is Laravel's official platform-as-a-service offering that includes fully managed WebSocket infrastructure powered by Laravel Reverb clusters. It eliminates the operational overhead of running Reverb—there is no need to configure Supervisor, Nginx, or process management. Connection scaling is handled automatically. Pricing is based on connections and bandwidth rather than server instances. Deploying a Reverb-enabled application to Laravel Cloud requires minimal configuration beyond standard Laravel deployment. The platform handles TLS termination, load balancing, and Reverb cluster management transparently.

## Core Concepts
Laravel Cloud abstracts the entire WebSocket infrastructure layer. Developers write standard Laravel broadcasting code (events, channels, Echo) and Laravel Cloud provides the Reverb backend automatically. The platform scales Reverb instances up/down based on connection demand without manual intervention. Environment configuration is simplified—no need to configure `REVERB_SERVER_HOST`, `REVERB_SERVER_PORT`, or Supervisor configuration files. Laravel Cloud provides a dashboard for monitoring WebSocket connection counts, message throughput, and error rates.

## Mental Models
Laravel Cloud is "serverless Reverb." You bring the Laravel broadcasting code, and Laravel Cloud provides the WebSocket infrastructure. The platform manages everything from TLS to scaling to process monitoring.

## Internal Mechanics
When a Laravel application is deployed to Laravel Cloud with broadcasting enabled, the platform provisions Reverb clusters behind its global load balancer. The Laravel application's queue workers handle broadcast event dispatch, which reach the Reverb cluster through Laravel Cloud's internal networking. The platform manages the Reverb processes, TLS termination at the edge, and sticky session routing. Connection metrics are collected automatically and available in the Laravel Cloud dashboard.

## Patterns
- **Zero-ops WebSocket infrastructure**: No Supervisor, Nginx, or server configuration needed
- **Automatic scaling**: Connection capacity adjusts based on demand without capacity planning
- **Unified platform**: Application hosting, queue workers, and WebSocket server in one managed environment
- **Usage-based pricing**: Pay for connections and bandwidth, not provisioned server capacity

## Architectural Decisions
- **Managed Reverb clusters**: Laravel Cloud runs Reverb internally, abstracting version management, patching, and updates
- **Platform integration**: Tight integration with Laravel Cloud's deployment pipeline, environment management, and monitoring
- **Auto-scaling**: Scaling decisions are handled by the platform based on connection metrics and traffic patterns

## Tradeoffs
- **Platform lock-in**: Managed WebSockets are tied to Laravel Cloud; migrating off requires Reverb self-hosting
- **Pricing uncertainty**: Usage-based pricing may be less predictable than fixed-cost self-hosting
- **Less operational control**: Cannot tune Reverb settings beyond what the platform exposes
- **Limited debugging access**: Reduced visibility into the underlying WebSocket server internals
- **Emerging service**: As of 2026, Laravel Cloud's managed WebSocket offering is relatively new; production patterns and pricing at scale are still maturing

## Performance Considerations
- Edge delivery via Laravel Cloud's global network (lower latency than single-region self-hosted)
- Auto-scaling handles traffic spikes without manual capacity planning
- Bandwidth costs for high-volume applications may exceed self-hosted alternatives
- Connection limits per plan tier require monitoring and upgrades as usage grows

## Production Considerations
- Ensure broadcasting configuration uses standard Reverb environment variables (Laravel Cloud reads these to configure the managed backend)
- Test connection latency from various geographic regions if user base is global
- Monitor connection pricing to avoid unexpected costs from scaling events
- Understand the platform's idle timeout and reconnection behavior
- Configure proper channel authorization—the platform handles WebSocket infrastructure, but auth logic remains application responsibility
- Have a fallback plan if migrating off Laravel Cloud to self-hosted Reverb

## Common Mistakes
- Assuming managed WebSockets means no broadcasting configuration needed (auth, channels, Echo still require setup)
- Not monitoring connection counts against plan limits, causing unexpected throttling
- Overlooking geographic latency for global user bases (edge distribution may vary by plan)
- Not understanding the pricing model for connections vs messages vs bandwidth
- Expecting the same level of Reverb configuration control as self-hosted deployments

## Failure Modes
- **Platform outage**: Laravel Cloud infrastructure issue affects all WebSocket connections globally
- **Rate limiting**: Managed WebSocket service enforces per-application connection/message limits
- **Pricing shock**: Unexpected traffic spike leads to high usage-based charges
- **Configuration limitations**: Platform may not expose advanced Reverb settings needed for specific use cases
- **Migration complexity**: Moving from managed to self-hosted Reverb requires reconfiguration of deployment and infrastructure

## Ecosystem Usage
- New Laravel applications wanting zero-infrastructure WebSocket deployment
- Teams already using Laravel Cloud for hosting, wanting unified platform management
- Prototypes and MVPs that need real-time features without operational overhead
- Applications expecting variable traffic patterns that benefit from auto-scaling
- Organizations without dedicated DevOps resources for WebSocket infrastructure management

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K27: Supervisor & Production Process Management
- K04: Reverb Horizontal Scaling via Redis
- K33: Dedicated Reverb Fleet Architecture

## Research Notes
Laravel Cloud's managed WebSocket offering was launched as part of the Laravel Cloud platform (late 2024/early 2025). As of 2026, it is still emerging with maturing best practices. The managed Reverb infrastructure is distinct from self-hosted Reverb on Laravel Forge (where you still manage the server). The key differentiator from Forge deployments is the elimination of server-level configuration—no Supervisor, no Nginx WebSocket proxy configuration. Pricing details and capacity limits are available through Laravel Cloud's pricing page. The managed WebSocket offering makes Laravel competitive with platforms like Vercel (for SSE) and Railway (for basic WebSocket support).
