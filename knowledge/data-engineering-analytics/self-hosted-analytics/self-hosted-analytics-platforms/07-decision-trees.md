# Decision Trees: Self-Hosted Analytics Platforms

## Decision: Platform Selection

**Q: What is the primary analytics need?**
- Basic metrics (page views, visitors, bounce rate) → Plausible
- Full GA4 replacement (funnels, goals, heatmaps) → Matomo
- Product analytics (events, feature flags, session recording) → PostHog
- Unsure → Start with Plausible; migrate if needs grow

**Q: What is the team's infrastructure capacity?**
- Low / No dedicated ops → Plausible (simplest, lightest)
- Moderate → Matomo (well-documented, standard LAMP stack)
- High → PostHog (complex, resource-intensive, but most capable)

**Q: Is GDPR compliance a primary concern?**
- Yes → Plausible (privacy-first by design) or Matomo (configurable)
- No → Any platform works

**Q: What budget is available for infrastructure?**
- $0-100/month → Plausible self-hosted on cheapest VPS
- $100-500/month → Matomo self-hosted
- $500+/month → PostHog self-hosted or cloud

## Decision: Reverse Proxy Strategy

**Q: Is there a web server (Nginx/Caddy) in front of Laravel?**
- Yes → Configure reverse proxy at web server level (most efficient)
- No → Implement proxy routes in Laravel application

## Decision: Infrastructure Placement

**Q: Is this production or staging/development?**
- Production → Dedicated server/VM, separate database, monitoring
- Staging/Dev → Docker Compose on shared server, minimal resources
