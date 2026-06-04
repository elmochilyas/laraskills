# Decision Trees: Laravel Reverb WebSocket Broadcasting

## Decision: Channel Type

**Q: Does the data need authentication?**
- Yes → Private channel
- No → Public channel (only for non-sensitive data)

**Q: Does the feature show who is connected?**
- Yes → Presence channel
- No → Private channel is sufficient

## Decision: Scaling Strategy

**Q: Expected concurrent connections?**
- < 10K → Single Reverb instance
- 10K-50K → 2-3 Reverb instances with Redis backbone
- 50K+ → Horizontal scaling with dedicated Redis cluster
