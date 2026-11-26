# دليل تشغيل Pharmily بالكامل (من الصفر لحد ما الدفعة كلها تشوفه)

الترتيب: **أ)** تجربة على جهازك ← **ب)** Firebase ← **ج)** GitHub Desktop ← **د)** نشر الموقع ← **هـ)** تجربة على الأجهزة ومشاركة الرابط.
المدة المتوقعة: حوالي 30 دقيقة، وكله مجاني ومن غير كارت بنكي.

---

## أ) التجربة على جهازك (اختياري)
دوس دوبل كليك على `index.html`. هيفتح في **وضع المعاينة**: التسجيل والبروفايل والذكريات شغالين، لكن البيانات على جهازك بس.
الشات والبيانات المشتركة بين الدفعة بتشتغل بعد الخطوات اللي تحت.

---

## ب) Firebase (قاعدة البيانات والتسجيل)

### 1) إنشاء المشروع
1. افتح https://console.firebase.google.com وسجّل دخول بحساب Google.
2. اضغط **Create a project** واكتب اسم مثل `pharmily16` ثم **Continue**.
3. اقفل Google Analytics (مش محتاجينه) ثم **Create project** وانتظر ثم **Continue**.

### 2) تشغيل التسجيل (Authentication)
1. من القايمة الشمال: **Build ← Authentication** ثم **Get started**.
2. تبويب **Sign-in method** ثم اختار **Email/Password**.
3. فعّل المفتاح الأول (Enable) فقط، واترك Email link مقفول، ثم **Save**.

> الموقع بيعمل إيميل داخلي لكل طالب من اسمه (مثل `amal.yasser@pharmily16.app`)، فالطلبة مش بيكتبوا إيميل خالص.

### 3) إنشاء قاعدة البيانات (Firestore)
1. **Build ← Firestore Database** ثم **Create database**.
2. اختار أقرب منطقة (مثلا `eur3` أو `europe-west`) ثم **Next**.
3. اختار **Start in production mode** ثم **Create**.

### 4) نسخ الـ Rules (مهم جدًا للحماية)
1. في Firestore افتح تبويب **Rules**.
2. امسح كل الموجود، وافتح ملف `firestore.rules` بأي محرر نصوص (Notepad)، انسخ كل محتواه والصقه.
3. اضغط **Publish**.

الـ Rules دي بتضمن إن: لازم تسجّل دخول علشان تشوف أي حاجة، كل واحد يعدّل بروفايله بس، اسم صاحب الذكرى لازم يطابق حسابه، والشات بين الاتنين بس.

### 5) ربط الموقع بالمشروع
1. اضغط ⚙️ جنب **Project Overview** ثم **Project settings**.
2. انزل لـ **Your apps** واضغط أيقونة الويب `</>`.
3. اكتب اسم مستعار (مثل `pharmily-web`)، **لا تعلّم** على Firebase Hosting، واضغط **Register app**.
4. هيظهرلك كود فيه `firebaseConfig = { ... }`. انسخ القيم اللي جوه.
5. افتح الملف `js/firebase-config.js` بـ Notepad واستبدل كل `PASTE_...`:

```js
window.firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "pharmily16.firebaseapp.com",
  projectId: "pharmily16",
  storageBucket: "pharmily16.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```
6. احفظ الملف (Ctrl+S).

> الـ `apiKey` مش سر، وعادي يتنشر على GitHub. الحماية الحقيقية من الـ Rules في الخطوة 4.

---

## ج) GitHub Desktop (رفع الملفات)

### 6) حساب GitHub وبرنامج GitHub Desktop
1. اعمل حساب مجاني على https://github.com (لو معندكيش) وفعّل الإيميل. **اسم المستخدم** (username) هيظهر في رابط الموقع، فاختاره كويس.
2. نزّل **GitHub Desktop** من https://desktop.github.com وثبّته.
3. افتحه واضغط **Sign in to GitHub.com** وسجّل بحسابك.

### 7) إضافة فولدر المشروع
1. فك ضغط ملف `pharmily.zip` في مكان ثابت (مثلا `D:\Fadl website`).
2. في GitHub Desktop: **File ← Add local repository**.
3. اضغط **Choose...** واختار فولدر **`pharmily`** نفسه، اللي جواه ملف `index.html` مباشرة. (غلطة شائعة: اختيار الفولدر الأب).
4. هتظهر رسالة "This directory does not appear to be a Git repository"، اضغط على رابط **create a repository**.
5. اتركي الاسم `pharmily` واضغط **Create repository**.

### 8) Commit ثم Publish
1. على الشمال هتلاقي كل الملفات. تحت اكتب في خانة Summary: `Pharmily site` واضغط **Commit to main**.
2. اضغط **Publish repository** (فوق).
3. **شيل علامة** `Keep this code private`، علشان GitHub Pages المجانية بتحتاج مستودع Public.
4. اضغط **Publish repository**.

