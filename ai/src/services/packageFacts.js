function searchablePackage(item) {
    return [item.package_name, item.package_description, ...(item.tags || []), item.details?.meeting_point,
        ...(item.details?.itinerary || []).flatMap(day => [day.title, day.activities]),
        ...(item.details?.included_services || []).flatMap(service => [service.title, service.description]),
        ...(item.details?.excluded_services || []).flatMap(service => [service.title, service.description])]
        .filter(Boolean).join(" ").toLowerCase();
}

function packageActivityText(item) {
    return [item.package_description, ...(item.details?.itinerary || []).flatMap(day => [day.title, day.activities])]
        .filter(Boolean).join(" ").toLowerCase();
}

function includedServicesText(item) {
    return (item.details?.included_services || []).flatMap(service => [service.title, service.description])
        .filter(Boolean).join(" ").toLowerCase();
}

const SERVICE_PATTERNS = {
    guide: /\bguide|guided|tour guide|\u0645\u0631\u0634\u062f/iu,
    transport: /\btransport|transfer|pickup|pick-up|bus|vehicle|\u0646\u0642\u0644|\u062a\u0648\u0635\u064a\u0644/iu,
    meals: /\bmeal|lunch|dinner|breakfast|food|\u0648\u062c\u0628\u0629|\u063a\u062f\u0627\u0621|\u0639\u0634\u0627\u0621|\u0625\u0641\u0637\u0627\u0631/iu,
    tickets: /\bticket|entry|admission|entrance|\u062a\u0630\u0643\u0631\u0629|\u062f\u062e\u0648\u0644/iu,
    accommodation: /\bhotel|accommodation|camp|overnight|\u0641\u0646\u062f\u0642|\u0625\u0642\u0627\u0645\u0629|\u0645\u062e\u064a\u0645/iu,
    equipment: /\bequipment|gear|rental|\u0645\u0639\u062f\u0627\u062a/iu,
    "child-friendly": /\bchild[- ]friendly|children|kids|family|\u0623\u0637\u0641\u0627\u0644|\u0627\u0637\u0641\u0627\u0644|\u0639\u0627\u0626\u0644/iu
};

const ACTIVITY_PATTERNS = {
    history: /\bhistor|heritage|archaeolog|\u062a\u0627\u0631\u064a\u062e|\u062a\u0631\u0627\u062b|\u0622\u062b\u0627\u0631|\u0627\u062b\u0627\u0631/iu,
    museums: /\bmuseum|\u0645\u062a\u062d\u0641/iu, food: /\bfood|cuisine|tasting|\u0637\u0639\u0627\u0645|\u062a\u0630\u0648\u0642/iu,
    hiking: /\bhik|trail|trek|\u0645\u0634\u064a|\u0645\u0633\u0627\u0631/iu, nature: /\bnature|forest|wildlife|\u0637\u0628\u064a\u0639/iu,
    art: /\bart|mosaic|craft|\u0641\u0646|\u0641\u0633\u064a\u0641\u0633\u0627\u0621/iu, snorkeling: /\bsnorkel|\u063a\u0648\u0635/iu,
    stargazing: /\bstargaz|stars|\u0646\u062c\u0648\u0645/iu, spa: /\bspa|wellness|\u0633\u0628\u0627/iu,
    shopping: /\bshop|market|souq|\u062a\u0633\u0648\u0642|\u0633\u0648\u0642/iu, photography: /\bphoto|\u062a\u0635\u0648\u064a\u0631/iu
};

function includesRequiredService(item, service) {
    return SERVICE_PATTERNS[service]?.test(includedServicesText(item)) || false;
}

function includesPreferredActivity(item, activity) {
    return ACTIVITY_PATTERNS[activity]?.test(packageActivityText(item)) || false;
}

function destinationProfileFor(item, profiles) {
    const text = searchablePackage(item);
    return profiles.find(profile => [profile.name, ...(profile.aliases || [])].filter(Boolean).some(alias => text.includes(alias.toLowerCase()))) || null;
}

// A package usually names the site ("Petra") and not the country ("Jordan"), so a curated
// destination profile is consulted before deciding that a package is in the wrong place.
function matchesDestination(item, profile, destination) {
    const needle = String(destination || "").trim().toLowerCase();
    if (!needle) return true;
    if (searchablePackage(item).includes(needle)) return true;
    return [profile?.name, profile?.country, profile?.region, ...(profile?.aliases || [])]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())
        .some(alias => alias === needle || alias.includes(needle) || needle.includes(alias));
}

module.exports = { searchablePackage, packageActivityText, includedServicesText, includesRequiredService, includesPreferredActivity, destinationProfileFor, matchesDestination };
