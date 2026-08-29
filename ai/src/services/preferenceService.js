const PACKAGE_TYPES = ["adventure", "cultural", "relaxation", "historical", "family"];
const AVOID_FEATURES = ["sandy", "humid", "hot", "crowded", "strenuous", "water", "heights"];
const ACTIVITY_TYPES = ["history", "museums", "food", "hiking", "nature", "art", "snorkeling", "stargazing", "spa", "shopping", "photography"];
const SERVICE_TYPES = ["guide", "transport", "meals", "tickets", "accommodation", "equipment", "child-friendly"];

const CURRENCY_WORDS = "\\$|€|usd|jod|jd|eur|dinars?|dollars?|euros?|دينار|دولار|يورو";
const BUDGET_LEAD = "budget|around|about|under|below|up to|spend|spending|max|maximum|at most|no more than|not more than|less than|within|limit|cheaper than|ميزاني(?:ة|تي)|حوالي|بحدود|بحد أقصى|بحد اقصى|أقل من|اقل من|presupuesto|environ|budget de|máximo|maximum de";
const BUDGET_TRAIL = "max|maximum|at most|or less|budget|limit|كحد أقصى|كحد اقصى|بالكثير|maximo|máximo|au maximum";
const SCALE_WORDS = "k|thousand|ألف|الف|mil|mille";
const AMOUNT = `(?:${CURRENCY_WORDS})?\\s*\\d[\\d,]*(?:\\.\\d+)?\\s*(?:${SCALE_WORDS})?\\s*(?:${CURRENCY_WORDS})?`;

function amountFromText(value) {
    const match = String(value || "").match(new RegExp(`(?:${CURRENCY_WORDS})?\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(${SCALE_WORDS})?`, "iu"));
    return match ? Number(match[1].replace(/,/g, "")) * (match[2] ? 1000 : 1) : null;
}

// A budget may lead the amount ("under 300 JOD"), trail it ("300 dinar max"), or be carried
// by the currency word alone ("300 JOD"). All three phrasings must be recognised.
function budgetTextFrom(text) {
    return text.match(new RegExp(`(?:${BUDGET_LEAD})[^\\d$€]{0,24}${AMOUNT}`, "iu"))?.[0]
        || text.match(new RegExp(`${AMOUNT}\\s*(?:${BUDGET_TRAIL})\\b`, "iu"))?.[0]
        || text.match(new RegExp(`(?:\\$|€)\\s*\\d[\\d,]*(?:\\.\\d+)?\\s*(?:${SCALE_WORDS})?`, "iu"))?.[0]
        || text.match(new RegExp(`\\d[\\d,]*(?:\\.\\d+)?\\s*(?:${SCALE_WORDS})?\\s*(?:${CURRENCY_WORDS})\\b`, "iu"))?.[0]
        || null;
}

function startOfDay(now) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isoIfReal(year, month, day) {
    const date = new Date(Date.UTC(year, month, day));
    return date.getUTCDate() === day && date.getUTCMonth() === month ? date.toISOString().slice(0, 10) : null;
}

