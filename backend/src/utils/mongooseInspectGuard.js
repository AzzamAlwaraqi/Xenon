// Mongoose 9.7.4 bug workaround (not application logic):
// When populating a UUID-typed ref across a multi-document result set, Mongoose's
// internal CastError formatter calls util.inspect() on a Document whose internal
// $__ state isn't fully built yet, which throws "Cannot read properties of undefined
// (reading 'populated')" from inside $__hasOnlyPrimitiveValues. That secondary crash
// replaces whatever (usually harmless/internal) error Mongoose was trying to report,
// turning normal populate() calls into a fatal 500 for any endpoint listing 2+ items.
// This makes Document inspection defensive so that failure can't happen, without
// changing any query/business logic.
const mongoose = require("mongoose");
const util = require("util");

const safeInspect = function () {
    try {
        return this.toObject ? this.toObject() : Object.assign({}, this);
    } catch (e) {
        return `[Document: inspect failed - ${e.message}]`;
    }
};

mongoose.Document.prototype.inspect = safeInspect;
mongoose.Document.prototype[util.inspect.custom] = safeInspect;
