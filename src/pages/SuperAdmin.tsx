import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  MoreVertical,
  Activity,
  CreditCard,
  Loader2,
  Server,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  ChevronDown,
  Lock,
  Terminal,
  Globe,
  Zap,
  Clock,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  X,
  ArrowRight,
  Mail,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, orderBy, updateDoc, doc, where, setDoc, deleteDoc, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../components/AuthProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const activityData = [
  { time: '00:00', requests: 4000, errors: 24 },
  { time: '04:00', requests: 3000, errors: 13 },
  { time: '08:00', requests: 12000, errors: 45 },
  { time: '12:00', requests: 27800, errors: 89 },
  { time: '16:00', requests: 18900, errors: 38 },
  { time: '20:00', requests: 23900, errors: 55 },
  { time: '24:00', requests: 14900, errors: 43 },
];

const revenueData = [
  { month: 'Jan', revenue: 15000 },
  { month: 'Feb', revenue: 22000 },
  { month: 'Mar', revenue: 28000 },
  { month: 'Apr', revenue: 35000 },
  { month: 'May', revenue: 42000 },
  { month: 'Jun', revenue: 48000 },
];

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'billing' | 'security' | 'infrastructure'>('overview');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgForUsers, setSelectedOrgForUsers] = useState<any | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    async function fetchOrgs() {
      if (!profile?.isSuperAdmin) return;
      try {
        const q = query(collection(db, 'organizations'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const orgsWithUserCount = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const orgData = docSnap.data();
          const usersQuery = query(collection(db, 'users'), where('orgId', '==', docSnap.id));
          const usersSnapshot = await getCountFromServer(usersQuery);
          return {
            _id: docSnap.id,
            ...orgData,
            userCount: usersSnapshot.data().count
          };
        }));
        
        setOrgs(orgsWithUserCount);
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, [profile]);

  const handleUpdateOrg = async (orgId: string, field: string, value: string) => {
    try {
      await updateDoc(doc(db, 'organizations', orgId), { [field]: value });
      setOrgs(orgs.map(org => org._id === orgId ? { ...org, [field]: value } : org));
    } catch (error) {
      console.error(`Failed to update org ${orgId}:`, error);
    }
  };

  return (
    <div className="space-y-8 pb-12 h-screen overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">مركز القيادة <span className="text-brand">SuperAdmin</span></h1>
            <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              إنتاج (Production)
            </span>
          </div>
          <p className="text-gray-500 font-medium text-sm">نظام التحكم الشامل والعميق للمنصة، إحصائيات حية، إدارة الموارد (Tenants)، وسجلات التدقيق.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-200 flex items-center gap-3">
            <Globe className="text-gray-400" size={18} />
            <div className="text-left font-mono">
              <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Region</p>
              <p className="text-xs font-black text-gray-700">me-central-1 (GCP)</p>
            </div>
          </div>
          <div className="bg-green-50 px-5 py-2.5 rounded-2xl border border-green-200 flex items-center gap-3 shadow-sm">
            <Activity className="text-green-500" size={18} />
            <div className="text-left font-mono">
              <p className="text-[9px] font-bold uppercase text-green-600/70 tracking-widest">System Status</p>
              <p className="text-xs font-black text-green-700">All Systems Normal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'نظرة عامة (Overview)', icon: BarChart3 },
          { id: 'orgs', label: 'العملاء (Tenants)', icon: Building2 },
          { id: 'billing', label: 'الفوترة (Billing & MRR)', icon: CreditCard },
          { id: 'infrastructure', label: 'البنية التحتية (Infrastructure)', icon: Server },
          { id: 'security', label: 'سجلات التدقيق (Audit & IAM)', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2.5",
              activeTab === tab.id 
                ? "bg-gray-900 text-white shadow-lg border border-gray-800" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm hover:border-gray-300"
            )}
          >
            <tab.icon size={18} className={activeTab === tab.id ? "opacity-100" : "opacity-60"} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'الإيرادات الشهرية (MRR)', value: '$٤٨,٢٥٠', sub: '+12.5% الشهر الماضي', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-500', trend: 'up' },
                  { label: 'حجم الطلبات / ثانية (RPS)', value: '١,٨٤٠', sub: 'ذروة 4k/s اليوم', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-500', trend: 'up' },
                  { label: 'معدل الأخطاء (API Error Rate)', value: '٠.٠٢٪', sub: '-0.01% خلال 24h', icon: Terminal, color: 'text-brand', bg: 'bg-brand', trend: 'down' },
                  { label: 'العملاء النشطون (Active Tenants)', value: '٣٤٢', sub: '+15 خلال أسبوع', icon: Users, color: 'text-purple-600', bg: 'bg-purple-500', trend: 'up' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className={cn("p-3 rounded-2xl flex items-center justify-center border", stat.bg.replace('bg-', 'bg-opacity-10 bg-'), stat.color, stat.color.replace('text-', 'border-').replace('600', '100'))}>
                        <stat.icon size={22} />
                      </div>
                      <div className={cn("flex items-center gap-1 text-xs font-black", stat.trend === 'up' ? "text-green-500" : "text-brand")}>
                        {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {stat.trend === 'up' ? 'نمو' : 'تحسن'}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-sm font-bold text-gray-500">{stat.label}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-2">{stat.sub}</p>
                    </div>
                    {/* Decorative Background Element */}
                    <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-5 blur-2xl group-hover:scale-150 transition-transform duration-700", stat.bg)}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">حركة البيانات والأخطاء (Platform Traffic)</h2>
                      <p className="text-xs font-bold text-gray-500 mt-1">طلبات واجهة برمجة التطبيقات خلال 24 ساعة</p>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  <div className="h-72 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontFamily: 'Inter' }}
                          itemStyle={{ fontWeight: 800 }}
                          labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '8px' }}
                        />
                        <Area type="monotone" dataKey="requests" name="الطلبات (Requests)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                        <Area type="monotone" dataKey="errors" name="الأخطاء (Errors)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorErrors)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">نمو الإيرادات المتكررة (MRR Growth)</h2>
                      <p className="text-xs font-bold text-gray-500 mt-1">تطور الإيرادات مقسمة بالأشهر</p>
                    </div>
                  </div>
                  <div className="h-72 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontFamily: 'Inter' }}
                          itemStyle={{ fontWeight: 800 }}
                          labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '4px' }}
                        />
                        <Bar dataKey="revenue" name="الإيرادات ($)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORGANIZATIONS */}
          {activeTab === 'orgs' && (
            <AnimatePresence mode="wait">
              {selectedOrgForUsers ? (
                <ManageOrgUsersView key="usersView" org={selectedOrgForUsers} onBack={() => setSelectedOrgForUsers(null)} />
              ) : (
                <motion.div 
                  key="orgsList"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                >
              <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="البحث بـ Tenant ID، الاسم، البريد..." 
                      className="bg-white border text-sm font-bold border-gray-200 rounded-xl pr-12 pl-4 py-3 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 outline-none w-80 shadow-sm transition-all"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                    <Filter size={16} className="text-gray-400" /> فلترة (Filters)
                  </button>
                </div>
                <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <Download size={16} className="text-brand" /> تصدير (CSV)
                </button>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 text-[11px] font-black uppercase tracking-widest border-b border-gray-100">
                      <th className="px-8 py-5 whitespace-nowrap">المنظمة (Tenant)</th>
                      <th className="px-8 py-5 whitespace-nowrap text-center">المستخدمين (Users)</th>
                      <th className="px-8 py-5 whitespace-nowrap">الخطة (Plan)</th>
                      <th className="px-8 py-5 whitespace-nowrap">الحالة (Status)</th>
                      <th className="px-8 py-5 whitespace-nowrap">الاستهلاك وموارد DB</th>
                      <th className="px-8 py-5 whitespace-nowrap">تاريخ التسجيل</th>
                      <th className="px-8 py-5 whitespace-nowrap text-center">المسؤوليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-16 text-center text-gray-400">
                          <Loader2 className="animate-spin mx-auto mb-3" size={28} />
                          <p className="font-bold">جاري استرجاع بيانات الـ Tenants...</p>
                        </td>
                      </tr>
                    ) : orgs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-16 text-center text-gray-400">
                          <Database className="mx-auto mb-3 opacity-20" size={48} />
                          <p className="font-bold text-lg text-gray-900 mb-1">قاعدة البيانات فارغة</p>
                          <p className="text-sm">لا يوجد عملاء مسجلين حالياً في هذا الـ Cluster.</p>
                        </td>
                      </tr>
                    ) : orgs.map((org, i) => (
                      <tr key={org._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center font-black text-gray-500 text-lg uppercase shadow-sm">
                              {org.name?.[0] || 'T'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 group-hover:text-brand transition-colors cursor-pointer">{org.name || 'مجهول'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ID: {org._id.slice(0,8)}</span>
                                <span className="text-[10px] font-bold text-gray-400">{org.ownerId}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-black shadow-sm">
                            <Users size={14} className="text-gray-400" />
                            {org.userCount !== undefined ? org.userCount : '-'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="relative inline-block w-32">
                            <select 
                              value={org.planId || 'free'} 
                              onChange={(e) => handleUpdateOrg(org._id, 'planId', e.target.value)}
                              className={cn(
                                "w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-black uppercase outline-none border-2 cursor-pointer appearance-none shadow-sm transition-colors",
                                org.planId === 'enterprise' ? "bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-300" :
                                org.planId === 'pro' ? "bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300" :
                                "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                              )}
                            >
                              <option value="free">Free Tier</option>
                              <option value="pro">Pro ($29/m)</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => handleUpdateOrg(org._id, 'status', org.status === 'active' ? 'suspended' : 'active')}
                            className={cn(
                              "flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all",
                              org.status === 'active' ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            )}
                          >
                            {org.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {org.status === 'active' ? 'Active ' : 'Suspended'}
                          </button>
                        </td>
                        <td className="px-8 py-5">
                          {(() => {
                            const limits = { free: 1000, pro: 10000, enterprise: 100000 };
                            const limit = limits[org.planId as keyof typeof limits] || limits.free;
                            const usage = org.usage?.messages || Math.floor(Math.random() * limit * 0.8); // mockup
                            const percent = Math.min(100, Math.round((usage / limit) * 100));
                            
                            return (
                              <div className="w-48">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black text-gray-500 font-mono">{usage.toLocaleString()} / {limit.toLocaleString()} msg</span>
                                  <span className="text-[10px] font-black text-gray-600">{percent}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      percent > 85 ? "bg-red-500" : percent > 60 ? "bg-yellow-500" : "bg-brand"
                                    )} 
                                    style={{ width: `${percent}%` }} 
                                  />
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                  <Database size={10} className="text-gray-400" />
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest font-mono">Shard: db-cluster-a1</span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-gray-900">{new Date(org.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 font-mono mt-1">{new Date(org.createdAt).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setSelectedOrgForUsers(org)} className="p-2 hover:bg-brand/10 hover:text-brand rounded-xl text-gray-400 transition-colors" title="إدارة المستخدمين">
                              <Users size={18} />
                            </button>
                            <button className="p-2 hover:bg-brand/10 hover:text-brand rounded-xl text-gray-400 transition-colors" title="إعدادات Tenant">
                              <Settings size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                <p>إجمالي القيود المعروضة: <span className="font-black text-gray-900">{orgs.length}</span></p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50">السابق</button>
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50">التالي</button>
                </div>
              </div>
            </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* TAB: INFRASTRUCTURE (Mockup of Deep Systems) */}
          {activeTab === 'infrastructure' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'PostgreSQL Database', status: 'Healthy', details: 'Conn: 245/1000 | Load: 45%', icon: Database, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { title: 'Redis Cache (In-Memory)', status: 'Healthy', details: 'Hit Rate: 98.2% | Mem: 4GB/16GB', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
                  { title: 'Webhook Worker Queue', status: 'Processing', details: 'Pending: 12 | Processed (24h): 1.2M', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((infra, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn("w-14 h-14 border rounded-2xl flex items-center justify-center border-gray-100 shadow-sm", infra.bg, infra.color)}>
                        <infra.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-sm font-mono tracking-tight">{infra.title}</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-green-100">
                          {infra.status}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-600 font-mono text-left" dir="ltr">{infra.details}</p>
                    </div>
                    <button className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50 transition-colors">
                      View System Logs
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-xl overflow-hidden text-left" dir="ltr">
                <div className="px-6 py-4 border-b border-gray-800 bg-black/50 flex items-center gap-3">
                  <Terminal size={16} className="text-gray-400" />
                  <span className="text-xs font-black text-gray-300 font-mono tracking-widest uppercase">Live System Logs (Tail)</span>
                </div>
                <div className="p-6 font-mono text-[11px] md:text-sm text-green-400 space-y-2 h-64 overflow-y-auto">
                  <p><span className="text-gray-500">[2026-04-27T23:40:01Z]</span> INFO: API request inbound - POST /api/v1/messages (tenant: T_ax89b)</p>
                  <p><span className="text-gray-500">[2026-04-27T23:40:02Z]</span> <span className="text-yellow-400">WARN: Rate limit approaching for tenant T_ax89b (950/1000)</span></p>
                  <p><span className="text-gray-500">[2026-04-27T23:40:05Z]</span> INFO: Processed webhook queue batch - 150 items</p>
                  <p><span className="text-gray-500">[2026-04-27T23:40:12Z]</span> INFO: DB Backup completed to S3 bucket (size: 4.2GB)</p>
                  <p><span className="text-gray-500">[2026-04-27T23:40:21Z]</span> INFO: Auth token validated for admin user (uid: x9F...)</p>
                  <p><span className="text-gray-500">[2026-04-27T23:40:40Z]</span> <span className="text-brand">DEBUG: Cached plan data updated for Enterprise segment</span></p>
                  <p><span className="text-gray-500">[2026-04-27T23:41:00Z]</span> INFO: Health check ping - OK (Latency: 14ms)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & IAM */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center gap-4 mb-6">
                  <ShieldCheck size={28} className="text-gray-900" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900">سجل التدقيق الأمني (Audit Logs)</h2>
                    <p className="text-sm font-bold text-gray-500">مراقبة دقيقة لجميع العمليات الحساسة في المنصة.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right" dir="ltr">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left">Timestamp (UTC)</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left">Actor (Email / API Key)</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left">Action Event</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left">Resource</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left">IP Address</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700">
                      {[
                        { time: '2026-04-27 23:20:10', actor: 'admin@platform.com', event: 'TENANT_SUSPEND', res: 'org_8x99A', ip: '192.168.1.4', status: 'SUCCESS' },
                        { time: '2026-04-27 23:15:02', actor: 'system_worker', event: 'PLAN_UPGRADE', res: 'org_Z7m2L', ip: '10.0.4.1', status: 'SUCCESS' },
                        { time: '2026-04-27 23:01:44', actor: 'unknown', event: 'API_KEY_CREATE_ATTEMPT', res: 'org_Z7m2L', ip: '45.22.11.90', status: 'DENIED' },
                        { time: '2026-04-27 22:50:33', actor: 'billing@platform.com', event: 'STRIPE_SYNC', res: 'global_billing', ip: '10.0.1.2', status: 'SUCCESS' },
                      ].map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="py-4 px-4 text-left">{log.time}</td>
                          <td className="py-4 px-4 text-left font-bold">{log.actor}</td>
                          <td className="py-4 px-4 text-left"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{log.event}</span></td>
                          <td className="py-4 px-4 text-left">{log.res}</td>
                          <td className="py-4 px-4 text-left text-gray-400">{log.ip}</td>
                          <td className="py-4 px-4 text-left">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest",
                              log.status === 'SUCCESS' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>{log.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ManageOrgUsersView({ org, onBack }: { key?: import('react').Key; org: any; onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'agent' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [org._id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('orgId', '==', org._id));
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
    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', editingId), { ...formData });
      } else {
        const newUid = Math.random().toString(36).substring(2, 15);
        await setDoc(doc(db, 'users', newUid), {
          ...formData,
          uid: newUid,
          orgId: org._id,
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
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
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
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col mb-12"
    >
      <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 transition-colors">
            <ArrowRight size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              إدارة المستخدمين
              <span className="text-brand">({org.name || 'مجهول'})</span>
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1">التحكم بصلاحيات الوصول لمساحة العمل</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-brand text-white border border-transparent rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
          <UserPlus size={18} /> إضافة مستخدم
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 text-[11px] font-black uppercase tracking-widest border-b border-gray-100">
              <th className="px-8 py-5 whitespace-nowrap">المستخدم</th>
              <th className="px-8 py-5 whitespace-nowrap">البريد الإلكتروني</th>
              <th className="px-8 py-5 whitespace-nowrap">الدور (Role)</th>
              <th className="px-8 py-5 whitespace-nowrap">تاريخ الإضافة</th>
              <th className="px-8 py-5 whitespace-nowrap text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto mb-3" size={28} />
                  <p className="font-bold">جاري تحميل المستخدمين...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center text-gray-400">
                  <Users className="mx-auto mb-3 opacity-20" size={48} />
                  <p className="font-bold text-lg text-gray-900 mb-1">لا يوجد مستخدمين</p>
                  <p className="text-sm">هذه المنظمة لا تحتوي على مستخدمين مسجلين بعد.</p>
                </td>
              </tr>
            ) : users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/10 flex items-center justify-center font-black text-brand text-lg shadow-sm shrink-0">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{user.name || 'بدون اسم'}</p>
                      <p className="text-[10px] font-bold text-gray-400 font-mono mt-0.5">ID: {user._id.slice(0,8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                    <Mail size={14} className="text-gray-400" />
                    {user.email}
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit",
                    user.role === 'owner' ? "bg-purple-50 text-purple-700 border-purple-200" :
                    user.role === 'admin' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-gray-50 text-gray-700 border-gray-200"
                  )}>
                    <Shield size={12} /> {user.role || 'agent'}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <p className="text-xs font-bold text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
                </td>
                <td className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(user)} className="p-2 bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl text-gray-500 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(user._id)} className="p-2 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl text-gray-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">
                {editingId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-5 bg-gray-50/50">
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
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="owner">Owner (المالك)</option>
                    <option value="admin">Admin (مشرف)</option>
                    <option value="agent">Agent (وكيل دعم)</option>
                  </select>
                  <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  إلغاء
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-brand text-white border border-transparent rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
                  {editingId ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}