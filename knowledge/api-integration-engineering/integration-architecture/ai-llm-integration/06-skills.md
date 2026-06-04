# Skill: Integrate Laravel Applications with AI/LLM APIs

## Purpose
Connect Laravel applications to AI/LLM APIs (OpenAI, Anthropic, etc.) using structured service classes, prompt management, streaming responses, and cost tracking.

## When To Use
- Integrating AI/LLM APIs into Laravel applications
- Managing prompts, tokens, and responses in a structured way
- Streaming AI responses to users via SSE

## When NOT To Use
- Simple one-off AI calls
- When using dedicated AI orchestration frameworks (LangChain, etc.)

## Prerequisites
- API key from AI provider
- `openai-php/client` or `openai-php/laravel` package

## Workflow
1. Install AI client package for your provider
2. Create service class per AI capability
3. Manage prompts with versioned templates
4. Implement streaming responses with SSE
5. Track token usage and costs per request
6. Handle rate limits, timeouts, and errors
7. Implement retry with backoff for transient errors
8. Cache common responses where appropriate

## Validation Checklist
- [ ] AI client package installed and configured
- [ ] Service class structured per AI capability
- [ ] Prompt templates versioned and managed
- [ ] Streaming implemented for long responses
- [ ] Token usage and costs tracked
- [ ] Rate limits and failures handled
- [ ] Responses cached where applicable
