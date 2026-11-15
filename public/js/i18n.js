/* Language support: English is the default; Arabic is an option (RTL).
   t('English text', {vars}) returns the Arabic translation when Arabic is active.
   Server messages come back in English and are translated here with tErr(). */
const I18N_AR = {
  // general
  'EGP': 'ج.م', 'Cancel': 'إلغاء', 'Save': 'حفظ', 'Delete': 'حذف', 'Are you sure?': 'هل أنت متأكد؟', 'CLOSE': 'إغلاق', 'MENU': 'القائمة',
  'Home': 'الرئيسية', 'Courses': 'الكورسات', 'My progress': 'مستواي', 'Wallet': 'المحفظة', 'Profile': 'الملف الشخصي', 'Log in': 'تسجيل الدخول',
  'Create account': 'إنشاء حساب', 'Admin': 'لوحة التحكم', 'Log out': 'تسجيل الخروج', 'LOG IN': 'دخول', 'JOIN': 'اشترك',
  'Welcome back, {name}': 'أهلًا بعودتك يا {name}', 'Start your physics journey': 'ابدأ رحلتك مع الفيزياء', 'Pick up right where you stopped.': 'كمّل من حيث توقفت.',
  'Video lessons, quizzes and exams with Eng. Ahmed Alaa.': 'دروس فيديو واختبارات وامتحانات مع م. أحمد علاء.', 'Create free account': 'أنشئ حسابًا مجانيًا',
  'Eng. Ahmed Alaa · Secondary-school physics': 'م. أحمد علاء · فيزياء الثانوية العامة', 'Logged out. See you soon!': 'تم تسجيل الخروج. نراك قريبًا!',
  'Previous': 'السابق', 'Next': 'التالي', 'Free': 'مجاني', 'General': 'عام', 'Enrolled': 'مشترك', 'All': 'الكل', 'Balance': 'الرصيد', 'Top up': 'اشحن',
  'Edit': 'تعديل', 'Search': 'بحث', 'Done': 'تم', 'Copied.': 'تم النسخ.', 'Saved.': 'تم الحفظ.', 'Remove': 'إزالة', 'None.': 'لا يوجد.',
  'Student': 'طالب', 'Students': 'الطلاب', 'Lessons': 'الدروس', 'Date': 'التاريخ', 'Score': 'الدرجة', 'Type': 'النوع', 'Details': 'التفاصيل', 'Amount': 'المبلغ',
  // grades & categories (seed data)
  '1st Secondary': 'الصف الأول الثانوي', '2nd Secondary': 'الصف الثاني الثانوي', '3rd Secondary': 'الصف الثالث الثانوي',
  'First Secondary': 'الصف الأول الثانوي', 'Second Secondary': 'الصف الثاني الثانوي', 'Third Secondary': 'الصف الثالث الثانوي',
  'Recharge': 'شحن', 'Purchase': 'شراء', 'Manual adjustment': 'تعديل يدوي',
  // topics
  'Mechanics (pendulum)': 'ميكانيكا (بندول)', 'Waves': 'موجات', 'Light': 'الضوء', 'Heat': 'الحرارة', 'Electricity': 'الكهربية', 'Magnetism': 'المغناطيسية',
  'Atom / modern physics': 'ذرة / فيزياء حديثة', 'Mechanics': 'الميكانيكا', 'Motion, forces and energy': 'الحركة والقوى والطاقة', 'Waves & Sound': 'الموجات والصوت',
  'Oscillations and resonance': 'الاهتزازات والرنين', 'Reflection, lenses and interference': 'الانعكاس والعدسات والتداخل', 'Gases and thermodynamics': 'الغازات والديناميكا الحرارية',
  "Current, Ohm's and Kirchhoff's laws": 'التيار وقانونا أوم وكيرشوف', 'Fields, induction and AC': 'المجالات والحث والتيار المتردد', 'Modern Physics': 'الفيزياء الحديثة',
  'Quantum, atom and laser': 'الكم والذرة والليزر',
  // landing
  'Secondary-school physics — done differently': 'فيزياء الثانوية العامة — بأسلوب مختلف', 'Physics,': 'الفيزياء', 'made simple.': 'ببساطة.',
  'With Eng. Ahmed Alaa: a video for every lesson, quizzes and exams marked instantly, and progress tracking step by step.': 'مع م. أحمد علاء: شرح بالفيديو لكل درس، اختبارات وامتحانات بتصحيح فوري، ومتابعة لمستواك خطوة بخطوة.',
  'Continue learning': 'كمّل مذاكرتك', 'Start your journey': 'ابدأ رحلتك', 'Browse courses': 'تصفّح الكورسات', 'Start learning today': 'ابدأ التعلّم اليوم',
  'Browse all': 'عرض الكل', 'Browse all courses': 'كل الكورسات', '{n} courses for every secondary grade': '{n} كورسات لكل صفوف الثانوي', 'Courses are coming soon.': 'الكورسات قريبًا.',
  'Curriculum': 'المنهج', 'Your path through physics': 'رحلتك في الفيزياء', "Physics isn't memorised.": 'الفيزياء لا تُحفظ…', "It's understood.": 'الفيزياء تُفهم.', 'Light mode': 'الوضع الفاتح', 'Dark mode': 'الوضع الداكن',
  'More than equations, more than grades — learn to see the laws behind everything that moves around you.': 'أكثر من معادلات وأكثر من درجات — تعلّم أن ترى القوانين وراء كل شيء يتحرك حولك.',
  'Features': 'المميزات', 'Everything in one place': 'كل ما تحتاجه في مكان واحد', 'Grades': 'الصفوف', 'Choose your year': 'اختر صفّك', '{n} courses': '{n} كورس',
  'Your first step': 'خطوتك الأولى', 'Step through the gate,': 'ادخل من البوابة،', 'start today.': 'وابدأ الآن.', 'Go to courses': 'اذهب إلى الكورسات', 'Join now': 'اشترك الآن',
  'HD video lessons': 'شرح فيديو بجودة عالية', 'Lessons organised by chapter, with a protected player and a view limit per lesson.': 'دروس مرتبة بالفصول، مع مشغّل محمي وعدد مشاهدات محدد لكل درس.',
  'Quizzes & exams': 'الاختبارات والامتحانات', 'A quiz after every chapter plus full exams with a timer, instant marking and explained answers.': 'اختبار بعد كل فصل وامتحانات شاملة بمؤقت وتصحيح فوري وشرح للإجابات.',
  'Progress tracking': 'متابعة مستواك', "See the lessons you've finished, your scores and what to revise next.": 'اعرف الدروس التي أنهيتها ودرجاتك وما تحتاج إلى مراجعته.',
  'Wallet & recharge codes': 'محفظة وأكواد شحن', 'Top up with a code and unlock any course instantly.': 'اشحن رصيدك بكود وافتح أي كورس فورًا.',
  'Organised curriculum': 'منهج منظّم', 'Every grade split into courses, chapters and lessons — nothing gets lost.': 'كل صف مقسّم إلى كورسات وفصول ودروس — لا شيء يضيع.',
  'Straight from the teacher': 'من المدرّس مباشرة', 'Content written and kept up to date by Eng. Ahmed Alaa himself.': 'محتوى يعدّه ويحدّثه م. أحمد علاء بنفسه.',
  // auth
  'Welcome back': 'أهلًا بعودتك', 'Log in and carry on where you left off.': 'سجّل دخولك وكمّل من حيث توقفت.', 'Email or mobile number': 'البريد الإلكتروني أو رقم الموبايل',
  'Password': 'كلمة المرور', 'New here?': 'جديد هنا؟', 'Create an account': 'أنشئ حسابًا', 'Welcome, {name}!': 'أهلًا {name}!', 'Begin your journey': 'ابدأ رحلتك',
  'One account for lessons, exams, your wallet and your progress.': 'حساب واحد للدروس والامتحانات والمحفظة ومتابعة مستواك.', 'New account': 'حساب جديد',
  'Full name': 'الاسم بالكامل', 'Mobile number': 'رقم الموبايل', "Parent's mobile": 'رقم ولي الأمر', 'Email': 'البريد الإلكتروني', 'Grade': 'الصف',
  'Already have an account?': 'لديك حساب؟', 'Account created — welcome!': 'تم إنشاء حسابك، أهلًا بك!',
  // courses
  '{c} chapters · {l} lessons': '{c} فصول · {l} دروس', 'All courses': 'كل الكورسات', 'No courses here yet.': 'لا توجد كورسات هنا بعد.', '{n} min': '{n} دقيقة',
  'Best {n}%': 'أفضل نتيجة {n}%', 'Exam': 'امتحان', 'Quiz': 'اختبار', '{n} Q': '{n} سؤال', '{n} chapters': '{n} فصول', '{n} lessons': '{n} دروس',
  '{n} quizzes & exams': '{n} اختبارات وامتحانات', 'Your progress': 'تقدّمك', '{d}/{n} lessons': '{d}/{n} دروس', 'Start learning': 'ابدأ التعلّم',
  'Lifetime access to every lesson, quiz and exam in this course.': 'وصول دائم لكل الدروس والاختبارات والامتحانات في هذا الكورس.', 'Buy with wallet': 'اشترِ من المحفظة',
  'Enrol for free': 'اشترك مجانًا', 'Log in to enrol': 'سجّل الدخول للاشتراك', 'Course content': 'محتوى الكورس', 'Lessons coming soon.': 'الدروس قريبًا.', 'Final exams': 'الامتحانات النهائية',
  'Enrol in the course to unlock this.': 'اشترك في الكورس لفتح هذا المحتوى.', 'Log in and enrol to unlock this.': 'سجّل الدخول واشترك لفتح هذا المحتوى.',
  'Pay {p} from your wallet to unlock "{c}"?': 'سيتم خصم {p} من محفظتك لفتح "{c}". متابعة؟', 'Pay & enrol': 'ادفع واشترك', 'Enrolled — good luck!': 'تم الاشتراك! بالتوفيق.',
  // lesson
  'View {v}/{m}': 'مشاهدة {v}/{m}', 'Completed': 'مكتمل', 'Mark as completed': 'تحديد كمكتمل', 'Lesson notes / homework': 'ملزمة الدرس / الواجب',
  "This lesson's video will be uploaded soon.": 'سيتم رفع فيديو هذا الدرس قريبًا.', 'Nice work — lesson completed!': 'أحسنت! تم إكمال الدرس.',
  // quiz
  'Questions': 'الأسئلة', 'Time limit': 'المدة', 'To pass': 'درجة النجاح', 'Attempts left': 'محاولات متبقية', 'Start exam': 'ابدأ الامتحان', 'Start quiz': 'ابدأ الاختبار',
  'No attempts left': 'لا توجد محاولات متبقية', 'Previous attempts': 'محاولات سابقة', '{n} pt': '{n} درجة', 'Submit answers': 'تسليم الإجابات', 'Submit': 'تسليم',
  "Time's up — submitting.": 'انتهى الوقت — جارٍ التسليم.', '{n} question(s) unanswered. Submit anyway?': 'يوجد {n} سؤال بدون إجابة. هل تريد التسليم؟',
  'Passed — well done!': 'ناجح! أحسنت', 'Keep practising': 'تحتاج إلى مزيد من التدريب', 'You scored {s} out of {t}.': 'حصلت على {s} من {t}.',
  'Back to course': 'العودة للكورس', 'Review': 'مراجعة الإجابات', 'Correct': 'صحيح', 'Wrong': 'خطأ', 'Explanation': 'الشرح',
  // dashboard / wallet / profile
  'Hello, {name}': 'أهلًا، {name}', 'Step by step, one lesson at a time.': 'خطوة بخطوة، درس بعد درس.', 'Pick up where you left off': 'كمّل من حيث توقفت', 'Resume': 'استكمال',
  'Enrolled courses': 'كورسات مشترك بها', 'Lessons completed': 'دروس مكتملة', 'Average score': 'متوسط الدرجات', 'Wallet balance': 'رصيد المحفظة', 'My courses': 'كورساتي',
  'Exam results': 'نتائج الامتحانات', 'No exams taken yet.': 'لم تؤدِّ أي امتحان بعد.', "You haven't enrolled in a course yet.": 'لم تشترك في أي كورس بعد.',
  'My wallet': 'محفظتي', 'Current balance': 'الرصيد الحالي', 'Recharge code': 'كود الشحن', 'Redeem code': 'شحن الرصيد', 'How to get a code': 'كيف تحصل على كود؟',
  "Pay at the centre or by Vodafone Cash / InstaPay to Eng. Ahmed's assistant.": 'ادفع في السنتر أو عبر فودافون كاش / إنستاباي لمساعد م. أحمد.',
  'Receive a recharge code (AA-XXXX-XXXX).': 'استلم كود الشحن (AA-XXXX-XXXX).', 'Enter it here — the balance appears instantly.': 'أدخله هنا — يظهر الرصيد فورًا.',
  'Use your balance to unlock any course.': 'استخدم الرصيد لفتح أي كورس.', 'History': 'سجل العمليات', 'No transactions yet.': 'لا توجد عمليات بعد.',
  '{a} added to your wallet!': 'تمت إضافة {a} إلى محفظتك!', 'My account': 'حسابي', 'Change password': 'تغيير كلمة المرور', 'Current password': 'كلمة المرور الحالية',
  'New password': 'كلمة المرور الجديدة', 'Save changes': 'حفظ التغييرات', 'Back to courses': 'العودة للكورسات',
  // admin
  'Overview': 'نظرة عامة', 'Courses & videos': 'الكورسات والفيديوهات', 'Grades & categories': 'الصفوف والتصنيفات', 'Recharge codes': 'أكواد الشحن', 'Admin panel': 'لوحة التحكم',
  'View site': 'عرض الموقع', 'Statistics': 'الإحصائيات', 'New course': 'كورس جديد', 'Students · +{n} this week': 'طالب · +{n} هذا الأسبوع', 'Course sales': 'مبيعات الكورسات',
  'Enrolments': 'اشتراكات', 'Video views': 'مشاهدات الفيديو', 'Lessons in {n} courses': 'درس في {n} كورس', 'Exam attempts · avg {n}%': 'محاولة امتحان · المتوسط {n}%',
  'Total recharged': 'إجمالي الشحن', 'Unused codes': 'أكواد غير مستخدمة', 'New students · last 14 days': 'طلاب جدد · آخر 14 يوم', 'Sales (EGP) · last 14 days': 'المبيعات (ج.م) · آخر 14 يوم',
  'Top courses': 'أكثر الكورسات اشتراكًا', 'Course': 'الكورس', 'Latest exam attempts': 'آخر محاولات الامتحانات', 'No attempts yet.': 'لا توجد محاولات بعد.',
  'Name': 'الاسم', 'Description': 'الوصف', 'Order': 'الترتيب', 'Categories': 'التصنيفات', 'Add category': 'إضافة تصنيف', 'New category': 'تصنيف جديد', 'Edit category': 'تعديل التصنيف',
  'Courses in this category will become uncategorised.': 'الكورسات الموجودة في هذا التصنيف ستصبح بدون تصنيف.', 'Course title': 'عنوان الكورس', 'Category': 'التصنيف',
  '— none —': '— بدون —', 'Price (EGP) — 0 = free': 'السعر (ج.م) — 0 = مجاني', 'Cover icon': 'أيقونة الغلاف', 'Published (visible to students)': 'منشور (يظهر للطلاب)',
  'Lesson title': 'عنوان الدرس', 'Video link': 'رابط الفيديو', 'Tip: upload to YouTube as Unlisted, or to Vimeo with domain privacy, then paste the link.': 'نصيحة: ارفع الفيديو على يوتيوب "غير مدرج" أو على Vimeo مع تقييد النطاق، ثم الصق الرابط.',
  'Notes / homework PDF link (optional)': 'رابط الملزمة / الواجب PDF (اختياري)', 'Duration (minutes)': 'المدة (بالدقائق)', 'Max views per student (0 = unlimited)': 'أقصى عدد مشاهدات لكل طالب (0 = غير محدود)',
  'Free preview (no purchase needed)': 'درس مجاني (بدون شراء)', 'No category': 'بدون تصنيف', 'Published': 'منشور', 'Draft': 'مسودة', '{n} students': '{n} طالب',
  'Manage content': 'إدارة المحتوى', 'No courses yet.': 'لا توجد كورسات بعد.', 'Edit course': 'تعديل الكورس',
  'This deletes the course with all its chapters, lessons, quizzes and enrolments.': 'سيتم حذف الكورس بكل فصوله ودروسه واختباراته واشتراكاته.',
  'Course details': 'بيانات الكورس', 'Preview': 'معاينة', 'Chapter': 'فصل', 'Chapter {n}': 'الفصل {n}', 'Lesson': 'درس', 'No video yet': 'لا يوجد فيديو بعد', '{n} views': '{n} مشاهدات',
  'No lessons yet.': 'لا توجد دروس بعد.', 'Add the first chapter.': 'أضف أول فصل.', 'Course exams': 'امتحانات الكورس', 'No exams yet.': 'لا توجد امتحانات بعد.',
  'Chapter title': 'عنوان الفصل', 'New chapter': 'فصل جديد', 'Edit chapter': 'تعديل الفصل', 'Delete this chapter with all its lessons and quizzes?': 'حذف هذا الفصل بكل دروسه واختباراته؟',
  'New lesson': 'درس جديد', 'Edit lesson': 'تعديل الدرس', 'Delete this lesson?': 'حذف هذا الدرس؟', 'New chapter quiz': 'اختبار فصل جديد', 'New exam': 'امتحان جديد',
  'Title': 'العنوان', 'Time limit (minutes)': 'المدة (بالدقائق)', 'Pass mark (%)': 'درجة النجاح (%)', 'Max attempts (0 = unlimited)': 'أقصى عدد محاولات (0 = غير محدود)',
  'Quizzes': 'الاختبارات', 'New quiz': 'اختبار جديد', 'Time': 'المدة', 'Pass': 'النجاح', 'No quizzes yet.': 'لا توجد اختبارات بعد.',
  'Delete this quiz, its questions and all student attempts?': 'حذف هذا الاختبار وأسئلته وكل محاولات الطلاب؟', 'Quiz not found.': 'الاختبار غير موجود.',
  'Question': 'السؤال', 'Points': 'الدرجة', 'Question text': 'نص السؤال', 'Options — select the correct answer:': 'الاختيارات — حدّد الإجابة الصحيحة:', 'Correct answer': 'الإجابة الصحيحة',
  'Option {n}': 'الاختيار {n}', 'Explanation shown after submitting (optional)': 'شرح يظهر بعد التسليم (اختياري)', 'Add question': 'إضافة السؤال', 'Settings': 'الإعدادات',
  '{m} min · pass {p}% · {a} · {q} questions': '{m} دقيقة · النجاح {p}% · {a} · {q} سؤال', '{n} attempts': '{n} محاولات', 'unlimited attempts': 'محاولات غير محدودة',
  'Add a question': 'إضافة سؤال', 'The correct option cannot be empty.': 'لا يمكن أن تكون الإجابة الصحيحة فارغة.', 'Question added.': 'تمت إضافة السؤال.',
  'Delete this question?': 'حذف هذا السؤال؟', 'Quiz settings': 'إعدادات الاختبار', 'Delete this quiz and all attempts?': 'حذف هذا الاختبار وكل المحاولات؟',
  'Search name, email or mobile': 'ابحث بالاسم أو البريد أو الموبايل', 'Mobile': 'الموبايل', 'Average': 'المتوسط', 'Joined': 'تاريخ التسجيل', 'Blocked': 'محظور', 'Parent': 'ولي الأمر',
  'No students found.': 'لا يوجد طلاب.', 'All students': 'كل الطلاب', 'Adjust balance': 'تعديل الرصيد', 'Enrol': 'اشتراك', 'Reset views': 'تصفير المشاهدات',
  'Unblock': 'إلغاء الحظر', 'Block': 'حظر', 'Exam attempts': 'محاولات الامتحانات', 'Courses & progress': 'الكورسات والتقدّم', 'Remove from course': 'إلغاء الاشتراك في الكورس',
  'Not enrolled in any course.': 'غير مشترك في أي كورس.', 'No attempts.': 'لا توجد محاولات.', 'No views yet.': 'لا توجد مشاهدات بعد.', 'Transactions': 'العمليات المالية',
  'Amount in EGP (negative to deduct)': 'المبلغ بالجنيه (بالسالب للخصم)', 'Note': 'ملاحظة', 'Cash payment at the centre': 'دفع نقدي في السنتر', 'Views reset.': 'تم تصفير المشاهدات.',
  'Remove this student from the course?': 'إلغاء اشتراك الطالب في هذا الكورس؟', 'Enrol for free in a course': 'اشتراك مجاني في كورس', 'Codes': 'الأكواد', 'Generate codes': 'إنشاء أكواد',
  'Sell these codes (cash, Vodafone Cash or InstaPay). Students redeem them in their wallet to buy courses.': 'بِع هذه الأكواد (نقدًا أو فودافون كاش أو إنستاباي). يشحن بها الطالب محفظته ليشتري الكورسات.',
  'Code': 'الكود', 'Value': 'القيمة', 'Status': 'الحالة', 'Created': 'تاريخ الإنشاء', 'Used by {n}': 'استخدمه {n}', 'Available': 'متاح', 'No codes yet.': 'لا توجد أكواد بعد.',
  'How many': 'العدد', 'Value of each code (EGP)': 'قيمة الكود (ج.م)', '{n} codes × {v}': '{n} كود × {v}', 'Copy all': 'نسخ الكل',
  // server messages (English from the API)
  'Please log in first.': 'سجّل الدخول أولًا.', 'Admins only.': 'هذه الصفحة للمسؤولين فقط.', 'Name, email, phone and password are required.': 'الاسم والبريد والموبايل وكلمة المرور مطلوبة.',
  'Password must be at least 6 characters.': 'كلمة المرور يجب ألا تقل عن 6 أحرف.', 'Enter a valid email.': 'أدخل بريدًا إلكترونيًا صحيحًا.',
  'Email or phone already registered.': 'البريد أو رقم الموبايل مسجّل بالفعل.', 'Wrong email/phone or password.': 'البريد/الموبايل أو كلمة المرور غير صحيحة.',
  'This account is suspended. Contact support.': 'هذا الحساب موقوف. تواصل مع الدعم.', 'Current password is wrong.': 'كلمة المرور الحالية غير صحيحة.',
  'Course not found.': 'الكورس غير موجود.', 'Lesson not found.': 'الدرس غير موجود.', 'Please log in to watch lessons.': 'سجّل الدخول لمشاهدة الدروس.',
  'Enroll in this course to unlock the lesson.': 'اشترك في الكورس لفتح هذا الدرس.', 'Exam not found.': 'الامتحان غير موجود.', 'Enroll in the course to take this exam.': 'اشترك في الكورس لدخول هذا الامتحان.',
  'No attempts left for this exam.': 'لا توجد محاولات متبقية لهذا الامتحان.', 'Invalid code.': 'الكود غير صحيح.', 'This code was already used.': 'هذا الكود مستخدم من قبل.',
  'Not found': 'غير موجود', 'Enter an amount.': 'أدخل المبلغ.', 'Enter a valid amount.': 'أدخل قيمة صحيحة.', 'That value already exists.': 'هذه القيمة موجودة بالفعل.',
  'Server error.': 'حدث خطأ في الخادم.', 'Something went wrong. Please try again.': 'حدث خطأ، حاول مرة أخرى.',
  'This is a design preview. Sign-up, lessons, exams and the wallet run on the full platform.': 'هذه نسخة عرض للتصميم. التسجيل والدروس والامتحانات والمحفظة تعمل على المنصة الكاملة.',
};
const I18N_AR_PATTERNS = [
  [/^Not enough balance\. You need (\d+) EGP more — recharge your wallet\.$/, 'رصيدك غير كافٍ. تحتاج $1 ج.م إضافية — اشحن محفظتك.'],
  [/^You used all (\d+) views for this lesson\. Ask Mr\. Ahmed to reset them\.$/, 'استنفدت كل المشاهدات المتاحة ($1) لهذا الدرس. اطلب من م. أحمد إعادة تفعيلها.'],
];

let LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
function t(s, vars) {
  let out = (LANG === 'ar' && I18N_AR[s]) || s;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return out;
}
function tErr(msg) {
  if (LANG !== 'ar') return msg;
  if (I18N_AR[msg]) return I18N_AR[msg];
  for (const [re, ar] of I18N_AR_PATTERNS) if (re.test(msg)) return msg.replace(re, ar);
  return msg;
}
/* transaction notes stored by the server ("Code AA-XXXX-XXXX", "Manual adjustment") */
function tNote(note) {
  if (!note) return '';
  if (LANG === 'ar' && /^Code /.test(note)) return note.replace(/^Code /, 'كود ');
  return t(note);
}
function setLang(l) {
  LANG = l === 'ar' ? 'ar' : 'en';
  try { localStorage.setItem('lang', LANG); } catch (e) { /* storage blocked: language still applies for this visit */ }
  const d = document.documentElement;
  d.lang = LANG; d.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  if (LANG === 'ar' && !document.getElementById('font-ar')) {
    const link = document.createElement('link');
    link.id = 'font-ar'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Lalezar&family=Tajawal:wght@400;500;700&display=swap';
    document.head.appendChild(link);
  }
  document.title = LANG === 'ar' ? 'Physics Bytes · م. أحمد علاء' : 'Physics Bytes · Eng. Ahmed Alaa';
}
if (LANG === 'ar') document.title = 'Physics Bytes · م. أحمد علاء';
