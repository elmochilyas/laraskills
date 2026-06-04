# Skill: Handle Serverless WebSocket Limitations in Laravel

## Purpose
Design real-time features for serverless Laravel (Vapor, Lambda) by pairing with managed WebSocket services (Pusher, Ably, API Gateway) and handling platform-specific constraints.

## When To Use
- Applications already invested in serverless infrastructure (Vapor, Lambda)
- Prototypes and low-traffic applications not warranting self-hosted WebSocket infrastructure
- Applications using managed WebSocket services for global edge delivery

## When NOT To Use
- High-traffic applications with predictable WebSocket loads (self-hosted Reverb is more cost-effective)
- Applications requiring custom WebSocket configuration or protocols
- Bidirectional real-time features requiring client events (limited on some serverless platforms)

## Prerequisites
- Serverless Laravel deployment (Vapor, Lambda, or similar)
- Managed WebSocket service account (Pusher/Ably/API Gateway)
- Understanding of platform-specific limits (idle timeout, message size, concurrency)

## Inputs
- Managed WebSocket service credentials and configuration
- Serverless deployment configuration (e.g., `vapor.yml`)
- Client-side heartbeat and reconnection strategy

## Workflow
1. Select a managed WebSocket service compatible with the serverless platform
2. Configure `BROADCAST_CONNECTION` to Pusher/Ably in serverless environment
3. Set `VAPOR_BROADCAST=true` for Laravel Vapor deployments
4. Implement connection heartbeat (e.g., every 5 min for API Gateway 10-min idle timeout)
5. Design reconnection strategy with extended backoff for cold start latency
6. Keep broadcast payloads under platform message size limits (e.g., 32KB for API Gateway)
7. Document migration path from serverless to self-hosted Reverb
8. Monitor connection limits and usage costs

## Validation Checklist
- [ ] Managed WebSocket service selected (Pusher/Ably/API Gateway)
- [ ] Serverless functions handle auth only, not connection management
- [ ] Connection heartbeat implemented for API Gateway
- [ ] Cold start tested for auth endpoint
- [ ] Reconnection strategy with jitter and backoff configured
- [ ] Message size limits understood and payloads sized accordingly
- [ ] Migration path documented

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Reverb won't deploy on Vapor/Lambda | Reverb requires long-running process | Use Pusher/Ably with VAPOR_BROADCAST=true |
| Connections drop after 10 min idle | API Gateway idle timeout | Implement heartbeat every 5 min |
| Broadcast events silently disappear | Payload exceeds 32KB (API Gateway) | Keep payloads small or switch to Reverb |
| Auth fails during reconnection storm | Cold start adds 500ms+ latency | Use extended backoff with jitter |

## Decision Points
- **Platform choice**: Vapor + Pusher for Laravel-native; API Gateway + Lambda for AWS-native; Cloudflare Workers for edge deployment
- **Managed vs self-hosted**: Managed for serverless simplicity; self-hosted Reverb for cost at scale
- **Heartbeat interval**: Every 5 min for API Gateway (10-min timeout); adjust for other platforms

## Performance/Security Considerations
- API Gateway: 10-min idle timeout, 32KB max message, 5-min Lambda timeout
- Lambda cold starts add ~500ms+ to auth — design reconnection strategy accordingly
- Managed services handle WSS transport security automatically
- Auth tokens must be short-lived and properly signed
- Message publishing via API Gateway `@connections` API: HTTP request per broadcast event

## Related Rules (from 05-rules.md)
- Never Attempt to Run Reverb on Serverless Platforms
- Always Use Managed WebSocket Service with Serverless Laravel
- Always Implement Connection Heartbeat for API Gateway
- Always Account for Cold Start Latency in Auth Endpoint
- Never Exceed API Gateway Message Size Limits
- Always Have a Migration Path from Serverless to Self-Hosted

## Related Skills
- Integrate Pusher Channels for Managed WebSocket Service
- Integrate Ably for Enterprise Real-Time Features
- Configure and Operate Laravel Broadcasting Architecture

## Success Criteria
- Real-time features work on serverless Laravel via managed WebSocket service
- API Gateway connections stay alive via heartbeat
- Broadcast payloads stay within platform message size limits
- Reconnection strategy handles cold start latency
- Migration path to self-hosted Reverb is documented
