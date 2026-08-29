// Two-tier conversation state: an in-process LRU for speed, plus an optional persistent
// repository so a service restart does not silently drop every customer's follow-up context.
function createConversationStore({ ttlMs, maximum, repository = null }) {
    const records = new Map();

    function cleanup(now = Date.now()) {
        for (const [id, record] of records) if (now - record.updatedAt > ttlMs) records.delete(id);
        while (records.size > maximum) records.delete(records.keys().next().value);
    }

    function readMemory(id) {
        const record = records.get(id);
        if (!record) return undefined;
        if (Date.now() - record.updatedAt > ttlMs) { records.delete(id); return undefined; }
        records.delete(id); records.set(id, record);
        return record;
    }

    function writeMemory(id, value) {
        records.delete(id);
        records.set(id, { ...value, updatedAt: Date.now() });
        cleanup();
    }

    async function get(id) {
        const cached = readMemory(id);
        if (cached) return cached;
        if (!repository) return undefined;
        try {
            const stored = await repository.read(id);
            if (!stored) return undefined;
            writeMemory(id, stored);
            return readMemory(id);
        } catch (_) { return undefined; }
    }

    async function set(id, value) {
        writeMemory(id, value);
        if (!repository) return;
        try { await repository.write(id, value, new Date(Date.now() + ttlMs)); }
        catch (_) { /* Persistence is an availability aid, never a request failure. */ }
    }

    return { get, set, cleanup, size: () => records.size };
}

module.exports = { createConversationStore };
