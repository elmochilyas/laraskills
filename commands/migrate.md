---
description: Create and manage Laravel 13 database migrations with schema design best practices
---

# Migration Command

## Usage

Create migrations with proper schema design, foreign keys, indexes, and soft deletes.

### Steps

1. Create migration file with descriptive name
2. Define `up()` with schema blueprint
3. Define `down()` as reverse
4. Add indexes for query performance
5. Create matching factory and seeder

## Schema Patterns

```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('status', 20)->default('pending');
    $table->decimal('total', 10, 2);
    $table->timestamps();
    $table->index('status');
});
```
