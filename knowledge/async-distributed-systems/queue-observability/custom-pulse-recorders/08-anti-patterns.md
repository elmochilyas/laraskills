---
Domain: Async & Distributed Systems
Subdomain: Queue Observability
Knowledge Unit: K072 — Custom Pulse Recorders for Queue Depth
Knowledge ID: K072
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Recording Too Frequently (Sub-Second) | Performance | Medium |
| 2 | Not Handling Redis Failures in Recorder | Operations | Medium |
| 3 | Hardcoding Queue Names in Recorder | Architecture | Low |
| 4 | No Dashboard Card Registered | Implementation | Medium |
| 5 | Slow `record()` Method (> 10ms) | Performance | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Excessive Recording Frequency | Medium — Pulse storage fills rapidly | Use 15-60s sampling intervals |
| Recorder Crash Takes Down Pulse | Medium — one recorder's failure stops all | Wrap recorder logic in try-catch |
| Hardcoded Queue Topology | Low — code change required for new queues | Read queue names from config |

---

## 1. Recording Too Frequently (Sub-Second)

### Category
Performance

### Description
Recording metrics (queue depth, worker count) on every request or at sub-second intervals. Pulse is designed for aggregation at 10-60 second granularity — recording every request generates thousands of writes per minute for metrics that change slowly.

### Why It Happens
- Not understanding Pulse's aggregation model (it buckets data, not stores every sample)
- Using event-driven recording instead of scheduled sampling
- Assuming more data points = better accuracy (Pulse aggregates regardless)
- Not profiling Pulse write volume
- "I want real-time queue depth" — Pulse is not a real-time system

### Warning Signs
- Custom recorder fires on every HTTP request
- Queue depth recorder has no sampling interval
- `Pulse::record()` called thousands of times per minute
- Pulse storage grows rapidly
- "Our Pulse dashboard is slow" — too many writes
- Recorder uses event listeners instead of scheduled callbacks

### Why Harmful
The queue depth recorder records on every request: 100 requests/second = 100 writes/second. Queue depth changes slowly (minutes to hours). 99.99% of writes are recording the same value. Pulse is designed for bucketed aggregation — storing every sample is wasted storage and write bandwidth. The Pulse dashboard itself slows down from the write load.

### Consequences
- Pulse storage fills rapidly (increased Redis/DB memory usage)
- Pulse dashboard performance degrades from write contention
- No information gain: 60 samples/minute provides the same insight as 6,000
- Infrastructure cost: more storage, more writes
- Write load contributes to Redis/DB bottleneck

### Alternative
- Use scheduled sampling with 15-60 second intervals:
  ```php
  class QueueDepthRecorder
  {
      public function register(): void
      {
          Schedule::everyThirtySeconds()->call(fn () => $this->record());
      }
  }
  ```
- For scheduler-based recorders, set `sample_rate` in config to control frequency
- Read queue depth on a timer, not on every request

### Refactoring Strategy
1. Audit custom recorder: event-driven or timer-based?
2. Convert to scheduled sampling (every 30 seconds)
3. Remove any per-request recording for gauge metrics (queue depth, worker count)
4. Set appropriate `sample_rate` in config
5. Monitor Pulse write volume — expect 95%+ reduction

### Detection Checklist
- [ ] Recorder uses scheduling (not per-event recording) for gauge metrics
- [ ] Sampling interval is 15-60 seconds
- [ ] Pulse write volume is appropriate for the metric type
- [ ] No per-request recording for slowly-changing metrics
- [ ] Dashboard still shows accurate trends with reduced frequency

### Related Rules
- keep-recorder-records-lightweight, avoid-recording-on-every-request

### Related Skills
- Build Custom Pulse Recorders for Queue Observability

### Related Decision Trees
- Custom Pulse Recorder vs Built-in Horizon Metrics

---

## 2. Not Handling Redis Failures in Recorder

### Category
Operations

### Description
Writing a custom Pulse recorder that accesses Redis (e.g., for queue depth via `LLEN`) without wrapping in a try-catch. If Redis fails, the unhandled exception crashes Pulse's entire recording pipeline, preventing all other recorders from running.

### Why It Happens
- Assuming Redis always responds
- Not considering that Redis can fail or be unreachable
- Not knowing that Pulse runs recorders sequentially — one crash stops all
- Not testing what happens when Redis is down
- "Redis has never failed" — until it does

### Warning Signs
- Recorder reads Redis directly without error handling
- Pulse dashboard goes blank when Redis is down
- "Pulse is down" — actually just one recorder crashed the pipeline
- Error log: unhandled exception in custom recorder
- No monitoring for recorder failures

### Why Harmful
Redis becomes unavailable for 10 seconds during a failover. The custom queue depth recorder calls `Redis::llen('queues:default')` which throws an exception. Pulse's recording pipeline is sequential — the exception propagates and stops all subsequent recorders from running. Pulse's built-in recorders (slow jobs, request timing) also stop recording. The entire Pulse dashboard freezes because one custom recorder didn't handle a Redis failure.

### Consequences
- Pulse dashboard goes blank during Redis disruption
- All Pulse metrics stop recording (not just the custom one)
- Monitoring blackout during incident (worst possible timing)
- Engineers lose Pulse observability while troubleshooting the Redis issue
- Recovery time increased: restart Pulse or wait for Redis to come back

### Alternative
- Wrap all external calls in try-catch:
  ```php
  public function record(): void
  {
      try {
          $depth = Redis::llen('queues:default');
          Pulse::record('queue_depth', 'default', $depth);
      } catch (Throwable $e) {
          Log::warning('Queue depth recorder failed', [
              'error' => $e->getMessage(),
          ]);
          // Don't rethrow — Pulse pipeline continues
      }
  }
  ```
- Log the error but never let it propagate
- Monitor recorder failure rate separately

### Refactoring Strategy
1. Audit all custom recorders for unhandled exceptions
2. Add try-catch around all external calls (Redis, DB, HTTP)
3. Log failures but do NOT rethrow
4. Monitor: recorder failure rate — alert if > 0
5. Test: simulate Redis failure — verify Pulse continues recording

### Detection Checklist
- [ ] All external calls in recorders wrapped in try-catch
- [ ] Recorder exceptions logged (not swallowed silently)
- [ ] Exceptions do NOT propagate to Pulse pipeline
- [ ] Pulse continues recording when one recorder fails
- [ ] Recorder failure rate monitored

### Related Rules
- keep-recorder-records-lightweight

### Related Skills
- Build Custom Pulse Recorders for Queue Observability

### Related Decision Trees
- Custom Pulse Recorder vs Built-in Horizon Metrics

---

## 3. Hardcoding Queue Names in Recorder

### Category
Architecture

### Description
Hardcoding queue names (e.g., `queues:default`, `queues:webhooks`) directly in the Pulse recorder code. When the queue topology changes (new queues added, renamed, removed), the recorder requires a code change and deploy to update.

### Why It Happens
- Starting with a fixed set of queues
- Not anticipating queue topology evolution
- Using string literals instead of configuration
- "We only have three queues" — for now
- Not extracting queue monitoring configuration

### Warning Signs
- Queue names hardcoded in recorder class
- Adding a new queue requires modifying and deploying the recorder
- Recorder has a list of queue names as string constants
- Ops team cannot add a queue to monitoring without developer involvement
- "We need to monitor the new `priority` queue — please update the recorder code"

### Why Harmful
An ops team adds a new `priority` queue to handle urgent customer requests. They configure it in Horizon but the custom Pulse recorder only monitors `default`, `webhooks`, and `emails` (hardcoded). The new queue's depth, processing rate, and failure rate are invisible in Pulse. The ops team doesn't notice when the `priority` queue backs up because it's not in the monitoring configuration. A code change is required to add the new queue — which goes through a deploy pipeline that takes 30 minutes.

### Consequences
- New queues are invisible in Pulse monitoring until code is updated
- Ops team depends on developers for monitoring configuration
- Delayed detection of issues in new queues
- Configuration drift: Horizon knows about queues, Pulse doesn't
- Deploy cycle required for monitoring changes
- Human error: deploying monitoring update may affect other recorder behavior

### Alternative
- Read queue names from configuration:
  ```php
  class QueueDepthRecorder
  {
      public function record(): void
      {
          foreach (config('queue.monitored_queues', []) as $queue) {
              $depth = Redis::llen("queues:{$queue}");
              Pulse::record('queue_depth', $queue, $depth);
          }
      }
  }
  ```
- Or read from Horizon's supervisor configuration
- Or use environment variable for queue list

### Refactoring Strategy
1. Audit recorders for hardcoded queue names
2. Extract queue names to config file (e.g., `config/queue-monitoring.php`)
3. Update recorder to read from config
4. Update deploy process: config change for new queues (not code change)
5. Document: adding a queue to monitoring = config update

### Detection Checklist
- [ ] Queue names read from configuration (not hardcoded)
- [ ] Adding a new queue requires config change only
- [ ] Ops team can add queue to monitoring without code deploy
- [ ] Configuration matches actual queue topology
- [ ] No hardcoded strings in recorder for queue names

### Related Rules
- name-recorders-descriptively

### Related Skills
- Build Custom Pulse Recorders for Queue Observability

### Related Decision Trees
- Custom Pulse Recorder vs Built-in Horizon Metrics

---

## 4. No Dashboard Card Registered

### Category
Implementation

### Description
Creating a custom Pulse recorder but forgetting to register the corresponding Livewire dashboard card. The metric is collected and stored but never displayed — the data exists in Pulse storage but is invisible to operators.

### Why It Happens
- Focusing only on the recording side of Pulse
- Not reading the full Pulse documentation about dashboard cards
- Thinking Pulse automatically shows all recorded metrics (it only shows registered cards)
- Copying a recorder example without the dashboard card registration
- "I can see the data in Pulse" — no, you need a card

