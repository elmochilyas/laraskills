# Anti-Patterns: Laravel Reverb WebSocket Broadcasting

## Broadcasting Raw Eloquent Models
Eloquent models are serialized as broadcast event data. The broadcast exposes all model attributes, including internal fields and sensitive columns.

**Solution:** Use dedicated event DTOs that control exactly what is broadcast.

## Public Channels for Analytics Data
Dashboard metrics are broadcast on public channels. Anyone who knows the channel name can receive real-time revenue data.

**Solution:** Use private channels with authorization. Implement access control per channel.

## Single Server for All Connections
Reverb runs on a single server without scaling plan. When connection count exceeds capacity, the server becomes unresponsive.

**Solution:** Plan horizontal scaling from the start. Monitor connection counts and add instances proactively.

## No Authorization for Private Channels
The broadcast/auth endpoint returns true for all requests. Private channels are effectively public.

**Solution:** Implement proper authorization logic. Verify the authenticated user has access to the channel resource.

## Broadcasting at Too High Frequency
Each database write triggers a broadcast event. High-throughput analytics pipelines broadcast 1000+ events/second, overwhelming Reverb and clients.

**Solution:** Batch broadcasts. Throttle to maximum 1-10 broadcasts/second per dashboard. Use aggregation before broadcasting.
