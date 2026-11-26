//  ===== إزاي تضيفي صور الطلبة (من غير كود) =====
//  سمي صورة كل طالب برقمه في الشيت وحطيها في فولدر photos:
//  الطالب رقم 1 -> photos/1.jpg ، رقم 2 -> photos/2.jpg ... وهكذا (لازم jpg)
//  الصورة بتظهر لوحدها. مش لازم تلمسي أي كود.
//  (اختياري) لو عايزة اسم صورة مختلف اكتبي photo: "photos/اسم.jpg" في سطر الطالب.
//
// ======================================================
//  data.js  —  الملف الوحيد اللي هتعدلي فيه (مش محتاجة تلمسي index.html)
// ======================================================

// 1) كود الدفعة: لازم الطالب يكتبه وهو بيسجل أول مرة (بعدها بيختار باسورد خاص بيه)
const PASSWORD = "Pharmily16";

// 1-ب) صورة الغلاف (اختياري): حطي صورة في photos باسم hero.jpg وهتظهر لوحدها ورا العنوان الكبير
const HERO_PHOTO = "photos/hero.jpg";

// 2) قايمة الطلبة. كل طالب سطر واحد بين { } ومفصول بفاصلة , في الآخر.
//    name     = الاسم زي ما هو في الشيت (ده اللي بيتقارن وقت تسجيل الدخول - متغيريهوش)
//    nickname = اللقب. لو مفيش لقب سيبيه فاضي "" ، ولو في اكتبيه: nickname: "الدكتورة"
//    photo    = مسار الصورة جوه فولدر photos. لو فاضي بتظهر الحروف الأولى بدل الصورة
//
//    مثال طالب متعدل بالكامل:
//    { name: "amal yasser", nickname: "Lab Queen", photo: "photos/amal.jpg" },
//
//    خطوات إضافة صورة: حطي الصورة في فولدر photos (مثلاً amal.jpg)
//    وبعدين اكتبي photo: "photos/amal.jpg" (الاسم لازم يطابق بالظبط، حروف صغيرة/كبيرة مهمة)
const STUDENTS = [
  { name: "Abdelrhman Ehab", nickname: "", photo: "Abdelrhman.png" },
  { name: "amal yasser", nickname: "", photo: "" },
  { name: "mariam elsayed", nickname: "", photo: "" },
  { name: "shahd mamdouh", nickname: "", photo: "" },
  { name: "mariam albitar", nickname: "", photo: "" },
  { name: "nouran khalid", nickname: "", photo: "" },
  { name: "meral shehata", nickname: "", photo: "" },
  { name: "farah fathy", nickname: "", photo: "" },
  { name: "shahd ali", nickname: "", photo: "" },
  { name: "malak ayman", nickname: "", photo: "" },
  { name: "habiba hossam", nickname: "", photo: "" },
  { name: "mona nada", nickname: "", photo: "" },
  { name: "zahwa mohamed", nickname: "", photo: "" },
  { name: "mariam alaa", nickname: "", photo: "" },
  { name: "eman youssef", nickname: "", photo: "" },
  { name: "menna amer", nickname: "", photo: "" },
  { name: "nourhan aboelmagd", nickname: "", photo: "" },
  { name: "kholoud gamal", nickname: "", photo: "" },
  { name: "aya yasser", nickname: "", photo: "" },
  { name: "mayar esam", nickname: "", photo: "" },
  { name: "fatma khaled", nickname: "", photo: "" },
  { name: "rahma ayman", nickname: "", photo: "" },
  { name: "nada elsayed", nickname: "", photo: "" },
  { name: "aya hatem", nickname: "", photo: "" },
  { name: "raghad mahmoud", nickname: "", photo: "" },
  { name: "arwa mohsen", nickname: "", photo: "" },
  { name: "menna abdelaty", nickname: "", photo: "" },
  { name: "nour mohamed", nickname: "", photo: "" },
  { name: "nada omar", nickname: "", photo: "" },
  { name: "eman ehab", nickname: "", photo: "" },
  { name: "dana tamer", nickname: "", photo: "" },
  { name: "salma hegazy", nickname: "", photo: "" },
  { name: "shahd mohamed", nickname: "", photo: "" },
  { name: "habiba saad", nickname: "", photo: "" },
  { name: "sama amr", nickname: "", photo: "" },
  { name: "alaa labib", nickname: "", photo: "" },
  { name: "rawan anter", nickname: "", photo: "" },
  { name: "razan atef", nickname: "", photo: "" },
  { name: "eman shawki", nickname: "", photo: "" },
  { name: "aya amr", nickname: "", photo: "" },
  { name: "shimaa mahmoud", nickname: "", photo: "" },
  { name: "nourhan hosni", nickname: "", photo: "" },
  { name: "basmala haseeb", nickname: "", photo: "" },
  { name: "arwa soliman", nickname: "", photo: "" },
  { name: "tabark ehab", nickname: "", photo: "" },
  { name: "jana hisham", nickname: "", photo: "" },
  { name: "shahd rezk", nickname: "", photo: "" },
  { name: "eman fathy", nickname: "", photo: "" },
  { name: "salsabeel ebrahim", nickname: "", photo: "" },
  { name: "ahmed attia", nickname: "", photo: "" },
  { name: "karam akram", nickname: "", photo: "" },
  { name: "osama soliman", nickname: "", photo: "" },
  { name: "karem salama", nickname: "", photo: "" },
  { name: "Hazem berry", nickname: "", photo: "" },
  { name: "fadl tamer", nickname: "", photo: "" },
  { name: "ahmed fathey", nickname: "", photo: "" },
  { name: "ziad wael", nickname: "", photo: "" },
  { name: "mohamed adel", nickname: "", photo: "" },
  { name: "khaled menem", nickname: "", photo: "" },
  { name: "ali galhoum", nickname: "", photo: "" },
  { name: "mohamed alfarraj", nickname: "", photo: "" },
  { name: "ziad shalaby", nickname: "", photo: "" },
  { name: "mina atef", nickname: "", photo: "" },
  { name: "ahmed atia", nickname: "", photo: "" },
  { name: "mohamed basiouny", nickname: "", photo: "" },
  { name: "mostafa zaki", nickname: "", photo: "" },
  { name: "ziad atef", nickname: "", photo: "" },
  { name: "hitham rostom", nickname: "", photo: "" },
  { name: "assem ahmed", nickname: "", photo: "" },
  { name: "ahmed fares", nickname: "", photo: "" },
  { name: "hisham elsayed", nickname: "", photo: "" },
  { name: "abdullah elbahrawy", nickname: "", photo: "" },
  { name: "mahmoud salah", nickname: "", photo: "" },
  { name: "adham mohamed", nickname: "", photo: "" },
  { name: "yousef hisham", nickname: "", photo: "" },
  { name: "fares mohamed", nickname: "", photo: "" },
  { name: "ahmed hatem", nickname: "", photo: "" },
  { name: "mostafa basher", nickname: "", photo: "" },
  { name: "mahmoud sabry", nickname: "", photo: "" },
  { name: "ahmed reda", nickname: "", photo: "" },
  { name: "mostafa Abdullah", nickname: "", photo: "" },
  { name: "momen mohamed", nickname: "", photo: "" },
  { name: "mahmoud sherif", nickname: "", photo: "" }
];

