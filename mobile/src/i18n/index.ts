import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

const en = {
  appName:'BARQ', tagline:'Know your energy. Honor your strength.',
  welcome:'Welcome to BARQ', login:'Log In', register:'Create Account',
  email:'Email', password:'Password', fullName:'Full Name',
  forgotPassword:'Forgot Password?', noAccount:"Don't have an account?",
  signUp:'Sign Up', logout:'Log Out', biometricLogin:'Login with Face ID',
  today:'Today', recovery:'Recovery', strain:'Strain', sleep:'Sleep', profile:'Profile',
  goodMorning:'Good morning,', goodAfternoon:'Good afternoon,', goodEvening:'Good evening,',
  wellnessScore:'Wellness Score', optimal:'Optimal', good:'Good', moderate:'Moderate',
  low:'Low', poor:'Poor', fromYesterday:'from yesterday',
  weeklyWellness:'7-Day Wellness', weeklyAvg:'Weekly avg',
  recommended:'Recommended Today', logActivity:'Log Activity',
  recoveryTitle:'How recovered are you?', recoveryTrend:'Recovery Trend',
  recoverySignals:'Recovery Signals', hrv:'HRV', rhr:'Resting HR',
  skinTemp:'Skin Temp', bloodOxygen:'Blood Oxygen',
  strainTitle:"Today's exertion", strainScore:'Strain Score',
  liveActivity:'Live Activity', startActivity:'▶  Start Activity',
  pauseSession:'⏸  Pause Session', todayActivities:"Today's Activities",
  sleepTitle:"Last night's sleep", sleepScore:'Sleep Score',
  wellRested:'Well Rested', bedtime:'Bedtime', wakeUp:'Wake Up',
  sleepCoach:'Sleep Coach',
  memberSince:'Member Since', band:'Band', avgRecovery:'Avg Recovery',
  avgSleep:'Avg Sleep', streak:'Streak', workouts:'Workouts',
  yearConsistency:'2025 Consistency', yearAvg:'Year Average',
  connectedDevice:'Connected Device', goals:'Goals', notifications:'Notifications',
  language:'Language', privacy:'Privacy', support:'Support', account:'Account',
  loading:'Loading...', error:'Something went wrong', retry:'Try Again',
  pushHard:'Push hard — your body is ready',
  moderateSession:'Moderate session recommended',
  lightActivity:'Light activity only',
  restDay:'Rest day — prioritize recovery',
  days:['S','M','T','W','T','F','S'],
  synced:'LIVE', proMember:'Pro Member',
};

const ar = {
  appName:'بارق', tagline:'اعرف طاقتك. أكرم قوتك.',
  welcome:'مرحباً بك في بارق', login:'تسجيل الدخول', register:'إنشاء حساب',
  email:'البريد الإلكتروني', password:'كلمة المرور', fullName:'الاسم الكامل',
  forgotPassword:'نسيت كلمة المرور؟', noAccount:'ليس لديك حساب؟',
  signUp:'إنشاء حساب', logout:'تسجيل الخروج', biometricLogin:'الدخول ببصمة الوجه',
  today:'اليوم', recovery:'التعافي', strain:'الجهد', sleep:'النوم', profile:'حسابي',
  goodMorning:'صباح الخير،', goodAfternoon:'مساء الخير،', goodEvening:'مساء النور،',
  wellnessScore:'درجة الصحة', optimal:'ممتاز', good:'جيد', moderate:'متوسط',
  low:'منخفض', poor:'ضعيف', fromYesterday:'عن أمس',
  weeklyWellness:'مؤشر 7 أيام', weeklyAvg:'متوسط الأسبوع',
  recommended:'موصى به اليوم', logActivity:'سجّل النشاط',
  recoveryTitle:'كيف مستوى تعافيك؟', recoveryTrend:'اتجاه التعافي',
  recoverySignals:'مؤشرات التعافي', hrv:'تباين القلب', rhr:'معدل الراحة',
  skinTemp:'حرارة الجلد', bloodOxygen:'الأكسجين',
  strainTitle:'مجهودك اليوم', strainScore:'درجة الجهد',
  liveActivity:'النشاط المباشر', startActivity:'▶  ابدأ النشاط',
  pauseSession:'⏸  إيقاف مؤقت', todayActivities:'أنشطة اليوم',
  sleepTitle:'نومك الليلة الماضية', sleepScore:'درجة النوم',
  wellRested:'مرتاح جيداً', bedtime:'وقت النوم', wakeUp:'الاستيقاظ',
  sleepCoach:'مساعد النوم',
  memberSince:'عضو منذ', band:'الجهاز', avgRecovery:'متوسط التعافي',
  avgSleep:'متوسط النوم', streak:'التتابع', workouts:'التمارين',
  yearConsistency:'انتظام 2025', yearAvg:'متوسط السنة',
  connectedDevice:'الجهاز المتصل', goals:'الأهداف', notifications:'الإشعارات',
  language:'اللغة', privacy:'الخصوصية', support:'الدعم', account:'الحساب',
  loading:'جاري التحميل...', error:'حدث خطأ', retry:'حاول مجدداً',
  pushHard:'جسدك جاهز — اضغط بقوة',
  moderateSession:'جلسة متوسطة موصى بها',
  lightActivity:'نشاط خفيف فقط',
  restDay:'يوم راحة — ركّز على التعافي',
  days:['أح','إث','ثل','أر','خم','جم','سب'],
  synced:'مباشر', proMember:'عضو Pro',
};

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function switchLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);
  const isRTL = lang === 'ar';
  I18nManager.forceRTL(isRTL);
}

export default i18n;
