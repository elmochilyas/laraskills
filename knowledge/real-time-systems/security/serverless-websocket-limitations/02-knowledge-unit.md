# Metadata
Domain: Real-Time Systems
Subdomain: Security
Knowledge Unit: Serverless WebSocket Limitations
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Serverless platforms (AWS Lambda, Vercel Functions, Cloudflare Workers) have fundamental limitations for WebSocket applications due to their stateless, short-lived execution model. WebSocket connections require persistent state (connection tracking, subscription state, presence data) that serverless functions do not natively support. Workarounds exist: using managed WebSocket services (Pusher, Ably) where the serverless app only handles auth via HTTP functions, or using Cloudflare Workers (which support WebSocket connections via the Workers runtime). Amazon API Gateway WebSocket API provides managed WebSocket infrastructure that integrates with Lambda functions. The core limitation is that serverless functions cannot maintain long-lived connections—they must delegate WebSocket state management to an external service.

## Core Concepts
Serverless functions are invoked per-request and have no memory between invocations. WebSocket servers maintain persistent in-memory state across the entire connection lifecycle—tracking connections, subscriptions, and presence. These two models are fundamentally incompatible. The solution is to split the architecture: use serverless functions for broadcast event dispatch (HTTP requests) and a managed WebSocket service (Pusher, Ably, API Gateway) for connection management. The serverless functions authenticate and authorize, then delegate WebSocket delivery to the managed service. Cloudflare Workers are an exception—they support WebSocket connections via the `connect()` and `acceptWebSocket()` APIs within the Worker runtime.

## Mental Models
Serverless WebSocket is like a hotel with no front desk staff for the night shift. The check-in process (auth) works fine during business hours (HTTP functions), but once guests are in their rooms (connections established), there's no one to handle their needs (maintain state / push events).

## Internal Mechanics
AWS API Gateway WebSocket API maintains WebSocket connections as a managed service. Lambda functions handle authentication, authorization, and event broadcasting. The Lambda function publishes messages to API Gateway's `@connections` endpoint, which pushes to connected clients. API Gateway has a 10-minute idle timeout for connections and a 32KB message size limit. Cloudflare Workers can call `event.acceptWebSocket()` inside a fetch handler, and the Worker remains alive as long as the WebSocket is open. Laravel Vapor (serverless Laravel) supports broadcasting through Pusher or Ably as managed WebSocket backends, not through self-hosted Reverb.

## Patterns
- **Managed WebSocket + serverless app**: Use Pusher/Ably for WebSocket; serverless functions for auth and broadcast dispatch
- **API Gateway WebSocket API**: AWS-native WebSocket management with Lambda backends
- **Cloudflare Workers as WebSocket relay**: Workers handle WebSocket upgrade and relay to backend services
- **Stateless auth functions**: Serverless functions only handle authentication; connections managed externally

## Architectural Decisions
- **Offload WebSocket management**: Do not attempt to run Reverb on serverless infrastructure; use managed services
- **API Gateway for AWS-native**: Tight integration with other AWS services (DynamoDB, Lambda, SQS)
- **Laravel Vapor + Pusher/Ably**: The recommended architecture for serverless Laravel real-time applications

## Tradeoffs
- **Managed service cost**: Pusher, Ably, or API Gateway charges for WebSocket connections and messages
- **Connection limits**: API Gateway's 10-minute idle timeout may disconnect legitimate idle connections
- **Message size limits**: API Gateway's 32KB limit requires chunking large payloads
- **Cold start latency**: WebSocket auth on cold Lambda functions adds ~500ms+ to connection setup
- **No self-hosted control**: Cannot run Reverb on Vapor; must use third-party managed WebSocket service

## Performance Considerations
- API Gateway WebSocket: 10-min idle timeout, 32KB max message, 5-min Lambda timeout for backend functions
- Cloudflare Workers: WebSocket connections count against Worker CPU time limits (30ms free, paid plans more)
- Lambda cold starts affect initial WebSocket connection latency (auth endpoint)
- Message publishing via API Gateway `@connections` API: HTTP request per broadcast event

## Production Considerations
- Use Laravel Vapor + Pusher/Ably for serverless Laravel real-time applications
- Implement connection heartbeat to prevent API Gateway idle timeout (send ping every 5 minutes)
- Design for connection reconnection—serverless auth endpoint may have cold start latency
- Monitor API Gateway connection limits and usage costs
- Have a migration path to self-hosted Reverb if WebSocket requirements outgrow serverless capabilities
- Test cold start behavior for auth endpoint with realistic reconnection scenarios

## Common Mistakes
- Attempting to run Reverb on Lambda or Vapor (Reverb requires a long-running PHP process)
- Not accounting for API Gateway idle timeout (connections drop after 10 minutes of inactivity)
- Exceeding API Gateway 32KB message size limit (messages silently fail)
- Assuming Cloudflare Workers can run Laravel broadcasting directly (Workers are JavaScript/V8, not PHP)
- Not testing cold start impact on WebSocket authentication user experience

## Failure Modes
- **Idle connection termination**: API Gateway drops connections after 10-min idle timeout; clients silently disconnect
- **Message size limit hit**: Broadcast payload >32KB; message is dropped by API Gateway
- **Lambda cold start during reconnection storm**: All clients reconnect simultaneously; cold Lambda function delays auth response, compounding the storm
- **Connection quota exceeded**: API Gateway connection limit reached (default 500, can be increased via support request)
- **Provider outage**: Pusher/Ably/API Gateway outage stops all WebSocket delivery; no self-hosted fallback

## Ecosystem Usage
- Laravel Vapor applications using Pusher or Ably for WebSocket delivery
- Serverless APIs that need real-time push to web/mobile clients
- Prototypes and low-traffic applications that don't warrant self-hosted WebSocket infrastructure
- Applications already heavily invested in serverless infrastructure wanting to minimize operational surface area
- Cloudflare Workers ecosystem for lightweight WebSocket relay patterns

## Related Knowledge Units
- K06: Pusher Channels Integration
- K07: Ably Integration & Enterprise Features
- K28: Laravel Cloud Managed WebSockets
- K04: Reverb Horizontal Scaling via Redis

## Research Notes
Serverless WebSocket is an active area of platform development. AWS announced WebSocket support for API Gateway in 2018. Cloudflare Workers added WebSocket support in 2019. Laravel Vapor (serverless Laravel) supports Pusher and Ably but not self-hosted Reverb. The architectural consensus: do not try to run WebSocket servers on serverless platforms that don't natively support persistent connections. As of 2026, no mainstream serverless PHP platform supports running Reverb natively. The trend is toward managed WebSocket services (Pusher, Ably, Laravel Cloud) rather than serverless self-hosted WebSocket. Cloudflare's Durable Objects (sticky) provide a stateful serverless model that can maintain WebSocket state, but this requires JavaScript Workers, not PHP.
