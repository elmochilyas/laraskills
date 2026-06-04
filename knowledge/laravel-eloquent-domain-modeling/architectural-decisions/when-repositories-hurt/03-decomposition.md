# Decomposition: When Repositories Hurt

## Files & Structure
When repositories hurt, the structure should reflect their absence:
- `App\Models\{Entity}.php` — Direct use of Eloquent throughout
- `App\Actions\{Domain}\{UseCase}.php` — Actions query/save models directly
- `tests\Feature\{Domain}\{UseCase}Test.php` — Feature tests with real database
- `tests\Unit\Models\{Entity}Test.php` — Unit tests with model factories

No interfaces, no repository classes, no service provider bindings.

## Decision Tree
```
Do you have multiple data sources for this aggregate?
├── Yes → Repository MAY help (see when-repositories-help)
└── No → Is there genuinely complex persistence logic?
    ├── Yes → Repository MAY help
    └── No → Is the ONLY reason for a repository "testing"?
        ├── Yes → Repository is harmful — use model factories + SQLite instead
        └── No → Repository is harmful — remove it
```

## Signatures

### PHP (What NOT to do — leaky repository)
```php
// DON'T: Leaky repository that wraps Eloquent 1:1
namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    // This just calls $user->save(). Pointless abstraction.
    public function save(User $user): void
    {
        $user->save();
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findWhere(string $column, $value): ?User
    {
        return User::where($column, $value)->first();
    }

    // This is just User::create(). Why?
    public function create(array $data): User
    {
        return User::create($data);
    }
}
```

### PHP (What TO do — just use Eloquent)
```php
namespace App\Actions\Users;

use App\Models\User;
use App\DataTransferObjects\RegisterUserData;

class RegisterUserAction
{
    public function __invoke(RegisterUserData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
        ]);

        $user->assignRole($data->role);

        return $user;
    }
}
```

## Validation Criteria
- No repository classes exist that have only one implementation
- No repository interface exists that mirrors Eloquent's API
- Every query is visible directly in the action or model where it's used
- No test uses a mock repository — tests use model factories with real DB
- Developers can read an action and immediately see what queries run

## Example Refactoring: Repository Removal

### Before (repository layer)
```php
// Interface in App\Contracts\Repositories
interface InvoiceRepository {
    public function findPending(): Collection;
    public function store(Invoice $invoice): Invoice;
}

// Implementation in App\Repositories
class EloquentInvoiceRepository implements InvoiceRepository {
    public function findPending(): Collection {
        return Invoice::with('lines')->where('status', 'pending')->get();
    }
    public function store(Invoice $invoice): Invoice {
        $invoice->save();
        return $invoice;
    }
}

// Action uses it
class ProcessInvoicesAction {
    public function __construct(private InvoiceRepository $invoices) {}
    public function __invoke() {
        foreach ($this->invoices->findPending() as $invoice) { ... }
    }
}
```

### After (repository removed)
```php
// Action queries directly
class ProcessInvoicesAction
{
    public function __invoke(): void
    {
        $pending = Invoice::with('lines')
            ->where('status', 'pending')
            ->get();

        foreach ($pending as $invoice) {
            // process directly
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