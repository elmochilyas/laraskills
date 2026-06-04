# Rule: Default to eventual consistency for cross-context data synchronization
---
## Category
Architecture
---
## Rule
Use eventual consistency as the default pattern for data synchronization across bounded contexts.
---
## Reason
Eventual consistency enables context independence. Forcing strong consistency across contexts requires synchronous calls, distributed locks, or shared databases — all of which compromise context autonomy.
---
## Bad Example
```php
// Forcing strong consistency for all cross-context reads
class BillingService
{
    public function getInvoice(int $id): Invoice
    {
        $user = $this->identity->getUser($this->invoice->getUserId()); // sync call every time
        // Strong consistency required even for display-only data
        // If Identity is slow, Billing is slow too
    }
}
```
---
## Good Example
```php
// Eventual consistency for display data
class BillingService
{
    public function getInvoice(int $id): Invoice
    {
        $invoice = Invoice::with('localCustomer')->findOrFail($id);
        // localCustomer updated via event — eventually consistent
        // Fast local query, no cross-context sync call
        return $invoice;
    }
}
```
---
## Exceptions
When current data is required for correctness (financial transactions, authorization checks) — use synchronous contracts.
---
## Consequences Of Violation
Contexts coupled through synchronous calls; reduced availability and performance.

# Rule: Make all event handlers idempotent
---
## Category
Reliability
---
## Rule
Design every cross-context event handler to be safely processable multiple times without side effects.
---
## Reason
Events may be delivered more than once (queue redelivery, at-least-once semantics). Non-idempotent handlers cause duplicate inserts, double refunds, or data corruption on retry.
---
## Bad Example
```php
// Non-idempotent event handler
class OnUserCreated
{
    public function handle(UserCreated $event): void
    {
        BillingCustomer::create([ // duplicate insert on retry
            'identity_user_id' => $event->userId,
            'email' => $event->email,
        ]);
    }
}
```
---
## Good Example
```php
// Idempotent event handler
class OnUserCreated
{
    public function handle(UserCreated $event): void
    {
        BillingCustomer::updateOrCreate(
            ['identity_user_id' => $event->userId],
            ['email' => $event->email, 'name' => $event->name]
        );
    }
}

// Alternative: deduplication tracking
class OnUserCreated
{
    public function handle(UserCreated $event): void
    {
        if (ProcessedEvent::where('event_id', $event->eventId)->exists()) {
            return; // already processed
        }

        BillingCustomer::create([/* ... */]);
        ProcessedEvent::create(['event_id' => $event->eventId]);
    }
}
```
---
## Exceptions
Exactly-once delivery guarantees (rare in distributed systems).
---
## Consequences Of Violation
Duplicate processing on retry causes incorrect state (duplicate records, double charges).

# Rule: Design UIs to tolerate stale cross-context data
---
## Category
Design
---
## Rule
Build user interfaces that function correctly even when cross-context data is slightly stale.
---
## Reason
If UIs require perfectly consistent cross-context data, every feature must wait for sync to complete before rendering. This defeats the purpose of eventual consistency and creates poor user experience.
---
## Bad Example
```php
// UI requires exact real-time data
class InvoiceController
{
    public function show(int $id): View
    {
        $invoice = Invoice::findOrFail($id);
        // Blocks until Identity confirms latest user data
        $user = $this->identity->getUserBlocking($invoice->getUserId());
        return view('invoices.show', compact('invoice', 'user'));
    }
}
```
---
## Good Example
```php
// UI tolerates stale data gracefully
class InvoiceController
{
    public function show(int $id): View
    {
        $invoice = Invoice::with('localCustomer')->findOrFail($id);
        // localCustomer may be slightly stale, but UI works fine
        return view('invoices.show', [
            'invoice' => $invoice,
            'lastSyncedAt' => $invoice->localCustomer?->updated_at,
        ]);
    }
}

// View shows staleness indicator if needed
// {{ $invoice->localCustomer->name }}
// @if($lastSyncedAt->diffInMinutes() > 5)
//     <span class="text-muted">(synced {{ $lastSyncedAt->diffForHumans() }})</span>
// @endif
```
---
## Exceptions
Real-time dashboards or financial displays where staleness is unacceptable.
---
## Consequences Of Violation
Slow UIs that block on cross-context data; poor user experience; reduced availability.

