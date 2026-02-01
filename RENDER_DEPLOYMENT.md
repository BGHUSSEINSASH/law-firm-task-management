# نشر Backend على Render.com

## خطوات النشر:

### 1️⃣ إنشاء حساب على Render.com

1. اذهب إلى: https://render.com
2. اضغط **Get Started for Free**
3. سجل دخول بـ GitHub

### 2️⃣ إنشاء Web Service جديد

1. من Dashboard، اضغط **New +**
2. اختر **Web Service**
3. اختر **Connect a repository**
4. اختر المستودع: `law-firm-task-management`

### 3️⃣ إعدادات الخدمة

```
Name: law-firm-backend
Region: Frankfurt (أو الأقرب لك)
Branch: master
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### 4️⃣ متغيرات البيئة (Environment Variables)

اضغط **Advanced** وأضف:

```
Key: NODE_ENV
Value: production

Key: PORT
Value: 5000

Key: JWT_SECRET
Value: your-super-secret-jwt-key-change-this-in-production-2024
```

### 5️⃣ النشر

1. اضغط **Create Web Service**
2. انتظر 5-10 دقائق حتى يكتمل النشر
3. انسخ الـ URL (مثل: `https://law-firm-backend.onrender.com`)

### 6️⃣ تحديث Frontend

بعد نشر Backend:

1. افتح Firebase Console
2. اذهب إلى **Hosting** → **law-firm07506050**
3. اضغط **Settings** → **Environment Variables**
4. عدّل `REACT_APP_API_URL`:
   ```
   من: http://localhost:5000/api
   إلى: https://law-firm-backend.onrender.com/api
   ```
5. احفظ وأعد النشر

أو محلياً:

```bash
# تحديث متغير البيئة
cd frontend
echo "REACT_APP_API_URL=https://law-firm-backend.onrender.com/api" > .env.production

# إعادة البناء
npm run build

# إعادة النشر على Firebase
cd ..
firebase deploy --only hosting
```

### 7️⃣ اختبار النظام

1. افتح: https://law-firm07506050.web.app
2. جرب تسجيل الدخول:
   - Email: admin@lawfirm.com
   - Password: password123
3. يجب أن يعمل بنجاح! ✅

---

## ملاحظات مهمة:

⚠️ **Render Free Tier**:
- يتوقف الخادم بعد 15 دقيقة من عدم النشاط
- يستغرق ~30 ثانية للتشغيل عند أول طلب
- مناسب للتطوير والاختبار

💡 **للتحسين**:
- استخدم خطة مدفوعة لإبقاء الخادم نشطاً
- أو استخدم خدمة Cron لإرسال ping كل 10 دقائق

---

## الروابط النهائية:

- **Frontend**: https://law-firm07506050.web.app
- **Backend**: https://law-firm-backend.onrender.com
- **GitHub**: https://github.com/BGHUSSEINSASH/law-firm-task-management
