Hey,

I've been working on LaraSkills — a Laravel 13 skills, rules, and knowledge-retrieval system for AI-assisted development. The public beta just shipped, and I'd love to get a real developer's take on it.

**What it does:** You install it in a Laravel project, and your AI coding tool gets access to Laravel 13–specific skills, security rules, architecture patterns, and a knowledge base with 2,300+ curated units covering Eloquent, APIs, auth, testing, databases, and more.

**To try it:**

```bash
cd your-laravel-project
npm install --save-dev laraskills
npx laraskills install --profile core
npx laraskills doctor
```

Then just use your AI tool as usual — the skills and rules should steer it toward better Laravel output. If you want the retrieval layer too, clone the repo and run `npx laraskills setup`.

**What I'd love feedback on:**
- Did the install work smoothly?
- Did you notice the AI tool producing better Laravel code?
- Was anything confusing or missing?
- Any features you'd want to see?

Even a "I tried it for 10 minutes and here's what I noticed" is incredibly useful.

If you're up for it, the [beta testing guide](https://github.com/elmochilyas/laraskills/blob/main/docs/feedback/beta-testing-guide.md) has a structured walkthrough, and you can file feedback directly on GitHub.

Repo: [github.com/elmochilyas/laraskills](https://github.com/elmochilyas/laraskills)

No pressure at all — thanks either way.
