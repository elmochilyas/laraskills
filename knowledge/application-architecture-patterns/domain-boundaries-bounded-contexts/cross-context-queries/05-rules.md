# Rule: Never JOIN across bounded context boundaries
---
## Category
Architecture
---
## Rule
Do not write SQL JOINs or Eloquent relationships that span tables from different bounded contexts.
---
## Reason
A cross-context JOIN couples the schemas of both contexts. The owning context cannot evolve its table schema without breaking queries in other contexts that JOIN on its tables.
---
## Bad Example
```php
// Cross-context JOIN
$invoices = DB::table('billing_invoices')
    ->join('identity_users', 'billing_invoices.identity_user_id', '=', 'identity_users.id')
    ->select('billing_invoices.*', 'identity_users.email')
    ->get();

// Eloquent cross-context join (same problem)
class Invoice extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class, 'identity_user_id');
        // User is in Identity context — cross-context relationship
    }
}
```
---
## Good Example
```php
// Application-level aggregation — query each context separately
class InvoiceWithUserService
{
    public function __construct(
        private InvoiceRepository $invoices,
        private IdentityServiceInterface $identity
    ) {}

    public function getInvoicesWithUsers(): array
    {
        $invoices = $this->invoices->getAll();
        $userIds = $invoices->pluck('identity_user_id')->unique();
        $users = $this->identity->getUsersByIds($userIds->toArray());

        return $invoices->map(fn (Invoice $inv) => [
            'invoice' => $inv,
            'user' => $users[$inv->getUserId()] ?? null,
        ])->toArray();
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Schema coupling between contexts; preventing independent schema evolution; blocking future extraction.

# Rule: Use application-level aggregation as the default for cross-context reads
---
## Category
Design
---
## Rule
Default to application-level aggregation (call each context's service separately and combine results in application code) for cross-context data retrieval.
---
## Reason
Application-level aggregation maintains full context independence. Each context is queried through its own service contract, preserving schema isolation. It is the simplest pattern and works for any query volume.
---
## Bad Example
```php
// Direct cross-context query — schema coupled
$data = DB::table('catalog_products')
    ->join('billing_invoices', 'catalog_products.id', '=', 'billing_invoices.product_id')
    ->get();
```
---
## Good Example
```php
// Application-level aggregation
class OrderSummaryService
{
    public function __construct(
        private CatalogServiceInterface $catalog,
        private BillingServiceInterface $billing
    ) {}

    public function getSummaries(int $userId): array
    {
        $orders = $this->billing->getOrdersByUser($userId);
        $productIds = collect($orders)->pluck('product_id')->unique();
        $products = $this->catalog->getProductsByIds($productIds->toArray());

        return collect($orders)->map(fn ($order) => [
            'order' => $order,
            'product' => $products[$order->productId] ?? null,
        ])->all();
    }
}
```
---
## Exceptions
High-frequency queries where the performance cost of N calls is unacceptable (use local projections instead).
---
## Consequences Of Violation
Schema coupling; context independence is compromised.

# Rule: Use local projections for frequent cross-context queries
---
## Category
Performance
---
## Rule
For frequently accessed cross-context data, maintain a local projection table updated via event listeners, rather than calling the other context's service on every request.
---
## Reason
Application-level aggregation for every request creates unnecessary overhead and latency. A local projection enables fast local queries while preserving eventual consistency.
---
## Bad Example
```php
// Application-level aggregation on every request — expensive for high traffic
class ProductReviewController
{
    public function index(int $productId): View
    {
        $product = $this->catalog->getProduct($productId);      // call 1
        $reviews = $this->reviews->getReviews($productId);      // call 2
        $users = $this->identity->getReviewers($productId);     // call 3
        return view('reviews.index', compact('product', 'reviews', 'users'));
    }
}
```
---
## Good Example
```php
// Local projection maintained via events
// Table: review_user_projection (user_id, name, avatar_url) in Reviews context
class SyncUserToReviewProjection
{
    public function handle(UserUpdated $event): void
    {
        ReviewUserProjection::updateOrCreate(
            ['identity_user_id' => $event->userId],
            ['name' => $event->name, 'avatar_url' => $event->avatarUrl]
        );
    }
}

