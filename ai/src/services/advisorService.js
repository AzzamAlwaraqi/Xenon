const { classifyScope } = require("./scopeService");
const { searchablePackage, packageActivityText, includedServicesText, includesRequiredService, includesPreferredActivity, destinationProfileFor, matchesDestination } = require("./packageFacts");

const DISCLAIMER = "Weather forecasts and exchange rates can change. Recommendations include only matching database packages.";

function emptyResponse(query, outcome, reply) {
    return { query, outcome, message: reply, reply, preferences: null, budgetConversion: null, budgetFilterApplied: false, budgetConversionFailed: false, destinationFilterRelaxed: false, recommendations: [], matchingPackages: [], topRecommendation: null, alternatives: [], suggestions: [], disclaimer: DISCLAIMER };
}

function explainRecommendation(recommendation) {
    if (!recommendation) return "I do not have a previous package recommendation to explain. Tell me your destination, dates, budget, group size, preferred experience, and temperature preference first.";
    const reasons = recommendation.matchReasons?.length ? recommendation.matchReasons.join(" ") : "It ranked highest against the preferences you provided.";
    const tradeoffs = recommendation.tradeoffs?.length ? ` Trade-offs: ${recommendation.tradeoffs.join(" ")}` : "";
    return `I selected ${recommendation.package.package_name} as the top option. ${reasons}${tradeoffs}`;
}

