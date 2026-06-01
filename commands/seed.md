---
description: Create database seeders and factories for Laravel 13 testing and development
---

# Seed Command

## Usage

Create seeders and factories with realistic data for development and testing.

### Factory

```php
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'is_admin' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $_) => ['is_admin' => true]);
    }
}
```

### Seeder

```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory(10)->create();
        User::factory()->admin()->create([
            'email' => 'admin@example.com',
        ]);
    }
}
```