class ProductReviewController
{
    public function index(int $productId): View
    {
        $product = $this->catalog->getProduct($productId);
        $reviews = Review::with('userProjection')
            ->where('catalog_product_id', $productId)
            ->get();
        return view('reviews.index', compact('product', 'reviews'));
    }
}
```
---
## Exceptions
When real-time accuracy is required and eventual consistency is unacceptable.
---
## Consequences Of Violation
Unnecessary service call overhead for frequent cross-context reads; higher latency and lower throughput.

# Rule: Use batch endpoints to avoid N+1 across contexts
---
## Category
Performance
---
## Rule
Never call a cross-context service in a loop. Use batch endpoints that accept multiple IDs in a single request.
---
## Reason
Calling a service per item in a loop creates N+1 latency across contexts. Batch endpoints reduce N calls to 1 call, dramatically improving performance.
---
## Bad Example
```php
// N+1 across contexts
class InvoiceController
{
    public function index(): View
    {
        $invoices = Invoice::all();
        foreach ($invoices as $invoice) {
            // N calls to Identity service
            $user = $this->identity->getUser($invoice->getUserId());
            $invoice->userName = $user->name;
        }
        return view('invoices.index', compact('invoices'));
    }
}
```
---
## Good Example
```php
// Batch endpoint
class InvoiceController
{
    public function index(): View
    {
        $invoices = Invoice::all();
        $userIds = $invoices->pluck('identity_user_id')->unique()->toArray();

        // Single batch call
        $users = $this->identity->getUsersByIds($userIds);

        foreach ($invoices as $invoice) {
            $invoice->userName = $users[$invoice->getUserId()] ?? 'Unknown';
        }
        return view('invoices.index', compact('invoices'));
    }
}

interface IdentityServiceInterface
{
    /** @param int[] $ids */
    public function getUsersByIds(array $ids): array;
}
```
---
## Exceptions
When the batch size is trivially small (1-2 items) and performance is not critical.
---
## Consequences Of Violation
N service calls instead of 1; high latency under load; poor user experience.

# Rule: Use CQRS read models for complex cross-context queries
---
## Category
Architecture
---
## Rule
For queries that combine data from multiple contexts in complex ways (filtering, sorting across fields), build a dedicated CQRS read model maintained by event listeners.
---
## Reason
Application-level aggregation becomes unwieldy when queries need to filter or sort across fields from different contexts. A denormalized read model optimized for the specific query pattern provides the best performance and cleanest code.
---
## Bad Example
```php
// Complex cross-context filtering in application code — slow and messy
class SearchController
{
    public function search(Request $request): array
    {
        $products = $this->catalog->search($request->q);
        $productIds = collect($products)->pluck('id');
        $inventory = $this->inventory->getStockLevels($productIds->toArray());
        $prices = $this->pricing->getPrices($productIds->toArray());
        // Manual cross-filtering with pagination issues
    }
}
```
---
## Good Example
```php
// CQRS read model — built and maintained via events
Schema::create('catalog_listing_read_model', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->decimal('price', 10, 2);
    $table->integer('stock_level');
    $table->string('status');
});

class CatalogListingProjector
{
    public function onProductCreated(ProductCreated $event): void
    {
        CatalogListing::create([
            'name' => $event->name,
            'price' => $event->price,
            'stock_level' => 0,
            'status' => 'active',
        ]);
    }

    public function onStockUpdated(StockUpdated $event): void
    {
        CatalogListing::where('catalog_product_id', $event->productId)
            ->update(['stock_level' => $event->newLevel]);
    }
}