function createAdvisorService({ config, preferences, currency, weather, packages, knowledge = { findAll: async () => [] } }) {
    async function recommend(query, context = {}) {
        const hasHistory = Boolean(context.preferences);
        const scope = classifyScope(query, hasHistory);

        // The caller referenced a conversation whose stored context is gone. Saying so beats
        // answering a follow-up as if it were an unrelated first question.
        if (context.contextLost && !hasHistory && scope === "out_of_scope") {
            return {
                ...emptyResponse(query, "context_lost", "I no longer have the earlier part of our conversation, so I cannot build on it. Tell me your destination, travel date, budget, group size, and preferred experience again and I will search the packages."),
                suggestions: ["Repeat your destination and travel date.", "State your budget and number of travellers.", "Name the package type you prefer."]
            };
        }

        if (scope === "capabilities") return emptyResponse(query, "capabilities", "I can compare only the travel packages stored in Xenon. Tell me your destination, travel date, budget and currency, number of travellers, preferred package type, and weather preference. I will return matching packages, select the strongest option, and explain the decision.");
        if (scope === "out_of_scope") return emptyResponse(query, "out_of_scope", "I’m a Xenon package-selection assistant, so I can’t answer technical or unrelated questions. I can help you compare available travel packages, prices, dates, capacity, and forecast weather. Try: ‘Find a cultural family package in Jordan under 300 JOD on September 5.’");
        if (scope === "unsupported_tourism_information") return emptyResponse(query, "unsupported_tourism_information", "That tourism question is outside the verified information stored in Xenon packages. I won't guess or use an unapproved source. I can only discuss package descriptions, itineraries, included services, dates, capacity, prices, meeting points, and configured forecast weather. Please consult an official source for visas, safety, laws, medical guidance, opening hours, transport, hotels, or general destination facts.");
        if (scope === "explain_recommendation") {
            const reply = explainRecommendation(context.topRecommendation);
            return { ...emptyResponse(query, "recommendation_explanation", reply), preferences: context.preferences, topRecommendation: context.topRecommendation || null, matchingPackages: context.topRecommendation ? [context.topRecommendation] : [] };
        }

        const preference = await preferences.extract(query, context.preferences);
        const people = Math.min(100, Math.max(1, Number(preference.people) || 1));
        const conversion = preference.budget ? await currency.convert(preference.budget, preference.currency, config.packageCurrency) : null;
        // A budget we could not convert is a budget we cannot enforce; the customer must be told.
        const budgetConversionFailed = Boolean(preference.budget) && !conversion;
        const candidates = await packages.findCandidates({
            people,
            packageTypes: preference.packageTypes,
            maximumPerPerson: conversion ? conversion.convertedAmount / people : undefined,
            travelDate: preference.travelDate,
            destination: preference.destination
        });
        let profiles = [];
        try { profiles = await knowledge.findAll(); } catch (_) { /* Optional enrichment must not break package search. */ }
        const enrichedCandidates = candidates.map(item => ({ item, profile: destinationProfileFor(item, profiles) }));

        const satisfiesRequirements = ({ item, profile }) => {
            if ((preference.requiredServices || []).some(service => !includesRequiredService(item, service))) return false;
            const environment = profile?.environmentTags || [];
            // Heat is decided from dated weather below; destination profiles describe terrain/environment.
            if ((preference.avoidFeatures || []).filter(feature => feature !== "hot").some(feature => environment.includes(feature))) return false;
            return true;
        };

        const qualified = enrichedCandidates.filter(satisfiesRequirements);
        const withDestination = qualified.filter(({ item, profile }) => matchesDestination(item, profile, preference.destination));
        // Package text often names the site ("Petra") and never the country, so a destination that
        // matches nothing is treated as a weak signal rather than an answer-destroying filter.
        const destinationFilterRelaxed = Boolean(preference.destination) && withDestination.length === 0 && qualified.length > 0;
        const relevant = (destinationFilterRelaxed ? qualified : withDestination).slice(0, 10);

        const recommendations = await Promise.all(relevant.map(async ({ item, profile }) => {
            const coordinates = item.details?.location_coordinates;
            const weatherDate = preference.travelDate || (item.startDate instanceof Date ? item.startDate.toISOString().slice(0, 10) : String(item.startDate || "").slice(0, 10)) || null;
            const forecast = await weather.forecast(coordinates?.lat, coordinates?.lng, weatherDate);
            const temperatureMatch = preference.maxTemperatureC == null || !forecast?.available ? null : forecast.maxTemperatureC <= preference.maxTemperatureC;
            const humidityMatch = preference.maxHumidityPercent == null || !forecast?.available || !Number.isFinite(forecast.averageHumidityPercent)
                ? null : forecast.averageHumidityPercent <= preference.maxHumidityPercent;
            let score = (item.ratingsAverage || 0) * 10;
            if (preference.packageTypes?.includes(item.package_type)) score += 25;
            if (preference.familyFriendly && (item.package_type === "family" || item.tags?.some(tag => /family|kids|children/i.test(tag)))) score += 15;
            if (temperatureMatch === true) score += 20;
            if (temperatureMatch === false) score -= 30;
            if (humidityMatch === true) score += 15;
            if (humidityMatch === false) score -= 25;
            const activityMatches = (preference.preferredActivities || []).filter(activity => includesPreferredActivity(item, activity));
            score += activityMatches.length * 8;
            const totalPrice = item.package_price * people;
            const matchReasons = [];
            const tradeoffs = [];
            if (preference.packageTypes?.includes(item.package_type)) matchReasons.push(`It matches your requested ${item.package_type} experience.`);
            if (conversion && totalPrice <= conversion.convertedAmount) matchReasons.push(`Its ${totalPrice} ${config.packageCurrency} total fits your converted budget.`);
            matchReasons.push(`It has enough seats for ${people} traveller(s).`);
            matchReasons.push(`Its listed maximum capacity is ${item.max_people || item.available_seats || "not specified"} people.`);
            if (preference.travelDate) matchReasons.push(`It is offered on ${preference.travelDate}.`);
            if (preference.familyFriendly && (item.package_type === "family" || item.tags?.some(tag => /family|kids|children/i.test(tag)))) matchReasons.push("It is marked as family-friendly.");
            if (temperatureMatch === true) matchReasons.push(`The forecast maximum of ${forecast.maxTemperatureC}°C fits your temperature preference.`);
            if (humidityMatch === true) matchReasons.push(`The forecast average humidity of ${forecast.averageHumidityPercent}% fits your humidity preference.`);
            if (activityMatches.length) matchReasons.push(`Its description or itinerary includes preferred activities: ${activityMatches.join(", ")}.`);
            if ((preference.requiredServices || []).length) matchReasons.push(`Its included services satisfy: ${preference.requiredServices.join(", ")}.`);
            if (profile?.terrainNotes) matchReasons.push(`Curated site terrain note: ${profile.terrainNotes}`);
            if (profile?.climateNotes) matchReasons.push(`Curated site climate note: ${profile.climateNotes}`);
            if (destinationFilterRelaxed) tradeoffs.push(`Its stored details do not confirm ${preference.destination}, so treat the destination match as approximate.`);
            if (budgetConversionFailed) tradeoffs.push(`Your ${preference.currency} budget could not be converted, so this price was not checked against it.`);
            if (temperatureMatch === false) tradeoffs.push(`The forecast maximum of ${forecast.maxTemperatureC}°C is above your preference.`);
            if (humidityMatch === false) tradeoffs.push(`The forecast average humidity of ${forecast.averageHumidityPercent}% is above your ${preference.maxHumidityPercent}% preference.`);
            if (preference.maxHumidityPercent != null && forecast?.available && !Number.isFinite(forecast.averageHumidityPercent)) tradeoffs.push("A dated humidity value is unavailable for this package.");
            if (!forecast?.available) tradeoffs.push(forecast?.reason || "Forecast weather is unavailable.");
            return { package: item, destinationProfile: profile, totalPrice, currency: config.packageCurrency, weather: forecast, matchesTemperaturePreference: temperatureMatch, matchesHumidityPreference: humidityMatch, matchReasons, tradeoffs, score };
        }));
        recommendations.sort((a, b) => b.score - a.score || a.totalPrice - b.totalPrice);

        let alternatives = [];
        if (!recommendations.length) {
            const relaxed = await packages.findCandidates({ people, packageTypes: [], maximumPerPerson: undefined, travelDate: preference.travelDate });
            alternatives = relaxed.slice(0, 5).map(item => ({
                package: item,
                totalPrice: item.package_price * people,
                currency: config.packageCurrency,
                reason: "This active package is available but does not satisfy every requested destination, type, or budget constraint."
            }));
        }

        const outcome = recommendations.length ? "matches_found" : (alternatives.length ? "no_exact_match" : "no_packages_available");
        const topRecommendation = recommendations[0] || null;
        const weatherSummary = topRecommendation?.weather?.available
            ? ` Forecast: ${topRecommendation.weather.minTemperatureC}–${topRecommendation.weather.maxTemperatureC}°C${Number.isFinite(topRecommendation.weather.averageHumidityPercent) ? ` with ${topRecommendation.weather.averageHumidityPercent}% average humidity` : ""} on ${topRecommendation.weather.date}.`
            : topRecommendation ? ` Weather note: ${topRecommendation.weather?.reason || "No forecast is available for that package date."}` : "";
        const reasonSummary = topRecommendation?.matchReasons?.length ? ` I chose it first because ${topRecommendation.matchReasons.slice(0, 3).join(" ").replace(/^./, value => value.toLowerCase())}` : "";

        // Anything the search could not honour is stated up front rather than left for the customer to discover.
        const caveats = [];
        if (preference.travelDateInPast) caveats.push("The date you gave has already passed, so I searched upcoming packages instead.");
        if (budgetConversionFailed) caveats.push(`I could not convert your ${preference.currency} budget to ${config.packageCurrency} right now, so no budget filter was applied.`);
        if (destinationFilterRelaxed) caveats.push(`No package explicitly names ${preference.destination}, so I widened the search to every matching package.`);
        const caveatSummary = caveats.length ? ` ${caveats.join(" ")}` : "";

        const reply = topRecommendation
            ? `I found ${recommendations.length} matching package(s). My top recommendation is ${topRecommendation.package.package_name} at ${topRecommendation.totalPrice} ${topRecommendation.currency} total.${reasonSummary}${weatherSummary}${caveatSummary} You can ask “why?”, “make it cheaper”, or change the date.`
            : outcome === "no_exact_match"
                ? `I could not find an exact match, but I found ${alternatives.length} available database package(s) you may want to consider.${caveatSummary} You can ask me to change the budget, date, destination, or package type.`
                : `I could not find an available package for those preferences.${caveatSummary} Try changing the date, budget, group size, destination, or package type.`;

        return {
            query,
            outcome,
            message: outcome === "matches_found"
                ? `${recommendations.length} matching package(s) found.`
                : outcome === "no_exact_match"
                    ? "No package matches every preference. Available database alternatives are provided separately."
                    : "There are currently no active packages with enough seats and valid future dates in the database.",
            preferences: preference,
            budgetConversion: conversion,
            budgetFilterApplied: Boolean(conversion),
            budgetConversionFailed,
            destinationFilterRelaxed,
            caveats,
            recommendations,
            matchingPackages: recommendations,
            topRecommendation,
            reply,
            alternatives,
            suggestions: outcome === "matches_found" ? [] : ["Increase the budget or remove the budget limit.", "Try another package type or destination.", "Choose different travel dates or reduce the group size."],
            disclaimer: DISCLAIMER
        };
    }
    return { recommend };
}

module.exports = { createAdvisorService, searchablePackage, packageActivityText, includedServicesText, includesRequiredService, includesPreferredActivity };
