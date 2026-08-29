function createPackageRepository(config, mongoFactory) {
    let client;
    async function getClient() {
        if (!client) {
            const factory = mongoFactory || (() => {
                const { MongoClient } = require("mongodb");
                return new MongoClient(config.databaseUri, { readPreference: "secondaryPreferred", serverSelectionTimeoutMS: 5000 });
            });
            client = factory();
            await client.connect();
        }
        return client;
    }

    async function findCandidates({ people, packageTypes, maximumPerPerson, travelDate, destination }) {
        const db = (await getClient()).db(config.databaseName);
        const now = new Date();
        const match = {
            package_status: "active",
            isDeleted: { $ne: true },
            available_seats: { $gte: people },
            endDate: { $gte: now }
        };
        if (packageTypes?.length) match.package_type = { $in: packageTypes };
        if (Number.isFinite(maximumPerPerson)) match.package_price = { $lte: maximumPerPerson };
        if (travelDate) {
            const dayStart = new Date(`${travelDate}T00:00:00.000Z`);
            const dayEnd = new Date(`${travelDate}T23:59:59.999Z`);
            match.startDate = { $lte: dayEnd };
            // Never widen past the "not yet expired" guard: a date in the past must not resurrect old packages.
            match.endDate = { $gte: dayStart > now ? dayStart : now };
        }
        const escaped = destination ? String(destination).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : null;
        return db.collection("packages").aggregate([
            { $match: match },
            { $lookup: { from: "packagedetails", localField: "_id", foreignField: "package_id", as: "details" } },
            { $set: { details: { $first: "$details" } } },
            { $project: {
                _id: 1, package_name: 1, package_description: 1, package_price: 1,
                package_type: 1, startDate: 1, endDate: 1, tags: 1, images: 1, max_people: 1, vendor_id: 1,
                available_seats: 1, ratingsAverage: 1, ratingsQuantity: 1,
                "details.itinerary": 1, "details.included_services": 1,
                "details.excluded_services": 1, "details.meeting_point": 1,
                "details.location_coordinates": 1, "details.cancellation_policy": 1
            } },
            // Destination is ranked, never filtered: package text often names the site and not the
            // country, so excluding non-matching text here would hide genuinely valid packages.
            ...(escaped ? [{ $set: { destinationMatch: { $cond: [{ $or: [
                { $regexMatch: { input: { $ifNull: ["$package_name", ""] }, regex: escaped, options: "i" } },
                { $regexMatch: { input: { $ifNull: ["$package_description", ""] }, regex: escaped, options: "i" } }
            ] }, 1, 0] } } }] : []),
            { $sort: { ...(escaped ? { destinationMatch: -1 } : {}), ratingsAverage: -1, package_price: 1 } },
            // Generous enough that the destination, service, and environment filters applied in the
            // advisor still have candidates left to work with.
            { $limit: 120 }
        ], { maxTimeMS: 5000 }).toArray();
    }

    async function health() {
        await (await getClient()).db(config.databaseName).command({ ping: 1 });
        return true;
    }

    async function close() {
        if (client) await client.close();
        client = null;
    }

    return { findCandidates, health, close };
}

module.exports = { createPackageRepository };
