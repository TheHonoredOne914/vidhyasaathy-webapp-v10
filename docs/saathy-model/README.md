# Saathy model integration

Saathy is served by the existing Fastify API and rendered at `/student/saathy`. It reuses VidhyaSaathy's authenticated Ask stream, SQLite conversation history, published-note retrieval, privacy guards, usage budget, quick checks, and shared learning evidence. Lesson and chapter entry points pass their context into the chat. The API prompt now includes only the signed-in learner's name, class, subjects, chapters, recent concept progress, recent mistakes, and current chapter, plus a short guide to app destinations. It does not query other profiles' learning evidence.

Dhruv's Next.js shell, Prisma persistence, and provider setup are not carried over. This integration uses the existing provider abstraction, VidhyaSaathy's SQLite schema, routes, and auth. Ganita Manjari's Grade 9 maths book is included as an additional retrieval source when active chapter and question terms match; it supplements published school notes. No migration was needed for existing Ask tables.

## Configuration

The API supports its existing provider configuration: `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_API_URL`. Provider credentials must stay in the API environment, never in `VITE_` variables. With no live provider, the API's configured fallback behavior remains in effect. The web app uses `VITE_API_PROXY_TARGET` when proxying requests to the API in development.

## Run locally

Run from the repository root in separate terminals:

```powershell
npm run dev --workspace @vidhyasaathy/api
npm run dev --workspace @vidhyasaathy/web
```

To use the requested local ports, set `PORT=3201` for the API and configure the web proxy target to `http://127.0.0.1:3201`; run Vite on port `5273` with the workspace's supported CLI option/configuration.

## Existing evidence and privacy

Quick Try answers are checked server-side against the stored item and recorded through the shared `recordAnswer` learning service. Chat ownership is checked against the authenticated school and profile. Student learning summaries are built from rows scoped to that same profile and school. Chat uses the existing retention and output-safety behavior.

## Remaining gaps

- Port and validate the structured Saathy metadata contract, safe parser/rescue, artifact rendering, and interactive cards.
- Add the prerequisite-only Level Check gate/cards and record answers through shared evidence, including no-penalty `not_taught` responses.
- Expand the existing server-scored Quick Try into a hint ladder.
- Add API and UI coverage for those features before calling the model port complete.
