# Decision Trees — Console/Artisan Command Testing

## Decision Tree 1: Integration Test vs Unit Test

```
How should the Artisan command be tested?
│
├── Does the command depend on Laravel services (DB, queue, mail)?
│   └── YES → Use `$this->artisan()` (integration test)
│       Boots Laravel (~30-50ms)
│       Access to database, container, facades
│       `$this->artisan('import:users')->expectsOutput('Done')->assertExitCode(0)`
│
├── Is the command logic purely computational (no framework deps)?
│   └── YES → Use Symfony CommandTester (unit test)
│       No Laravel boot (<1ms)
│       Instantiate command class directly
│       `$commandTester->execute(['arg' => 'val']); $this->assertStringContainsString('Done', $commandTester->getDisplay());`
│
└── Does the command make external calls (API, email)?
    └── Mock dependencies FIRST, then use `$this->artisan()`
        `Http::fake(); Mail::fake(); Queue::fake()`
        `$this->artisan('sync:users')->assertExitCode(0)`
```

## Decision Tree 2: Output Assertion Strategy

```
What assertion method should be used for command output?
│
├── Is the output fully static (headers, labels, separators)?
│   └── Use `expectsOutput('Exact string')`
│       Example: `expectsOutput('Starting import...')`
│
├── Does the output contain variable data (counts, timestamps, IDs)?
│   └── Use `expectsOutputToContain('partial string')` or regex
│       Example: `expectsOutputToContain('Imported')` instead of `expectsOutput('Imported 10 users')`
│       Or: `expectsOutput(fn($out) => preg_match('/Imported \d+ users/', $out))`
│
└── Are there side effects to verify (database changes, file creation)?
    └── Assert behavior, not just output
        `$this->assertDatabaseHas('users', ['email' => 'test@example.com'])`
        `Storage::disk('exports')->assertExists('users.csv')`
```

## Decision Tree 3: Interactive Command Testing

```
Does the command require user interaction?
│
├── Uses `$this->ask()` or `$this->confirm()`?
│   └── Register answers BEFORE execution with `expectsQuestion()`
│       ```php
│       $this->artisan('make:model')
│           ->expectsQuestion('What is the model name?', 'User')
│           ->expectsQuestion('Should we generate migration?', 'yes')
│           ->assertExitCode(0);
│       ```
│       Without this: test hangs waiting for STDIN
│
├── Uses `$this->choice()` with multiple options?
│   └── Register both question and chosen option
│       `expectsQuestion('Select environment', 'production')`
│
└── Uses `$this->secret()` for sensitive input?
    └── Register as normal with expected answer
        `expectsQuestion('Enter API key', 'sk-test-key')`
```
