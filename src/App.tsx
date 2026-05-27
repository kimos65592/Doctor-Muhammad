import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  Layout, Video, FileText, Settings,
  Menu, X, Sun, Moon, LogOut, Download, 
  GraduationCap, PlayCircle, FileUp, 
  Eye, AlertCircle, ClipboardList, 
  BarChart3, CheckCircle2, Trophy, Clock, 
  Users, PlusCircle, TrendingUp, Code, Construction, User,
  Calendar, Info, ChevronLeft, UploadCloud, Link as LinkIcon, Search, BarChart, Award, ExternalLink, Bell, MessageCircle, Send, Sparkles, BookOpen, Lock, ShieldAlert, Key, Check, Phone, Trash2
} from 'lucide-react';

// ==========================================
// 1. إعدادات Firebase الخاصة بك (مثبتة بالكامل)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCIBzF1hSpWOsXm65NZaaahSl1A2ny6x4U",
  authDomain: "doctor-mahmoud-67f8d.firebaseapp.com",
  projectId: "doctor-mahmoud-67f8d",
  storageBucket: "doctor-mahmoud-67f8d.firebasestorage.app",
  messagingSenderId: "601972471456",
  appId: "1:601972471456:web:175b7a926e6d880d9dbbc5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const appId = "edu-platform-pro-v1";

// ==========================================
// 2. إعدادات Cloudinary الخاصة بك
// ==========================================
const CLOUDINARY_CLOUD_NAME = "dzjqygcih"; 
const CLOUDINARY_UPLOAD_PRESET = "ggne34f9"; 

// رقم واتساب المعلم المخصص للطلاب للتواصل الفوري
const TEACHER_WHATSAPP_NUMBER = "201034851479"; 

// مفاتيح OneSignal (تستخدم لإرسال التنبيهات السحابية الفورية)
const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID"; 
const ONESIGNAL_REST_API_KEY = "YOUR_ONESIGNAL_REST_API_KEY"; 

// دالة إرسال الإشعارات عبر OneSignal REST API
const sendOneSignalNotification = async (title, message, data = {}) => {
  if (ONESIGNAL_APP_ID === "YOUR_ONESIGNAL_APP_ID" || ONESIGNAL_REST_API_KEY === "YOUR_ONESIGNAL_REST_API_KEY") {
    console.log("OneSignal integration logs:", { title, message, data });
    return;
  }
  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { en: title, ar: title },
        contents: { en: message, ar: message },
        data: data,
        included_segments: ["All"]
      })
    });
  } catch (error) {
    console.error("OneSignal Error:", error);
  }
};

// المكون الفرعي لشريط الاختيارات الجانبي مأمن بالكامل ومفصول لمنع رندرة كائنات React خاطئة
const SidebarItem = memo(({ icon: Icon, label, id, activeTab, activeSubjectTheme, setActiveTab, setSidebarOpen }) => {
  const isSelected = activeTab === id;
  const activeBtnClass = isSelected 
    ? (activeSubjectTheme === 'red' ? 'bg-red-600 text-white shadow-lg' : 
       activeSubjectTheme === 'emerald' ? 'bg-emerald-600 text-white shadow-lg' : 
       activeSubjectTheme === 'purple' ? 'bg-purple-600 text-white shadow-lg' : 
       activeSubjectTheme === 'amber' ? 'bg-amber-500 text-white shadow-lg' : 
       'bg-blue-600 text-white shadow-lg') 
    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <button 
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={`w-full p-4 flex items-center gap-4 font-bold rounded-2xl transition-all text-right ${activeBtnClass}`}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
});

SidebarItem.displayName = 'SidebarItem';

// المكون الفرعي لرسم دائرة التقدم الشهيرة من نسختك السابقة
const ProgressCircle = ({ percentage, size = 60, themeColor = 'blue' }) => {
  const radius = (size / 2) - 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const strokeColor = themeColor === 'red' ? 'text-red-500' : 
                      themeColor === 'emerald' ? 'text-emerald-500' : 
                      themeColor === 'purple' ? 'text-purple-500' : 
                      themeColor === 'amber' ? 'text-amber-500' : 'text-blue-500';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
          className={strokeColor}
        />
      </svg>
      <span className="absolute text-[10px] font-black">{Math.round(percentage)}%</span>
    </div>
  );
};

