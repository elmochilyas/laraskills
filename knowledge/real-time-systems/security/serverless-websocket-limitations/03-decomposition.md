# Decomposition: Serverless Websocket Limitations

## Topic Overview
Serverless platforms (AWS Lambda, Vercel Functions, Cloudflare Workers) have fundamental limitations for WebSocket applications due to their stateless, short-lived execution model. WebSocket connections require persistent state (connection tracking, subscription state, presence data) that serverless functions do not natively support. Workarounds exist: using managed WebSocket services (Pusher, Ably) where the serverless app only handles auth via HTTP functions, or using Cloudflare Workers (wh...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security/K38-serverless-websocket-limitations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Serverless Websocket Limitations
- **Purpose:** Serverless platforms (AWS Lambda, Vercel Functions, Cloudflare Workers) have fundamental limitations for WebSocket applications due to their stateless, short-lived execution model. WebSocket connections require persistent state (connection tracking, subscription state, presence data) that serverless functions do not natively support. Workarounds exist: using managed WebSocket services (Pusher, Ably) where the serverless app only handles auth via HTTP functions, or using Cloudflare Workers (wh...
- **Difficulty:** Intermediate
- **Dependencies:
  - K06: Pusher Channels Integration
  - K07: Ably Integration & Enterprise Features
  - K28: Laravel Cloud Managed WebSockets
  - K04: Reverb Horizontal Scaling via Redis

## Dependency Graph
**Depends on:**
  - K06: Pusher Channels Integration
  - K07: Ably Integration & Enterprise Features
  - K28: Laravel Cloud Managed WebSockets
  - K04: Reverb Horizontal Scaling via Redis

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Managed WebSocket + serverless app**: Use Pusher/Ably for WebSocket; serverless functions for auth and broadcast dispatch**API Gateway WebSocket API**: AWS-native WebSocket management with Lambda backends**Cloudflare Workers as WebSocket relay**: Workers handle WebSocket upgrade and relay to backend services**Stateless auth functions**: Serverless functions only handle authentication; connections managed externally**Offload WebSocket management**: Do not attempt to run Reverb on serverless infrastructure; use managed services**API Gateway for AWS-native**: Tight integration with other AWS services (DynamoDB, Lambda, SQS)**Laravel Vapor + Pusher/Ably**: The recommended architecture for serverless Laravel real-time applications**Managed service cost**: Pusher, Ably, or API Gateway charges for WebSocket connections and messages**Connection limits**: API Gateway's 10-minute idle timeout may disconnect legitimate idle connections**Message size limits**: API Gateway's 32KB limit requires chunking large payloads**Cold start latency**: WebSocket auth on cold Lambda functions adds ~500ms+ to connection setup**No self-hosted control**: Cannot run Reverb on Vapor; must use third-party managed WebSocket serviceAPI Gateway WebSocket: 10-min idle timeout, 32KB max message, 5-min Lambda timeout for backend functionsCloudflare Workers: WebSocket connections count against Worker CPU time limits (30ms free, paid plans more)Lambda cold starts affect initial WebSocket connection latency (auth endpoint)Message publishing via API Gateway `@connections` API: HTTP request per broadcast eventUse Laravel Vapor + Pusher/Ably for serverless Laravel real-time applicationsImplement connection heartbeat to prevent API Gateway idle timeout (send ping every 5 minutes)Design for connection reconnection—serverless auth endpoint may have cold start latencyMonitor API Gateway connection limits and usage costsHave a migration path to self-hosted Reverb if WebSocket requirements outgrow serverless capabilitiesTest cold start behavior for auth endpoint with realistic reconnection scenariosAttempting to run Reverb on Lambda or Vapor (Reverb requires a long-running PHP process)Not accounting for API Gateway idle timeout (connections drop after 10 minutes of inactivity)Exceeding API Gateway 32KB message size limit (messages silently fail)Assuming Cloudflare Workers can run Laravel broadcasting directly (Workers are JavaScript/V8, not PHP)Not testing cold start impact on WebSocket authentication user experience**Idle connection termination**: API Gateway drops connections after 10-min idle timeout; clients silently disconnect**Message size limit hit**: Broadcast payload >32KB; message is dropped by API Gateway**Lambda cold start during reconnection storm**: All clients reconnect simultaneously; cold Lambda function delays auth response, compounding the storm**Connection quota exceeded**: API Gateway connection limit reached (default 500, can be increased via support request)**Provider outage**: Pusher/Ably/API Gateway outage stops all WebSocket delivery; no self-hosted fallbackLaravel Vapor applications using Pusher or Ably for WebSocket deliveryServerless APIs that need real-time push to web/mobile clientsPrototypes and low-traffic applications that don't warrant self-hosted WebSocket infrastructureApplications already heavily invested in serverless infrastructure wanting to minimize operational surface areaCloudflare Workers ecosystem for lightweight WebSocket relay patternsK06: Pusher Channels IntegrationK07: Ably Integration & Enterprise FeaturesK28: Laravel Cloud Managed WebSocketsK04: Reverb Horizontal Scaling via Redis

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