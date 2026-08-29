const test = require("node:test");
const assert = require("node:assert/strict");
const { createPackageRepository } = require("../src/repositories/packageRepository");
const { createDestinationProfileRepository } = require("../src/repositories/destinationProfileRepository");
const { createAdvisorService } = require("../src/services/advisorService");

test("repository performs a read-only packages/details aggregation", async () => {
    let pipeline;
    const documents = [{ _id: "stored-package" }];
    const collection = { aggregate(value, options) { pipeline = value; assert.equal(options.maxTimeMS, 5000); return { toArray: async () => documents }; } };
    const client = { connect: async () => {}, db: () => ({ collection(name) { assert.equal(name, "packages"); return collection; }, command: async () => ({ ok: 1 }) }), close: async () => {} };
    const repository = createPackageRepository({ databaseUri: "mongodb://test", databaseName: "Xenon" }, () => client);
    const result = await repository.findCandidates({ people: 4, packageTypes: ["cultural"], maximumPerPerson: 750 });
    assert.equal(result[0]._id, "stored-package");
    assert.deepEqual(pipeline[0].$match.available_seats, { $gte: 4 });
    assert.deepEqual(pipeline[0].$match.package_price, { $lte: 750 });
    assert.equal(pipeline[1].$lookup.from, "packagedetails");
    assert.equal(pipeline[3].$project.package_description, 1);
    assert.equal(pipeline[3].$project.max_people, 1);
    assert.equal(pipeline[3].$project["details.itinerary"], 1);
    assert.equal(pipeline[3].$project["details.included_services"], 1);
    assert.ok(!pipeline.some(stage => stage.$out || stage.$merge));
});

test("destination knowledge repository reads only enrichment from the separate AI database", async () => {
    let databaseName;
    let filter;
    let options;
    const profiles = [{ siteKey: "ajloun", environmentTags: ["hilly"] }];
    const collection = { find(value, config) { filter = value; options = config; return { toArray: async () => profiles }; } };
    const client = {
        connect: async () => {},
        db(name) { databaseName = name; return { collection(collectionName) { assert.equal(collectionName, "destinationprofiles"); return collection; } }; },
        close: async () => {}
    };
    const repository = createDestinationProfileRepository({ databaseUri: "mongodb://test", aiDatabaseName: "XenonAI" }, () => client);
    const result = await repository.findAll();
    assert.equal(databaseName, "XenonAI");
    assert.deepEqual(filter, { status: "active" });
    assert.equal(options.projection.activityTags, undefined);
    assert.deepEqual(result, profiles);
    assert.equal(collection.insertOne, undefined);
    assert.equal(collection.updateOne, undefined);
});

test("repository constrains packages to the requested date", async () => {
    let pipeline;
    const client = { connect: async () => {}, db: () => ({ collection: () => ({ aggregate(value) { pipeline = value; return { toArray: async () => [] }; } }) }), close: async () => {} };
    const repository = createPackageRepository({ databaseUri: "mongodb://test", databaseName: "Xenon" }, () => client);
    await repository.findCandidates({ people: 1, packageTypes: [], travelDate: "2026-09-05" });
    assert.equal(pipeline[0].$match.startDate.$lte.toISOString(), "2026-09-05T23:59:59.999Z");
    assert.equal(pipeline[0].$match.endDate.$gte.toISOString(), "2026-09-05T00:00:00.000Z");
});

test("advisor converts budget, queries records, checks weather, and ranks", async () => {
    let criteria;
    const config = { packageCurrency: "USD" };
    const preferences = { extract: async () => ({ destination: "Jordan", packageTypes: ["cultural"], budget: 3000, currency: "JOD", people: 4, maxTemperatureC: 30, familyFriendly: true, travelDate: null, source: "fallback" }) };
    const currency = { convert: async () => ({ convertedAmount: 4230, rate: 1.41 }) };
    const packages = { findCandidates: async value => { criteria = value; return [
        { _id: "hot", package_name: "Hot Jordan", package_description: "Jordan", package_type: "cultural", package_price: 400, ratingsAverage: 5, tags: [], details: { location_coordinates: { lat: 1, lng: 1 } } },
        { _id: "cool", package_name: "Cool Jordan", package_description: "Jordan", package_type: "cultural", package_price: 500, ratingsAverage: 4.5, tags: ["family"], details: { location_coordinates: { lat: 2, lng: 2 } } }
    ]; } };
    const weather = { forecast: async lat => ({ available: true, maxTemperatureC: lat === 1 ? 39 : 25 }) };
    const result = await createAdvisorService({ config, preferences, currency, weather, packages }).recommend("valid travel prompt");
    assert.equal(criteria.maximumPerPerson, 1057.5);
    assert.equal(result.recommendations[0].package._id, "cool");
    assert.equal(result.recommendations[0].totalPrice, 2000);
    assert.equal(result.recommendations[1].matchesTemperaturePreference, false);
    assert.equal(result.outcome, "matches_found");
    assert.equal(result.matchingPackages.length, 2);
    assert.equal(result.topRecommendation.package._id, "cool");
    assert.match(result.reply, /top recommendation/i);
});