# Rule: Monitor the consistency window
---
## Category
Reliability
---
## Rule
Monitor the average time between event dispatch and processing (the consistency window) to detect growing staleness.
---
## Reason
Without monitoring, the consistency window can grow silently due to queue backlogs, processing failures, or resource constraints. Users see stale data without any indication.
---
## Bad Example
```php
// No monitoring — consistency window grows silently
// Queue backlog reaches 5 minutes
// Users see outdated data for 5 minutes with no indication
```
---
## Good Example
```php
// Consistency window monitoring
class ConsistencyMonitor
{
    public function measure(): void
    {
        $latest = ProcessedEvent::latest('processed_at')->first();
        $averageLag = ProcessedEvent::where('processed_at', '>', now()->subHour())
            ->avg(DB::raw('TIMESTAMPDIFF(SECOND, created_at, processed_at)'));

        Metrics::put('consistency_window_seconds', $averageLag);

        if ($averageLag > 300) { // >5 minutes
            Alert::warning("Consistency window exceeded 5 minutes (current: {$averageLag}s)");
        }
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent staleness growth; users experience stale data without notification.

# Rule: Implement read-your-writes consistency for the initiating user
---
## Category
Design
---
## Rule
When a user initiates a change that triggers eventual consistency, ensure they see their own write immediately on subsequent reads.
---
## Reason
Users expect to see changes they just made. If eventual consistency causes their own write to be invisible on the next page load, they perceive a bug.
---
## Bad Example
```php
// Writer sees stale data after their own action
// User updates their email in Identity context
// Redirected to Billing dashboard — still shows old email
// User thinks the update failed
```
---
## Good Example
```php
// Read-your-writes consistency
class UserController
{
    public function updateEmail(Request $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $user = $request->user();
            $user->update(['email' => $request->email]);

            // Dispatch event for Billing context
            UserUpdated::dispatch($user->id, $user->email);
        });

        // Bypass eventual consistency for the writer — force direct update
        if (Auth::check()) {
            BillingCustomer::where('identity_user_id', Auth::id())
                ->update(['email' => $request->email]);
        }

        return redirect()->back()->with('status', 'Email updated');
    }
}
```
---
## Exceptions
When the write and subsequent read are separated by enough time that eventual consistency has already caught up.
---
## Consequences Of Violation
Users perceive their changes as failed; support tickets increase; user trust decreases.

# Rule: Use synchronous contract calls when current data is required for correctness
---
## Category
Architecture
---
## Rule
For operations that depend on another context's data being current (financial transactions, authorization), use synchronous contract calls instead of eventual consistency.
---
## Reason
Eventual consistency can serve stale data. If correctness depends on current data, eventual consistency can produce incorrect results. Synchronous calls guarantee current data at the cost of coupling.
---
## Bad Example
```php
// Eventual consistency for a financial check
class PaymentService
{
    public function processPayment(int $userId, float $amount): void
    {
        $balance = $this->billing->getLocalBalance($userId); // might be stale
        // User may have spent money in another context that hasn't synced yet
        if ($balance >= $amount) {
            // Process payment — possible overdraft
        }
    }
}
```
---
## Good Example
```php
// Synchronous call for financial correctness
class PaymentService
{
    public function processPayment(int $userId, float $amount): void
    {
        // Synchronous call guarantees current balance
        $balance = $this->billing->getCurrentBalance($userId); // sync call
        if ($balance >= $amount) {
            $this->billing->withdraw($userId, $amount); // sync call
        }
    }
}
```
---
## Exceptions
Non-critical operations where staleness is acceptable (display names, preferences).
---
## Consequences Of Violation
Operations based on stale data produce incorrect results (overdrafts, double bookings).

# Rule: Define and document acceptable staleness windows per data type
---
## Category
Architecture
---
## Rule
Define and document the maximum acceptable staleness window for each type of cross-context data.
---
## Reason
Different data types have different freshness requirements. Without explicit definitions, developers either over-engineer for freshness or produce unacceptable staleness.
---
## Bad Example
```php
// No staleness definitions — all data treated the same
// User display name: 5 minute staleness is fine
// User credit balance: 5 second staleness may cause problems
// Same sync strategy used for both
```
---
## Good Example
```php
// Documented staleness windows per data type
class StalenessPolicy
{
    public array $windows = [
        'user_display_name' => [
            'max_staleness_seconds' => 300, // 5 minutes — display only
            'sync_strategy' => 'event',
        ],
        'user_credit_balance' => [
            'max_staleness_seconds' => 2, // 2 seconds — near real-time
            'sync_strategy' => 'synchronous',
        ],
        'product_stock_level' => [
            'max_staleness_seconds' => 10, // 10 seconds — low risk
            'sync_strategy' => 'event_with_projection',
        ],
    ];

