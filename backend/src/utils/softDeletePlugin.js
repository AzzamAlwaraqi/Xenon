/**
 * Mongoose Soft Delete Plugin
 * Automatically filters out documents with isDeleted: true from find and aggregate queries.
 */

module.exports = function softDeletePlugin(schema) {
    // 1. Add isDeleted field to the schema if not already present
    schema.add({
        isDeleted: {
            type: Boolean,
            default: false
        }
    });

    // 2. Pre-hook for query operations
    const excludeDeleted = function () {
        const query = this.getQuery();

        // If the query doesn't explicitly filter by isDeleted, default to finding only non-deleted documents
        if (query && query.isDeleted === undefined) {
            this.where({ isDeleted: { $ne: true } });
        }
    };

    // Apply to standard Mongoose queries
    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('updateMany', excludeDeleted);

    // 3. Pre-hook for aggregations
    schema.pre('aggregate', function () {
        const pipeline = this.pipeline();
        // If the first stage isn't a $match on isDeleted, inject it
        if (pipeline.length > 0) {
            const firstStage = pipeline[0];
            if (firstStage.$match && firstStage.$match.isDeleted === undefined) {
                pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
            } else if (!firstStage.$match) {
                pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
            }
        } else {
            pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
        }
    });
};
