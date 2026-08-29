# Xenon standalone AI service

This folder is independent from `backend/` and accesses its MongoDB data read-only. It never creates, updates, or deletes packages.

Package descriptions, itineraries/activities, maximum people, and included services remain exclusively in the existing `Xenon` database and are read directly during every recommendation. The optional `XenonAI.destinationprofiles` collection stores only destination-level enrichment (for example sandy/humid terrain tendencies and accessibility/climate notes); it does not duplicate package content.

## Setup

1. Install Node.js 22+ and Ollama.
2. Run `ollama pull qwen3:4b`.
3. Configure it: `cp src/config.env.example src/config.env`, then fill in `DATABASE`, `MONGODB_DATABASE`, and `AI_API_KEY`. The template is committed; `src/config.env` is git-ignored and must never be committed. `AI_API_KEY` must match `AI_SERVICE_API_KEY` in `backend/src/config.env`, and `MONGODB_DATABASE` must name the database the backend actually writes packages to. The service defaults to port 3100 and JOD package prices. Use a MongoDB account with read-only permissions outside local development.
4. Run `npm install`, `npm test`, then `npm start`.

## API

`POST /v1/recommendations`

```json
{
  "query": "I want a cultural site in Jordan on September 5 that is not too hot for my family, around 3000 JOD",
  "conversationId": "optional-id-returned-by-the-previous-response"
}
```

The first response creates a `conversationId`. Send it with later prompts such as `make it cheaper` or `what about September 7?` to retain and update earlier preferences. Responses include a conversational `reply`, `matchingPackages`, and one `topRecommendation`. The older `recommendations` field remains as a compatibility alias.

`GET /v1/capabilities` exposes the versioned feature contract for mobile clients. Every response includes `apiVersion` and `requestId`. Errors have a stable `error.code`, a human-readable `error.message`, and optional field details. A reference transport adapter is available in `integrations/flutter/`; it is deliberately not a Flutter application.

The agent is intentionally bounded. It declines technical and unrelated questions. It also refuses unsupported tourism facts such as visa rules, safety, laws, medical advice, opening hours, flights, hotels, restaurants, or destination history unless that information is explicitly present in a returned package record. It does not browse for answers or allow Ollama to compose factual responses.

`AI_API_KEY` is required, so every request must include `Authorization: Bearer <key>` (set `AI_ALLOW_ANONYMOUS=true` only for an isolated local run). `GET /health` verifies database connectivity. Ollama is optional at runtime: a multilingual fallback parser is used if it is disabled or unavailable.

The service binds to `0.0.0.0:3100`, so a mobile app can reach it from a physical phone using the development computer's LAN address, for example `http://192.168.1.169:3100`. Port 3000 remains reserved for the existing backend.

When no exact match exists, the response uses `outcome: "no_exact_match"`, leaves `recommendations` empty, and returns separately labelled active `alternatives` plus suggestions. When no usable package exists at all, it uses `outcome: "no_packages_available"`. It never fabricates a package.

The service uses Open-Meteo for forecasts and Frankfurter for exchange rates. Both calls have timeouts and fail safely. Forecasts include dated minimum/maximum temperature, rain probability, and hourly relative humidity summarized as daily average/maximum. Successful forecasts use a short configurable cache (`WEATHER_CACHE_TTL_MS`, ten minutes by default); the payload includes `fetchedAt` and `cached`. Dates beyond 15 days return `status: "not_yet_available"` instead of a fabricated long-range forecast. Currency conversion is performed before the MongoDB price filter; if conversion fails, no potentially incorrect budget constraint is applied.

## Local fake packages

Run `npm run seed:fake` to idempotently add ten clearly marked local demo packages. Run `npm run seed:remove` to delete only records marked with seed ID `xenon-ai-demo-v1`. The running recommendation service remains read-only; only these explicit developer scripts can write or remove demo data.

Run `npm run seed:knowledge` to idempotently add the separate destination-enrichment demo records to `XenonAI.destinationprofiles`. Run `npm run seed:knowledge:remove` to remove only records marked `xenon-ai-destination-demo-v1`. These records contain no package descriptions, itineraries, capacity, or service lists.

## Security

- `AI_API_KEY` is mandatory by default and protects recommendations and health checks. `CORS_ALLOWED_ORIGINS` is empty by default; `*` is refused unless `AI_ALLOW_ANY_ORIGIN=true`.
- Replace `CORS_ALLOWED_ORIGIN=*` with the exact Flutter web/frontend origin in deployed environments.
- Requests are rate-limited, limited to 16 KiB, and constrained by HTTP and external-service timeouts.
- Recommendation requests require `Content-Type: application/json`, reject unknown fields and control characters, and return non-sensitive structured errors.
- Configure `CORS_ALLOWED_ORIGINS` as a comma-separated exact allowlist for Flutter web. Native mobile requests do not use CORS.
- Conversation state has a configurable TTL and hard maximum. Restarting the standalone process clears it; use an authenticated external store later if conversations must survive restarts or multiple instances.
- Ollama output is normalized before it can affect MongoDB filters. Package results use an explicit field allowlist.
- The MongoDB code contains read operations only. Production MongoDB credentials should still be assigned the database `read` role for defense in depth.
- Do not embed `AI_API_KEY` in a production Flutter binary. Use HTTPS and authenticated server-side mediation or short-lived user credentials.