// مكون رسم بياني تفاعلي مخصص لحسابات الطلاب والمعلم باستخدام SVG
const CustomInteractiveChart = ({ data, title, themeColor = 'blue' }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value), 10);
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;
  
  const colorMap = {
    red: '#dc2626',
    emerald: '#10b981',
    purple: '#a855f7',
    amber: '#f59e0b',
    blue: '#3b82f6'
  };
  const accentHex = colorMap[themeColor] || '#3b82f6';
  const darkAccentHex = themeColor === 'red' ? '#991b1b' : 
                        themeColor === 'emerald' ? '#047857' : 
                        themeColor === 'purple' ? '#7e22ce' : 
                        themeColor === 'amber' ? '#b45309' : '#1d4ed8';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm text-right w-full">
      <h4 className="font-black text-lg mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2 justify-end">
        {title}
        <BarChart3 className="text-slate-400" size={18} />
      </h4>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + (chartHeight - padding * 2) * (1 - ratio);
            return (
              <g key={idx}>
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={chartWidth - padding} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeDasharray="4 4"
                  className="dark:stroke-slate-800"
                />
                <text 
                  x={padding - 5} 
                  y={y + 4} 
                  fill="#94a3b8" 
                  fontSize="10" 
                  textAnchor="end"
                  className="font-bold"
                >
                  {Math.round(maxVal * ratio)}
                </text>
              </g>
            );
          })}

          {data.map((item, idx) => {
            const xSpace = (chartWidth - padding * 2) / data.length;
            const x = padding + idx * xSpace + (xSpace - 24) / 2;
            const barHeight = (item.value / maxVal) * (chartHeight - padding * 2);
            const y = chartHeight - padding - barHeight;

            return (
              <g key={idx} className="group">
                <rect
                  x={x}
                  y={y}
                  width="24"
                  height={Math.max(barHeight, 2)}
                  rx="6"
                  fill="url(#barGradient)"
                  className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                />
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <rect 
                    x={x - 10} 
                    y={y - 25} 
                    width="44" 
                    height="18" 
                    rx="4" 
                    fill="#1e293b" 
                  />
                  <text 
                    x={x + 12} 
                    y={y - 13} 
                    fill="#ffffff" 
                    fontSize="10" 
                    textAnchor="middle" 
                    className="font-bold"
                  >
                    {item.value}
                  </text>
                </g>
                <text
                  x={x + 12}
                  y={chartHeight - 10}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-black dark:fill-slate-400"
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentHex} />
              <stop offset="100%" stopColor={darkAccentHex} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

const App = () => {
  // ==========================================
  // 3. تعريف حالات (useState) المكون الرئيسي في قمة الكومبوننت
  // ==========================================
  const [user, setUser] = useState(null);
  const [fbUser, setFbUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('الرئيسية');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [loginRole, setLoginRole] = useState('student');
  const [activeSubjectId, setActiveSubjectId] = useState('chemistry');

  const [subjectConfig, setSubjectConfig] = useState({
    chemistry_name: 'الكيمياء',
    chemistry_theme: 'red',
    physics_name: 'الفيزياء',
    physics_theme: 'blue',
    global_style: 'rounded-fabulous'
  });

  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [viewLogs, setViewLogs] = useState([]); 
  
  const [viewingContent, setViewingContent] = useState(null);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [showContentsList, setShowContentsList] = useState(false); 
  const [selectedStudentForLogs, setSelectedStudentForLogs] = useState(null);

  const [sortBy, setSortBy] = useState('newest'); 
  const [filterType, setFilterType] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  const [contentType, setContentType] = useState('video'); 
  const [uploadType, setUploadType] = useState('link'); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizTime, setNewQuizTime] = useState(15);
  const [isGoogleForm, setIsGoogleForm] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [newQuizQuestions, setNewQuizQuestions] = useState([]);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [currentQuestionOptions, setCurrentQuestionOptions] = useState(["", "", "", ""]);
  const [currentQuestionCorrect, setCurrentQuestionCorrect] = useState(0);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [quizTimer, setQuizTimer] = useState(0);
  const [completedQuizResult, setCompletedQuizResult] = useState(null); 
  const [reviewingQuiz, setReviewingQuiz] = useState(null); 

  const [notifications, setNotifications] = useState([]);
  const [searchStudentCode, setSearchStudentCode] = useState('');
  const [scannedStudent, setScannedStudent] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [inlineNotification, setInlineNotification] = useState(""); // تنبيهات مخصصة بدلاً من الـ alert

  // mمراجع السيرفر المتوافقة للبيئات المعزولة والـ Canvas لـ Firebase
  const configDocRef = useMemo(() => doc(db, 'artifacts', appId, 'public', 'data', 'config', 'global'), []);
  const contentsRef = useMemo(() => collection(db, 'artifacts', appId, 'public', 'data', 'contents'), []);
  const quizzesRef = useMemo(() => collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), []);
  const resultsRef = useMemo(() => collection(db, 'artifacts', appId, 'public', 'data', 'results'), []);
  const usersRef = useMemo(() => collection(db, 'artifacts', appId, 'public', 'data', 'users'), []);
  const logsRef = useMemo(() => collection(db, 'artifacts', appId, 'public', 'data', 'view_logs'), []);

  // استخراج قائمة المواد المعرّفة ديناميكياً بناءً على إعدادات المعلم
  const subjectsList = useMemo(() => {
    return [
      { 
        id: 'chemistry', 
        name: subjectConfig.chemistry_name, 
        theme: subjectConfig.chemistry_theme, 
        colorClass: subjectConfig.chemistry_theme, 
        bgGradient: subjectConfig.chemistry_theme === 'red' ? 'from-red-700 via-red-600 to-teal-900' :
                    subjectConfig.chemistry_theme === 'emerald' ? 'from-emerald-700 via-emerald-600 to-teal-900' :
                    subjectConfig.chemistry_theme === 'purple' ? 'from-purple-700 via-purple-600 to-indigo-900' :
                    subjectConfig.chemistry_theme === 'amber' ? 'from-amber-600 via-amber-500 to-stone-900' :
                    'from-blue-700 via-blue-600 to-indigo-900', 
        accentColor: subjectConfig.chemistry_theme === 'red' ? 'bg-red-600' :
                     subjectConfig.chemistry_theme === 'emerald' ? 'bg-emerald-600' :
                     subjectConfig.chemistry_theme === 'purple' ? 'bg-purple-600' :
                     subjectConfig.chemistry_theme === 'amber' ? 'bg-amber-500' : 'bg-blue-600', 
        textColor: subjectConfig.chemistry_theme === 'red' ? 'text-red-600' :
                   subjectConfig.chemistry_theme === 'emerald' ? 'text-emerald-600' :
                   subjectConfig.chemistry_theme === 'purple' ? 'text-purple-600' :
                   subjectConfig.chemistry_theme === 'amber' ? 'text-amber-500' : 'text-blue-600', 
        hoverColor: subjectConfig.chemistry_theme === 'red' ? 'hover:bg-red-50 dark:hover:bg-red-950/20' :
                    subjectConfig.chemistry_theme === 'emerald' ? 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20' :
                    subjectConfig.chemistry_theme === 'purple' ? 'hover:bg-purple-50 dark:hover:bg-purple-950/20' :
                    subjectConfig.chemistry_theme === 'amber' ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20' :
                    'hover:bg-blue-50 dark:hover:bg-blue-950/20', 
        borderColor: subjectConfig.chemistry_theme === 'red' ? 'border-red-500' :
                    subjectConfig.chemistry_theme === 'emerald' ? 'border-emerald-500' :
                    subjectConfig.chemistry_theme === 'purple' ? 'border-purple-500' :
                    subjectConfig.chemistry_theme === 'amber' ? 'border-amber-500' : 'border-blue-500'
      },
      { 
        id: 'physics', 
        name: subjectConfig.physics_name, 
        theme: subjectConfig.physics_theme, 
        colorClass: subjectConfig.physics_theme, 
        bgGradient: subjectConfig.physics_theme === 'red' ? 'from-red-700 via-red-600 to-teal-900' :
                    subjectConfig.physics_theme === 'emerald' ? 'from-emerald-700 via-emerald-600 to-teal-900' :
                    subjectConfig.physics_theme === 'purple' ? 'from-purple-700 via-purple-600 to-indigo-900' :
                    subjectConfig.physics_theme === 'amber' ? 'from-amber-600 via-amber-500 to-stone-900' :
                    'from-blue-700 via-blue-600 to-indigo-900', 
        accentColor: subjectConfig.physics_theme === 'red' ? 'bg-red-600' :
                     subjectConfig.physics_theme === 'emerald' ? 'bg-emerald-600' :
                     subjectConfig.physics_theme === 'purple' ? 'bg-purple-600' :
                     subjectConfig.physics_theme === 'amber' ? 'bg-amber-500' : 'bg-blue-600', 
        textColor: subjectConfig.physics_theme === 'red' ? 'text-red-600' :
                   subjectConfig.physics_theme === 'emerald' ? 'text-emerald-600' :
                   subjectConfig.physics_theme === 'purple' ? 'text-purple-600' :
                   subjectConfig.physics_theme === 'amber' ? 'text-amber-500' : 'text-blue-600', 
        hoverColor: subjectConfig.physics_theme === 'red' ? 'hover:bg-red-50 dark:hover:bg-red-950/20' :
                    subjectConfig.physics_theme === 'emerald' ? 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20' :
                    subjectConfig.physics_theme === 'purple' ? 'hover:bg-purple-50 dark:hover:bg-purple-950/20' :
                    subjectConfig.physics_theme === 'amber' ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20' :
                    'hover:bg-blue-50 dark:hover:bg-blue-950/20', 
        borderColor: subjectConfig.physics_theme === 'red' ? 'border-red-500' :
                    subjectConfig.physics_theme === 'emerald' ? 'border-emerald-500' :
                    subjectConfig.physics_theme === 'purple' ? 'border-purple-500' :
                    subjectConfig.physics_theme === 'amber' ? 'border-amber-500' : 'border-blue-500'
      }
    ];
  }, [subjectConfig]);

  // استخراج تفاصيل المادة الفعالة حالياً للتلوين والتطبيق البصري
  const activeSubject = useMemo(() => {
    return subjectsList.find(s => s.id === activeSubjectId) || subjectsList[0];
  }, [subjectsList, activeSubjectId]);

  // تصفية المحتويات والاختبارات حسب المادة المحددة حالياً
  const filteredContents = useMemo(() => {
    return contents.filter(c => c.subject === activeSubjectId).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  }, [contents, activeSubjectId]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => q.subject === activeSubjectId).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  }, [quizzes, activeSubjectId]);

  const filteredResults = useMemo(() => {
    return results.filter(r => r.subject === activeSubjectId);
  }, [results, activeSubjectId]);

  const filteredViewLogs = useMemo(() => {
    return viewLogs.filter(l => l.subject === activeSubjectId);
  }, [viewLogs, activeSubjectId]);

  // حساب دقيق للتحليلات الحقيقية للطالب أو المعلم بناءً على تفاعلات السيرفر والمادة النشطة حالياً
  const analytics = useMemo(() => {
    if (!user) {
      return { avg: 0, count: 0, content: 0, completed: 0, totalContents: 0, examAvg: 0, completedExams: 0 };
    }
    if (role === 'teacher') {
      const totalStudents = allStudents.length || 1;
      const uniqueActiveStudents = new Set(filteredViewLogs.map(l => l.studentName)).size;
      const avgActivity = Math.min(Math.round((uniqueActiveStudents / totalStudents) * 100), 100);
      return { avg: avgActivity, count: allStudents.length, content: filteredContents.length };
    } else {
      const myLogs = filteredViewLogs.filter(l => l.studentName === user?.name);
      const uniqueWatchedIds = new Set(myLogs.map(l => l.contentId));
      const watchedCount = uniqueWatchedIds.size;
      const totalLectures = filteredContents.length;
      const progressPercent = totalLectures > 0 ? Math.min(Math.round((watchedCount / totalLectures) * 100), 100) : 0;
      
      const myRes = filteredResults.filter(r => r.studentName === user?.name);
      const examAvg = myRes.length > 0 ? Math.round(myRes.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0) / myRes.length) : 0;

      return { completed: watchedCount, avg: progressPercent, totalContents: totalLectures, examAvg, completedExams: myRes.length };
    }
  }, [role, allStudents, filteredContents, filteredViewLogs, user, filteredResults]);

  // حساب بيانات المخطط البياني للمعلم (عدد المشاهدات لكل محاضرة في المادة النشطة)
  const teacherChartData = useMemo(() => {
    if (filteredContents.length === 0) return [];
    const latestContents = [...filteredContents]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    return latestContents.reverse().map(content => {
      const viewsCount = filteredViewLogs.filter(log => log.contentId === content.id).length;
      return {
        label: content.title.length > 10 ? content.title.substring(0, 10) + ".." : content.title,
        value: viewsCount
      };
    });
  }, [filteredContents, filteredViewLogs]);

  // حساب بيانات المخطط البياني الخاص بالطالب (تطور تقدمه التراكمي للمشاهدة في المادة النشطة)
  const studentChartData = useMemo(() => {
    if (!user || filteredContents.length === 0) return [];
    const weekdays = ["الأحد", "الأثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    
    return weekdays.map((day, idx) => {
      const stepValue = Math.min(Math.round((analytics.completed / (5 - idx)) * (idx + 1)), analytics.completed);
      return {
        label: day,
        value: isNaN(stepValue) ? 0 : stepValue
      };
    });
  }, [filteredContents, user, analytics]);

  // دمج المحاضرات/المذكرات والاختبارات المنشورة للمعلم معاً مع تفصيل نوع العنصر
  const combinedList = useMemo(() => {
    const lectures = filteredContents.map(c => ({ ...c, isQuiz: false, typeLabel: c.type === 'video' ? 'فيديو شرح' : 'مذكرة دراسية' }));
    const exams = filteredQuizzes.map(q => ({ ...q, isQuiz: true, type: 'quiz', typeLabel: q.isGoogleForm ? 'اختبار جوجل فورم' : 'اختبار متكامل' }));
    return [...lectures, ...exams];
  }, [filteredContents, filteredQuizzes]);

  // تصفية وترتيب القائمة المدمجة بناءً على البحث والفلترة والترتيب المحدد للمعلم
  const sortedCombinedList = useMemo(() => {
    let list = [...combinedList];

    if (searchQuery.trim() !== '') {
      list = list.filter(item => item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filterType !== 'all') {
      list = list.filter(item => item.type === filterType);
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      }
      if (sortBy === 'alpha-asc') {
        return (a.title || '').localeCompare(b.title || '', 'ar');
      }
      if (sortBy === 'alpha-desc') {
        return (b.title || '').localeCompare(a.title || '', 'ar');
      }
      return 0;
    });

    return list;
  }, [combinedList, sortBy, filterType, searchQuery]);

  // منطق الدخول المجهول المتين للاتصال بـ Firebase طبقاً لقاعدة المصادقة الأولى والصلاحيات
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            // في حال حدوث خطأ تطابق التوكن custom-token-mismatch، التراجع الفوري لتسجيل الدخول المجهول لمنع توقف السيرفر
            console.warn("Custom token mismatch, falling back to anonymous auth.");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { 
        console.error("Auth System Error", e); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (curr) => setFbUser(curr));
    return () => unsubscribe();
  }, []);

  // تحقق تلقائي من حالة تسجيل الدخول المحفوظة محلياً (Auto-Login)
  useEffect(() => {
    const savedUser = localStorage.getItem('dr_mahmoud_user_session');
    const savedRole = localStorage.getItem('dr_mahmoud_user_role');
    if (savedUser && savedRole) {
      try {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      } catch (e) {
        localStorage.removeItem('dr_mahmoud_user_session');
        localStorage.removeItem('dr_mahmoud_user_role');
      }
    }
  }, []);

  // جلب البيانات اللحظية المباشرة من المجلدات لـ Firebase بعد اتمام المصادقة (RULE 3)
  useEffect(() => {
    if (!fbUser) return;
    
    // جلب التفضيلات والألوان المحددة للمعلم
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSubjectConfig(docSnap.data());
      }
    });

    const unsubContent = onSnapshot(contentsRef, (s) => setContents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubQuizzes = onSnapshot(quizzesRef, (s) => setQuizzes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubResults = onSnapshot(resultsRef, (s) => setResults(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStudents = onSnapshot(usersRef, (s) => setAllStudents(s.docs.filter(d => d.data().role === 'student').map(d => ({ id: d.id, ...d.data() }))));
    const unsubLogs = onSnapshot(logsRef, (s) => setViewLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { unsubConfig(); unsubContent(); unsubQuizzes(); unsubResults(); unsubStudents(); unsubLogs(); };
  }, [fbUser, configDocRef, contentsRef, quizzesRef, resultsRef, usersRef, logsRef]);

  // مراقبة حساب الطالب للتأكد من حظره أو تفعيله لحظياً
  useEffect(() => {
    if (role === 'student' && user) {
      const currentStudentInList = allStudents.find(s => s.username === user.name);
      if (currentStudentInList && currentStudentInList.status === 'blocked') {
        setUser(prev => ({ ...prev, status: 'blocked' }));
      } else if (currentStudentInList && currentStudentInList.status !== 'blocked') {
        setUser(prev => ({ ...prev, status: currentStudentInList.status || 'preview', studentCode: currentStudentInList.studentCode }));
      }
    }
  }, [allStudents, role, user?.name]);

  // مؤقت اختبار الطالب التفاعلي بالثواني
  useEffect(() => {
    let interval = null;
    if (activeQuiz && quizTimer > 0) {
      interval = setInterval(() => {
        setQuizTimer(prev => prev - 1);
      }, 1000);
    } else if (activeQuiz && quizTimer === 0) {
      handleSubmitQuiz();
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizTimer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const name = e.target.username.value.trim();
    const password = e.target.password.value;
    const selectedRole = e.target.role.value;
    const phone = e.target.phone ? e.target.phone.value.trim() : '';

    try {
      if (selectedRole === 'teacher') {
        if (name === "admin" && password === "admin") {
          const teacherData = { name: "د. محمود", role: "teacher" };
          setUser(teacherData); 
          setRole('teacher');
          localStorage.setItem('dr_mahmoud_user_session', JSON.stringify(teacherData));
          localStorage.setItem('dr_mahmoud_user_role', 'teacher');
        } else {
          setAuthError("بيانات المعلم غير صحيحة");
        }
      } else {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', name);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.password === password) {
            const studentData = { 
              name: userData.username, 
              studentId: userData.studentId || "ST-0000",
              studentCode: userData.studentCode || "",
              status: userData.status || 'preview',
              phone: userData.phone || ""
            };
            setUser(studentData); 
            setRole('student');
            localStorage.setItem('dr_mahmoud_user_session', JSON.stringify(studentData));
            localStorage.setItem('dr_mahmoud_user_role', 'student');
          } else {
            setAuthError("كلمة الورقة خاطئة");
          }
        } else {
          if (!phone) {
            setAuthError("يرجى إدخال رقم الهاتف للتسجيل لأول مرة");
            setLoading(false);
            return;
          }
          const newStudentId = generateStudentId();
          const randomCode = `DRM-${Math.floor(1000 + Math.random() * 9000)}`;
          const newStudentData = { 
            username: name, 
            password: password, 
            role: 'student', 
            phone: phone,
            studentId: newStudentId,
            studentCode: randomCode,
            status: 'preview', 
            createdAt: serverTimestamp() 
          };
          
          await setDoc(userRef, newStudentData);
          const studentData = { name, studentId: newStudentId, studentCode: randomCode, status: 'preview', phone };
          setUser(studentData); 
          setRole('student');
          localStorage.setItem('dr_mahmoud_user_session', JSON.stringify(studentData));
          localStorage.setItem('dr_mahmoud_user_role', 'student');

          sendOneSignalNotification(
            "طالب جديد سجل بالمنصة! 🎉",
            `سجل الطالب ${name} برقم هاتف ${phone} برمز التفعيل ${randomCode} ودخل بوضعية البريفيو المجاني.`
          );
        }
      }
    } catch (err) {
      setAuthError("حدث خطأ أثناء تسجيل الدخول، يرجى إعادة المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('dr_mahmoud_user_session');
    localStorage.removeItem('dr_mahmoud_user_role');
  };

  // معالجة اختيار ملفات الفيديو وتخزينها بأمان في حالة المكون
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");
    setSuccessMessage("");
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error("فشل الرفع السحابي، تأكد من إعدادات Cloudinary الجديدة");
    const data = await response.json();
    return data.secure_url;
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!fbUser) return;
    setLoading(true); setFileError(""); setSuccessMessage("");
    const fd = new FormData(e.target);
    const title = fd.get('title');
    const type = fd.get('type');
    let finalUrl = fd.get('url');

    try {
      if (type === 'material') {
        if (!finalUrl) throw new Error("يرجى إدخال الرابط المباشر لملف المذكرة (PDF).");
      } else {
        if (uploadType === 'file' && selectedFile) {
          setUploadProgress(40);
          finalUrl = await uploadToCloudinary(selectedFile);
          setUploadProgress(90);
        }
        if (!finalUrl) throw new Error("يرجى وضع رابط الفيديو أو رفع ملف شرح.");
      }

      // إضافة المادة النشطة تلقائياً لحفظ الدروس تحتها
      await addDoc(contentsRef, {
        title,
        type,
        url: finalUrl,
        subject: activeSubjectId, 
        source: type === 'material' ? 'link' : uploadType,
        createdAt: serverTimestamp()
      });
      
      setSuccessMessage("تم رفع المحاضرة بنجاح ونشرها للطلاب! 🎉");
      setTimeout(() => { setActiveTab('الرئيسية'); setUploadType('link'); setSelectedFile(null); }, 1500);
    } catch (err) { setFileError(err.message); } 
    finally { setLoading(false); setUploadProgress(0); }
  };

  // مراجعة دالة إضافة السؤال للاختبارات وتأمين إضافتها البرمجية
  const handleAddQuestion = () => {
    if (!currentQuestionText.trim()) return;
    const newQuestion = {
      text: currentQuestionText,
      options: [...currentQuestionOptions],
      correct: currentQuestionCorrect
    };
    setNewQuizQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestionText("");
    setCurrentQuestionOptions(["", "", "", ""]);
    setCurrentQuestionCorrect(0);
  };

  // دالة حفظ ونشر الاختبارات المفقودة
  const handleSaveQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    if (!isGoogleForm && newQuizQuestions.length === 0) return;
    if (isGoogleForm && !googleFormUrl.trim()) return;

    setLoading(true);
    try {
      await addDoc(quizzesRef, {
        title: newQuizTitle,
        timeLimit: Number(newQuizTime),
        isGoogleForm: isGoogleForm,
        googleFormUrl: isGoogleForm ? googleFormUrl : "",
        questions: isGoogleForm ? [] : newQuizQuestions,
        subject: activeSubjectId, 
        createdAt: serverTimestamp()
      });
      setSuccessMessage("تم حفظ ونشر الاختبار بنجاح! 📝");
      
      sendOneSignalNotification(
        `تم نشر اختبار جديد في مادة ${activeSubject.name}! 📝`,
        `اختبر مستواك الآن في اختبار: "${newQuizTitle}" مدة الحل ${newQuizTime} دقيقة.`
      );

      setNewQuizTitle("");
      setGoogleFormUrl("");
      setNewQuizQuestions([]);
      setTimeout(() => {
        setSuccessMessage("");
        setActiveTab("الرئيسية");
      }, 1500);
    } catch (e) {
      setFileError("فشل نشر الاختبار السحابي.");
    } finally {
      setLoading(false);
    }
  };

  // دالة بدء حل الاختبار للطالب
  const startQuiz = (quiz) => {
    if (quiz.isGoogleForm) {
      window.open(quiz.googleFormUrl, '_blank');
      addDoc(resultsRef, {
        studentName: user.name,
        studentId: user.studentId || "ST-0000",
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: "خارجي (Google Form)",
        percentage: 100,
        isGoogleForm: true,
        subject: activeSubjectId, 
        timestamp: serverTimestamp()
      });
      return;
    }
    setActiveQuiz(quiz);
    setStudentAnswers({});
    setQuizTimer(quiz.timeLimit * 60);
  };

  // دالة تصحيح وتسليم الاختبار اللحظي للطالب
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setLoading(true);
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const totalQuestions = activeQuiz.questions.length;
    const scoreText = `${correctCount} / ${totalQuestions}`;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    const resultData = {
      studentName: user.name,
      studentId: user.studentId || "ST-0000",
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      score: scoreText,
      percentage: scorePercentage,
      studentAnswers: studentAnswers,
      subject: activeSubjectId, 
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(resultsRef, resultData);
      
      sendOneSignalNotification(
        "نتيجة اختبار جديدة! 🏆",
        `أنهى الطالب ${user.name} (ID: ${user.studentId}) اختبار "${activeQuiz.title}" وحصل على نتيجة: ${scoreText} (${scorePercentage}%).`
      );

      setCompletedQuizResult({
        title: activeQuiz.title,
        score: scoreText,
        percentage: scorePercentage,
        quiz: activeQuiz,
        answers: studentAnswers
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActiveQuiz(null);
      setLoading(false);
    }
  };

  // دالة تفعيل وعرض مراجعة الإجابات السابقة للطالب (تم إضافتها وتثبيتها بدقة كاملة)
  const startReviewQuiz = (quiz, myResult) => {
    setReviewingQuiz({
      quiz: quiz,
      answers: myResult?.studentAnswers || {}
    });
  };

  // دالة logView المفقودة لتسجيل قراءات الطلاب
  const logView = async (content) => {
    if (role !== 'student' || !user || !fbUser) return; 
    try {
      await addDoc(logsRef, {
        studentName: user.name,
        studentId: user.studentId || "ST-0000",
        contentId: content.id,
        contentTitle: content.title,
        contentType: content.type,
        subject: activeSubjectId, 
        timestamp: serverTimestamp()
      });
    } catch (e) { 
      console.error("Error logging student view:", e); 
    }
  };

  const handleSaveThemesAndNames = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setFileError("");
    const fd = new FormData(e.target);
    const updatedConfig = {
      chemistry_name: fd.get('chem_name'),
      chemistry_theme: fd.get('chem_theme'),
      physics_name: fd.get('phys_name'),
      physics_theme: fd.get('phys_theme'),
      global_style: subjectConfig.global_style || 'rounded-fabulous'
    };

    try {
      await setDoc(configDocRef, updatedConfig);
      setSuccessMessage("تم حفظ إعدادات المواد والألوان بنجاح وتطبيقها فوراً! 🎨");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      setFileError("فشل ترحيل الإعدادات إلى السيرفر، يرجى إعادة المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    setScannedStudent(null);
    setInlineNotification("");
    if (!searchStudentCode.trim()) return;

    const found = allStudents.find(s => s.studentCode === searchStudentCode.trim() || s.studentId === searchStudentCode.trim() || s.username === searchStudentCode.trim());
    if (found) {
      setScannedStudent(found);
    } else {
      setInlineNotification("خطأ: لم يتم العثور على طالب مطابق للرمز المدخل.");
      setTimeout(() => setInlineNotification(""), 3500);
    }
  };

  const handleChangeStudentStatus = async (studentName, newStatus) => {
    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', studentName);
      await updateDoc(studentRef, { status: newStatus });
      
      if (scannedStudent && scannedStudent.username === studentName) {
        setScannedStudent(prev => ({ ...prev, status: newStatus }));
      }

      if (newStatus === 'blocked') {
        sendOneSignalNotification(
          "تنبيه هام! ⚠️",
          `تم قفل حساب الطالب ذو المعرف ${studentName} من قبل المعلم.`
        );
      } else if (newStatus === 'active') {
        sendOneSignalNotification(
          "مبروك! تم تفعيل حسابك بالكامل 🌟",
          `قام الدكتور محمود بتفعيل حسابك بالكامل. يمكنك الآن تصفح كافة الفيديوهات والملفات والاختبارات.`
        );
      }

      setInlineNotification("تم تحديث وضع وصلاحيات الطالب بنجاح! ✓");
      setTimeout(() => setInlineNotification(""), 3500);
    } catch (e) {
      setInlineNotification("خطأ: فشل تحديث حالة الطالب السحابية.");
      setTimeout(() => setInlineNotification(""), 3500);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmTarget) return;
    setLoading(true);
    try {
      const collectionRef = deleteConfirmTarget.isQuiz ? quizzesRef : contentsRef;
      const targetDoc = doc(collectionRef, deleteConfirmTarget.id);
      await deleteDoc(targetDoc);
      
      setSuccessMessage("تم حذف العنصر بنجاح من قاعدة البيانات والمنصة! 🗑️");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء محاولة الحذف السحابي.");
    } finally {
      setDeleteConfirmTarget(null);
      setLoading(false);
    }
  };

  // التحقق إن كان المحتوى مغلقاً تبعا لوجبة الحساب والبريفيو المجاني (العنصر الأول فقط مفتوح)
  const isContentLocked = (item, idx) => {
    if (role === 'teacher') return false;
    if (user?.status === 'active') return false; 
    return idx > 0; // إذا لم يكن العنصر الأول (ترتيب 0) وكان حسابه بريفيو، يتم قفله
  };

  return (
    <div className={`min-h-screen transition-all pb-24 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#fcfdfe] text-slate-900'} ${subjectConfig.global_style === 'rounded-none' ? 'rounded-none' : subjectConfig.global_style === 'rounded-3xl' ? 'rounded-3xl' : 'rounded-fabulous'}`} dir="rtl">
      
      {/* شاشة الحظر الكاملة في حال كان الطالب محجوباً */}
      {role === 'student' && user?.status === 'blocked' && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
           <div className="max-w-md w-full bg-slate-900 border border-red-500/30 p-10 rounded-[3rem] shadow-2xl text-white">
              <ShieldAlert size={64} className="text-red-500 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl font-black mb-4 italic text-red-500">تم حجب الحساب!</h2>
              <p className="text-slate-400 font-bold mb-8 leading-relaxed text-sm">أهلاً بك. نأسف لإعلامك بأنه قد تم حظر وصولك إلى المنصة من قبل الإدارة. يرجى التواصل مع المعلم مباشرة لتسوية الاشتراك وتفعيل حسابك مجدداً.</p>
              <a 
                href={`https://wa.me/${TEACHER_WHATSAPP_NUMBER}?text=مرحباً دكتور محمود، أنا الطالب ${user?.name || ""} (ID: ${user?.studentId || ""})، لقد تم حجب حسابي وأود الاستفسار عن طريقة التفعيل.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <MessageCircle size={22} /> تواصل لتفعيل الحساب
              </a>
           </div>
        </div>
      )}

      {/* مودال تأكيد حذف العنصر سحابياً تفادياً للـ confirm والـ alert المعزولين داخل الـ iframe */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl text-right">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 text-slate-800 dark:text-slate-100 text-center">تأكيد حذف العنصر</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 leading-relaxed text-xs sm:text-sm text-center">
              هل أنت متأكد من رغبتك في حذف <span className="text-red-600 font-black">"{deleteConfirmTarget.title}"</span>؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسحه من الطلاب فوراً.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleDeleteItem}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-xs sm:text-sm transition-all"
              >
                تأكيد الحذف النهائي
              </button>
              <button 
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-4 rounded-2xl font-black text-xs sm:text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شاشة تسجيل الدخول والتسجيل الجديد للطلاب برقم الهاتف */}
      {!user && (
        <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900'}`} dir="rtl">
          <div className={`max-w-md w-full p-10 rounded-[3rem] shadow-2xl ${darkMode ? 'bg-slate-900' : 'bg-white border border-slate-100'}`}>
            <div className="text-center mb-8">
              <div className="inline-flex p-5 bg-blue-600 rounded-3xl text-white shadow-xl mb-4"><GraduationCap size={44} /></div>
              <h1 className="text-3xl font-black italic text-slate-800">مَنصة التميز.</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                <button 
                  type="button" 
                  onClick={() => setLoginRole('student')}
                  className={`flex-1 py-3 text-center rounded-xl font-bold transition-all text-sm ${loginRole === 'student' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}
                >
                  طالب
                </button>
                <button 
                  type="button" 
                  onClick={() => setLoginRole('teacher')}
                  className={`flex-1 py-3 text-center rounded-xl font-bold transition-all text-sm ${loginRole === 'teacher' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}
                >
                  معلم
                </button>
                <input type="hidden" name="role" value={loginRole} />
              </div>
              <input name="username" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-blue-500 text-center" placeholder="اسم المستخدم" />
              
              {loginRole === 'student' && (
                <div className="relative flex items-center animate-in slide-in-from-top-3 duration-300">
                  <input 
                    name="phone" 
                    type="tel" 
                    className="w-full p-4 pr-12 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-blue-500 text-center" 
                    placeholder="رقم الهاتف (للتسجيل لأول مرة)" 
                  />
                  <Phone size={18} className="absolute right-4 text-slate-400" />
                </div>
              )}

              <input name="password" type="password" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-blue-500 text-center" placeholder="كلمة المرور" />
              <button disabled={loading || !fbUser} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                  {!fbUser ? "جاري الاتصال بالسيرفر..." : loading ? "جاري التحقق..." : "دخول المنصة"}
              </button>
              {authError && <p className="text-red-500 text-center font-bold text-sm mt-2">{authError}</p>}
            </form>
          </div>
        </div>
      )}

      {user && (
        <>
          {/* Header */}
          <header className={`sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => setSidebarOpen(true)} className={`p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl ${activeSubjectId === 'chemistry' ? (subjectConfig.chemistry_theme === 'red' ? 'text-red-600' : subjectConfig.chemistry_theme === 'emerald' ? 'text-emerald-600' : subjectConfig.chemistry_theme === 'purple' ? 'text-purple-600' : subjectConfig.chemistry_theme === 'amber' ? 'text-amber-500' : 'text-blue-600') : (subjectConfig.physics_theme === 'red' ? 'text-red-600' : subjectConfig.physics_theme === 'emerald' ? 'text-emerald-600' : subjectConfig.physics_theme === 'purple' ? 'text-purple-600' : subjectConfig.physics_theme === 'amber' ? 'text-amber-500' : 'text-blue-600')}`}><Menu size={24}/></button>
              <span className={`font-black text-2xl italic ${activeSubjectId === 'chemistry' ? (subjectConfig.chemistry_theme === 'red' ? 'text-red-600' : subjectConfig.chemistry_theme === 'emerald' ? 'text-emerald-600' : subjectConfig.chemistry_theme === 'purple' ? 'text-purple-600' : subjectConfig.chemistry_theme === 'amber' ? 'text-amber-500' : 'text-blue-600') : (subjectConfig.physics_theme === 'red' ? 'text-red-600' : subjectConfig.physics_theme === 'emerald' ? 'text-emerald-600' : subjectConfig.physics_theme === 'purple' ? 'text-purple-600' : subjectConfig.physics_theme === 'amber' ? 'text-amber-500' : 'text-blue-600')}`}>التميز.</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${activeSubjectId === 'chemistry' ? (subjectConfig.chemistry_theme === 'red' ? 'bg-red-600' : subjectConfig.chemistry_theme === 'emerald' ? 'bg-emerald-600' : subjectConfig.chemistry_theme === 'purple' ? 'bg-purple-600' : subjectConfig.chemistry_theme === 'amber' ? 'bg-amber-500' : 'bg-blue-600') : (subjectConfig.physics_theme === 'red' ? 'bg-red-600' : subjectConfig.physics_theme === 'emerald' ? 'bg-emerald-600' : subjectConfig.physics_theme === 'purple' ? 'bg-purple-600' : subjectConfig.physics_theme === 'amber' ? 'bg-amber-500' : 'bg-blue-600')}`}>{user.name ? user.name[0] : ""}</div>
                <div className="text-right leading-none">
                  <span className="font-bold text-sm block">{user.name}</span>
                  {role === 'student' && <span className={`block text-[9px] font-black mt-1 ${activeSubjectId === 'chemistry' ? (subjectConfig.chemistry_theme === 'red' ? 'text-red-600' : subjectConfig.chemistry_theme === 'emerald' ? 'text-emerald-600' : subjectConfig.chemistry_theme === 'purple' ? 'text-purple-600' : subjectConfig.chemistry_theme === 'amber' ? 'text-amber-500' : 'text-blue-600') : (subjectConfig.physics_theme === 'red' ? 'text-red-600' : subjectConfig.physics_theme === 'emerald' ? 'text-emerald-600' : subjectConfig.physics_theme === 'purple' ? 'text-purple-600' : subjectConfig.physics_theme === 'amber' ? 'text-amber-500' : 'text-blue-600')}`}>{user.studentId}</span>}
                </div>
              </div>
            </div>
          </header>

          {/* شريط اختيار المواد الدراسية العلوي المذهل والخاضع لهوية تفاعلية متحركة */}
          <div className="max-w-7xl mx-auto px-6 pt-6 sm:px-10">
             <div className="bg-white p-3 rounded-[2rem] border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-black text-sm text-slate-400 flex items-center gap-2 flex-row-reverse text-right sm:pr-4">
                   اختر المادة الدراسية لعرض محتواها:
                   <BookOpen size={16} />
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                   {subjectsList.map(subj => {
                     const isSelected = activeSubjectId === subj.id;
                     let activeBtnStyle = isSelected 
                       ? `${subj.accentColor} text-white shadow-lg`
                       : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700';

                     return (
                       <button
                         key={subj.id}
                         onClick={() => {
                           setActiveSubjectId(subj.id);
                           setSearchQuery('');
                           setFilterType('all');
                         }}
                         className={`flex-1 sm:px-8 py-3 rounded-2xl font-black text-sm transition-all duration-300 transform active:scale-95 ${activeBtnStyle}`}
                       >
                         {subj.name}
                       </button>
                     );
                   })}
                </div>
             </div>
          </div>

          {/* Sidebar - Fixed to Right */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-[100] flex">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
              <div className={`relative w-80 h-full p-8 shadow-2xl bg-white dark:bg-slate-900 border-l dark:border-slate-800 mr-0 ml-auto transition-transform duration-300`}>
                <div className="flex items-center justify-between mb-10">
                   <span className="font-black text-xl italic underline decoration-blue-600 underline-offset-8">قائمة التحكم</span>
                   <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X/></button>
                </div>
                <nav className="space-y-3">
                  <SidebarItem icon={Layout} label="الرئيسية" id="الرئيسية" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                  {role === 'student' && (
                    <>
                      <SidebarItem icon={PlayCircle} label="المحاضرات" id="الفيديوهات" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                      <SidebarItem icon={FileText} label="المذكرات" id="الماتيريال" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                      <SidebarItem icon={ClipboardList} label="الاخبارات" id="الاختبارات" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                    </>
                  )}
                  {role === 'teacher' && (
                    <>
                      <SidebarItem icon={PlusCircle} label="نشر محتوى" id="إضافة دروس" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                      <SidebarItem icon={CheckCircle2} label="إنشاء اختبار" id="إنشاء اختبار" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                      <SidebarItem icon={User} label="إدارة الطلاب والأكواد" id="إدارة الطلاب" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                    </>
                  )}
                  <SidebarItem icon={BarChart3} label="مركز التحليلات" id="التحليلات" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                  <SidebarItem icon={Settings} label="الإعدادات" id="الإعدادات" activeTab={activeTab} activeSubjectTheme={activeSubject.theme} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                  <div className="pt-10">
                    <button onClick={handleLogout} className="w-full p-4 text-right rounded-2xl flex items-center gap-4 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"><LogOut size={22}/> خروج آمن</button>
                  </div>
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-7xl mx-auto p-6 sm:p-10">
            
            {/* TAB: Dashboard */}
            {activeTab === 'الرئيسية' && (
              <div className="space-y-8 animate-in fade-in">
                {/* بطاقة الواجهة الذكية الملونة تبعا للمادة النشطة */}
                <div className={`bg-gradient-to-br ${activeSubject.bgGradient} p-10 sm:p-16 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-500`}>
                   <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
                   <h2 className="text-3xl sm:text-5xl font-black mb-4 relative z-10 italic">مادة {activeSubject.name} 📚</h2>
                   <p className="opacity-90 font-bold text-lg relative z-10 max-w-xl">
                     {role === 'student' ? `مرحباً ${user.name} - معرف الطالب: ${user.studentId}` : `بوابتك السحابية الذكية لإدارة مادة ${activeSubject.name}.`}
                   </p>
                   {role === 'student' && user?.status === 'preview' && (
                     <div className="mt-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-200 text-xs sm:text-sm font-bold max-w-lg">
                        تنبيه: حسابك حالياً في الوضع التجريبي المجاني (Preview)، يمكنك فقط تصفح أول عنصر من كل قسم. للتفعيل يرجى تزويد المعلم برمزك الخاص: <span className="underline font-black">{user.studentCode}</span>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <button 
                      type="button"
                      disabled={role !== 'teacher'}
                      onClick={() => role === 'teacher' && setShowStudentsList(true)}
                      className={`p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-sm text-right transition-all ${role === 'teacher' ? 'hover:shadow-xl hover:border-blue-500 cursor-pointer active:scale-95' : ''}`}
                   >
                      <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl w-fit mb-4"><Users size={30}/></div>
                      <p className="text-slate-400 font-bold text-sm">{role === 'teacher' ? 'إجمالي الطلاب (اضغط للمشاهدة)' : 'المحتوى المتاح'}</p>
                      <h4 className="text-4xl font-black">{role === 'teacher' ? analytics.count : filteredContents.length}</h4>
                   </button>
                   <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-sm text-right">
                      <div className="p-4 bg-green-100 text-green-600 rounded-2xl w-fit mb-4"><TrendingUp size={30}/></div>
                      <p className="text-slate-400 font-bold text-sm">
                        {role === 'teacher' ? 'معدل التفاعل الإجمالي للطلاب' : 'المحاضرات المنجزة والمشاهدة فعلياً'}
                      </p>
                      <h4 className="text-4xl font-black">
                        {role === 'teacher' ? `${analytics.avg}%` : `${analytics.completed} / ${analytics.totalContents}`}
                      </h4>
                   </div>
                   <button 
                      type="button"
                      disabled={role !== 'teacher'}
                      onClick={() => role === 'teacher' && setShowContentsList(true)}
                      className={`p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-sm text-right transition-all ${role === 'teacher' ? 'hover:shadow-xl hover:border-blue-500 cursor-pointer active:scale-95' : ''}`}
                   >
                      <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl w-fit mb-4"><Trophy size={30}/></div>
                      <p className="text-slate-400 font-bold text-sm">{role === 'teacher' ? 'إجمالي المحتوى (اضغط للتفاصيل والترتيب)' : 'نسبة إنجازك الإجمالية للدروس'}</p>
                      <h4 className="text-4xl font-black">{role === 'teacher' ? analytics.content : `${analytics.avg}%`}</h4>
                   </button>
                </div>

                {/* صفحة المعلم الرئيسية: الجزء الخاص بالطلاب وتحليلاتهم والعناصر التي تم نشرها */}
                {role === 'teacher' && (
                  <div className="space-y-8 pt-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* الرسوم البيانية التفاعلية اللحظية للمحاضرات الأكثر تفاعلاً */}
                      <div>
                        {teacherChartData.length > 0 ? (
                          <CustomInteractiveChart data={teacherChartData} title={`أكثر محاضرات مادة ${activeSubject.name} تفاعلاً ومقروئية 📊`} themeColor={activeSubject.theme} />
                        ) : (
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border text-center opacity-30 italic font-black">
                            <Info size={40} className="mx-auto mb-2" />
                            <p>لا توجد محاضرات منشورة بعد لرسم المخطط البياني.</p>
                          </div>
                        )}
                      </div>

                      {/* العناصر الأخيرة التي تم نشرها وتفاصيلها */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm text-right flex flex-col justify-between">
                         <div>
                            <h4 className="font-black text-lg mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2 justify-end">
                              آخر العناصر التعليمية المنشورة في مادة {activeSubject.name}
                              <FileText className={activeSubject.textColor} size={18} />
                            </h4>
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                               {filteredContents.length > 0 ? [...filteredContents].reverse().slice(0, 4).map((item, i) => (
                                 <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 rounded-xl flex justify-between items-center flex-row-reverse text-xs font-bold">
                                   <span className="truncate max-w-[200px] text-slate-800 dark:text-slate-100">{item.title}</span>
                                   <span className={`px-2.5 py-1 rounded-md text-[10px] text-white ${item.type === 'video' ? activeSubject.accentColor : 'bg-amber-500'}`}>
                                     {item.type === 'video' ? 'فيديو' : 'مذكرة'}
                                   </span>
                                 </div>
                               )) : (
                                 <p className="text-center text-slate-400 py-10">لا توجد دروس منشورة بعد في مادة {activeSubject.name}.</p>
                               )}
                            </div>
                         </div>
                         <button type="button" onClick={() => setShowContentsList(true)} className={`w-full text-white py-3.5 mt-4 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 transition-all hover:brightness-105 active:scale-95 ${activeSubject.accentColor}`}>
                            إدارة وترتيب المحتوى بالكامل <ChevronLeft size={16}/>
                         </button>
                      </div>
                    </div>

                    {/* تحليلات الطلاب وسجلات نشاطاتهم اللحظية */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 overflow-hidden flex flex-col">
                       <h4 className="font-black text-xl mb-6 flex items-center gap-2 italic justify-end">
                         سجل النشاط اللحظي وتفاعل الطلاب مع مادة {activeSubject.name}
                         <Clock className={activeSubject.textColor} size={22} />
                       </h4>
                       <div className="overflow-y-auto max-h-[300px] space-y-3 pr-2">
                          {filteredViewLogs.length > 0 ? [...filteredViewLogs].reverse().map((log, i) => (
                            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 rounded-2xl flex items-center justify-between text-sm shadow-sm flex-row-reverse font-sans">
                               <div className="flex items-center gap-3 flex-row-reverse text-right">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm ${activeSubject.accentColor}`}>{log.studentName?.[0]}</div>
                                  <div>
                                     <p className="font-black text-slate-800 dark:text-slate-100">{log.studentName}</p>
                                     <p className={`text-[10px] font-black ${activeSubject.textColor}`}>{log.studentId || "ST-0000"}</p>
                                     <p className="text-[11px] font-bold text-slate-400 mt-1">شاهد وتفاعل مع: "{log.contentTitle}"</p>
                                   </div>
                               </div>
                               <div className="text-left">
                                  <p className={`text-[10px] font-bold ${activeSubject.textColor} bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mb-2`}>{log.contentType === 'video' ? 'فيديو شرح' : 'مذكرة دراسية'}</p>
                                  <p className="text-[10px] opacity-40 font-bold">{log.timestamp?.toDate().toLocaleString('ar-EG')}</p>
                               </div>
                            </div>
                          )) : (
                            <p className="text-center opacity-40 py-12 italic font-black">لا توجد سجلات نشاط لطلب الكيمياء أو الفيزياء بعد.</p>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Analytics */}
            {activeTab === 'التحليلات' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-right font-sans">
                <h3 className="text-3xl font-black mb-6 flex items-center gap-3 justify-end"><BarChart3 className={activeSubject.textColor}/> مركز البيانات والتحليلات - مادة {activeSubject.name}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 flex flex-col justify-between animate-in fade-in">
                      <div>
                        <h4 className="font-black text-xl mb-6 italic">ملخص النشاط الدقيق</h4>
                        <div className="space-y-4">
                           <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-3xl flex justify-between items-center">
                              <span className="font-bold">{role === 'teacher' ? 'تفاعل الطلاب' : 'نسبة الإكمال'}</span>
                              <span className="font-black text-green-600">{analytics.avg}%</span>
                           </div>
                        </div>
                      </div>
                      {role === 'student' && (
                        <div className={`p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border ${activeSubject.borderColor} mt-4 text-center`}>
                          <Award className={`${activeSubject.textColor} mx-auto mb-2`} size={32} />
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold font-sans">تقييمك الحالي في مادة {activeSubject.name}</p>
                          <h4 className={`font-black text-lg mt-1 ${activeSubject.textColor}`}>
                            {analytics.avg >= 85 ? "طالب ممتاز ومجتهد 🏆" : analytics.avg >= 50 ? "طالب نشط وجيد جداً 👍" : "واصل المذاكرة لتتميز 📚"}
                          </h4>
                        </div>
                      )}
                   </div>

                   <div className="lg:col-span-2">
                     {role === 'teacher' ? (
                       teacherChartData.length > 0 ? (
                         <CustomInteractiveChart data={teacherChartData} title={`أكثر محاضرات مادة ${activeSubject.name} تفاعلاً`} themeColor={activeSubject.theme} />
                       ) : (
                         <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border text-center opacity-30 italic font-black">
                           <Info size={40} className="mx-auto mb-2" />
                           <p>لا توجد محاضرات منشورة بعد لرسم المخطط البياني.</p>
                         </div>
                       )
                     ) : (
                       studentChartData.length > 0 ? (
                         <CustomInteractiveChart data={studentChartData} title={`معدل تقدمك في مادة ${activeSubject.name}`} themeColor={activeSubject.theme} />
                       ) : (
                         <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border text-center opacity-30 italic font-black">
                           <Info size={40} className="mx-auto mb-2" />
                           <p>يرجى البدء بمشاهدة الدروس لعرض منحنى تقدمك.</p>
                         </div>
                       )
                     )}
                   </div>

                   {role === 'teacher' && (
                     <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 overflow-hidden flex flex-col max-h-[500px]">
                        <h4 className="font-black text-xl mb-6 flex items-center gap-2 italic justify-end"><Clock className={activeSubject.textColor}/> آخر نشاطات الطلاب اللحظية لمادة {activeSubject.name}</h4>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 font-sans">
                           {filteredViewLogs.length > 0 ? [...filteredViewLogs].reverse().map((log, i) => (
                             <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 rounded-2xl flex items-center justify-between text-sm shadow-sm flex-row-reverse font-sans">
                                <div className="flex items-center gap-3 flex-row-reverse">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${activeSubject.accentColor}`}>{log.studentName?.[0]}</div>
                                   <div>
                                      <p className="font-black">{log.studentName}</p>
                                      <p className={`text-[10px] font-bold ${activeSubject.textColor}`}>{log.studentId || "ST-0000"}</p>
                                      <p className="text-[10px] opacity-60 font-sans">شاهد: {log.contentTitle}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                   <p className={`text-[10px] font-bold ${activeSubject.textColor} bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mb-1 font-sans`}>{log.contentType === 'video' ? 'فيديو' : 'مذكرة'}</p>
                                   <p className="text-[9px] opacity-40 font-bold font-sans">{log.timestamp?.toDate().toLocaleString('ar-EG')}</p>
                                </div>
                             </div>
                           )) : <p className="text-center opacity-40 py-10">لا توجد سجلات بعد في هذه المادة</p>}
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* TAB: Content Viewer */}
            {(activeTab === 'الفيديوهات' || activeTab === 'الماتيريال' || activeTab === 'إضافة دروس') && (
               <div className="animate-in fade-in">
                  {activeTab === 'إضافة دروس' ? (
                    <div className="max-w-3xl mx-auto p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border dark:border-slate-800 text-right">
                      <h3 className="text-3xl font-black text-center mb-4 italic text-slate-800 dark:text-slate-100 font-sans">نشر محتوى جديد</h3>
                      <p className={`text-center font-black text-sm mb-10 ${activeSubject.textColor}`}>سيتم حفظ المحتوى تلقائياً تحت مادة ({activeSubject.name})</p>
                      
                      {successMessage && <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-xl text-center font-bold">{successMessage}</div>}
                      {fileError && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-center font-bold">{fileError}</div>}

                      <form onSubmit={handleAddContent} className="space-y-6 font-sans">
                        <input name="title" required className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-blue-500 text-center" placeholder="عنوان الدرس" />
                        
                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-2">نوع المحتوى:</label>
                          <select 
                            name="type" 
                            value={contentType}
                            onChange={(e) => {
                              setContentType(e.target.value);
                              if (e.target.value === 'material') {
                                setUploadType('link');
                              }
                            }}
                            className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold text-center border-2 border-transparent focus:border-blue-500 cursor-pointer"
                          >
                              <option value="video">🎥 فيديو شرح</option>
                              <option value="material">📚 مذكرة PDF</option>
                          </select>
                        </div>

                        {contentType !== 'material' ? (
                          <div className="space-y-4 animate-in fade-in">
                            <label className="text-xs font-bold text-slate-400 block">مصدر الفيديو (رابط أو ملف الهاتف):</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                              <button 
                                type="button" 
                                onClick={() => setUploadType('link')} 
                                className={`flex-1 py-3 text-center rounded-xl font-bold transition-all text-sm ${uploadType === 'link' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}
                              >
                                وضع رابط URL
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setUploadType('file')} 
                                className={`flex-1 py-3 text-center rounded-xl font-bold transition-all text-sm ${uploadType === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}
                              >
                                رفع فيديو من جهازي
                              </button>
                            </div>

                            {uploadType === 'link' ? (
                              <div className="space-y-2 animate-in fade-in font-sans">
                                <label className="text-xs font-bold text-slate-400 block mb-1">الرابط المباشر للفيديو (URL):</label>
                                <input name="url" required={uploadType === 'link'} className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-blue-500 text-center font-sans" placeholder="الصق الرابط المباشر هنا" />
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in">
                                <label className="text-xs font-bold text-slate-400 block mb-1">اختر ملف الفيديو من جيل الهاتف:</label>
                                <input type="file" accept="video/*" onChange={handleFileChange} required={uploadType === 'file'} className="w-full p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold font-sans" />
                                {loading && (
                                  <div className="space-y-2">
                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <p className="text-center text-xs font-bold text-blue-600 animate-pulse font-sans">جاري رفع ومعالجة الفيديو سحابياً... {uploadProgress}%</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 animate-in fade-in font-sans">
                            <label className="text-xs font-bold text-slate-400 block mb-1">الرابط المباشر لملف المذكرة (PDF الرابط فقط):</label>
                            <input name="url" required className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-blue-500 text-center font-sans" placeholder="الصق رابط المذكرة هنا" />
                          </div>
                        )}

                        <button disabled={loading} className={`w-full text-white p-6 rounded-2xl font-black text-xl shadow-lg hover:brightness-105 active:scale-95 transition-all font-sans ${activeSubject.accentColor}`}>
                          {loading ? 'جاري الرفع والنشر والتحقق...' : 'نشر المحتوى الآن'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-right font-sans">
                      {filteredContents.filter(c => c.type === (activeTab === 'الفيديوهات' ? 'video' : 'material')).map((item, index) => {
                        const locked = isContentLocked(item, index);
                        return (
                          <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden text-right relative font-sans">
                             {locked && (
                               <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white font-sans">
                                  <Lock size={36} className="text-amber-500 mb-2 animate-bounce" />
                                  <h5 className="font-black text-sm mb-1">محتوى مدفوع ومغلق</h5>
                                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[200px] font-sans font-sans">يجب الاشتراك لتفعيل هذا المحتوى</p>
                               </div>
                             )}
                             <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-3xl mb-6 flex items-center justify-center relative">
                                {item.type === 'video' ? <PlayCircle size={60} className={`${activeSubject.textColor} opacity-40`} /> : <FileText size={60} className="text-amber-600/40" />}
                             </div>
                             <h4 className="font-black mb-6 text-center text-lg">{item.title}</h4>
                             <div className="flex gap-3 font-sans">
                                <button type="button" disabled={locked} onClick={() => { setViewingContent(item); logView(item); }} className={`flex-1 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-45 ${activeSubjectId === 'chemistry' ? (subjectConfig.chemistry_theme === 'red' ? 'bg-red-600' : subjectConfig.chemistry_theme === 'emerald' ? 'bg-emerald-600' : subjectConfig.chemistry_theme === 'purple' ? 'bg-purple-600' : subjectConfig.chemistry_theme === 'amber' ? 'bg-amber-500' : 'bg-blue-600') : (subjectConfig.physics_theme === 'red' ? 'bg-red-600' : subjectConfig.physics_theme === 'emerald' ? 'bg-emerald-600' : subjectConfig.physics_theme === 'purple' ? 'bg-purple-600' : subjectConfig.physics_theme === 'amber' ? 'bg-amber-500' : 'bg-blue-600')}`}><Eye size={18}/> مشاهدة</button>
                                <a href={item.url} target="_blank" rel="noreferrer" className="p-4 border dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><Download size={20}/></a>
                             </div>
                          </div>
                        );
                      })}
                      {filteredContents.filter(c => c.type === (activeTab === 'الفيديوهات' ? 'video' : 'material')).length === 0 && (
                        <div className="col-span-3 text-center py-20 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] opacity-40 w-full font-sans">
                          <Info size={32} className="mx-auto mb-2 text-slate-400" />
                          <p className="font-bold font-sans">لا توجد محاضرات منشورة في هذا القسم بعد لمادة {activeSubject.name}.</p>
                        </div>
                      )}
                    </div>
                  )}
               </div>
            )}

            {/* TAB: الاختبارات */}
            {(activeTab === 'الاخبارات' || activeTab === 'الاختبارات') && (
              <div className="space-y-6 animate-in fade-in text-right font-sans">
                 <h3 className="text-3xl font-black mb-6 flex items-center gap-3 justify-end"><ClipboardList className={activeSubject.textColor}/> الاختبارات المتاحة - مادة {activeSubject.name}</h3>
                 
                 {activeQuiz ? (
                   <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl max-w-3xl mx-auto font-sans">
                     <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-6 flex-row-reverse">
                        <h4 className={`font-black text-xl ${activeSubject.textColor}`}>{activeQuiz.title}</h4>
                        <div className="flex items-center gap-2 text-red-500 font-black font-sans font-sans">
                           <Clock size={18}/>
                           <span>{Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}</span>
                        </div>
                     </div>
                     
                     <div className="space-y-8 font-sans">
                        {activeQuiz.questions.map((q, qIdx) => (
                          <div key={qIdx} className="space-y-4">
                             <h5 className="font-black text-lg font-sans">السؤال {qIdx + 1}: {q.text}</h5>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                                {q.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => setStudentAnswers({...studentAnswers, [qIdx]: oIdx})}
                                    className={`p-4 rounded-2xl text-right font-bold transition-all border-2 ${studentAnswers[qIdx] === oIdx ? (activeSubjectId === 'chemistry' ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20 text-red-600' : 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600') : 'border-slate-100 dark:border-slate-800 hover:border-blue-500'}`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                     
                     <button 
                       type="button"
                       onClick={handleSubmitQuiz} 
                       className={`w-full text-white p-5 rounded-2xl font-black text-lg shadow-lg mt-10 transition-all font-sans ${activeSubject.accentColor}`}
                     >
                       إنهاء وتسليم الاختبار آلياً
                     </button>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                      {filteredQuizzes.map((quiz, index) => {
                        const hasDone = results.some(r => r.quizId === quiz.id && r.studentName === user?.name);
                        const myResult = results.find(r => r.quizId === quiz.id && r.studentName === user?.name);
                        const locked = isContentLocked(quiz, index);

                        return (
                          <div key={quiz.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden font-sans font-sans">
                             {locked && (
                               <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
                                  <Lock size={36} className="text-amber-500 mb-2 animate-bounce" />
                                  <h5 className="font-black text-sm mb-1 font-sans">محتوى مغلق</h5>
                                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[200px] font-sans">يجب الاشتراك لتفعيل هذا الاختبار</p>
                               </div>
                             )}
                             <div>
                               <div className="flex items-center justify-between mb-2 flex-row-reverse font-sans">
                                 <h4 className="font-black text-lg">{quiz.title}</h4>
                                 {quiz.isGoogleForm && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded-md font-bold font-sans">جوجل فورم</span>}
                               </div>
                               <p className="text-xs text-slate-400 font-bold mb-4 font-sans font-sans font-sans">مدة الاختبار: {quiz.timeLimit} دقيقة</p>
                             </div>
                             {hasDone ? (
                               <div className="space-y-3 font-sans">
                                 <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-2xl text-center font-black text-sm font-sans">
                                   {quiz.isGoogleForm ? "تم إرسال الإجابة وحلها" : `تم التسليم بنسبة: ${myResult?.score} (${myResult?.percentage}%)`}
                                 </div>
                                 {!quiz.isGoogleForm && (
                                   <button 
                                     type="button"
                                     onClick={() => startReviewQuiz(quiz, myResult)} 
                                     className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-3 rounded-2xl font-black text-sm transition-all font-sans"
                                   >
                                     مراجعة إجاباتك السابقة
                                   </button>
                                 )}
                               </div>
                             ) : (
                               <button 
                                 type="button"
                                 disabled={locked}
                                 onClick={() => startQuiz(quiz)} 
                                 className={`w-full text-white py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1 disabled:opacity-45 font-sans ${activeSubject.accentColor}`}
                               >
                                 {quiz.isGoogleForm ? <><ExternalLink size={16}/> افتح وحل الاختبار في Google Form</> : "ابدأ حل الاختبار الآن"}
                               </button>
                             )}
                          </div>
                        );
                      })}
                      {filteredQuizzes.length === 0 && (
                        <div className="col-span-3 text-center py-20 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] opacity-40 w-full font-sans">
                           <Info size={32} className="mx-auto mb-2 text-slate-400" />
                           <p className="font-bold font-sans">لا توجد اختبارات منشورة حالياً لمادة {activeSubject.name}.</p>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            )}

            {/* TAB: إنشاء اختبار */}
            {activeTab === 'إنشاء اختبار' && role === 'teacher' && (
              <div className="max-w-3xl mx-auto p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border dark:border-slate-800 text-right animate-in fade-in font-sans">
                 <h3 className="text-3xl font-black text-center mb-2 italic text-slate-800 dark:text-slate-100 font-sans font-sans font-sans">إنشاء اختبار جديد</h3>
                 <p className={`text-center font-black text-sm mb-8 ${activeSubject.textColor}`}>سيتم حفظ الاختبار ونشره تلقائياً لمادة ({activeSubject.name})</p>
                 
                 {successMessage && <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-xl text-center font-bold">{successMessage}</div>}
                 {fileError && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-center font-bold">{fileError}</div>}
                 
                 <div className="space-y-6 font-sans">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                      <button type="button" onClick={() => setIsGoogleForm(false)} className={`flex-1 py-3 text-center rounded-xl font-bold transition-all text-sm ${!isGoogleForm ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}>اختبار على الموقع</button>
                      <button type="button" onClick={() => setIsGoogleForm(true)} className={`flex-1 py-3 text-center rounded-xl font-bold transition-all text-sm ${isGoogleForm ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}>اختبار خارجي (Google Form)</button>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-2">عنوان الاختبار:</label>
                      <input 
                        type="text" 
                        value={newQuizTitle} 
                        onChange={(e) => setNewQuizTitle(e.target.value)} 
                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-center animate-in fade-in font-sans" 
                        placeholder="مثال: اختبار الباب الأول"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-2 font-sans font-sans font-sans">المدة الزمنية (بالدقائق):</label>
                      <input 
                        type="number" 
                        value={newQuizTime} 
                        onChange={(e) => setNewQuizTime(e.target.value)} 
                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-center animate-in fade-in font-sans"
                      />
                    </div>

                    {isGoogleForm ? (
                      <div className="space-y-2 animate-in fade-in font-sans">
                        <label className="block text-sm font-bold text-slate-400 mb-2">رابط الـ Google Form الخاص بالاختبار:</label>
                        <input 
                          type="text" 
                          value={googleFormUrl} 
                          onChange={(e) => setGoogleFormUrl(e.target.value)} 
                          className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-center" 
                          placeholder="الصق الرابط هنا (https://docs.google.com/forms/...)"
                    />
                  </div>
                ) : (
                  <div className="border-t dark:border-slate-800 pt-6 space-y-4 animate-in fade-in font-sans">
                     <h4 className={`font-black text-lg ${activeSubject.textColor}`}>إضافة سؤال للاختبار:</h4>
                     <input 
                       type="text" 
                       value={currentQuestionText} 
                       onChange={(e) => setCurrentQuestionText(e.target.value)} 
                       className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold font-sans font-sans font-sans" 
                       placeholder="نص السؤال..."
                     />
                     <div className="grid grid-cols-2 gap-3 font-sans">
                        {currentQuestionOptions.map((opt, idx) => (
                          <input 
                            key={idx}
                            type="text" 
                            value={opt} 
                            onChange={(e) => {
                              const updated = [...currentQuestionOptions];
                              updated[idx] = e.target.value;
                              setCurrentQuestionOptions(updated);
                            }} 
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-xs font-bold text-center font-sans" 
                            placeholder={`الاختيار ${idx + 1}`}
                          />
                        ))}
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-400 mb-2 font-sans">تحديد الإجابة الصحيحة:</label>
                       <select 
                         value={currentQuestionCorrect} 
                         onChange={(e) => setCurrentQuestionCorrect(Number(e.target.value))} 
                         className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs cursor-pointer font-sans"
                       >
                          <option value={0}>الاختيار 1</option>
                          <option value={1}>الاختيار 2</option>
                          <option value={2}>الاختيار 3</option>
                          <option value={3}>الاختيار 4</option>
                       </select>
                     </div>
                     <button 
                       type="button" 
                       onClick={handleAddQuestion} 
                       className={`text-white px-6 py-3 rounded-xl font-bold text-xs hover:brightness-110 transition-all font-sans ${activeSubject.accentColor}`}
                     >
                       حفظ السؤال في القائمة
                     </button>

                     {newQuizQuestions.length > 0 && (
                        <div className="border-t dark:border-slate-800 pt-6 font-sans">
                           <h5 className="font-black text-sm mb-3">الأسئلة المضافة حالياً ({newQuizQuestions.length}):</h5>
                           <div className="space-y-2">
                              {newQuizQuestions.map((q, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold font-sans">
                                   <span>{q.text}</span>
                                   <span className={activeSubject.textColor}>الإجابة الصحيحة: الاختيار {q.correct + 1}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
                )}

                <button 
                  type="button"
                  disabled={loading || (!isGoogleForm && newQuizQuestions.length === 0) || (isGoogleForm && !googleFormUrl.trim())}
                  onClick={handleSaveQuiz} 
                  className={`w-full text-white p-5 rounded-2xl font-black text-lg shadow-lg mt-8 transition-all disabled:opacity-50 font-sans ${activeSubject.accentColor}`}
                >
                  نشر الاختبار للطلاب فوراً
                </button>
             </div>
          </div>
        )}

        {/* TAB: Student Management & Activation Panel (للمعلم) */}
        {activeTab === 'إدارة الطلاب' && role === 'teacher' && (
          <div className="space-y-8 text-right animate-in fade-in">
             <h3 className="text-3xl font-black mb-6 flex items-center gap-3 justify-end"><Users className="text-blue-600"/> إدارة وتنشيط حسابات الطلاب</h3>
             
             {inlineNotification && (
               <div className="p-4 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 rounded-2xl text-center text-sm font-black text-blue-600 shadow-sm animate-in fade-in">
                 {inlineNotification}
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* البحث عن طالب باستخدام كود التفعيل */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border h-fit font-sans">
                   <h4 className="font-black text-lg mb-4 flex items-center gap-2 flex-row-reverse"><Key size={18} className="text-blue-600"/> ابحث برمز التفعيل ST</h4>
                   <form onSubmit={handleSearchStudent} className="space-y-4">
                      <input 
                        type="text" 
                        value={searchStudentCode}
                        onChange={(e) => setSearchStudentCode(e.target.value)}
                        placeholder="أدخل رمز تفعيل الطالب (DRM-XXXX)" 
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold border-2 border-transparent focus:border-blue-500 text-center text-sm outline-none"
                      />
                      <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm shadow-md transition-all font-sans">
                        مراجعة بيانات الرمز
                      </button>
                   </form>
                </div>

                {/* تفاصيل الطالب المكتشف والتحليلات الخاصة به */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-sm min-h-[300px] flex flex-col justify-between font-sans animate-in fade-in animate-in fade-in">
                   {scannedStudent ? (
                     <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between border-b pb-4 flex-row-reverse">
                           <div className="text-right font-sans font-sans">
                              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{scannedStudent.username}</h4>
                              <p className="text-xs text-slate-400 font-bold mt-1">رقم الهاتف: {scannedStudent.phone || "غير متوفر"}</p>
                           </div>
                           <span className={`px-4 py-2 rounded-full font-black text-xs font-sans font-sans ${scannedStudent.status === 'active' ? 'bg-green-100 text-green-700' : scannedStudent.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {scannedStudent.status === 'active' ? 'مشترك بالكامل ✓' : scannedStudent.status === 'blocked' ? 'محجوب ✗' : 'بريفيو مجاني ⚙'}
                           </span>
                        </div>

                        {/* معلومات الحساب الإضافية */}
                        <div className="grid grid-cols-2 gap-4 text-sm font-sans font-sans">
                           <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                              <p className="text-xs text-slate-400">الرمز التعريفي الفريد (ID):</p>
                              <p className="font-black text-slate-700 dark:text-slate-200 mt-1">{scannedStudent.studentId}</p>
                           </div>
                           <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                              <p className="text-xs text-slate-400">كلمة المرور المسجلة:</p>
                              <p className="font-black text-slate-700 dark:text-slate-200 mt-1">{scannedStudent.password}</p>
                           </div>
                        </div>

                        {/* أزرار التحكم الفوري بصلاحيات الطالب */}
                        <div className="pt-4 border-t dark:border-slate-800 space-y-3 font-sans font-sans">
                           <p className="text-xs font-black text-slate-400">تعديل صلاحيات تصفح الطالب:</p>
                           <div className="grid grid-cols-3 gap-3">
                              <button 
                                type="button"
                                onClick={() => handleChangeStudentStatus(scannedStudent.username, 'active')}
                                className="p-3 bg-green-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 font-sans"
                              >
                                 <Check size={14}/> تفعيل بالكامل
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleChangeStudentStatus(scannedStudent.username, 'preview')}
                                className="p-3 bg-amber-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 font-sans"
                              >
                                 إعادة للبريفيو
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleChangeStudentStatus(scannedStudent.username, 'blocked')}
                                className="p-3 bg-red-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 font-sans"
                              >
                                 <ShieldAlert size={14}/> حظر وحجب الطالب
                              </button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold italic py-20 text-center animate-pulse">
                        <User size={48} className="text-slate-300 mb-2 mx-auto" />
                        <p className="font-sans font-sans">يرجى إدخال الرمز الخاص بالطالب ST للتحقق من بياناته وصلاحياته وتفعيل حسابه فوراً.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* TAB: Settings & Themes Panel */}
        {activeTab === 'الإعدادات' && (
          <div className="max-w-4xl mx-auto py-10 text-right animate-in fade-in">
             <h3 className="text-3xl font-black mb-2 text-center italic text-blue-600">لوحة الإعدادات وتخصيص المنصة</h3>
             <p className="text-xs text-slate-400 font-bold text-center mb-10 font-sans font-sans">تحكم بأسماء مادتك الدراسية وهويتك البصرية بالكامل</p>

             {successMessage && <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-xl text-center font-bold">{successMessage}</div>}
             {fileError && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-center font-bold">{fileError}</div>}

             {role === 'teacher' ? (
                <form onSubmit={handleSaveThemesAndNames} className="bg-white p-8 sm:p-12 rounded-[3.5rem] border shadow-xl space-y-8 font-sans font-sans">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* المادة الأولى */}
                      <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border dark:border-slate-800">
                         <h4 className="font-black text-lg text-red-600 flex items-center gap-2 flex-row-reverse">تخصيص المادة الأولى <BookOpen size={18}/></h4>
                         <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">اسم المادة الأولى:</label>
                            <input name="chem_name" required defaultValue={subjectConfig.chemistry_name} className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 font-bold border outline-none focus:border-red-500" />
                         </div>
                         <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">تحديد اللون الخاص بها:</label>
                            <select name="chem_theme" defaultValue={subjectConfig.chemistry_theme} className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 font-bold border cursor-pointer">
                               <option value="red">🔴 الأحمر الملكي</option>
                               <option value="emerald">🟢 الأخضر الزمردي</option>
                               <option value="purple">🟣 البنفسجي الأنيق</option>
                               <option value="amber">🟡 الذهبي الفخم</option>
                               <option value="blue">🔵 الأزرق القياسي</option>
                            </select>
                         </div>
                      </div>

                      {/* المادة الثانية */}
                      <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border dark:border-slate-800">
                         <h4 className="font-black text-lg text-blue-600 flex items-center gap-2 flex-row-reverse">تخصيص المادة الثانية <BookOpen size={18}/></h4>
                         <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">اسم المادة الثانية:</label>
                            <input name="phys_name" required defaultValue={subjectConfig.physics_name} className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 font-bold border outline-none focus:border-blue-500" />
                         </div>
                         <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">تحديد اللون الخاص بها:</label>
                            <select name="phys_theme" defaultValue={subjectConfig.physics_theme} className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 font-bold border cursor-pointer">
                               <option value="blue">🔵 الأزرق القياسي</option>
                               <option value="red">🔴 الأحمر الملكي</option>
                               <option value="emerald">🟢 الأخضر الزمردي</option>
                               <option value="purple">🟣 البنفسجي الأنيق</option>
                               <option value="amber">🟡 الذهبي الفخم</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-lg shadow-lg transition-all">
                      {loading ? "جاري ترحيل وحفظ الإعدادات..." : "حفظ الإعدادات بالكامل ونشرها للطلاب"}
                   </button>
                </form>
             ) : (
                <div className="text-center p-20 bg-white font-sans">
                   <Settings size={60} className="mx-auto text-slate-200 mb-4" />
                   <h4 className="text-xl font-black mb-2">{user?.name}</h4>
                   <p className="font-bold text-blue-600 block text-lg mb-2">{user?.studentId}</p>
                   <p className="font-bold text-slate-400 italic text-sm">كافة الإعدادات والتحويلات تدار بواسطة دكتور محمود</p>
                </div>
             )}
          </div>
        )}

      </main>

      {/* Students Tracker Modal */}
      {showStudentsList && role === 'teacher' && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in" onClick={() => { setShowStudentsList(false); setSelectedStudentForLogs(null); }}>
           <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col md:flex-row-reverse" onClick={e => e.stopPropagation()}>
              <div className="flex-1 p-8 border-l overflow-y-auto text-right">
                 <h3 className="text-2xl font-black mb-6 italic font-sans">قائمة الطلاب</h3>
                 <div className="space-y-2">
                    {allStudents.map((std, i) => {
                       const myLogs = filteredViewLogs.filter(l => l.studentName === std.username);
                       const uniqueWatchedIds = new Set(myLogs.map(l => l.contentId));
                       const progressPercent = filteredContents.length > 0 ? Math.min(Math.round((uniqueWatchedIds.size / filteredContents.length) * 100), 100) : 0;

                       return (
                         <div key={i} onClick={() => setSelectedStudentForLogs(std)} className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between flex-row-reverse ${selectedStudentForLogs?.id === std.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'bg-slate-50'}`}>
                           <div className="flex items-center gap-3 flex-row-reverse font-sans">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${selectedStudentForLogs?.id === std.id ? 'bg-white text-blue-600' : (activeSubjectId === 'chemistry' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white')}`}>{std.username ? std.username[0] : ""}</div>
                             <div>
                               <span className="font-bold text-sm block">{std.username}</span>
                               <span className={`text-[10px] font-black block ${selectedStudentForLogs?.id === std.id ? 'text-blue-100' : 'text-blue-500'}`}>{std.studentId || "ST-0000"}</span>
                             </div>
                           </div>
                           <ProgressCircle percentage={progressPercent} size={44} themeColor={activeSubjectId} />
                         </div>
                       );
                    })}
                 </div>
              </div>
              <div className="flex-[1.5] bg-slate-50 p-8 overflow-y-auto text-right animate-in fade-in">
                 {selectedStudentForLogs ? (
                    <>
                       <h4 className="font-black text-xl mb-2 text-blue-600 italic">سجل نشاط: {selectedStudentForLogs.username}</h4>
                       <p className="text-xs text-slate-400 font-bold mb-6">المعرّف: {selectedStudentForLogs.studentId}</p>
                       
                       <div className="mb-6 bg-white p-6 rounded-2xl border text-right font-sans">
                          <h5 className="font-black text-sm mb-3">نتائج اختبارات الطالب في مادة {activeSubject.name}:</h5>
                          {filteredResults.filter(r => r.studentName === selectedStudentForLogs.username).length > 0 ? (
                            <div className="space-y-2">
                               {filteredResults.filter(r => r.studentName === selectedStudentForLogs.username).map((res, i) => (
                                 <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold font-sans font-sans">
                                    <span>{res.quizTitle}</span>
                                    <span className="text-green-600 font-sans">النتيجة: {res.score} ({res.percentage}%)</span>
                                 </div>
                               ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-bold">لم يقم بحل أي اختبار بعد في هذه المادة.</p>
                          )}
                       </div>

                       <div className="space-y-3 font-sans">
                          <h5 className="font-black text-sm">سجل مشاهدة محاضرات مادة {activeSubject.name}:</h5>
                          {filteredViewLogs.filter(l => l.studentName === selectedStudentForLogs.username).length > 0 ? 
                            [...filteredViewLogs.filter(l => l.studentName === selectedStudentForLogs.username)].reverse().map((log, i) => (
                              <div key={i} className="bg-white p-4 rounded-2xl text-sm shadow-sm border dark:border-slate-800 font-sans">
                                 <p className="font-black text-slate-800 dark:text-slate-100">فتح: {log.contentTitle}</p>
                                 <p className="text-[10px] opacity-40 mt-1 font-bold">{log.timestamp?.toDate().toLocaleString('ar-EG')}</p>
                              </div>
                            )) : <p className="text-center py-20 opacity-30 italic font-black">لا يوجد نشاط لهذا الطالب حالياً في هذه المادة</p>
                          }
                       </div>
                    </>
                 ) : <div className="h-full flex items-center justify-center text-slate-400 font-bold italic animate-pulse font-sans">اختر طالباً من القائمة لعرض تفاصيل نشاطه الزمني الدقيق</div>}
              </div>
           </div>
        </div>
      )}

      {/* Contents Management Modal */}
      {showContentsList && role === 'teacher' && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowContentsList(false)}>
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-right" onClick={e => e.stopPropagation()}>
            {/* الهيدر */}
            <div className="p-8 border-b flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-3 flex-row-reverse font-sans">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Trophy size={24}/></div>
                <div>
                  <h3 className="text-2xl font-black italic">إجمالي المحتوى لمادة {activeSubject.name}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">تصفية وترتيب وحذف الفيديوهات والمذكرات والاختبارات المنشورة</p>
                </div>
              </div>
              <button onClick={() => setShowContentsList(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
            </div>

            {/* شريط الفلاتر وأدوات التصفية */}
            <div className="p-6 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-3 gap-4 font-sans font-sans">
              {/* البحث */}
              <div className="relative flex items-center text-right">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الدرس أو الاختبار..." 
                  className="w-full pr-10 pl-4 py-3 bg-white border rounded-xl font-bold text-sm outline-none focus:border-blue-500 transition-colors text-right font-sans font-sans"
                />
                <Search size={18} className="absolute right-3 text-slate-400" />
              </div>

              {/* نوع المحتوى */}
              <div className="flex items-center gap-2 justify-end flex-row-reverse">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">القسم:</span>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-3 bg-white border rounded-xl font-bold text-sm outline-none cursor-pointer text-right font-sans"
                >
                  <option value="all">📁 الكل ({sortedCombinedList.length})</option>
                  <option value="video">🎥 فيديوهات الشرح ({sortedCombinedList.filter(c => c.type === 'video').length})</option>
                  <option value="material">📚 المذكرات PDF ({sortedCombinedList.filter(c => c.type === 'material').length})</option>
                  <option value="quiz">📝 الاختبارات المنشورة ({sortedCombinedList.filter(c => c.isQuiz).length})</option>
                </select>
              </div>

              {/* نوع الترتيب */}
              <div className="flex items-center gap-2 justify-end flex-row-reverse font-sans">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap font-sans font-sans">الترتيب:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 bg-white border rounded-xl font-bold text-sm outline-none cursor-pointer text-right font-sans font-sans"
                >
                  <option value="newest">📅 الأحدث أولاً</option>
                  <option value="oldest">📅 الأقدم أولاً</option>
                  <option value="alpha-asc">🔤 أبجدي (أ - ي)</option>
                  <option value="alpha-desc">🔤 أبجدي (ي - أ)</option>
                </select>
              </div>
            </div>

            {/* قائمة العناصر المنتقاة */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 font-sans font-sans">
              {sortedCombinedList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedCombinedList.map((item) => (
                    <div key={item.id} className="p-5 bg-slate-50 rounded-3xl border flex items-center justify-between flex-row-reverse gap-4 hover:border-blue-500 transition-all font-sans">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <div className={`p-3 rounded-2xl ${item.isQuiz ? 'bg-purple-100 text-purple-600' : item.type === 'video' ? (activeSubjectId === 'chemistry' ? (subjectConfig.chemistry_theme === 'red' ? 'bg-red-100 text-red-600' : subjectConfig.chemistry_theme === 'emerald' ? 'bg-emerald-100 text-emerald-600' : subjectConfig.chemistry_theme === 'purple' ? 'bg-purple-100 text-purple-600' : subjectConfig.chemistry_theme === 'amber' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-600') : (subjectConfig.physics_theme === 'red' ? 'bg-red-100 text-red-600' : subjectConfig.physics_theme === 'emerald' ? 'bg-emerald-100 text-emerald-600' : subjectConfig.physics_theme === 'purple' ? 'bg-purple-100 text-purple-600' : subjectConfig.physics_theme === 'amber' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-600')) : 'bg-amber-100 text-amber-600'}`}>
                          {item.isQuiz ? <ClipboardList size={24}/> : item.type === 'video' ? <PlayCircle size={24}/> : <FileText size={24}/>}
                        </div>
                        <div className="text-right">
                          <h4 className="font-black text-sm max-w-[180px] sm:max-w-xs truncate">{item.title}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-1 font-sans">
                            {item.typeLabel} {item.createdAt ? `• نشر في: ${item.createdAt.toDate().toLocaleDateString('ar-EG')}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!item.isQuiz && (
                          <button 
                            type="button"
                            onClick={() => { setViewingContent(item); setShowContentsList(false); }}
                            className={`px-4 py-2 text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 font-sans ${activeSubject.accentColor}`}
                          >
                            <Eye size={14}/> معاينة
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => setDeleteConfirmTarget({ id: item.id, title: item.title, isQuiz: item.isQuiz })}
                          className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                          title="حذف المحتوى نهائياً"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30 italic font-black font-sans">
                  <Info size={40} className="mx-auto mb-2" />
                  <p>لا توجد عناصر تطابق خيارات التصفية الحالية.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Modal (مودال عرض الفيديوهات أو تحذير المذكرات لتجنب الشاشات البيضاء) */}
      {viewingContent && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in" onClick={() => setViewingContent(null)}>
           <div className="p-6 border-b border-white/10 flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-3">
                <h4 className="font-black text-xl text-white italic font-sans">{viewingContent.title}</h4>
              </div>
              <div className="flex gap-2 font-sans font-sans">
                {viewingContent.type === 'material' && (
                  <a 
                    href={viewingContent.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`px-4 py-2 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${activeSubject.accentColor}`}
                  >
                    <ExternalLink size={14}/> تحميل وقراءة الملف بالخارج
                  </a>
                )}
                <button type="button" onClick={() => setViewingContent(null)} className="p-3 bg-white/10 text-white rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
              </div>
           </div>
           <div className="flex-1 overflow-hidden animate-in fade-in" onClick={e => e.stopPropagation()}>
              {viewingContent.type === 'video' ? (
                <video src={viewingContent.url} controls className="w-full h-full object-contain" autoPlay />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white bg-slate-950 p-6 text-center font-sans font-sans">
                   <FileText size={64} className="text-amber-500 mb-4 animate-bounce" />
                   <h3 className="text-2xl font-black mb-2 font-sans">الملف أو المذكرة جاهزة للقراءة والتحميل</h3>
                   <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed font-sans">لتجنب قيود الحماية وظهور شاشة بيضاء، اضغط على الزر أدناه لفتح المذكرة فوراً بجودة عالية في متصفحك أو تحميلها على جهازك.</p>
                   <a 
                     href={viewingContent.url} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className={`px-8 py-4 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all ${activeSubject.accentColor}`}
                   >
                     <ExternalLink size={18}/> اضغط لفتح المذكرة الآن 
                   </a>
                </div>
              )}
           </div>
        </div>
      )}

      {/* ميزة الطالب 2: مودال مراجعة الإجابات والحلول دون إتاحة إعادة الحل */}
      {reviewingQuiz && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in" onClick={() => setReviewingQuiz(null)}>
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-right animate-in slide-in-from-bottom-6" onClick={e => e.stopPropagation()}>
             <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between flex-row-reverse">
                <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 italic">مراجعة الاختبار: {reviewingQuiz.quiz.title}</h3>
                <button type="button" onClick={() => setReviewingQuiz(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-red-500 dark:hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-8 font-sans">
                {reviewingQuiz.quiz.questions.map((q, qIdx) => {
                  const studentAns = reviewingQuiz.answers[qIdx];
                  const isCorrect = studentAns === q.correct;

                  return (
                    <div key={qIdx} className="space-y-4 border-b dark:border-slate-800 pb-6 last:border-none">
                       <div className="flex items-start justify-between gap-4 flex-row-reverse">
                          <h5 className="font-black text-lg text-slate-800 dark:text-slate-100">السؤال {qIdx + 1}: {q.text}</h5>
                          <span className={`text-[10px] px-3 py-1 rounded-md font-black whitespace-nowrap ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {isCorrect ? "إجابة صحيحة ✓" : "إجابة خاطئة ✗"}
                          </span>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt, oIdx) => {
                            let style = "border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300";
                            
                            if (oIdx === q.correct) {
                              style = "border-green-600 bg-green-50/50 dark:bg-green-950/20 text-green-600 dark:text-green-400 font-bold";
                            } else if (oIdx === studentAns && !isCorrect) {
                              style = "border-red-600 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold";
                            }

                            return (
                              <div
                                key={oIdx}
                                className={`p-4 rounded-2xl text-right transition-all border-2 flex items-center justify-between flex-row-reverse ${style}`}
                              >
                                <span>{opt}</span>
                                {oIdx === q.correct && <span className="text-[10px] bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded font-black">الصح</span>}
                                {oIdx === studentAns && !isCorrect && <span className="text-[10px] bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded font-black">اختيارك</span>}
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
};

export default App;
