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

// 3) الـ Journey: 6 سنين. كل سنة فيها عنوان ووصف وصور.
//    لإضافة صورة للسنة: حطي الصورة في photos واكتبي مسارها جوه photos: [ ... ]
//    مثال:  photos: ["photos/y1-a.jpg", "photos/y1-b.jpg"]
const JOURNEY = [
  { year: "Year 1", date: "2022", title: "Where It All Began", text: "أول خطوة في رحلة ماكنّاش نعرف نهايتها، وشوش جديدة وحكاية لسا بتتكتب 💓", photos: [] },
  { year: "Year 2", date: "2023", title: "Finding Our Place", text: "بدأنا نعرف المكان اكتر ونعرف بعض ونخلق ذكريات فيه تعيش للابد 💗", photos: [] },
  { year: "Year 3", date: "2024", title: "Somewhere in Between", text: "في نص الطريق ما بين أحلام بنجري وراها وأيام بنعيشها اتجمعت زكريات كتير هتفضل عايشه معانا 💗", photos: [] },
  { year: "Year 4", date: "2025", title: "The People Who Made It Home", text: "هنا نقدر نقول بجد لقد أصبحت الدار داري والرفاق رفاقي والمكان يعرفني الحمد لله 💗", photos: [] },
  { year: "Year 5", date: "2026", title: "The Beginning of Goodbye", text: "يُقالُ عِندَ الوَداع مع السَّلامَة ، أينَ السَّلامَةُ فِى وَدَاعِ المُحبِين ؟", photos: [] },
  { year: "Year 6", date: "2027", title: "Until we meet again", text: "اللهم في طرقنا القادمة، اكتب لنا ولمن أحببنا أجمل الأقدار 💗", photos: [] }
];

// 4) رسالتك الخاصة (Special Letter) - عدليها زي ما تحبي
const LETTER = [
  "مش عارف ابدأ منين، ولا إزاي ممكن احط خمس سنين من عمرنا في كام سطر ، ولا إزاي اكتب عن مكان كان في يوم من الأيام مجرد كلية بنروحها كل يوم الصبح واحنا مش طايقين نفسنا بس بقى النهارده جزء من حكايتنا ومن ذكرياتنا ومن أشخاص يمكن ماكنّاش نعرف إنهم هيبقوا يوم من الايام  بالأهمية دي في حياتنا بس اتوقع انا دلوقتي عارف هبدا ازاي كويس",
  "السلام عليكم ازيكم يشباب يارب تكونو بخير 💗\nالمرادي انا مش عارف انتو هتقرو الرساله دي تاني امتى بس دي اكتر مره بدعيلكم فيها دايما تكونو بخير فعلا",
  "رحله طويله اوي اوي قعدناها سوا ،يمكن كنا كلنا داخلين وفي دماغنا أسئلة كتير وخايفين من اللي جاي ووسط ناس جديدة بنسأل نفسنا هل دول هيبقو صحابي فعلا في يوم من الايام؟\nمحدش فينا كان عارف ان وسط المحاضرات، والسكاشن، والامتحانات، والـ deadlines، والـ panic اللي بييجي قبل كل امتحان بساعتين، هنلاقي عيلة تانيه لينا بتتكوّن من غير ما ناخد بالنا، عيله هتشاركنا الضحك والتعب والنجاحات الصغيرة اللي كانت بالنسبالنا كبيرة وحتى اللحظات اللي ماكنّاش قادرين فيها نكمّل.",
  "يمكن اشتكينا كتير ويمكن كان نفسنا الأيام تعدّي أسرع وفي لحظات كتير اتمنّينا نخلص ونمشي ومنرجعش تاني بس غريبه اوي الدنيا دي، لما قربنا فعلًا نخلص بقينا نتمنى لو نقدر نبطّأ الوقت شوية، لو نقدر نعيش يوم عادي من الأيام اللي كنا بنعتبرها مملة، نقعد في نفس الأماكن ونسمع نفس الكلام ونضحك على نفس الحاجات اللي كانت بتضحكنا من غير سبب.",
  "كانو دايما بيقولو الكنز في الرحله مش في الوصول صح؟  يمكن دي اكتر حاجه قادر اأكدها دلوقتي، أجمل حاجة في الرحله دي مش كانت الدرجات ولا الشهادات ولا حتى اللحظة اللي هنلبس فيها الروب وهنقف نتصور، يمكن أجمل حاجة في الرحله دي كانت الناس، الناس اللي اتعرفنا عليهم ووجودهم خلّى الأيام تعدي أخف، اللي ساعدونا بقلبهم من غير ما يطلبوا مقابل، اللي كانوا موجودين في اصعب فتراتنا بيعملو ملخصات وبيعملو اي حاجه لينا تسهل علينا الرحله دي",
  "يمكن بعد التخرج كل واحد فينا هيمشي في طريق اللي هيشتغل واللي هيسافر ، وهنتعرف على ناس جديدة، وهنبطل نسأل على بعض والتجمعات اللي كنا بنعملها من غير ترتيب تبقى صعبة، ويمكن يبقى أقصى اللي نقدر نعمله إننا نشوف صور بعض ونقول فاكرين كذا؟ بس اللي بتمناه بجد نفضل طول عمرنا دفعه متماسكه نفضل طول عمرنا",
  "اللي بتمناه بجد نفضل طول عمرنا بنسال ع بعض وبنطمن ع بعض وبنحاول نساعد بعض ويمكن من هنا جه اسم Pharmily بقى واللي هو يعتبر ميكس بين pharmacy و family عشان نفضل دايما فاكرين بعض وفاكرين اننا كنا عيله واحده جوا وهنفضل عيله واحده برا 💗",
  "اتمنالكم بجد تنجحو قدام وتحققو كل اللي نفسكم فيه ، اتمنالكم بجد توصلو لكل اللي بتحلموله وكل اللي بتسعو ليه  ، دي مش نهاية حكايتنا دي نهاية فصل كان طويل شويه وكان مرهق ومليان تفاصيل لكنه كان فصل جميل جدا واتمنى تكونو انبسطتو فيه 💗"
];
const LETTER_SIGN = "Until we meet again 💗\nPharmily - Clinical Pharmacy - Class 16.";

// 5) Future Me: بعد كام سنة تتفتح الرسالة
const FUTURE_YEARS = 5;
