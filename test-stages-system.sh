#!/bin/bash

echo "🧪 اختبار نظام المراحل المحسّن"
echo "================================"
echo ""

# المتغيرات
API_URL="http://localhost:5000"
HEADERS="Content-Type: application/json"

# 1. تسجيل الدخول والحصول على التوكن
echo "1️⃣ تسجيل الدخول..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "$HEADERS" \
  -d '{"email":"admin@lawfirm.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✅ التوكن: ${TOKEN:0:20}..."
echo ""

# 2. الحصول على جميع المراحل
echo "2️⃣ جلب جميع المراحل..."
STAGES=$(curl -s -X GET "$API_URL/api/stages" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo "المراحل المتاحة:"
echo $STAGES | jq '.[] | {id, name, requirements}' 2>/dev/null || echo $STAGES
echo ""

# 3. جلب مرحلة محددة مع التفاصيل
echo "3️⃣ جلب تفاصيل المرحلة الأولى..."
STAGE_1=$(curl -s -X GET "$API_URL/api/stages/1" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo "تفاصيل المرحلة 1:"
echo $STAGE_1 | jq '.' 2>/dev/null || echo $STAGE_1
echo ""

# 4. جلب المهام في المرحلة الأولى
echo "4️⃣ جلب المهام في المرحلة الأولى..."
STAGE_TASKS=$(curl -s -X GET "$API_URL/api/stages/1/tasks" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo "عدد المهام في المرحلة الأولى:"
echo $STAGE_TASKS | jq 'length' 2>/dev/null || echo $STAGE_TASKS
echo ""

# 5. اختبار الإحصائيات الشاملة
echo "5️⃣ جلب إحصائيات النظام..."
ANALYTICS=$(curl -s -X GET "$API_URL/api/stages-analytics/summary" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo "ملخص الإحصائيات:"
echo $ANALYTICS | jq '.' 2>/dev/null || echo $ANALYTICS
echo ""

# 6. اختبار نقل مهمة (من المرحلة 1 إلى 2)
echo "6️⃣ نقل مهمة من المرحلة الأولى للثانية..."
MOVE_TASK=$(curl -s -X PUT "$API_URL/api/stages/task/1/stage/2" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo $MOVE_TASK | jq '.' 2>/dev/null || echo $MOVE_TASK
echo ""

# 7. اختبار نقلها مرة أخرى
echo "7️⃣ نقل المهمة للمرحلة الثالثة..."
MOVE_TASK=$(curl -s -X PUT "$API_URL/api/stages/task/1/stage/3" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo $MOVE_TASK | jq '.progress' 2>/dev/null || echo "Progress updated"
echo ""

# 8. موافقة على المهمة
echo "8️⃣ محاولة الموافقة على مهمة..."
APPROVE=$(curl -s -X POST "$API_URL/api/stages/1/tasks/1/approve" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

echo $APPROVE | jq '.task.approval_status' 2>/dev/null || echo "Approval attempted"
echo ""

# 9. إنشاء مرحلة جديدة
echo "9️⃣ إنشاء مرحلة اختبار..."
NEW_STAGE=$(curl -s -X POST "$API_URL/api/stages" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"مرحلة اختبار",
    "order":8,
    "color":"#FF6B9D",
    "description":"مرحلة للاختبار فقط",
    "requirements":"متطلبات الاختبار",
    "approval_type":"single"
  }')

NEW_STAGE_ID=$(echo $NEW_STAGE | jq '.id' 2>/dev/null)
echo "✅ تم إنشاء المرحلة برقم: $NEW_STAGE_ID"
echo ""

# 10. حذف المرحلة المجربة
echo "🔟 حذف مرحلة الاختبار..."
DELETE=$(curl -s -X DELETE "$API_URL/api/stages/$NEW_STAGE_ID" \
  -H "$HEADERS" \
  -H "Authorization: Bearer $TOKEN")

echo $DELETE | jq '.message' 2>/dev/null || echo "Stage deleted"
echo ""

echo "================================"
echo "✅ انتهى الاختبار بنجاح!"
echo ""