---

## د) نشر الموقع (GitHub Pages)

### 9) تفعيل Pages
1. افتح `https://github.com/USERNAME/pharmily` (غيّر USERNAME لاسمك).
2. **Settings ← Pages** (من القايمة الشمال).
3. في **Build and deployment**: Source = **Deploy from a branch**.
4. Branch = **main** والفولدر **/(root)** ثم **Save**.
5. استنى 1 إلى 3 دقايق وحدّث الصفحة، وهيظهر الرابط: `https://USERNAME.github.io/pharmily/`

### 10) السماح لدومين الموقع في Firebase (بينساها الناس!)
1. Firebase ← **Authentication ← Settings ← Authorized domains**.
2. **Add domain** واكتب `USERNAME.github.io` (من غير https ومن غير `/pharmily`) ثم **Add**.

---

## هـ) التجربة على الأجهزة والمشاركة

### 11) جرّب بنفسك
1. افتح رابط الموقع من الكمبيوتر وسجّل (اسمك + كود الدفعة + باسورد + صورتك).
2. افتح نفس الرابط من **موبايلك**، وسجّل دخول بنفس الاسم والباسورد. المفروض بروفايلك وذكرياتك تظهر.
3. اطلب من زميلة تسجّل، وجرّبوا الشات والذكريات سوا.

### 12) شارك الرابط مع الدفعة
ابعت رابط `https://USERNAME.github.io/pharmily/` في جروب الدفعة، وقول لهم:
1. دوس **Register**.
2. اختار اسمك من القايمة (نفس الاسم زي الشيت).
3. اكتب **كود الدفعة**، وهو `PASSWORD` اللي في `data.js`، واختار باسورد خاص بيك.
4. سيب علامة **تذكرني** شغالة علشان تدخل على طول المرة الجاية.

### 13) إضافة الموقع كأيقونة على الموبايل (اختياري)
- **أندرويد (Chrome):** ⋮ ثم **Add to Home screen**.
- **آيفون (Safari):** زرار المشاركة ثم **Add to Home Screen**.

---

## التحديثات بعد كدا
أي تعديل (في `data.js` أو أي ملف): احفظ الملف ← افتح GitHub Desktop ← اكتب رسالة ← **Commit to main** ← **Push origin**. الموقع بيتحدث لوحده بعد دقيقة أو اتنين (جرّب Ctrl+F5 لو شايف القديم).

## أمور مفيدة
- **صورة الغلاف:** حطي صورة باسم `hero.jpg` في فولدر `photos` وهتظهر ورا العنوان الكبير.
- **زرار الاحتفال 🎉:** تحت على الشمال. دوسة بتنزّل الورق الملون، ودوسة تانية بتخفيه.
- **كود الدفعة** (`PASSWORD` في `data.js`) حماية خفيفة لأنه ظاهر في الملف.
- **الحدود المجانية:** 50 ألف قراءة يوميا و 20 ألف كتابة، وده كفاية لدفعة 78 طالب بسهولة.

## حل المشاكل الشائعة
| الرسالة أو المشكلة | الحل |
|---|---|
| صفحة التسجيل بتقول Firebase مش متوصل | راجع خطوة 5: القيم متلصقة صح؟ وحفظتي الملف ورفعتيه (Push)؟ |
| `permission-denied` / "مفيش صلاحية" | الـ Rules مش منشورة: راجع خطوة 4 واضغط Publish |
| `operation-not-allowed` | Email/Password مش مفعّل: خطوة 2 |
| `unauthorized-domain` | ضيف دومين github.io في خطوة 10 |
| "الاسم ده متسجل قبل كدا" | الطالب سجّل قبل كدا، يضغط **Sign in** بدل Register |
| طالب نسي الباسورد | Firebase ← Authentication ← Users، تمسحي حسابه من (⋮ ← Delete account)، ويسجّل من جديد |
| صفحة 404 بعد النشر | استني دقيقة، وتأكدي إن `index.html` في أول الريبو (مش جوه فولدر تاني) |
| الموقع لسه بيظهر القديم | Ctrl+F5 (أو امسح الكاش) |

---

## تحديث مهم: الرياكتات والتعليقات وذكريات Journey
الإصدار الجديد فيه رياكتات (زي فيسبوك) وتعليقات وتعديل الكابشن وإضافة ذكريات لكل سنة في Journey، وده محتاج **Rules جديدة**:
1. افتح Firebase ← Firestore Database ← **Rules**.
2. امسح الموجود والصق محتوى `firestore.rules` الجديد كله ثم **Publish**.
من غير الخطوة دي الرياكتات والتعليقات وJourney مش هتشتغل (هتظهر رسالة "مفيش صلاحية").
