// Environment must be loaded before any module reads process.env.
require("./loadEnv").loadEnv();

const { loadConfig } = require("./config");
const { createPackageRepository } = require("./repositories/packageRepository");
const { createDestinationProfileRepository } = require("./repositories/destinationProfileRepository");
const { createConversationRepository } = require("./repositories/conversationRepository");
const { createPreferenceService } = require("./services/preferenceService");
const { createCurrencyService } = require("./services/currencyService");
const { createWeatherService } = require("./services/weatherService");
const { createAdvisorService } = require("./services/advisorService");
const { createApp } = require("./app");

const config = loadConfig();
const repository = createPackageRepository(config);
const knowledge = createDestinationProfileRepository(config);
const conversationRepository = config.conversationPersistence ? createConversationRepository(config) : null;
const advisor = createAdvisorService({ config, preferences: createPreferenceService(config), currency: createCurrencyService(config), weather: createWeatherService(config), packages: repository, knowledge });

const healthRepository = { health: async () => {
    await repository.health();
    let knowledgeStatus = "connected";
    try { await knowledge.health(); } catch (_) { knowledgeStatus = "unavailable_optional"; }
    return { packageDatabase: "connected", destinationKnowledge: knowledgeStatus, conversationPersistence: conversationRepository ? "enabled" : "disabled" };
} };

const server = createApp({
    advisor, repository: healthRepository, apiKey: config.apiKey, corsOrigins: config.corsOrigins,
    rateLimitPerMinute: config.rateLimitPerMinute, requestTimeoutMs: config.requestTimeoutMs, maximumBodyBytes: config.maximumBodyBytes,
    conversationTtlMs: config.conversationTtlMs, maximumConversations: config.maximumConversations, conversationRepository
});

server.on("error", error => {
    console.error(`Xenon AI service failed to start: ${error.message}`);
    process.exit(1);
});

server.listen(config.port, config.host, () => {
    console.log(`Xenon AI service listening on ${config.host}:${config.port}`);
    if (!config.apiKey) console.warn("Xenon AI service is running without an API key (AI_ALLOW_ANONYMOUS). Do not use this outside an isolated local run.");
});

let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Xenon AI service shutting down (${signal}).`);
    await new Promise(resolve => server.close(resolve));
    await Promise.allSettled([repository.close(), knowledge.close(), conversationRepository?.close()]);
    process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", reason => console.error("Xenon AI service unhandled rejection:", reason));
