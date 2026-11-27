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
//    role = "admin" أو "core" (اختياري) بيظهر تحت الكارت ومعاه إضاءة مميزة
//    خطوات إضافة صورة: حطي الصورة في فولدر photos (مثلاً amal.jpg)
//    وبعدين اكتبي photo: "photos/amal.jpg" (الاسم لازم يطابق بالظبط، حروف صغيرة/كبيرة مهمة)
const STUDENTS = [
  { name: "fadl tamer", nickname: "", photo: "photos/fadl-tamer.jpg", role: "admin" },
  { name: "salsabeel ebrahim", nickname: "", photo: "photos/salsabeel-ebrahim.jpg", role: "admin" },
  { name: "mariam elsayed", nickname: "", photo: "photos/mariam-elsayed.jpg", role: "core" },
  { name: "ziad wael", nickname: "", photo: "photos/ziad-wael.jpg", role: "core" },
  { name: "rawan anter", nickname: "", photo: "photos/rawan-anter.jpg", role: "core" },
  { name: "zahwa mohamed", nickname: "", photo: "photos/zahwa-mohamed.jpg", role: "core" },
  { name: "mahmoud sherif", nickname: "", photo: "photos/mahmoud-sherif.jpg", role: "core" },
  { name: "amal yasser", nickname: "", photo: "photos/amal-yasser.jpg" },
  { name: "shahd mamdouh", nickname: "", photo: "photos/shahd-mamdouh.jpg" },
  { name: "ahmed attia", nickname: "", photo: "photos/ahmed-attia.jpg" },
  { name: "mariam albitar", nickname: "", photo: "photos/mariam-albitar.jpg" },
  { name: "karam akram", nickname: "", photo: "photos/karam-akram.jpg" },
  { name: "nouran khalid", nickname: "", photo: "photos/nouran-khalid.jpg" },
  { name: "meral shehata", nickname: "", photo: "photos/meral-shehata.jpg" },
  { name: "osama soliman", nickname: "", photo: "photos/osama-soliman.jpg" },
  { name: "farah fathy", nickname: "", photo: "photos/farah-fathy.jpg" },
  { name: "karem salama", nickname: "", photo: "photos/karem-salama.jpg" },
  { name: "shahd ali", nickname: "", photo: "photos/shahd-ali.jpg" },
  { name: "Hazem berry", nickname: "", photo: "photos/hazem-berry.jpg" },
  { name: "malak ayman", nickname: "", photo: "photos/malak-ayman.jpg" },
  { name: "habiba hossam", nickname: "", photo: "photos/habiba-hossam.jpg" },
  { name: "ahmed fathey", nickname: "", photo: "photos/ahmed-fathey.jpg" },
  { name: "mona nada", nickname: "", photo: "photos/mona-nada.jpg" },
  { name: "mohamed adel", nickname: "", photo: "photos/mohamed-adel.jpg" },
  { name: "mariam alaa", nickname: "", photo: "photos/mariam-alaa.jpg" },
  { name: "khaled menem", nickname: "", photo: "photos/khaled-menem.jpg" },
  { name: "eman youssef", nickname: "", photo: "photos/eman-youssef.jpg" },
  { name: "menna amer", nickname: "", photo: "photos/menna-amer.jpg" },
  { name: "ali galhoum", nickname: "", photo: "photos/ali-galhoum.jpg" },
  { name: "nourhan aboelmagd", nickname: "", photo: "photos/nourhan-aboelmagd.jpg" },
  { name: "mohamed alfarraj", nickname: "", photo: "photos/mohamed-alfarraj.jpg" },
  { name: "kholoud gamal", nickname: "", photo: "photos/kholoud-gamal.jpg" },
  { name: "aya yasser", nickname: "", photo: "photos/aya-yasser.jpg" },
  { name: "ziad shalaby", nickname: "", photo: "photos/ziad-shalaby.jpg" },
  { name: "mayar esam", nickname: "", photo: "photos/mayar-esam.jpg" },
  { name: "mina atef", nickname: "", photo: "photos/mina-atef.jpg" },
  { name: "fatma khaled", nickname: "", photo: "photos/fatma-khaled.jpg" },
  { name: "ahmed atia", nickname: "", photo: "photos/ahmed-atia.jpg" },
  { name: "rahma ayman", nickname: "", photo: "photos/rahma-ayman.jpg" },
  { name: "nada elsayed", nickname: "", photo: "photos/nada-elsayed.jpg" },
  { name: "mohamed basiouny", nickname: "", photo: "photos/mohamed-basiouny.jpg" },
  { name: "aya hatem", nickname: "", photo: "photos/aya-hatem.jpg" },
  { name: "mostafa zaki", nickname: "", photo: "photos/mostafa-zaki.jpg" },
  { name: "raghad mahmoud", nickname: "", photo: "photos/raghad-mahmoud.jpg" },
  { name: "ziad atef", nickname: "", photo: "photos/ziad-atef.jpg" },
  { name: "arwa mohsen", nickname: "", photo: "photos/arwa-mohsen.jpg" },
  { name: "menna abdelaty", nickname: "", photo: "photos/menna-abdelaty.jpg" },
  { name: "hitham rostom", nickname: "", photo: "photos/hitham-rostom.jpg" },
  { name: "nour mohamed", nickname: "", photo: "photos/nour-mohamed.jpg" },
  { name: "assem ahmed", nickname: "", photo: "photos/assem-ahmed.jpg" },
  { name: "nada omar", nickname: "", photo: "photos/nada-omar.jpg" },
  { name: "eman ehab", nickname: "", photo: "photos/eman-ehab.jpg" },
  { name: "ahmed fares", nickname: "", photo: "photos/ahmed-fares.jpg" },
  { name: "dana tamer", nickname: "", photo: "photos/dana-tamer.jpg" },
  { name: "hisham elsayed", nickname: "", photo: "photos/hisham-elsayed.jpg" },
  { name: "salma hegazy", nickname: "", photo: "photos/salma-hegazy.jpg" },
  { name: "abdullah elbahrawy", nickname: "", photo: "photos/abdullah-elbahrawy.jpg" },
  { name: "shahd mohamed", nickname: "", photo: "photos/shahd-mohamed.jpg" },
  { name: "habiba saad", nickname: "", photo: "photos/habiba-saad.jpg" },
  { name: "mahmoud salah", nickname: "", photo: "photos/mahmoud-salah.jpg" },
  { name: "sama amr", nickname: "", photo: "photos/sama-amr.jpg" },
  { name: "adham mohamed", nickname: "", photo: "photos/adham-mohamed.jpg" },
  { name: "alaa labib", nickname: "", photo: "photos/alaa-labib.jpg" },
  { name: "yousef hisham", nickname: "", photo: "photos/yousef-hisham.jpg" },
  { name: "razan atef", nickname: "", photo: "photos/razan-atef.jpg" },
  { name: "eman shawki", nickname: "", photo: "photos/eman-shawki.jpg" },
  { name: "fares mohamed", nickname: "", photo: "photos/fares-mohamed.jpg" },
  { name: "aya amr", nickname: "", photo: "photos/aya-amr.jpg" },
  { name: "ahmed hatem", nickname: "", photo: "photos/ahmed-hatem.jpg" },
  { name: "shimaa mahmoud", nickname: "", photo: "photos/shimaa-mahmoud.jpg" },
  { name: "nourhan hosni", nickname: "", photo: "photos/nourhan-hosni.jpg" },
  { name: "mostafa basher", nickname: "", photo: "photos/mostafa-basher.jpg" },
  { name: "basmala haseeb", nickname: "", photo: "photos/basmala-haseeb.jpg" },
  { name: "mahmoud sabry", nickname: "", photo: "photos/mahmoud-sabry.jpg" },
  { name: "arwa soliman", nickname: "", photo: "photos/arwa-soliman.jpg" },
  { name: "ahmed reda", nickname: "", photo: "photos/ahmed-reda.jpg" },
  { name: "tabark ehab", nickname: "", photo: "photos/tabark-ehab.jpg" },
  { name: "jana hisham", nickname: "", photo: "photos/jana-hisham.jpg" },
  { name: "mostafa Abdullah", nickname: "", photo: "photos/mostafa-abdullah.jpg" },
  { name: "shahd rezk", nickname: "", photo: "photos/shahd-rezk.jpg" },
  { name: "momen mohamed", nickname: "", photo: "photos/momen-mohamed.jpg" },
  { name: "eman fathy", nickname: "", photo: "photos/eman-fathy.jpg" },
  { name: "Abdelrhman Ehab", nickname: "", photo: "" }
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
