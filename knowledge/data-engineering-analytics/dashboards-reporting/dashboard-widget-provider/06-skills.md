# Skills: Dashboard Widget Data Provider Pattern

## Skill: Implementing a Widget Data Provider in Laravel
**Purpose:** Build a testable, cacheable data provider for a dashboard widget.
**When to use:** Any dashboard widget that retrieves and transforms data.
**Steps:**
1. Define the WidgetData DTO (filter parameters)
2. Create the provider class implementing `__invoke(WidgetData $data)`
3. Write the data query using Eloquent or raw SQL
4. Transform results into chart-ready format
5. Add caching with appropriate TTL
6. Create the widget Blade/Livewire component that calls the provider
7. Test provider independently with mocked and integration tests
8. Register provider in the dashboard configuration
