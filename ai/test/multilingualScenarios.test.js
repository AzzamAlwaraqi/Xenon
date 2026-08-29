const test = require("node:test");
const assert = require("node:assert/strict");
const { createPreferenceService } = require("../src/services/preferenceService");
const { createAdvisorService } = require("../src/services/advisorService");

function scenarioAdvisor() {
    const packageRecord = {
        _id: "ajloun", package_name: "Ajloun Forest Family Hike", package_description: "A cultural family hiking day in Ajloun, Jordan.",
        package_type: "cultural", package_price: 50, available_seats: 12, max_people: 16, ratingsAverage: 4.8, tags: ["family"],
        details: { itinerary: [{ title: "Heritage and nature", activities: ["Guided hiking and historical castle visit"] }], included_services: [{ title: "Local guide" }, { title: "Lunch" }], location_coordinates: { lat: 32.33, lng: 35.75 } }
    };
    return createAdvisorService({
        config: { packageCurrency: "JOD" }, preferences: createPreferenceService({ ollamaEnabled: false }),
        currency: { convert: async amount => ({ convertedAmount: amount }) },
        weather: { forecast: async () => ({ available: true, date: "2026-09-05", minTemperatureC: 19, maxTemperatureC: 26, averageHumidityPercent: 48 }) },
        packages: { findCandidates: async () => [packageRecord] },
        knowledge: { findAll: async () => [{ name: "Ajloun", aliases: [], environmentTags: ["hilly"], terrainNotes: "Forest hills." }] }
    });
}

test("returns grounded recommendations for English, Arabic, French, and Spanish prompts", async () => {
    const prompts = [
        "Cultural family trip in Jordan with hiking, a guide and lunch, not humid, under 300 JOD",
        "أريد رحلة ثقافية في الأردن للعائلة مع مشي ومرشد وغداء، غير رطبة وبميزانية 300 دينار",
        "Je veux un voyage culturel en Jordanie en famille avec randonnée, guide et repas, pas humide, budget de 300 JOD",
        "Quiero un viaje cultural en Jordania con mi familia, senderismo, guía y comida incluida, sin humedad, presupuesto 300 JOD"
    ];
    for (const prompt of prompts) {
        const result = await scenarioAdvisor().recommend(prompt);
        assert.equal(result.outcome, "matches_found", prompt);
        assert.equal(result.topRecommendation.package._id, "ajloun", prompt);
        assert.equal(result.topRecommendation.weather.averageHumidityPercent, 48, prompt);
        assert.match(result.reply, /Ajloun Forest Family Hike/, prompt);
    }
});

test("multilingual environmental exclusions reject sandy and humid destinations", async () => {
    const cases = [
        "Jordan family trip without sand and not humid",
        "رحلة عائلية في الأردن بدون رمل وبدون رطوبة",
        "Voyage en Jordanie sans sable et pas humide",
        "Viaje en Jordania sin arena y sin humedad"
    ];
    const service = createPreferenceService({ ollamaEnabled: false });
    for (const prompt of cases) {
        const preference = await service.extract(prompt);
        assert.ok(preference.avoidFeatures.includes("sandy"), prompt);
        assert.ok(preference.avoidFeatures.includes("humid"), prompt);
    }
});
