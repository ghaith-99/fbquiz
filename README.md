# تحدي خمن اللاعب - Football Guessing Challenge

موقع تحدي كرة قدم لتخمين اللاعبين مع نظام تسجيل دخول للمستخدمين والمسؤولين وتكامل مع Supabase.

## المميزات

- واجهة مستخدم عربية سهلة الاستخدام
- نظام تسجيل دخول وتسجيل حسابات جديدة
- واجهة خاصة للمسؤولين لإدارة اللاعبين والمدربين
- عرض اللاعبين الحاليين والمعتزلين والمدربين
- إمكانية عرض التفاصيل الكاملة لكل شخصية
- تكبير الصور عند النقر عليها
- عرض الأندية التي لعب لها اللاعب وأعلام الدول
- تكامل كامل مع Supabase للتخزين والمصادقة

## متطلبات التشغيل

- متصفح ويب حديث
- اتصال بالإنترنت
- حساب Supabase

## كيفية الإعداد

1. قم بإنشاء حساب على [Supabase](https://supabase.com)
2. قم بإنشاء مشروع جديد
3. أنشئ الجداول التالية في قاعدة البيانات:

### جدول football_persons
```sql
CREATE TABLE football_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  nationality_flag TEXT,
  category TEXT,
  current_club TEXT,
  current_club_logo TEXT,
  image_url TEXT,
  achievements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### جدول previous_clubs
```sql
CREATE TABLE previous_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES football_persons(id) ON DELETE CASCADE,
  name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### جدول users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. قم بإنشاء bucket في التخزين باسم "images" مع المجلدات التالية:
   - public/persons
   - public/flags
   - public/clubs

5. استبدل قيم `SUPABASE_URL` و `SUPABASE_KEY` في ملف `app.js` بمعلومات مشروعك من صفحة الإعدادات في Supabase:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

6. قم بتشغيل الموقع في متصفح الويب

## كيفية الاستخدام

### للمستخدمين العاديين
1. قم بتسجيل الدخول باستخدام حسابك أو تسجيل حساب جديد
2. استعرض فئات اللاعبين (حاليين، معتزلين، مدربين)
3. انقر على صورة اللاعب لتكبيرها
4. انقر على "عرض التفاصيل" لمشاهدة معلومات إضافية

### للمسؤولين
1. قم بتسجيل الدخول كمسؤول
2. انتقل إلى "لوحة التحكم" في القائمة
3. يمكنك إضافة وتعديل وحذف شخصيات كرة القدم
4. أضف صور، أعلام الدول، شعارات الأندية وجميع المعلومات المطلوبة

## ملاحظات للمطورين

- يجب ضبط سياسات الأمان المناسبة في Supabase للتحكم في الوصول إلى البيانات
- يمكن تخصيص الواجهة بتعديل ملف CSS
- لإضافة مسؤول جديد، قم بتعديل حقل `is_admin` للمستخدم في جدول `users` إلى `true`

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام والتعديل. 