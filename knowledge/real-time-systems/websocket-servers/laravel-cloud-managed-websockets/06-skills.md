# Skill: Use Laravel Cloud for Managed WebSocket Infrastructure

## Purpose
Deploy real-time Laravel applications on Laravel Cloud using its managed Reverb infrastructure, eliminating operational overhead of self-hosting WebSocket servers.

## When To Use
- New Laravel applications wanting zero-infrastructure WebSocket deployment
- Teams already using Laravel Cloud for hosting
- Prototypes and MVPs needing real-time features without operational overhead
- Applications with variable traffic benefitting from auto-scaling
- Organizations without dedicated DevOps for WebSocket management

## When NOT To Use
- Teams needing full control over Reverb configuration and tuning
- High-volume applications where usage-based pricing may be less cost-effective
- Teams already invested in self-hosted Reverb with operational expertise

## Prerequisites
- Laravel Cloud account
- Application deployed on Laravel Cloud
- Standard broadcasting code (events, channels, Echo)

## Inputs
- Standard Reverb environment variables (`BROADCAST_CONNECTION`, `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`)
- Channel authorization in `routes/channels.php`
- Echo frontend configuration

## Workflow
1. Configure standard Reverb env vars for Laravel Cloud (it reads these automatically)
2. Write broadcasting code as normal — events, channels, Echo
3. Implement channel authorization in `routes/channels.php`
4. Monitor connection usage against plan limits
5. Test geographic latency from target user regions
6. Understand the pricing model (connections, messages, bandwidth)
7. Document a migration plan to self-hosted Reverb if needed

## Validation Checklist
- [ ] Standard Reverb env vars configured for Laravel Cloud
- [ ] Broadcasting code (events, channels, Echo) written as normal
- [ ] Channel authorization implemented
- [ ] Connection usage monitored against plan limits
- [ ] Geographic latency tested for target user regions
- [ ] Pricing model understood
- [ ] Migration plan documented (Laravel Cloud → self-hosted)

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Broadcasting not working on Laravel Cloud | Missing Reverb env vars | Set `BROADCAST_CONNECTION`, `REVERB_APP_ID`, etc. |
| Users can subscribe to any channel | Channel authorization not implemented | Add auth callbacks in `routes/channels.php` |
| Connection throttling at peak traffic | Plan connection limit exceeded | Monitor usage, upgrade plan or optimize |
| Unexpected charges after traffic spike | Usage-based pricing not understood | Review pricing model, set budget alerts |
| Can't migrate off Laravel Cloud easily | No migration plan documented | Document self-hosted Reverb migration steps |

## Decision Points
- **Laravel Cloud vs self-hosted**: Laravel Cloud for zero-ops; self-hosted for cost control and configuration flexibility
- **Plan tier**: Monitor connection and message usage to select appropriate plan

## Performance/Security Considerations
- Edge delivery via Laravel Cloud's global network (lower latency than single-region self-hosted)
- Auto-scaling handles traffic spikes without manual capacity planning
- Platform handles TLS termination and WSS transport security automatically
- Channel authorization remains application's responsibility
- Security patches applied automatically by Laravel Cloud

## Related Rules (from 05-rules.md)
- Always Use Standard Reverb Environment Variables for Laravel Cloud
- Always Monitor Connection Usage Against Plan Limits
- Always Implement Channel Authorization
- Always Test Geographic Latency for Global User Bases
- Always Document a Migration Plan Off Laravel Cloud

## Related Skills
- Configure and Operate Laravel Broadcasting Architecture
- Integrate Pusher Channels for Managed WebSocket Service

## Success Criteria
- Broadcasting works on Laravel Cloud with standard Reverb env vars
- Channel authorization prevents unauthorized subscriptions
- Connection usage is monitored and stays within plan limits
- Geographic latency is acceptable for target user regions
- Migration plan to self-hosted Reverb is documented