test("advisor uses package-owned details and AI-only environment enrichment", async () => {
    const sharedDetails = {
        itinerary: [{ title: "Forest walk", activities: ["Guided hiking trail"] }],
        included_services: [{ title: "Local guide" }, { title: "Picnic lunch" }],
        location_coordinates: { lat: 32.33, lng: 35.75 }
    };
    const packages = { findCandidates: async () => [
        { _id: "petra", package_name: "Petra trail", package_description: "A hiking day in Petra", package_type: "adventure", package_price: 50, max_people: 12, available_seats: 8, details: sharedDetails },
        { _id: "ajloun", package_name: "Ajloun forest trail", package_description: "A family hiking day in Ajloun", package_type: "adventure", package_price: 55, max_people: 10, available_seats: 8, details: sharedDetails }
    ] };
    const knowledge = { findAll: async () => [
        { name: "Petra", aliases: [], environmentTags: ["sandy"], terrainNotes: "Sandy paths." },
        { name: "Ajloun", aliases: [], environmentTags: ["hilly"], terrainNotes: "Forest hills." }
    ] };
    const dependencies = {
        config: { packageCurrency: "JOD" },
        preferences: { extract: async () => ({ packageTypes: ["adventure"], people: 4, avoidFeatures: ["sandy"], preferredActivities: ["hiking"], requiredServices: ["guide", "meals"] }) },
        currency: { convert: async () => null },
        weather: { forecast: async () => ({ available: false, reason: "No date supplied." }) },
        packages,
        knowledge
    };
    const result = await createAdvisorService(dependencies).recommend("hiking but no sandy places, with guide and lunch");
    assert.equal(result.matchingPackages.length, 1);
    assert.equal(result.topRecommendation.package._id, "ajloun");
    assert.equal(result.topRecommendation.package.max_people, 10);
    assert.match(result.topRecommendation.matchReasons.join(" "), /description or itinerary includes preferred activities: hiking/i);
    assert.match(result.topRecommendation.matchReasons.join(" "), /included services satisfy: guide, meals/i);
    assert.match(result.topRecommendation.matchReasons.join(" "), /maximum capacity is 10/i);
    assert.equal(result.topRecommendation.destinationProfile.activityTags, undefined);
});

test("advisor ranks live humidity and survives optional knowledge database failure", async () => {
    const basePackage = { package_name: "Jordan nature day", package_description: "Nature walk in Jordan", package_type: "adventure", package_price: 40, available_seats: 8, details: { location_coordinates: { lng: 35 } } };
    const dependencies = {
        config: { packageCurrency: "JOD" },
        preferences: { extract: async () => ({ destination: "Jordan", packageTypes: [], people: 2, maxHumidityPercent: 60 }) },
        currency: { convert: async () => null },
        weather: { forecast: async lat => ({ available: true, maxTemperatureC: 25, averageHumidityPercent: lat === 1 ? 80 : 45 }) },
        packages: { findCandidates: async () => [
            { ...basePackage, _id: "humid", ratingsAverage: 5, details: { location_coordinates: { lat: 1, lng: 35 } } },
            { ...basePackage, _id: "dry", ratingsAverage: 4, details: { location_coordinates: { lat: 2, lng: 35 } } }
        ] },
        knowledge: { findAll: async () => { throw new Error("optional database offline"); } }
    };
    const result = await createAdvisorService(dependencies).recommend("Jordan nature trip below 60% humidity");
    assert.equal(result.topRecommendation.package._id, "dry");
    assert.equal(result.topRecommendation.matchesHumidityPreference, true);
    assert.equal(result.recommendations.find(item => item.package._id === "humid").matchesHumidityPreference, false);
    assert.match(result.topRecommendation.matchReasons.join(" "), /45% fits your humidity preference/i);
});