// 3) الـ Journey: 5 سنين. كل سنة فيها عنوان ووصف وصور.
//    لإضافة صورة للسنة: حطي الصورة في photos واكتبي مسارها جوه photos: [ ... ]
//    مثال:  photos: ["photos/y1-a.jpg", "photos/y1-b.jpg"]
const JOURNEY = [
  { year: "Year 1", date: "2022", title: "The First Hello", text: "أول يوم وأول وشوش جديدة.", photos: [] },
  { year: "Year 2", date: "2023", title: "Organic Nights", text: "سهر ومذاكرة وضحك.", photos: [] },
  { year: "Year 3", date: "2024", title: "Into the Labs", text: "المعامل والبالطو الأبيض.", photos: [] },
  { year: "Year 4", date: "2025", title: "The Hardest Year", text: "شلنا بعض.", photos: [] },
  { year: "Year 5", date: "2026", title: "Almost There", text: "قرّبنا نخلص.", photos: [] }
];

// 4) رسالتك الخاصة (Special Letter) - عدليها زي ما تحبي
const LETTER = [
  "مش عارف أبدأ منين، ولا إزاي ممكن أحط خمس سنين من عمرنا في كام سطر، ولا إزاي أكتب عن مكان كان في يوم من الأيام مجرد كلية بنروحها كل يوم الصبح واحنا مش طايقين نفسنا، بس بقى النهارده جزء من حكايتنا ومن ذكرياتنا ومن أشخاص يمكن ماكنّاش نعرف إنهم هيبقوا يوم من الأيام بالأهمية دي في حياتنا. بس أتوقع أنا دلوقتي عارف هبدأ إزاي كويس.",
  "السلام عليكم ازيكم يا شباب، يارب تكونوا بخير 💗\nالمرادي أنا مش عارف انتو هتقروا الرسالة دي تاني امتى، بس دي أكتر مرة بدعيلكم فيها دايمًا تكونوا بخير فعلًا.",
  "رحلة طويلة أوي أوي قعدناها سوا، يمكن كنا كلنا داخلين وفي دماغنا أسئلة كتير وخايفين من اللي جاي، ووسط ناس جديدة بنسأل نفسنا: هل دول هيبقوا صحابي فعلًا في يوم من الأيام؟\nمحدش فينا كان عارف إن وسط المحاضرات، والسكاشن، والامتحانات، والـ deadlines، والـ panic اللي بييجي قبل كل امتحان بساعتين، هنلاقي عيلة تانية لينا بتتكوّن من غير ما ناخد بالنا، عيلة هتشاركنا الضحك والتعب والنجاحات الصغيرة اللي كانت بالنسبالنا كبيرة، وحتى اللحظات اللي ماكنّاش قادرين فيها نكمّل.",
  "يمكن اشتكينا كتير، ويمكن كان نفسنا الأيام تعدّي أسرع، وفي لحظات كتير اتمنّينا نخلص ونمشي ومنرجعش تاني. بس غريبة أوي الدنيا دي، لما قربنا فعلًا نخلص بقينا نتمنى لو نقدر نبطّأ الوقت شوية، لو نقدر نعيش يوم عادي من الأيام اللي كنا بنعتبرها مملة، نقعد في نفس الأماكن ونسمع نفس الكلام ونضحك على نفس الحاجات اللي كانت بتضحكنا من غير سبب.",
  "كانوا دايمًا بيقولوا الكنز في الرحلة مش في الوصول، صح؟ يمكن دي أكتر حاجة قادر أأكدها دلوقتي: أجمل حاجة في الرحلة دي مش كانت الدرجات ولا الشهادات ولا حتى اللحظة اللي هنلبس فيها الروب ونقف نتصور. يمكن أجمل حاجة في الرحلة دي كانت الناس، الناس اللي اتعرفنا عليهم ووجودهم خلّى الأيام تعدّي أخف، اللي ساعدونا بقلبهم من غير ما يطلبوا مقابل، اللي كانوا موجودين في أصعب فتراتنا بيعملوا ملخصات وبيعملوا أي حاجة تسهّل علينا الرحلة دي.",
  "يمكن بعد التخرج كل واحد فينا هيمشي في طريق، اللي هيشتغل واللي هيسافر، وهنتعرف على ناس جديدة، وهنبطّل نسأل على بعض، والتجمعات اللي كنا بنعملها من غير ترتيب تبقى صعبة، ويمكن يبقى أقصى اللي نقدر نعمله إننا نشوف صور بعض ونقول: فاكرين كذا؟ بس اللي بتمناه بجد إننا نفضل طول عمرنا بنسأل على بعض وبنطمّن على بعض وبنحاول نساعد بعض، دفعة متماسكة.",
  "ويمكن من هنا جه اسم Pharmily، اللي هو ميكس بين pharmacy و family، عشان نفضل دايمًا فاكرين بعض، وفاكرين إننا كنا عيلة واحدة جوا وهنفضل عيلة واحدة برّا 💗",
  "أتمنالكم بجد تنجحوا قدّام وتحققوا كل اللي نفسكم فيه، أتمنالكم بجد توصلوا لكل اللي بتحلموا بيه وكل اللي بتسعوا ليه. دي مش نهاية حكايتنا، دي نهاية فصل كان طويل شوية وكان مرهق ومليان تفاصيل، لكنه كان فصل جميل جدًا، وأتمنى تكونوا انبسطوا فيه 💗"
];
const LETTER_SIGN = "Until we meet again 💗\nPharmily - Clinical Pharmacy - Class 16.";

// 5) Future Me: بعد كام سنة تتفتح الرسالة
const FUTURE_YEARS = 5;