class CatalogListingController
{
    public function search(Request $request): LengthAwarePaginator
    {
        return CatalogListing::query()
            ->where('name', 'like', "%{$request->q}%")
            ->orderBy($request->sort ?? 'name')
            ->paginate(20);
    }
}
```
---
## Exceptions
Simple cross-context queries that don't need combined filtering or sorting.
---
## Consequences Of Violation
Complex application-level aggregation with poor performance; difficult to paginate, sort, and filter across contexts.

# Rule: Invalidate local projections when source data changes
---
## Category
Reliability
---
## Rule
Ensure that every local projection has a corresponding event listener that updates or invalidates it when the source context's data changes.
---
## Reason
A stale local projection silently returns outdated data. Without invalidation, users see inconsistent information with no indication that data is stale.
---
## Bad Example
```php
// Local projection created but no invalidation listener
class SyncUserToBilling
{
    public function handle(UserCreated $event): void
    {
        BillingCustomer::create([/* ... */]);
    }
}

// Missing handler for UserUpdated — user changes email, Billing shows old email
```
---
## Good Example
```php
class SyncUserToBilling
{
    public function created(UserCreated $event): void
    {
        BillingCustomer::create([
            'identity_user_id' => $event->userId,
            'email' => $event->email,
            'name' => $event->name,
        ]);
    }

    public function updated(UserUpdated $event): void
    {
        BillingCustomer::where('identity_user_id', $event->userId)
            ->update(['email' => $event->email, 'name' => $event->name]);
    }

    public function deleted(UserDeleted $event): void
    {
        BillingCustomer::where('identity_user_id', $event->userId)->delete();
    }
}
```
---
## Exceptions
Immutable data that never changes after creation (e.g., audit logs).
---
## Consequences Of Violation
Silent stale data; users see outdated information with no indication of staleness.

# Rule: Prefer synchronous contract calls over shared database reads
---
## Category
Architecture
---
## Rule
When real-time cross-context data is required, use synchronous service contract calls — not shared database access or direct table reads.
---
## Reason
Synchronous calls through contracts preserve the owning context's ability to enforce authorization, validation, and caching. Direct table access bypasses all business logic.
---
## Bad Example
```php
// Direct table read — bypasses Identity's business logic and authorization
class BillingService
{
    public function getUserStatus(int $userId): string
    {
        return DB::table('identity_users')
            ->where('id', $userId)
            ->value('status'); // bypasses Identity's access control
    }
}
```
---
## Good Example
```php
// Synchronous contract call — preserves business logic
interface IdentityServiceInterface
{
    public function getUserStatus(int $userId): string;
}

class BillingService
{
    public function __construct(
        private IdentityServiceInterface $identity
    ) {}

    public function getUserStatus(int $userId): string
    {
        return $this->identity->getUserStatus($userId);
    }
}
```
---
## Exceptions
Extreme performance requirements where the overhead of service calls is the bottleneck (use local projections instead).
---
## Consequences Of Violation
Business logic and authorization are bypassed; owning context cannot enforce data access policies.

# Rule: Do not use eager loading across contexts
---
## Category
Performance
---
## Rule
Do not use Eloquent's eager loading (`with()`, `load()`) to fetch relationships that cross bounded contexts.
---
## Reason
Eager loading across contexts implies a cross-context Eloquent relationship, which creates both schema coupling and hidden N+1 problems when the relationship is accessed.
---
## Bad Example
```php
// Cross-context eager loading
$invoices = Invoice::with('user')->get();
// Assumes Invoice belongsTo User (User is in Identity context)
// Schema coupled; User model imported in Billing
```
---
## Good Example
```php
// Separate queries — no cross-context eager loading
$invoices = Invoice::all();
$userIds = $invoices->pluck('identity_user_id')->unique();
$users = $this->identity->getUsersByIds($userIds->toArray());

$result = $invoices->map(fn ($inv) => [
    'invoice' => $inv,
    'user' => $users[$inv->getUserId()] ?? null,
]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Cross-context Eloquent relationships created; schema coupling; hidden N+1 across contexts.