test("a required service must be included, not merely listed as excluded", async () => {
    const dependencies = {
        config: { packageCurrency: "JOD" },
        preferences: { extract: async () => ({ packageTypes: [], people: 1, requiredServices: ["transport"] }) },
        currency: { convert: async () => null }, weather: { forecast: async () => null },
        packages: { findCandidates: async () => [{
            _id: "no-transport", package_name: "Walking tour", package_description: "City walk", package_price: 10,
            details: { included_services: [{ title: "Guide" }], excluded_services: [{ title: "Transport" }] }
        }] }
    };
    const result = await createAdvisorService(dependencies).recommend("tour with transport included");
    assert.equal(result.recommendations.length, 0);
});

test("advisor does not apply an unsafe budget when conversion fails", async () => {
    let criteria;
    const dependencies = {
        config: { packageCurrency: "USD" },
        preferences: { extract: async () => ({ packageTypes: [], budget: 1000, currency: "EUR", people: 1 }) },
        currency: { convert: async () => null }, weather: { forecast: async () => null },
        packages: { findCandidates: async value => { criteria = value; return []; } }
    };
    const result = await createAdvisorService(dependencies).recommend("valid travel prompt");
    assert.equal(criteria.maximumPerPerson, undefined);
    assert.equal(result.budgetFilterApplied, false);
});

test("advisor returns database alternatives when no exact package matches", async () => {
    let calls = 0;
    const dependencies = {
        config: { packageCurrency: "JOD" },
        preferences: { extract: async () => ({ destination: "Jordan", packageTypes: ["cultural"], budget: 100, currency: "JOD", people: 2 }) },
        currency: { convert: async () => ({ convertedAmount: 100 }) }, weather: { forecast: async () => null },
        packages: { findCandidates: async () => ++calls === 1 ? [] : [{ _id: "alternative", package_name: "Available adventure", package_description: "Wadi Rum", package_price: 80 }] }
    };
    const result = await createAdvisorService(dependencies).recommend("valid travel prompt");
    assert.equal(result.outcome, "no_exact_match");
    assert.equal(result.recommendations.length, 0);
    assert.equal(result.alternatives[0].package._id, "alternative");
    assert.ok(result.suggestions.length > 0);
});

test("advisor explicitly reports an empty package database", async () => {
    const dependencies = {
        config: { packageCurrency: "JOD" },
        preferences: { extract: async () => ({ packageTypes: [], people: 1 }) },
        currency: { convert: async () => null }, weather: { forecast: async () => null },
        packages: { findCandidates: async () => [] }
    };
    const result = await createAdvisorService(dependencies).recommend("valid travel prompt");
    assert.equal(result.outcome, "no_packages_available");
    assert.match(result.message, /no active packages/i);
});

test("advisor declines unrelated technical questions without querying packages", async () => {
    let queried = false;
    const dependencies = {
        config: { packageCurrency: "JOD" }, preferences: { extract: async () => { throw new Error("must not extract"); } },
        currency: {}, weather: {}, packages: { findCandidates: async () => { queried = true; return []; } }
    };
    const result = await createAdvisorService(dependencies).recommend("How do I write a Python database API?");
    assert.equal(result.outcome, "out_of_scope");
    assert.equal(queried, false);
    assert.match(result.reply, /package-selection assistant/i);
});

test("advisor explains its previous top recommendation from facts", async () => {
    const topRecommendation = { package: { package_name: "Petra Family Heritage Day" }, matchReasons: ["It matches cultural travel.", "It fits the budget."], tradeoffs: ["Forecast unavailable."] };
    const dependencies = { config: {}, preferences: {}, currency: {}, weather: {}, packages: {} };
    const result = await createAdvisorService(dependencies).recommend("why?", { preferences: { destination: "Jordan" }, topRecommendation });
    assert.equal(result.outcome, "recommendation_explanation");
    assert.match(result.reply, /Petra Family Heritage Day/);
    assert.match(result.reply, /fits the budget/);
});

test("advisor refuses unsupported tourism facts instead of inventing them", async () => {
    const dependencies = { config: {}, preferences: {}, currency: {}, weather: {}, packages: {} };
    const result = await createAdvisorService(dependencies).recommend("Who built Petra and do I need a visa?");
    assert.equal(result.outcome, "unsupported_tourism_information");
    assert.match(result.reply, /won't guess/i);
});