// Returns { date, past } so callers can tell "no date given" apart from "a date that already passed".
function readTravelDate(query, now = new Date()) {
    const today = startOfDay(now).toISOString().slice(0, 10);
    const settle = value => value ? { date: value >= today ? value : null, past: value < today } : null;

    const iso = query.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
    if (iso && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`))) return settle(iso);

    const numeric = query.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);
    if (numeric) {
        const first = Number(numeric[1]);
        const second = Number(numeric[2]);
        const year = Number(numeric[3]);
        // Day-first is the local convention; fall back to month-first only when day-first is impossible.
        const resolved = isoIfReal(year, second - 1, first) || isoIfReal(year, first - 1, second);
        if (resolved) return settle(resolved);
    }

    if (/\btomorrow\b|غد[اًًا]?/iu.test(query)) return settle(new Date(now.getTime() + 86400000).toISOString().slice(0, 10));
    if (/\bnext week\b|الأسبوع القادم|الاسبوع القادم/iu.test(query)) return settle(new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10));

    const months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
    const named = query.toLowerCase().match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s+(20\d{2}))?/);
    if (named) {
        const year = named[3] ? Number(named[3]) : now.getUTCFullYear();
        let resolved = isoIfReal(year, months[named[1]], Number(named[2]));
        // A bare "September 5" that has already passed means next year, not the past.
        if (resolved && !named[3] && resolved < today) resolved = isoIfReal(year + 1, months[named[1]], Number(named[2]));
        if (resolved) return settle(resolved);
    }
    return null;
}

function parseTravelDate(query, now = new Date()) {
    return readTravelDate(query, now)?.date ?? null;
}

function fallbackPreferences(query, now = new Date()) {
    const text = query.toLowerCase();
    const budgetText = budgetTextFrom(text);
    const people = text.match(/(\d+)\s*(?:people|persons|adults|travellers|travelers|guests|أشخاص|اشخاص|أفراد|افراد|personas|personnes)/iu)?.[1];
    const explicitTemperature = text.match(/(?:under|below|maximum|max|أقل من|تحت)[^\d]{0,15}(\d{1,2})\s*°?\s*c/iu)?.[1];
    const explicitHumidity = text.match(/(?:humidity|humid|رطوبة)[^\d]{0,18}(?:under|below|max(?:imum)?|أقل من|تحت)?[^\d]{0,8}(\d{1,3})\s*%/iu)?.[1]
        || text.match(/(?:under|below|max(?:imum)?|أقل من|تحت)[^\d]{0,10}(\d{1,3})\s*%[^\n]{0,10}(?:humidity|humid|رطوبة)/iu)?.[1];
    const types = [];
    if (/cultur|ثقاف|museo|musée|museum|heritage|تراث/i.test(text)) types.push("cultural");
    if (/histor|تاريخ|archaeolog|أثر|اثر/i.test(text)) types.push("historical");
    if (/adventure|مغامر|aventura|aventure/i.test(text)) types.push("adventure");
    if (/relax|استرخاء|relaj/i.test(text)) types.push("relaxation");
    if (/family[- ]friendly|family package|باقة عائلية|paquete familiar|forfait familial/i.test(text)) types.push("family");
    const avoidFeatures = [];
    if (/no sand|not sandy|avoid sand|without sand|sans sable|pas sablonneux|sin arena|no arenos|بدون رمل|(?:لا أريد|لا اريد|تجنب)[^،,.]{0,16}رمل/iu.test(text)) avoidFeatures.push("sandy");
    if (/no humidity|not humid|avoid humidity|without humidity|pas humide|sans humidité|sin humedad|no húmed|غير رطب|بدون رطوبة|(?:لا أريد|لا اريد|تجنب)[^،,.]{0,16}رطوب/iu.test(text)) avoidFeatures.push("humid");
    if (/not hot|avoid heat|غير حار/iu.test(text)) avoidFeatures.push("hot");
    if (/not crowded|avoid crowds|غير مزدحم|بدون ازدحام/iu.test(text)) avoidFeatures.push("crowded");
    if (/not strenuous|easy walking|avoid strenuous|غير شاق/iu.test(text)) avoidFeatures.push("strenuous");
    if (/no water|avoid water|بدون ماء|لا سباحة/iu.test(text)) avoidFeatures.push("water");
    if (/no heights|afraid of heights|بدون مرتفعات|اخاف من المرتفعات/iu.test(text)) avoidFeatures.push("heights");
    const activityPatterns = { history: /histor|historia|histoire|تاريخ/i, museums: /museum|museo|musée|متحف/i, food: /food|cuisine|comida|طعام|أكل|اكل/i, hiking: /hik|randonnée|senderismo|مشي|مسار/i, nature: /nature|naturaleza|طبيع/i, art: /art|arte|فن/i, snorkeling: /snorkel|غوص/i, stargazing: /star|étoile|estrella|نجوم/i, spa: /spa|منتجع/i, shopping: /shop|achat|compras|تسوق/i, photography: /photo|fotograf|تصوير/i };
    const servicePatterns = { guide: /guide|guía|guia|مرشد/i, transport: /transport|transfer|transporte|مواصلات|نقل/i, meals: /meal|lunch|dinner|repas|comida incluida|food included|وجبة|غداء|عشاء/i, tickets: /ticket|billet|entrada incluida|entry included|تذكرة|دخول/i, accommodation: /hotel|accommodation|hébergement|alojamiento|overnight|إقامة|اقامة/i, equipment: /equipment|gear|équipement|equipo|معدات/i, "child-friendly": /child[- ]friendly|kids|enfants|niños|أطفال|اطفال/i };
    const travel = readTravelDate(query, now);
    return {
        destination: /\bjordan(?:ie)?\b|jordania|الأردن|الاردن/i.test(query) ? "Jordan" : null,
        packageTypes: [...new Set(types)],
        budget: amountFromText(budgetText),
        currency: /\b(?:jod|jd|dinar)|دينار/i.test(query) ? "JOD" : (/\b(?:eur|euro)|€/i.test(query) ? "EUR" : "USD"),
        people: people ? Number(people) : (/\bfamily\b|عائل|famil(?:y|ia|le)/i.test(query) ? 4 : 1),
        maxTemperatureC: explicitTemperature ? Number(explicitTemperature) : (/(?:not|isn['’]?t) (?:too )?hot|غير حار|مش حار|جو معتدل|pas trop chaud|no muy caluroso|cool|mild/i.test(query) ? 30 : null),
        maxHumidityPercent: explicitHumidity ? Math.min(100, Number(explicitHumidity)) : (/not humid|avoid humidity|no humidity|without humidity|غير رطب|بدون رطوبة|pas humide|sans humidité|no húmed|sin humedad/iu.test(query) ? 65 : null),
        travelDate: travel?.date ?? null,
        travelDateInPast: Boolean(travel?.past),
        familyFriendly: /\b(?:family|children|kids|familia|famille)\b|عائل|أطفال|اطفال/i.test(query),
        avoidFeatures,
        preferredActivities: ACTIVITY_TYPES.filter(item => activityPatterns[item].test(text)),
        requiredServices: SERVICE_TYPES.filter(item => servicePatterns[item].test(text))
    };
}

function mergeConversationPreferences(current, previous, query) {
    if (!previous) return current;
    const text = query.toLowerCase();
    const explicitly = {
        destination: /\bjordan(?:ie)?\b|jordania|الأردن|الاردن/iu.test(query),
        packageTypes: /cultur|ثقاف|histor|تاريخ|adventure|مغامر|relax|استرخاء|family[- ]friendly|family package|باقة عائلية/iu.test(text),
        budget: /budget|around|about|under|up to|spend|cheaper|less expensive|ميزاني|حوالي|أرخص|ارخص|presupuesto|environ|budget de|\$|€|\b(?:usd|jod|eur|jd|dinar)\b|دينار/iu.test(text),
        currency: /\$|€|\b(?:usd|jod|jd|eur|dinar|euro)\b|دينار/iu.test(text),
        people: /\d+\s*(?:people|persons|adults|travellers|travelers|guests|أشخاص|اشخاص|أفراد|افراد|personas|personnes)|family|عائل/iu.test(text),
        maxTemperatureC: /hot|cool|mild|temperature|حار|معتدل|chaud|caluroso|°/iu.test(text),
        maxHumidityPercent: /humid|humidity|رطوب|humide|húmed/iu.test(text),
        travelDate: Boolean(readTravelDate(query)),
        familyFriendly: /family|children|kids|familia|famille|عائل|أطفال|اطفال/iu.test(text),
        avoidFeatures: /sand|humid|humidity|crowd|strenuous|water|height|رمل|رطوب|ازدحام|شاق|ماء|مرتفعات/iu.test(text),
        preferredActivities: /histor|museum|food|hik|nature|art|snorkel|star|spa|shop|photo|تاريخ|متحف|طعام|مشي|طبيع|فن|غوص|نجوم|تسوق|تصوير/iu.test(text),
        requiredServices: /guide|transport|transfer|meal|lunch|dinner|ticket|entry included|hotel|accommodation|equipment|child-friendly|مرشد|نقل|وجبة|غداء|عشاء|تذكرة|دخول|إقامة|اقامة|معدات/iu.test(text)
    };
    const merged = { ...previous };
    for (const key of Object.keys(explicitly)) if (explicitly[key]) merged[key] = current[key];
    merged.travelDateInPast = current.travelDateInPast === true;
    if (/cheaper|less expensive|أرخص|ارخص/iu.test(text) && current.budget == null && Number.isFinite(previous.budget)) merged.budget = Math.round(previous.budget * 0.8 * 100) / 100;
    if (/any budget|no budget|ignore (?:the )?budget|بدون ميزانية/iu.test(text)) merged.budget = null;
    if (/any date|no date|أي تاريخ|اي تاريخ/iu.test(text)) merged.travelDate = null;
    return merged;
}

const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
        destination: { type: ["string", "null"] },
        packageTypes: { type: "array", items: { type: "string", enum: PACKAGE_TYPES } },
        budget: { type: ["number", "null"] },
        currency: { type: "string", enum: ["USD", "JOD", "EUR"] },
        people: { type: "integer", minimum: 1, maximum: 100 },
        maxTemperatureC: { type: ["number", "null"] },
        maxHumidityPercent: { type: ["number", "null"] },
        travelDate: { type: ["string", "null"] },
        familyFriendly: { type: "boolean" },
        avoidFeatures: { type: "array", items: { type: "string", enum: AVOID_FEATURES } },
        preferredActivities: { type: "array", items: { type: "string", enum: ACTIVITY_TYPES } },
        requiredServices: { type: "array", items: { type: "string", enum: SERVICE_TYPES } }
    },
    required: ["destination", "packageTypes", "budget", "currency", "people", "maxTemperatureC", "maxHumidityPercent", "travelDate", "familyFriendly", "avoidFeatures", "preferredActivities", "requiredServices"]
};

function normalizePreferences(value, fallback, now = new Date()) {
    const currency = ["USD", "JOD", "EUR"].includes(value.currency) ? value.currency : fallback.currency;
    const types = Array.isArray(value.packageTypes) ? value.packageTypes.filter(type => PACKAGE_TYPES.includes(type)).slice(0, PACKAGE_TYPES.length) : fallback.packageTypes;
    const today = startOfDay(now).toISOString().slice(0, 10);
    const proposed = typeof value.travelDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.travelDate) ? value.travelDate : null;
    // The model can return a date that has already passed; searching for one would surface expired packages.
    const date = proposed && proposed >= today ? proposed : null;
    return {
        destination: typeof value.destination === "string" ? value.destination.trim().slice(0, 100) || null : fallback.destination,
        packageTypes: types,
        budget: Number.isFinite(value.budget) && value.budget >= 0 ? value.budget : fallback.budget,
        currency,
        people: Math.min(100, Math.max(1, Number.isInteger(value.people) ? value.people : fallback.people)),
        maxTemperatureC: Number.isFinite(value.maxTemperatureC) && value.maxTemperatureC >= -50 && value.maxTemperatureC <= 60 ? value.maxTemperatureC : fallback.maxTemperatureC,
        maxHumidityPercent: Number.isFinite(value.maxHumidityPercent) && value.maxHumidityPercent >= 0 && value.maxHumidityPercent <= 100 ? value.maxHumidityPercent : fallback.maxHumidityPercent,
        travelDate: date,
        travelDateInPast: Boolean(fallback.travelDateInPast || (proposed && proposed < today)),
        familyFriendly: typeof value.familyFriendly === "boolean" ? value.familyFriendly : fallback.familyFriendly,
        avoidFeatures: Array.isArray(value.avoidFeatures) ? value.avoidFeatures.filter(item => AVOID_FEATURES.includes(item)) : fallback.avoidFeatures,
        preferredActivities: Array.isArray(value.preferredActivities) ? value.preferredActivities.filter(item => ACTIVITY_TYPES.includes(item)) : fallback.preferredActivities,
        requiredServices: Array.isArray(value.requiredServices) ? value.requiredServices.filter(item => SERVICE_TYPES.includes(item)) : fallback.requiredServices
    };
}

function createPreferenceService(config, fetchImpl = fetch) {
    async function extract(query, previous) {
        const current = fallbackPreferences(query);
        const fallback = mergeConversationPreferences(current, previous, query);
        if (!config.ollamaEnabled) return { ...fallback, source: "fallback" };
        try {
            const response = await fetchImpl(`${config.ollamaBaseUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(config.ollamaTimeoutMs),
                body: JSON.stringify({
                    model: config.ollamaModel,
                    stream: false,
                    think: false,
                    format: schema,
                    options: { temperature: 0 },
                    messages: [
                        { role: "system", content: `Extract travel preferences from any language. Today is ${new Date().toISOString().slice(0, 10)}. Preserve relevant previous preferences for follow-up messages. Do not invent facts. Return only the JSON schema.` },
                        ...(previous ? [{ role: "assistant", content: `Previous preferences: ${JSON.stringify(previous)}` }] : []),
                        { role: "user", content: query }
                    ]
                })
            });
            if (!response.ok) return { ...fallback, source: "fallback" };
            const parsed = JSON.parse((await response.json()).message?.content);
            return { ...normalizePreferences(parsed, fallback), source: `ollama:${config.ollamaModel}` };
        } catch (_) {
            return { ...fallback, source: "fallback" };
        }
    }
    return { extract };
}

module.exports = { createPreferenceService, fallbackPreferences, mergeConversationPreferences, parseTravelDate, readTravelDate, normalizePreferences, PACKAGE_TYPES, AVOID_FEATURES, ACTIVITY_TYPES, SERVICE_TYPES };
