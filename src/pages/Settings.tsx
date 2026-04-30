import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  CreditCard, 
  Database, 
  Bell, 
  Shield, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Loader2,
  Lock,
  Key,
  MonitorSmartphone,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthProvider';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const { user, profile } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    orgName: ''
  });

  useEffect(() => {
    async function fetchOrg() {
      if (profile?.orgId) {
        try {
          const orgDoc = await getDoc(doc(db, 'organizations', profile.orgId));
          if (orgDoc.exists()) {
            setOrg(orgDoc.data());
            setFormData({
              userName: profile?.name || user?.displayName || '',
              orgName: orgDoc.data().name || ''
            });
          }
        } catch (error) {
          console.error("Failed to fetch org:", error);
        }
      }
      if (profile) {
        // assume profile docs might have twoFactorEnabled
        setTwoFactorEnabled(profile.twoFactorEnabled || false);
      }
      setLoading(false);
    }
    fetchOrg();
  }, [profile, user]);

  const handleToggle2FA = async () => {
    if (!profile?.uid) return;
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        twoFactorEnabled: newValue
      });
    } catch (e) {
      console.error(e);
      setTwoFactorEnabled(!newValue); // revert on error
    }
  };

  const handleSaveAccount = async () => {
    if (!profile?.uid || !profile?.orgId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        name: formData.userName
      });
      if (profile.role === 'owner') {
        await updateDoc(doc(db, 'organizations', profile.orgId), {
          name: formData.orgName
        });
      }
      // Re-fetch org to update state could go here, or handled by context
    } catch (error) {
      console.error('Failed to update account:', error);
    }
    setIsSaving(false);
  };

  const tabs = [
    { id: 'account', label: 'حسابي', icon: UserIcon },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'billing', label: 'الاشتراك والفواتير', icon: CreditCard },
    { id: 'whatsapp', label: 'ربط واتساب', icon: Smartphone },
    { id: 'team', label: 'فريق العمل', icon: Users },
    { id: 'notifications', label: 'التنبيهات', icon: Bell },
  ];

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full items-center justify-center pt-24 text-gray-400">
          <Loader2 className="animate-spin" size={32} />
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8 pb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 space-y-2 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black transition-all",
                    activeTab === tab.id 
                      ? "bg-brand text-white shadow-xl shadow-brand/20" 
                      : "text-gray-500 hover:bg-white hover:text-brand"
                  )}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-8 min-w-0">
              <AnimatePresence mode="wait">
                {activeTab === 'account' && (
                  <motion.div key="account" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                      <div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">المعلومات الشخصية</h2>
                        <p className="text-sm text-gray-500 font-medium">إدارة تفاصيل حسابك الشخصي وكيفية ظهورك.</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[2rem] bg-gray-100 flex items-center justify-center text-3xl font-black text-brand-dark border-4 border-white shadow-lg overflow-hidden">
                          {profile?.photoURL || user?.photoURL ? (
                            <img src={profile?.photoURL || user?.photoURL || ''} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            (profile?.name || user?.displayName)?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <button className="bg-brand text-white text-xs font-black px-4 py-2 rounded-xl mb-2">تغيير الصورة</button>
                          <p className="text-[10px] text-gray-400 font-bold">PNG, JPG بحد أقصى 5 ميجابايت</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 mr-2">الاسم الكامل</label>
                          <input 
                            type="text" 
                            value={formData.userName}
                            onChange={(e) => setFormData({...formData, userName: e.target.value})}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand/40 focus:bg-white rounded-2xl px-6 py-3 font-bold text-gray-900 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 mr-2">البريد الإلكتروني</label>
                          <input type="email" value={profile?.email || user?.email || ''} readOnly className="w-full bg-gray-50 border-2 border-transparent focus:border-brand/40 focus:bg-white rounded-2xl px-6 py-3 font-bold text-gray-900 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 mr-2">اسم الشركة</label>
                          <input 
                            type="text" 
                            value={formData.orgName}
                            onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                            disabled={profile?.role !== 'owner'}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand/40 focus:bg-white rounded-2xl px-6 py-3 font-bold text-gray-900 outline-none transition-all disabled:opacity-50" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 mr-2">المسؤولية</label>
                          <input type="text" value={profile?.role === 'owner' ? 'مالك الحساب' : 'مسؤول'} disabled className="w-full bg-gray-100 border-2 border-transparent rounded-2xl px-6 py-3 font-bold text-gray-400 outline-none cursor-not-allowed" />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <button 
                          onClick={handleSaveAccount}
                          disabled={isSaving}
                          className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-brand/10 hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                        >
                          {isSaving && <Loader2 size={16} className="animate-spin" />}
                          حفظ التغييرات
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                      <div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">إعدادات الأمان</h2>
                        <p className="text-sm text-gray-500 font-medium">حماية حسابك وإدارة جلسات تسجيل الدخول</p>
                      </div>

                      {/* Two-factor auth */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-brand flex items-center justify-center shrink-0 border border-gray-100">
                            <Lock size={24} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 mb-1">المصادقة الثنائية (2FA)</h3>
                            <p className="text-xs font-bold text-gray-500 max-w-sm">أضف طبقة أمان إضافية لحسابك من خلال المطالبة برمز بالإضافة إلى كلمة المرور الخاصة بك.</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleToggle2FA}
                          className={cn(
                            "px-6 py-2.5 text-xs font-black rounded-xl transition-colors shadow-sm shrink-0",
                            twoFactorEnabled 
                              ? "bg-red-50 text-red-600 hover:bg-red-100" 
                              : "bg-brand text-white hover:bg-brand-dark shadow-brand/10 shadow-xl"
                          )}
                        >
                          {twoFactorEnabled ? 'تعطيل' : 'التفعيل الآن'}
                        </button>
                      </div>

                      {/* Password Change */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-gray-600 flex items-center justify-center shrink-0 border border-gray-100">
                            <Key size={24} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 mb-1">كلمة المرور</h3>
                            <p className="text-xs font-bold text-gray-500 max-w-sm">تم آخر تغيير منذ ٣ أشهر. يفضل تغيير كلمة المرور بشكل دوري لتأمين الحساب.</p>
                          </div>
                        </div>
                        <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-xl hover:bg-gray-100 transition-colors shadow-sm shrink-0">تغيير كلمة المرور</button>
                      </div>

                      {/* Sessions */}
                      <div className="pt-4 border-t border-gray-50">
                        <h3 className="text-base font-black text-gray-900 mb-4">الجلسات النشطة</h3>
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-gray-100 hover:border-gray-200 transition-colors rounded-2xl">
                            <div className="flex items-center gap-4">
                              <MonitorSmartphone size={24} className="text-brand shrink-0" />
                              <div>
                                <p className="text-sm font-black text-gray-900">MacBook Pro - Chrome <span className="text-[10px] bg-green-50 text-green-600 px-2.5 py-0.5 rounded-lg mr-2 font-black uppercase tracking-widest">هذا الجهاز</span></p>
                                <p className="text-xs font-bold text-gray-400 mt-1">الرياض، السعودية • نشط الآن</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-gray-100 hover:border-gray-200 transition-colors rounded-2xl">
                            <div className="flex items-center gap-4">
                              <Smartphone size={24} className="text-gray-400 shrink-0" />
                              <div>
                                <p className="text-sm font-black text-gray-900">iPhone 14 Pro - Safari</p>
                                <p className="text-xs font-bold text-gray-400 mt-1">جدة، السعودية • منذ ساعتين</p>
                              </div>
                            </div>
                            <button className="text-xs font-black text-red-500 hover:text-red-900 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all shrink-0">إنهاء الجلسة</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div key="billing" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="bg-brand p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl shadow-brand/20">
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-black mb-1">الخطة الحالية: {org?.planId === 'enterprise' ? 'الخطة المؤسسية (Enterprise)' : org?.planId === 'pro' ? 'احترافية (Pro)' : 'مجانية (Free)'}</h2>
                          <p className="text-brand-light font-bold text-sm">تاريخ التجديد القادم: ١٥ مايو ٢٠٢٦</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black">
                          {org?.planId === 'enterprise' ? '$٩٩ / شهرياً' : org?.planId === 'pro' ? '$٤٩ / شهرياً' : 'مجاني'}
                        </div>
                      </div>

                      <div className="relative z-10 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(() => {
                          const limits = {
                            free: { messages: 1000, contacts: 500, auto: 3 },
                            pro: { messages: 10000, contacts: 5000, auto: 10 },
                            enterprise: { messages: 100000, contacts: 50000, auto: 100 }
                          };
                          const currentLimits = limits[org?.planId as keyof typeof limits] || limits.free;
                          
                          const usage = {
                            messages: org?.usage?.messages || 0,
                            contacts: org?.usage?.contacts || 0,
                            auto: org?.usage?.auto || 0
                          };

                          const msgPercent = Math.min(100, Math.round((usage.messages / currentLimits.messages) * 100));
                          const contactPercent = Math.min(100, Math.round((usage.contacts / currentLimits.contacts) * 100));
                          const autoPercent = Math.min(100, Math.round((usage.auto / currentLimits.auto) * 100));

                          return (
                            <>
                              <div>
                                <p className="text-brand-light text-[10px] font-black uppercase mb-2">استهلاك الرسائل</p>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                                  <div className="h-full bg-white rounded-full" style={{ width: `${msgPercent}%` }} />
                                </div>
                                <p className="text-xs font-black">{usage.messages.toLocaleString()} / {currentLimits.messages.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-brand-light text-[10px] font-black uppercase mb-2">جهات الاتصال</p>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                                  <div className="h-full bg-white rounded-full" style={{ width: `${contactPercent}%` }} />
                                </div>
                                <p className="text-xs font-black">{usage.contacts.toLocaleString()} / {currentLimits.contacts.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-brand-light text-[10px] font-black uppercase mb-2">الأتمتة النشطة</p>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                                  <div className="h-full bg-white rounded-full" style={{ width: `${autoPercent}%` }} />
                                </div>
                                <p className="text-xs font-black">{usage.auto} / {currentLimits.auto}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Zap size={200} />
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                      <h3 className="text-lg font-black text-gray-900">طرق الدفع</h3>
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-blue-800 italic">VISA</div>
                          <div>
                            <p className="text-sm font-black text-gray-900">Visa تنتهي بـ ٤٢٤٢</p>
                            <p className="text-[10px] font-bold text-gray-400">تنتهي في ٠٤ / ٢٨</p>
                          </div>
                        </div>
                        <button className="text-brand text-xs font-black">تعديل</button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={async () => {
                          if (!profile?.orgId) return;
                          setIsSaving(true);
                          await updateDoc(doc(db, 'organizations', profile.orgId), { planId: 'enterprise' });
                          setOrg({ ...org, planId: 'enterprise' });
                          setIsSaving(false);
                        }}
                        disabled={isSaving || org?.planId === 'enterprise'}
                        className="flex-1 bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-brand/40 transition-all text-center group disabled:opacity-50"
                      >
                        <p className="text-xs font-black text-gray-400 mb-2">ترقية الخطة</p>
                        <p className="text-lg font-black text-brand group-hover:scale-105 transition-transform">{org?.planId === 'enterprise' ? 'أنت على أعلى خطة' : 'الخطة المؤسسية (Enterprise)'}</p>
                      </button>
                      <button 
                        onClick={async () => {
                          if (!profile?.orgId) return;
                          setIsSaving(true);
                          await updateDoc(doc(db, 'organizations', profile.orgId), { planId: 'free' });
                          setOrg({ ...org, planId: 'free' });
                          setIsSaving(false);
                        }}
                        disabled={isSaving || org?.planId === 'free'}
                        className="flex-1 bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-red-100 transition-all text-center group disabled:opacity-50"
                      >
                        <p className="text-xs font-black text-gray-400 mb-2">إلغاء الاشتراك</p>
                        <p className="text-lg font-black text-red-500">تخفيض الخطة</p>
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'whatsapp' && (
                  <motion.div key="whatsapp" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center text-center space-y-6">
                      {org?.whatsappConnected ? (
                        <>
                          <div className="w-20 h-20 bg-green-50 text-brand rounded-[2rem] flex items-center justify-center shadow-xl shadow-brand/10">
                            <CheckCircle2 size={40} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">واتساب متصل وصحي</h2>
                            <p className="text-sm font-medium text-gray-500">رقم الهاتف النشط: {org?.whatsappNumber || 'غير متوفر'}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full">Meta Business API</span>
                            <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full">High Quality Rating</span>
                          </div>
                          <div className="pt-8 w-full max-w-sm space-y-3">
                            <button className="w-full bg-brand text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand/10">إعداد القوالب (Templates)</button>
                            <button 
                              onClick={async () => {
                                if (!profile?.orgId) return;
                                await updateDoc(doc(db, 'organizations', profile.orgId), { whatsappConnected: false, whatsappNumber: '' });
                                setOrg({ ...org, whatsappConnected: false, whatsappNumber: '' });
                              }}
                              className="w-full bg-gray-50 text-red-500 py-4 rounded-2xl font-black text-sm hover:bg-red-50 transition-colors"
                            >
                              قطع الاتصال
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-[2rem] flex items-center justify-center shadow-xl shadow-gray-100">
                            <Smartphone size={40} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">ربط واتساب للأعمال</h2>
                            <p className="text-sm font-medium text-gray-500">قم بربط حساب WhatsApp Business API الخاص بك لبدء إرسال الرسائل.</p>
                          </div>
                          <div className="pt-8 w-full max-w-sm space-y-3">
                            <button 
                              onClick={async () => {
                                if (!profile?.orgId) return;
                                const num = prompt("أدخل رقم الواتساب الخاص بك (مثال: +966501234567)");
                                if (num) {
                                  await updateDoc(doc(db, 'organizations', profile.orgId), { whatsappConnected: true, whatsappNumber: num });
                                  setOrg({ ...org, whatsappConnected: true, whatsappNumber: num });
                                }
                              }}
                              className="w-full bg-brand text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand/10 flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform"
                            >
                              ربط حساب واتساب الآن
                              <ArrowUpRight size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
                {activeTab === 'team' && (
                  <motion.div key="team" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                    <TeamSettings orgId={profile?.orgId || ''} currentRole={profile?.role || 'agent'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TeamSettings({ orgId, currentRole }: { orgId: string, currentRole: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'agent' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchUsers();
  }, [orgId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('orgId', '==', orgId));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: import('react').FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'owner' && currentRole !== 'admin') {
       setError("ليس لديك صلاحية.");
       return;
    }
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', editingId), { ...formData });
      } else {
        const newUid = Math.random().toString(36).substring(2, 15);
        await setDoc(doc(db, 'users', newUid), {
          ...formData,
          uid: newUid,
          orgId: orgId,
          createdAt: new Date().toISOString(),
          isSuperAdmin: false
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', email: '', role: 'agent' });
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (currentRole !== 'owner') {
       setError("لا يملك صلاحية الحذف سوى المالك.");
       return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openEdit = (u: any) => {
    setFormData({ name: u.name || '', email: u.email || '', role: u.role || 'agent' });
    setEditingId(u._id);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setFormData({ name: '', email: '', role: 'agent' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">فريق العمل</h2>
            <p className="text-sm text-gray-500 font-medium">إدارة الأعضاء والصلاحيات.</p>
          </div>
          {(currentRole === 'owner' || currentRole === 'admin') && (
            <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3 bg-brand text-white border border-transparent rounded-2xl text-sm font-black hover:bg-brand-dark transition-colors shadow-xl shadow-brand/10 shrink-0">
              <UserPlus size={18} /> إضافة عضو
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-[11px] font-black uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4 whitespace-nowrap rounded-r-2xl">العضو</th>
                <th className="px-6 py-4 whitespace-nowrap">الصلاحية</th>
                <th className="px-6 py-4 whitespace-nowrap text-center rounded-l-2xl">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-3" size={28} />
                    <p className="font-bold">جاري التحميل...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    <Users className="mx-auto mb-3 opacity-20" size={48} />
                    <p className="font-bold">لا يوجد أعضاء</p>
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/10 flex items-center justify-center font-black text-brand text-lg shadow-sm shrink-0">
                        {u.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{u.name || 'بدون اسم'}</p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 mt-1">
                          <Mail size={12} className="text-gray-400" />
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border flex items-center w-fit gap-1",
                      u.role === 'owner' ? "bg-purple-50 text-purple-700 border-purple-200" :
                      u.role === 'admin' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-gray-50 text-gray-700 border-gray-200"
                    )}>
                      {u.role === 'owner' ? <Shield size={12} /> : u.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                      {u.role === 'owner' ? 'المالك (Owner)' : u.role === 'admin' ? 'مشرف (Admin)' : 'وكيل دعم (Agent)'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                         onClick={() => openEdit(u)} 
                         disabled={currentRole !== 'owner' && currentRole !== 'admin'}
                         className="p-2 bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl text-gray-500 transition-colors disabled:opacity-50"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={() => handleDeleteUser(u._id)} 
                         disabled={currentRole !== 'owner'}
                         className="p-2 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl text-gray-500 transition-colors disabled:opacity-50"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden relative"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">
                {editingId ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-5 bg-gray-50/50">
              <div>
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">اسم المستخدم</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all"
                  required
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">الدور والصلاحيات</label>
                <div className="relative">
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    disabled={currentRole !== 'owner'}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="owner">المالك (Owner)</option>
                    <option value="admin">مشرف (Admin)</option>
                    <option value="agent">وكيل دعم (Agent)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  إلغاء
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-brand text-white border border-transparent rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
                  {editingId ? 'حفظ التعديلات' : 'إضافة العضو'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
