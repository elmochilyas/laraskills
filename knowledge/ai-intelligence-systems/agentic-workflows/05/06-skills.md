# Skills

## Skill 1: Design clear tool names and schemas for reliable LLM function calling

### Purpose
Define tools with unique, specific names and clear descriptions that guide the LLM to select the correct tool, with well-typed parameter schemas, parallel tool call support, and proper tool choice configuration for reliable function calling behavior.

### When To Use
- Use when defining tools for agent function calling
- Use when the LLM needs to choose between multiple tools
- Use when you need the LLM to call tools reliably with correct parameters
- Use when implementing parallel tool calls for efficiency

### When NOT To Use
- Do NOT use generic or ambiguous tool names — the LLM will choose wrong tools
- Do NOT use without parameter descriptions explaining what each parameter does
- Do NOT use without testing tool selection accuracy with the target model

### Prerequisites
- Laravel AI SDK with tool-calling support
- Tool definitions with JSON Schema parameter specifications
- Understanding of tool choice options (auto, required, none)
- Testing framework for evaluating tool selection accuracy

### Inputs
- Tool name and description
- Parameter schemas (types, descriptions, required fields, enum values)
- Tool choice configuration
- Examples of correct tool usage

### Workflow
1. Give each tool a unique, specific name: `lookupCustomerByEmail` not `lookup`
2. Write clear descriptions explaining what the tool does: "Looks up customer account by email address. Returns account status, subscription plan, and support history."
3. Define parameter schemas with types, descriptions, and constraints:
   - `email`: string, format: email, description: "Customer's email address"
   - `includeHistory`: boolean, default: false, description: "Include support ticket history"
4. Configure tool choice based on the use case:
   - `auto`: LLM decides whether to call tools (default for general agents)
   - `required`: LLM must call a tool each turn (for tool-only workflows)
   - `none`: LLM must not call tools (for pure chat)
   - Specific tool name: LLM must use a particular tool
5. Support parallel tool calls where tools are independent
6. Test tool selection accuracy: for each test input, verify correct tool + parameters
7. Monitor tool call frequency, accuracy, and failure rates in production

### Validation Checklist
- [ ] Tool names are unique and specific (not generic like "lookup" or "process")
- [ ] Descriptions clearly indicate each tool's purpose and when to use it
- [ ] Parameter schemas have types, descriptions, and constraints
- [ ] Enum/range values are defined for limited-option parameters
- [ ] Tool choice is configured appropriately for the use case
- [ ] Parallel tool calls work correctly for independent tools
- [ ] Tool selection accuracy is tested (target: >95%)
- [ ] Error responses are returned to the LLM for tool failures
- [ ] Tool usage is monitored in production (frequency, accuracy, errors)

### Common Failures
- **Generic names**: `lookup` not specific enough — LLM calls wrong tool
- **Missing parameter descriptions**: LLM doesn't know what to pass — incorrect arguments
- **Wrong tool choice**: `auto` when `required` should be used — LLM skips critical tools
- **No parallel support**: Sequential tool calls when parallel is possible — slower execution
- **No error return**: Tool failure not returned to LLM — agent doesn't know to retry
- **Ambiguous tools**: Two tools with overlapping purposes — LLM confused about which to use

### Decision Points
- **Tool choice**: `auto` (flexible) vs. `required` (tool-only) vs. `none` (no tools) — match to task
- **Parameter granularity**: Fewer parameters (simpler) vs. more parameters (more control)
- **Parallel execution**: Independent tools in parallel, dependent tools sequentially
- **Description verbosity**: Short (one sentence) vs. detailed (with usage examples)

### Performance Considerations
- Tool schemas add tokens to the prompt — more tools = larger prompts = higher cost
- Descriptions should be concise to minimize token usage while being clear
- Parallel tool calls reduce latency vs. sequential for independent operations
- Tool choice `required` forces LLM to always call tools — may increase token usage
- Monitor tool call latency and failure rates per tool

### Security Considerations
- Tool descriptions should not reveal internal implementation details
- Parameter schemas should enforce type and value constraints rigorously
- Tool arguments from LLM must be validated before execution
- Never include destructive operations without confirmation steps
- Audit log all tool calls with arguments, results, and timestamps

### Related Rules
- R1: Write Clear, Specific Tool Names and Descriptions — never use generic names

### Related Skills
- Implement tool argument validation with strict schemas
- Implement agent planning and reasoning strategies
- Design multi-agent systems with strict tool boundaries
- Implement streaming with tool calls

### Success Criteria
- LLM selects the correct tool >95% of the time for test inputs
- Tool descriptions guide the LLM to use appropriate parameters
- Parallel tool calls execute correctly and improve throughput
- Tool choice configuration prevents undesired behavior (skipping required tools)
- Tool call errors are returned to the LLM for retry
- Tool usage monitoring identifies mis-selection patterns for improvement