### Warning Signs
- Custom recorder class is complete but no Pulse card is visible
- `Pulse::record()` calls happen but metric doesn't appear in dashboard
- Config files show recorder registration but no card entry
- "I know the data is there because I can query it directly" — but dashboard doesn't show it
- Operator asks "where do I see queue depth in Pulse?"

### Why Harmful
A custom queue depth recorder collects data every 30 seconds for 2 weeks. The operations team asks "can we see queue depth in Pulse?" — yes, the data has been collected for 14 days. But no card was registered to display it. The data exists in Pulse storage but is invisible. The team must build a dashboard card retroactively, potentially regenerating the card for past data. Two weeks of valuable monitoring data was invisible to the people who needed it.

### Consequences
- Data collected but invisible in dashboard
- Operators cannot see the metric they intended to monitor
- Development effort wasted: recorder works but provides no value
- Retroactive card registration needed
- Operators may build alternative monitoring (wasted duplicate effort)
- Team perception: "Pulse doesn't show that metric" — but it does, just no card

### Alternative
- Always register dashboard card alongside recorder:
  ```php
  // config/pulse.php
  'recorders' => [
      App\Recorders\QueueDepthRecorder::class => [],
  ],
  
  'cards' => [
      App\Livewire\QueueDepthCard::class,
  ],
  ```
- Test: after implementing recorder, verify card appears in Pulse dashboard
- Document both recorder and card in a single PR

### Refactoring Strategy
1. Audit custom recorders without corresponding cards
2. Create Livewire component for each recorder
3. Register card in `config/pulse.php`
4. Verify card appears in Pulse dashboard
5. Confirm data is displayed correctly

### Detection Checklist
- [ ] Every custom recorder has a registered dashboard card
- [ ] Card appears in Pulse dashboard
- [ ] Card displays the recorded metric correctly
- [ ] No data collected without corresponding visualization
- [ ] Recorder + card included in same implementation PR

### Related Rules
- name-recorders-descriptively

### Related Skills
- Build Custom Pulse Recorders for Queue Observability

### Related Decision Trees
- Custom Pulse Recorder vs Built-in Horizon Metrics

---

## 5. Slow `record()` Method (> 10ms)

### Category
Performance

### Description
Writing a Pulse recorder whose `record()` method takes more than 10ms to execute. Pulse recorders run on every request by default (or on scheduled ticks) — slow recorders degrade page load times and Pulse dashboard performance.

### Why It Happens
- Recorder performs heavy database queries (joins, aggregations)
- Recorder makes external HTTP API calls
- Recorder loads full Eloquent models instead of using raw queries
- Not considering that `record()` runs frequently
- "The query is fast in the database" — fast in isolation, slow when called on every request

### Warning Signs
- `record()` method uses Eloquent with eager loading
- Recorder query joins multiple tables
- Recorder makes external HTTP calls
- Pulse ingestion latency increased after adding recorder
- Page load times increased after enabling the recorder

### Why Harmful
The custom recorder joins 5 tables on every page load — a busy site with 100 requests/second adds 20 seconds of query time per second, overwhelming the database. The `record()` method takes 200ms — Pulse ingestion adds 200ms to every page load. Engineers experience slow page loads and attribute it to "Pulse being slow" — but it's the custom recorder, not Pulse itself.

### Consequences
- Page load times increased by 200ms+ (recorder adds latency per request)
- Database query load spikes from recorder (100 requests/sec × expensive query)
- PHP-FPM processes spend significant time recording metrics
- Developer productivity: slow page loads
- Database contention: recorder queries compete with application queries
- "Pulse is slow" — incorrectly attributed, but Pulse runs the recorder

### Alternative
- Keep `record()` under 10ms:
  - Use raw DB queries, not Eloquent (no model hydration overhead)
  - Use Redis for fast reads (O(1) commands)
  - Use scheduler-based recording (not per-request) for slow operations
  - Avoid external HTTP calls entirely
  - Cache expensive computations
- Example fast recorder:
  ```php
  public function record(): void
  {
      // Fast: Redis LLEN is O(1), raw DB count is optimized
      $depth = Redis::llen('queues:default'); // Under 1ms
      Pulse::record('queue_depth', 'default', $depth);
  }
  ```

### Refactoring Strategy
1. Profile the `record()` method execution time
2. Identify slow operations (> 10ms)
3. Optimize: use raw queries, Redis, or caching
4. If optimization isn't possible: switch to scheduled recording (not per-request)
5. Verify: `record()` now executes under 10ms

### Detection Checklist
- [ ] `record()` executes under 10ms
- [ ] No Eloquent model hydration in record method
- [ ] No external HTTP calls in record method
- [ ] No multi-table joins or expensive aggregations
- [ ] Optimized for frequent execution (per-request or scheduled)
- [ ] Pulse ingestion latency is acceptable

### Related Rules
- keep-recorder-records-lightweight

### Related Skills
- Build Custom Pulse Recorders for Queue Observability

### Related Decision Trees
- Custom Pulse Recorder vs Built-in Horizon Metrics