    public function getMaxStaleness(string $dataType): int
    {
        return $this->windows[$dataType]['max_staleness_seconds'] ?? 60;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent staleness expectations; over-engineered sync for display data; under-engineered sync for critical data.

# Rule: Use conflict resolution strategies for concurrent writes across contexts
---
## Category
Design
---
## Rule
Define explicit conflict resolution strategies (last-write-wins, version-based, or manual) for data that can be modified in multiple contexts.
---
## Reason
When two contexts can update the same conceptual data, conflicts can arise. Without a strategy, concurrent updates silently overwrite each other or produce inconsistent state.
---
## Bad Example
```php
// No conflict resolution — last write silently wins
class UserProfileSync
{
    public function handle(UserUpdated $event): void
    {
        LocalProfile::updateOrCreate(
            ['identity_user_id' => $event->userId],
            ['name' => $event->name] // silently overwrites
        );
        // If Billing also updated name, one update is lost
    }
}
```
---
## Good Example
```php
// Version-based conflict resolution
class UserProfileSync
{
    public function handle(UserUpdated $event): void
    {
        $local = LocalProfile::where('identity_user_id', $event->userId)->first();

        if (! $local || $event->version > $local->sourceVersion) {
            LocalProfile::updateOrCreate(
                ['identity_user_id' => $event->userId],
                [
                    'name' => $event->name,
                    'sourceVersion' => $event->version,
                ]
            );
        }
    }
}

// Alternative: last-write-wins with timestamp
class UserProfileSync
{
    public function handle(UserUpdated $event): void
    {
        $local = LocalProfile::where('identity_user_id', $event->userId)->first();

        if (! $local || $event->updatedAt > $local->lastSyncedAt) {
            // Apply the update (newer wins)
        }
    }
}
```
---
## Exceptions
Data with a single writer per field (no possibility of conflict).
---
## Consequences Of Violation
Concurrent updates silently lost; data inconsistency without detection.

# Rule: Set up alerting for consistency window breaches
---
## Category
Reliability
---
## Rule
Configure alerts that fire when the consistency window exceeds the defined threshold for any data type.
---
## Reason
Silent consistency degradation is dangerous — users experience stale data while the team remains unaware. Alerts provide early warning before the situation impacts users.
---
## Bad Example
```php
// No alerts for consistency degradation
// Queue fails silently overnight
// 8 hours of stale data before anyone notices
```
---
## Good Example
```php
// Alerting configuration
class ConsistencyAlerting
{
    public function checkAndAlert(): void
    {
        foreach ($this->policies->windows as $dataType => $policy) {
            $currentLag = $this->monitor->getCurrentLag($dataType);

            if ($currentLag > $policy['max_staleness_seconds']) {
                Alert::critical("Consistency window breached for {$dataType}: " .
                    "{$currentLag}s (threshold: {$policy['max_staleness_seconds']}s)");

                // Auto-remediation: scale queue workers
                $this->queueScaler->scaleUp('cross-context-sync');
            }
        }
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Undetected consistency degradation; users experience stale data; trust erodes.
