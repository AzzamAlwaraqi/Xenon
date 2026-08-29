const PACKAGE_TERMS = /trip|travel|tour|package|destination|visit|vacation|holiday|budget|weather|temperature|family|people|cultural|historical|adventure|relax|hotel|booking|hiking|sightseeing|museum|stargazing|snorkeling|guide|included|sandy|humid|jordan|petra|amman|jerash|عائل|رحلة|سفر|سياح|باقة|طقس|ميزانية|مرشد|مشي|رمل|رطوب|الأردن|الاردن|البتراء|عمان|جرش|voyage|tourisme|randonnée|humide|viaje|turismo|senderismo|húmed/iu;

// Questions about what a stored package contains are answerable from package data, so they must
// never fall through to the "unsupported tourism facts" refusal below.
const PACKAGE_ATTRIBUTE_TERMS = /\b(?:includ\w*|inclusion|itinerar\w*|meeting point|package|packages|excluded|cancellation)\b|ضمن|يتضمن|مشمول|باقة|برنامج الرحلة|inclus|forfait|incluid|paquete|itinerario|itinéraire/iu;

const TECHNICAL_TERMS = /\b(?:javascript|python|java|flutter|react|database|mongodb|api|backend|frontend|server|code|programming|algorithm|linux|windows|computer|technical)\b|برمج|كود|قاعدة بيانات|تقني/iu;

// Deliberately phrase-scoped: a bare mention of "hotel" or "safe" is usually a question about the
// package itself, which this service can answer from stored data.
const UNSUPPORTED_TOURISM_FACTS = /\b(?:visa|passport|immigration|customs declaration|law|legal|crime|restaurant|flight|airline|opening hours|who built|history of|population|politics|medical|medicine)\b|\b(?:book|booking|find|best|which|recommend)\s+(?:a\s+|an\s+|the\s+)?hotels?\b|\bhotel\s+(?:recommendation|advice|review)|\bis\s+(?:it|there|jordan|petra|amman|jerash)\b[^?]{0,20}\bsafe\b|\bsafety\s+(?:in|of|advice|tips)|\btravel\s+advisor(?:y|ies)\b|تأشيرة|تاشيرة|جواز|قانون|مطعم|طيران|من بنى|تاريخ مدينة|طبي|حجز فندق|أفضل فندق|افضل فندق/iu;

const CAPABILITY_TERMS = /what can you do|how can you help|help me choose|choose for me|recommend for me|ماذا تستطيع|كيف تساعد|ساعدني أختار|ساعدني اختار/iu;
const EXPLANATION_TERMS = /^(?:why|why this|why this one|why that one|explain|explain this|how did you choose|ليش|لماذا|اشرح|pourquoi|por qué)[?!.\s]*$/iu;
const GREETING_TERMS = /^(?:hi|hello|hey|مرحبا|مرحباً|السلام عليكم|bonjour|hola)[!,.\s]*$/iu;

function classifyScope(query, hasConversation = false) {
    const text = query.trim();
    if (EXPLANATION_TERMS.test(text) && hasConversation) return "explain_recommendation";
    if (CAPABILITY_TERMS.test(text) || GREETING_TERMS.test(text)) return "capabilities";
    if (TECHNICAL_TERMS.test(text)) return "out_of_scope";
    if (UNSUPPORTED_TOURISM_FACTS.test(text) && !PACKAGE_ATTRIBUTE_TERMS.test(text)) return "unsupported_tourism_information";
    if (PACKAGE_TERMS.test(text) || hasConversation) return "package_search";
    return "out_of_scope";
}

module.exports = { classifyScope, PACKAGE_TERMS, PACKAGE_ATTRIBUTE_TERMS };
