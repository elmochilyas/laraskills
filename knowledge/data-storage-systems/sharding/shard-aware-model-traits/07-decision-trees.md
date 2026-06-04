# 6-14 Shard Aware Model Traits - Decision Trees

## Trait Implementation Strategy

---

## Decision Context

Choosing between a `ShardAware` trait (mixed into individual models) and an abstract base model class for implementing shard-aware Eloquent models in Laravel.

---

## Decision Criteria

* performance: trait has zero overhead over inheritance; connection resolution is O(1)
* architectural: trait can be selectively applied; base class forces shard awareness on all models
* maintainability: trait is more flexible (apply per-model); base class provides consistent routing

---

## Decision Tree

Do all models need shard awareness?

YES → Use abstract base model class

    ↓
    abstract class ShardedModel extends Model
    Uses ShardAware trait internally
    
    ↓
    Pro: All sharded models inherit routing automatically
    Pro: Consistent behavior across all models
    Pro: Single place to update routing logic
    
    ↓
    Con: Forces shard awareness on all children
    Con: Inheritance hierarchy may conflict with other base classes

NO → Only specific models need sharding

    ↓
    Use ShardAware trait on individual models
    
    ↓
    trait ShardAware {
        public function getConnectionName() {
            return 'shard_'.ShardRouter::getShard($this->shardKey());
        }
    }
    
    ↓
    Pro: Selective — only sharded models use it
    Pro: Can be added to existing models without refactoring
    Pro: Works with any base class
    
    ↓
    Con: Must remember to apply to each sharded model
    Con: Inconsistent if some models miss the trait

Shard key extraction:

↓

All models use the same shard key column (e.g., user_id)?

    YES → Hardcode column name in trait
        protected function shardKey(): string { return 'user_id'; }
    
    NO → Different models have different shard keys
        → Define shardKeyColumn property on each model
        protected $shardKeyColumn = 'tenant_id';

---

## Recommended Default

**Default:** `ShardAware` trait for selective application; abstract base class if all models are sharded
**Reason:** Trait is more flexible and can be retrofitted. Base class is cleaner for a fully-sharded app.

---

## Relationship Loading Across Shards

---

## Decision Context

Handling Eloquent relationship loading when related models may be on different shards — preventing accidental cross-shard queries and silent N+1 patterns.

---

## Decision Criteria

* performance: accidental cross-shard relationship loading causes fan-out or N+1
* architectural: same-group relationships load normally; cross-group must be explicit
* maintainability: silent cross-shard loading is hard to detect

---

## Decision Tree

Are related models in the same shard group (same shard key)?

YES → Relationship loading is safe

    ↓
    Related models are on the same shard
    Standard Eloquent eager loading works
    
    ↓
    $user->orders → same shard, single query
    User::with('orders')->get() → same shard, 2 queries (1 parent, 1 related)

NO → Related models use different shard keys

    ↓
    Cross-shard relationship detected
    
    ↓
    Option A: Always eager-load with explicit strategy
        
        ↓
        Load parent → collect IDs → fan-out to all shards
        $users = User::all(); // from various shards
        $userIds = $users->pluck('id');
        $orders = Order::whereIn('user_id', $userIds)->get(); // fan-out
        
        ↓
        Pro: Controlled, explicit
        Pro: No N+1
        Pro: Batching across shards

NO → Option B: Deny lazy loading

        ↓
        Override relationship loading to throw on cross-shard access
        Prevents accidental N+1
        
        ↓
        Required: explicit eager-loading only
        Risk: breaks existing code that uses lazy loading

---

## Recommended Default

**Default:** Eager-load cross-shard relationships with batched fan-out; throw exception on lazy-loaded cross-shard access
**Reason:** Silent cross-shard lazy loading is the most common sharding bug. Forcing explicit loading prevents N+1 disasters.

---

## Related Rules

* Rule 6-14-1: Always Route Model Queries By Shard Key
* Rule 6-14-2: Never Load Cross-Shard Relationships Automatically

---

## Related Skills

* Implement Shard-Aware Model Traits
* Implement `getShardId()` on Models
