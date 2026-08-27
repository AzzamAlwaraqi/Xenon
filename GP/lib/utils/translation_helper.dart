class TranslationHelper {
  static const Map<String, String> _dictionary = {
    'Amazing Package': 'باقة مذهلة',
    'Amazing': 'مذهل',
    'Package': 'باقة',
    'Tour': 'جولة',
    'Experience': 'تجربة',
    'Trip': 'رحلة',
    'Petra': 'البتراء',
    'Wadi Rum': 'وادي رم',
    'Amman': 'عمان',
    'Aqaba': 'العقبة',
    'Dead Sea': 'البحر الميت',
    'Jordan': 'الأردن',
    'Adventure': 'مغامرة',
    'Cultural': 'ثقافي',
    'Relaxation': 'استرخاء',
    'Historical': 'تاريخي',
    'Family': 'عائلي',
    'This is an amazing and unforgettable experience for everyone. Join us for package': 'هذه تجربة مذهلة لا تُنسى للجميع. انضم إلينا في باقة',
    'No description available': 'لا يوجد وصف متاح',
  };

  static String getLocalizedTitle(String title, bool isArabic) {
    if (!isArabic) return title;
    String t = title;
    
    _dictionary.forEach((eng, ar) {
      t = t.replaceAll(RegExp(eng, caseSensitive: false), ar);
    });
    
    return t;
  }

  static String getLocalizedDescription(String desc, bool isArabic) {
    if (!isArabic) return desc;
    String d = desc;
    
    _dictionary.forEach((eng, ar) {
      d = d.replaceAll(RegExp(eng, caseSensitive: false), ar);
    });
    
    return d;
  }
}
