const messages = {
  ar: {
    HEALTH_OK: 'الخدمة تعمل بشكل طبيعي',
    REPORT_READY: 'تم إنشاء التقرير',
    TEMPLATE_NOT_FOUND: 'القالب غير موجود'
  },
  en: {
    HEALTH_OK: 'Service is healthy',
    REPORT_READY: 'Report generated',
    TEMPLATE_NOT_FOUND: 'Template not found'
  }
};

const getLang = (req) => {
  const header = req.headers['accept-language'] || 'ar';
  return header.startsWith('en') ? 'en' : 'ar';
};

const t = (req, key) => {
  const lang = getLang(req);
  return messages[lang]?.[key] || messages.ar[key] || key;
};

module.exports = { t, getLang };
