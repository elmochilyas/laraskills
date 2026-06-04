# Decomposition: When Repositories Help

## Files & Structure
- `App\Contracts\Repositories\{Aggregate}Repository.php` — Domain interface
- `App\Repositories\Eloquent{Aggregate}Repository.php` — Eloquent implementation
- `App\Repositories\Cache{Aggregate}Repository.php` — Cached decorator
- `App\Repositories\InMemory{Aggregate}Repository.php` — Test fake
- `tests\Unit\Repositories\{Aggregate}RepositoryTest.php` — Tests against interface

## Decision Tree
```
Does this aggregate have multiple storage backends?
├── Yes → Repository helps (interface for swapping)
├── No → Is the persistence logic complex (event stream, custom serialization)?
│   ├── Yes → Repository helps
│   └── No → Is this a read-heavy aggregate where you need query abstraction?
│       ├── Yes → Consider Query Object instead
│       └── No → Repository is likely unnecessary — use Eloquent directly
```

## Signatures

### PHP (Interface)
```php
namespace App\Contracts\Repositories;

use App\Models\Contract;
use App\DataTransferObjects\ContractSearchCriteria;
use Illuminate\Support\Collection;

interface ContractRepository
{
    public function findById(int $id): ?Contract;
    public function findActive(): Collection;
    public function search(ContractSearchCriteria $criteria): Collection;
    public function store(Contract $contract): Contract;
    public function delete(Contract $contract): void;
}
```

### PHP (Eloquent Implementation)
```php
namespace App\Repositories;

use App\Contracts\Repositories\ContractRepository;
use App\Models\Contract;
use App\DataTransferObjects\ContractSearchCriteria;
use Illuminate\Support\Collection;

class EloquentContractRepository implements ContractRepository
{
    public function findById(int $id): ?Contract
    {
        return Contract::with('lines', 'signatures')->find($id);
    }

    public function findActive(): Collection
    {
        return Contract::with('lines')
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->get();
    }

    public function search(ContractSearchCriteria $criteria): Collection
    {
        $query = Contract::query();
        if ($criteria->status) {
            $query->where('status', $criteria->status);
        }
        // ... other criteria
        return $query->get();
    }

    public function store(Contract $contract): Contract
    {
        $contract->save();
        return $contract->fresh();
    }

    public function delete(Contract $contract): void
    {
        $contract->delete();
    }
}
```

## Validation Criteria
- Repository interface contains zero Eloquent-specific types (no `Builder`, no `Model`)
- Every repository method is unit-testable with an in-memory fake
- Repository does not manage transactions — the caller does
- Repository methods return domain models or collections of domain models
- Repository is only created for aggregate roots with actual storage variation needs

## Example Refactoring

### Before (direct Eloquent everywhere, hard to swap)
```php
class SyncContractsAction
{
    public function __invoke()
    {
        $apiContracts = ExternalContractApi::fetchAll(); // direct coupling
        foreach ($apiContracts as $data) {
            Contract::updateOrCreate(['external_id' => $data['id']], $data);
        }
    }
}
```

### After (repository abstraction, easy to swap source)
```php
class SyncContractsAction
{
    public function __construct(
        private ContractRepository $localContracts,
    ) {}

    public function __invoke()
    {
        // Repository implementation can be Eloquent, Redis, or in-memory
        $remote = ExternalContractApi::fetchAll();
        foreach ($remote as $data) {
            $this->localContracts->store(Contract::fromExternal($data));
        }
    }
}
```
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization