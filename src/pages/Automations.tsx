import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Zap, MessageSquare, Plus, Play, Pause, MoreVertical, 
  Clock, GitBranch, Settings2, Trash2, MousePointer2, 
  ArrowRight, Search, CheckCircle2, ChevronRight, Share2, Copy, Users, Save, X, Activity, Filter, GripVertical, Check,
  Mail, Tag, MousePointerClick, AlignLeft, Calendar, FileText, Bell, Hash, Sparkles, Webhook, UserPlus, FileJson, Layers,
  ShoppingCart, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect, MouseEvent } from 'react';
import { AutomationsSkeleton } from '../components/Skeletons';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface AutomationStep {
  id: string;
  type: 'trigger_event' | 'trigger_time' | 'action_whatsapp' | 'action_email' | 'action_tag' | 'action_webhook' | 'action_assign' | 'logic_delay' | 'logic_condition';
  title: string;
  description: string;
  config: any;
}

interface Automation {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'paused';
  createdAt: any;
  metrics: { triggers: number; completions: number };
  steps: AutomationStep[];
}

export default function AutomationsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [activeAutomation, setActiveAutomation] = useState<Automation | null>(null);

  useEffect(() => {
    fetchAutomations();
  }, [profile]);

  const fetchAutomations = async () => {
    if (!profile?.orgId) return;
    try {
      const q = query(collection(db, 'organizations', profile.orgId, 'automations'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Automation));
      setAutomations(data.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (error) {
      console.error("Error fetching automations", error);
    } finally {
      if (loading) setTimeout(() => setLoading(false), 600);
    }
  };

  const handleCreateNew = async () => {
    if (!profile?.orgId) return;
    const newDoc = {
      name: 'أتمتة جديدة',
      status: 'draft',
      metrics: { triggers: 0, completions: 0 },
      createdAt: serverTimestamp(),
      steps: [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'trigger_event',
          title: 'عند انضمام عميل جديد',
          description: 'يتم التقاط هذا الحدث عند إضافة جهة اتصال',
          config: { event: 'contact_created' }
        }
      ]
    };
    try {
      const docRef = await addDoc(collection(db, 'organizations', profile.orgId, 'automations'), newDoc);
      const created = { id: docRef.id, ...newDoc, createdAt: { toMillis: () => Date.now() } } as Automation;
      setAutomations([created, ...automations]);
      setActiveAutomation(created);
      setView('builder');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFromTemplate = async (template: any) => {
    if (!profile?.orgId) return;
    
    // Generate new IDs for the template steps
    const newSteps = template.steps.map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9)
    }));

    const newDoc = {
      name: template.name,
      status: 'draft',
      metrics: { triggers: 0, completions: 0 },
      createdAt: serverTimestamp(),
      steps: newSteps
    };
    
    try {
      const docRef = await addDoc(collection(db, 'organizations', profile.orgId, 'automations'), newDoc);
      const created = { id: docRef.id, ...newDoc, createdAt: { toMillis: () => Date.now() } } as Automation;
      setAutomations([created, ...automations]);
      setActiveAutomation(created);
      setView('builder');
    } catch (err) {
      console.error(err);
    }
  };

  const saveAutomation = async (automation: Automation) => {
    if (!profile?.orgId) return;
    try {
      const { id, ...data } = automation;
      await updateDoc(doc(db, 'organizations', profile.orgId, 'automations', id), data);
      setAutomations(autos => autos.map(a => a.id === id ? automation : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (automation: Automation) => {
    const newStatus = automation.status === 'active' ? 'paused' : 'active';
    const updated = { ...automation, status: newStatus as any };
    await saveAutomation(updated);
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!profile?.orgId) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه الأتمتة؟')) return;
    try {
      await deleteDoc(doc(db, 'organizations', profile.orgId, 'automations', id));
      setAutomations(autos => autos.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} className="h-full">
          <AutomationsSkeleton />
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-12 h-full flex flex-col">
          {view === 'list' ? (
            <ListView 
              automations={automations} 
              onCreate={handleCreateNew} 
              onCreateFromTemplate={handleCreateFromTemplate}
              onOpen={(a: Automation) => { setActiveAutomation(a); setView('builder'); }}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ) : (
            activeAutomation && (
              <BuilderView 
                automation={activeAutomation}
                onBack={() => { setView('list'); setActiveAutomation(null); }}
                onSave={(updated) => { saveAutomation(updated); setActiveAutomation(updated); }}
              />
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ListView({ automations, onCreate, onCreateFromTemplate, onOpen, onToggleStatus, onDelete }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'workflows' | 'integrations'>('workflows');

  const filtered = automations.filter((a: any) => a.name.includes(searchTerm));

  const templates = [
    {
      name: 'رسالة ترحيبية تلقائية',
      description: 'أرسل رسالة ترحيب عبر الواتساب عند انضمام عميل جديد للقائمة.',
      icon: MessageSquare,
      color: 'text-brand',
      bg: 'bg-brand/10',
      steps: [
        { type: 'trigger_event', title: 'عند إضافة جهة اتصال', description: 'يتم تشغيله عند إضافة جهة اتصال جديدة' },
        { type: 'action_whatsapp', title: 'إرسال رسالة الترحيب', description: 'إرسال الرسالة الترحيبية' }
      ]
    },
    {
      name: 'استرجاع السلة المتروكة',
      description: 'رسالة تذكيرية للعملاء الذين تركوا سلاتهم في المتاجر الإلكترونية مع دعوة ومحفز لاتمام الشراء.',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      steps: [
        { type: 'trigger_event', title: 'عند ترك السلة', description: 'يتم التقاط الحدث في منصة المتجر (سلة/زد)' },
        { type: 'logic_delay', title: 'تأخير 30 دقيقة', description: 'الانتظار لمدة نصف ساعة بعد ترك السلة' },
        { type: 'action_whatsapp', title: 'تذكير أولي', description: 'مرحباً {contact.name}! نسيتم شيئاً في سلتكم.. هل واجهتكم مشكلة؟ تفضل الرابط لإتمام الطلب' },
        { type: 'logic_delay', title: 'انتظار 24 ساعة', description: 'الانتظار لمدة يوم كامل للتحقق' },
        { type: 'logic_condition', title: 'هل أتم الشراء؟', description: 'تحقق من حالة الطلب الحالي للعميل' },
        { type: 'action_whatsapp', title: 'إرسال كوبون الخصم', description: 'أكمل طلبك الآن! استخدم الكود {discount.code} لتحصل على خصم إضافي وفريد على سلتك.' }
      ]
    },
    {
      name: 'تأكيد وحجز المواعيد',
      description: 'أرسل تأكيد فوري للحجز، ومتبوعاً بتذكير قبل الموعد بـ 24 ساعة لتقليل التخلف عن الحضور.',
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      steps: [
        { type: 'trigger_event', title: 'عند حجز الموعد', description: 'يتم التقاط الحدث من نظام الحجوزات' },
        { type: 'action_whatsapp', title: 'إرسال رسالة التأكيد', description: 'تأكيد الحجز والإرسال الموقع' },
        { type: 'logic_delay', title: 'انتظار حتى 24 ساعة قبل الحدث', description: 'جدولة التأخير الزمني' },
        { type: 'action_whatsapp', title: 'إرسال تذكير بالحضور', description: 'رسالة تذكير لتأكيد الحضور مع أزرار' },
        { type: 'action_assign', title: 'تعيين لموظف استقبال', description: 'إخبار الموظف المعني بالموعد والمتابعة' }
      ]
    },
    {
      name: 'تقييم تجربة الشراء (NPS)',
      description: 'اطلب من العميل تقييم تجربته بعد الشراء بأيام وارفع التقييمات الإيجابية.',
      icon: Sparkles,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      steps: [
        { type: 'trigger_event', title: 'تحديث حالة الطلب إلى مكتمل', description: 'استقبال حدث الشراء من منصة المتجر' },
        { type: 'logic_delay', title: 'تأخير 3 أيام', description: 'لإعطاء وقت للعميل لاستخدام المنتج' },
        { type: 'action_whatsapp', title: 'طلب التقييم التفاعلي', description: 'استخدام رسائل الأزرار Interactive للتقييم' },
        { type: 'logic_condition', title: 'إذا كان التقييم جيد', description: 'مشاركة رابط تقييم Google Maps أو إعادة طلب' }
      ]
    },
    {
      name: 'استرجاع العملاء الخاملين',
      description: 'استهداف العملاء الخاملين الذين لم يشتروا منذ مدة وتقديم كوبون خصم تحفيزي.',
      icon: Activity,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      steps: [
        { type: 'trigger_time', title: 'مجدول دورياً', description: 'بحث في قاعدة العملاء لآخر تفاعل' },
        { type: 'action_whatsapp', title: 'رسالة تفعيل مع كوبون', description: 'عرض تسويقي قوي مع Call To Action' }
      ]
    },
    {
      name: 'دعم فني وتوزيع التذاكر',
      description: 'توجيه المحادثات للموظف أو القسم المناسب بناءً على الكلمات المفتاحية بالرسالة.',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      steps: [
        { type: 'trigger_event', title: 'عند استلام رسالة جديدة', description: 'تتضمن كلمات "مشكلة"، "دعم"، "عطل"' },
        { type: 'action_tag', title: 'وسم المحادثة', description: 'إضافة وسم دعم فني آلياً' },
        { type: 'action_assign', title: 'توزيع للموظفين', description: 'إسناد عشوائي لأحد موظفي الدعم' }
      ]
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 flex-1">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">الأتمتة الذكية <span className="text-brand">(Workflows)</span></h1>
          <p className="text-gray-500 font-medium font-sans">قم بأتمتة التسويق، الردود، والعمليات بدقة متناهية.</p>
        </div>
        <button 
          onClick={onCreate}
          className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center gap-2 group whitespace-nowrap"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          أتمتة فارغة (من الصفر)
        </button>
      </div>

      <div className="flex gap-8 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('workflows')}
          className={cn(
            "pb-4 text-sm font-black transition-all relative outline-none",
            activeTab === 'workflows' ? "text-brand" : "text-gray-400 hover:text-gray-600"
          )}
        >
          قوالب وأتمتات العمل
          {activeTab === 'workflows' && <motion.div layoutId="autosTab" className="absolute -bottom-px left-0 right-0 h-[3px] bg-brand rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          className={cn(
            "pb-4 text-sm font-black transition-all relative outline-none",
            activeTab === 'integrations' ? "text-brand" : "text-gray-400 hover:text-gray-600"
          )}
        >
          الربط والتكامل (Integrations)
          {activeTab === 'integrations' && <motion.div layoutId="autosTab" className="absolute -bottom-px left-0 right-0 h-[3px] bg-brand rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'workflows' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Templates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 onClick={() => onCreateFromTemplate(tpl)}
                 className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-brand/40 hover:shadow-xl shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
               >
                 <div>
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", tpl.bg, tpl.color)}>
                     <tpl.icon size={24} />
                   </div>
                   <h3 className="font-black text-gray-900 text-lg mb-2">{tpl.name}</h3>
                   <p className="text-sm font-bold text-gray-500 mb-4">{tpl.description}</p>
                 </div>
                 <div className="flex items-center text-[11px] font-black uppercase text-brand gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    استخدام هذا القالب <ChevronRight size={14} className="mr-1" />
                 </div>
               </motion.div>
            ))}
          </div>

      {/* Metrics / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">إجمالي التفعيلات (30 يوم)</p>
            <p className="text-2xl font-black text-gray-900">
              {automations.reduce((acc: number, cur: any) => acc + (cur.metrics?.triggers || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">تدفقات مكتملة (30 يوم)</p>
            <p className="text-2xl font-black text-gray-900">
              {automations.reduce((acc: number, cur: any) => acc + (cur.metrics?.completions || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">الأتمتة النشطة</p>
            <p className="text-2xl font-black text-gray-900">
              {automations.filter((a: any) => a.status === 'active').length}
            </p>
          </div>
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="ابحث عن أتمتة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-brand/40 outline-none rounded-xl py-2.5 pr-12 pl-4 text-sm font-bold text-gray-900 transition-all"
              />
            </div>
            <button className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-4">
              <Zap size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">لا توجد تدفقات أتمتة</h3>
            <p className="text-sm font-medium text-gray-500 max-w-sm">قم بإنشاء وتوصيل تدفقات الأتمتة لتقليل العمل اليدوي وتعزيز تفاعل عملائك.</p>
            <button onClick={onCreate} className="mt-6 text-brand font-bold text-sm bg-brand/5 px-6 py-2.5 rounded-xl hover:bg-brand/10 transition-colors">
              أتمتة جديدة
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right mt-2">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">اسم الأتمتة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">الحالة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">تفعيلات</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">مكتملة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">نسبة النجاح</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">آخر تحديث</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((auto: any) => (
                  <tr key={auto.id} onClick={() => onOpen(auto)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          auto.status === 'active' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'
                        )}>
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900 group-hover:text-brand transition-colors">{auto.name}</p>
                          <p className="text-[11px] font-bold text-gray-500 mt-0.5">{auto.steps?.length || 0} خطوات</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer",
                        auto.status === 'active' ? 'bg-green-50 text-green-600' :
                        auto.status === 'paused' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-100 text-gray-600'
                      )} onClick={(e) => { e.stopPropagation(); onToggleStatus(auto); }}>
                        {auto.status === 'active' ? 'نشطة' : auto.status === 'paused' ? 'متوقفة' : 'حفظ كمسودة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-gray-600">
                      {auto.metrics?.triggers?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-gray-600">
                      {auto.metrics?.completions?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const successRate = auto.metrics?.triggers > 0 ? Math.round((auto.metrics?.completions / auto.metrics?.triggers) * 100) : 0;
                        return (
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-mono text-sm font-bold",
                              successRate >= 70 ? "text-green-600" : successRate >= 30 ? "text-orange-500" : "text-gray-400"
                            )}>
                              {successRate}%
                            </span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                              <div 
                                className={cn("h-full rounded-full transition-all", successRate >= 70 ? "bg-green-500" : successRate >= 30 ? "bg-orange-400" : "bg-gray-400")} 
                                style={{ width: `${successRate}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-400 font-mono">
                      {auto.createdAt?.toMillis ? new Date(auto.createdAt.toMillis()).toLocaleDateString() : 'الآن'}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onOpen(auto); }}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-brand hover:text-white transition-colors"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => onDelete(auto.id, e)}
                          className="p-2 bg-gray-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
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
        )}
      </div>
      </motion.div>
      )}

      {activeTab === 'integrations' && (
        <IntegrationsTab />
      )}
    </motion.div>
  );
}

function IntegrationsTab() {
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  const integrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      category: 'التجارة الإلكترونية',
      description: 'اربط متجر شوبيفاي لتتبع السلات المتروكة، الطلبات الجديدة، وحالة الشحنات.',
      icon: ShoppingCart,
      color: 'text-green-600',
      bg: 'bg-green-50',
      status: 'available',
      webhookUrl: 'https://api.wati-clone.com/webhooks/shopify/YOUR_ORG_ID'
    },
    {
      id: 'salla',
      name: 'منصة سلة (Salla)',
      category: 'التجارة الإلكترونية',
      description: 'أرسل رسائل تأكيد الطلب، واسترجاع السلات عبر تطبيق سلة للمتاجر الإلكترونية.',
      icon: ShoppingCart,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      status: 'available',
      webhookUrl: 'https://api.wati-clone.com/webhooks/salla/YOUR_ORG_ID'
    },
    {
      id: 'zid',
      name: 'منصة زد (Zid)',
      category: 'التجارة الإلكترونية',
      description: 'أتمتة إشعارات ما بعد الطلب وتتبع الشحنات لعملاء منصة زد.',
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      status: 'available',
      webhookUrl: 'https://api.wati-clone.com/webhooks/zid/YOUR_ORG_ID'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'أدوات الربط',
      description: 'اربط أكثر من 5000 تطبيق لإرسال واستقبال رسائل الواتساب مع أي نظام تستخدمه.',
      icon: Layers,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      status: 'available',
      webhookUrl: 'اربط عبر تطبيقنا في Zapier مباشرة'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      category: 'إدارة علاقات العملاء (CRM)',
      description: 'تزامن جهات الاتصال وإرسال رسائل وتس اب تلقائية من داخل Hubspot.',
      icon: Users,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      status: 'coming_soon'
    },
    {
      id: 'custom_webhook',
      name: 'Custom Webhooks',
      category: 'للمطورين',
      description: 'استقبل الـ Events من أي نظام خارجي عبر Webhook خاص لتشغيل أي أتمتة.',
      icon: Webhook,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      status: 'available',
      webhookUrl: 'https://api.wati-clone.com/v1/trigger?token=API_KEY'
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
         <div className="max-w-2xl">
           <h2 className="text-xl font-black text-gray-900 mb-2">استقبال الأحداث من الأنظمة الخارجية</h2>
           <p className="text-sm font-medium text-gray-500 leading-relaxed">
              يمكنك ربط النظام مع أي متجر إلكتروني أو تطبيق خارجي لبدء أتمتات العمل فور حدوث أي إجراء (مثل: إضافة منتج للسلة، أو دفع فاتورة، أو تسجيل مستخدم جديد).
           </p>
           
           <div className="mt-6 flex flex-col gap-3">
             <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4">
               <div className="mt-1 text-blue-500 shrink-0"><FileJson size={20} /></div>
               <div>
                 <p className="text-sm font-black text-gray-900 mb-1">توثيق الربط البرمجي (API Documentation)</p>
                 <p className="text-xs font-bold text-gray-500 mb-3">راجع التوثيق البرمجي لمعرفة الـ JSON Payloads المطلوبة والـ Authentication.</p>
                 <a href="#" className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs hover:underline">
                   استعراض توثيق API <ArrowRight size={14} className="rotate-180" />
                 </a>
               </div>
             </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((app) => (
          <div 
            key={app.id} 
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col hover:border-brand/40 transition-all cursor-pointer group"
            onClick={() => app.status === 'available' && setSelectedIntegration(app)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", app.bg, app.color)}>
                <app.icon size={24} />
              </div>
              {app.status === 'coming_soon' ? (
                <span className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">قريباً</span>
              ) : (
                <span className="bg-green-50 text-green-600 border border-green-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} /> متاح للربط
                </span>
              )}
            </div>
            
            <span className="text-[10px] font-black uppercase text-brand mb-1">{app.category}</span>
            <h3 className="font-black text-gray-900 text-lg mb-2">{app.name}</h3>
            <p className="text-xs font-bold text-gray-500 mb-6 leading-relaxed flex-1">{app.description}</p>
            
            {app.status === 'available' && app.webhookUrl ? (
              <div className="mt-auto relative z-10" onClick={e => e.stopPropagation()}>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">رابط Webhook المخصص لمزرعتك</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={app.webhookUrl} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-mono text-gray-600 outline-none" 
                    dir="ltr"
                  />
                  <button className="shrink-0 p-2.5 bg-brand/10 text-brand rounded-xl hover:bg-brand hover:text-white transition-colors" title="نسخ الرابط" onClick={() => { navigator.clipboard.writeText(app.webhookUrl); alert('تم نسخ الرابط'); }}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ) : null}
            
            {app.status === 'coming_soon' && (
              <button disabled className="mt-auto w-full py-2.5 bg-gray-50 text-gray-400 font-bold text-sm rounded-xl border border-gray-200">
                غير متوفر حالياً
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", selectedIntegration.bg, selectedIntegration.color)}>
                  <selectedIntegration.icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    دليل ربط {selectedIntegration.name}
                  </h3>
                  <p className="text-sm font-bold text-gray-500">تعليمات وشرح كيفية الربط خطوة بخطوة</p>
                </div>
              </div>
              <button onClick={() => setSelectedIntegration(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              <div className="space-y-4">
                <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs">1</span>
                  نسخ رابط Webhook
                </h4>
                <div className="pr-8 pb-4 border-r-2 border-brand/20">
                  <p className="text-sm font-medium text-gray-600 mb-3">انسخ هذا الرابط وضعه في إعدادات المنصة لديك لكي نتمكن من استقبال الأحداث.</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={selectedIntegration.webhookUrl} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 outline-none" 
                      dir="ltr"
                    />
                    <button className="shrink-0 p-3 bg-brand/10 text-brand rounded-xl font-bold hover:bg-brand hover:text-white transition-colors" onClick={() => { navigator.clipboard.writeText(selectedIntegration.webhookUrl); alert('تم نسخ الرابط'); }}>
                      نسخ
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs">2</span>
                  إرسال حدث لتجربة الربط (Test Webhook)
                </h4>
                <div className="pr-8 pb-4 border-r-2 border-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-3">مثال على كيفية إرسال البيانات إلينا باستخدام cURL أو عبر المنصة:</p>
                  <div className="bg-[#0D1117] rounded-xl p-4 overflow-x-auto" dir="ltr">
                    <pre className="text-xs font-mono text-gray-300">
<code><span className="text-pink-400">curl</span> -X POST {selectedIntegration.webhookUrl} \<br/>
  -H <span className="text-green-300">"Content-Type: application/json"</span> \<br/>
  -d <span className="text-yellow-200">'{'{'}"event": "order.created", "contact": {'{'}"phone": "+966500000000"{'}'}, "data": {'{'}"total": 150{'}'}{'}'}'</span></code>
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                  إنشاء الأتمتة (Workflow)
                </h4>
                <div className="pr-8">
                  <p className="text-sm font-medium text-gray-600 mb-3">بعد التوصيل الصحيح، اذهب إلى "الأتمتة الذكية" وأنشئ تدفقاً يبدأ عند استلام هذا الحدث.</p>
                  <button onClick={() => setSelectedIntegration(null)} className="px-6 py-3 bg-brand text-white text-sm font-black rounded-xl hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
                    فهمت، شكراً
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function BuilderView({ automation, onBack, onSave }: { automation: Automation, onBack: () => void, onSave: (a: Automation) => void }) {
  const [steps, setSteps] = useState<AutomationStep[]>(automation.steps || []);
  const [name, setName] = useState(automation.name);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ ...automation, name, steps });
    setIsSaving(false);
  };

  const handleAddStep = (type: AutomationStep['type'] | string) => {
    const titles: Record<string, string> = {
      'action_whatsapp': 'إرسال رسالة واتساب',
      'action_email': 'إرسال بريد إلكتروني',
      'action_tag': 'تحديث الوسوم (Tags)',
      'action_webhook': 'إرسال Webhook',
      'action_assign': 'إسناد لموظف',
      'logic_delay': 'تأخير زمني',
      'logic_condition': 'شرط (If/Else)',
      'trigger_event': 'حدث (Event)',
      'trigger_time': 'تاريخ ووقت'
    };
    const newStep: AutomationStep = {
      id: Math.random().toString(36).substr(2, 9),
      type: type as any,
      title: titles[type] || 'خطوة جديدة',
      description: 'قم بتكوين هذه الخطوة',
      config: {}
    };
    setSteps([...steps, newStep]);
    setSelectedStep(newStep.id);
  };

  const updateStep = (id: string, updates: Partial<AutomationStep>) => {
    setSteps(curr => curr.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStep = (id: string) => {
    setSteps(curr => curr.filter(s => s.id !== id));
    if (selectedStep === id) setSelectedStep(null);
  };

  const activeStepObj = steps.find(s => s.id === selectedStep);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-[calc(100vh-80px)] -mt-8 -mx-8 bg-gray-50">
      {/* Builder Header */}
      <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowRight size={20} />
          </button>
          <div>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="text-2xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 outline-none hover:bg-gray-50 px-2 rounded-lg transition-colors"
            />
            <div className="flex items-center gap-4 mt-1 px-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", automation.status === 'active' ? "bg-green-500" : "bg-orange-400")}></div>
                <span className="text-[11px] font-black uppercase text-gray-400">{automation.status === 'active' ? 'الأتمتة تعمل' : 'مسودة'}</span>
              </div>
              
              {/* Added Metrics to Header */}
              <div className="w-px h-3 bg-gray-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black uppercase text-gray-400">تفعيلات:</span>
                <span className="text-[11px] font-black text-gray-900">{automation.metrics?.triggers || 0}</span>
              </div>
              
              <div className="w-px h-3 bg-gray-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black uppercase text-gray-400">مكتملة:</span>
                <span className="text-[11px] font-black text-gray-900">{automation.metrics?.completions || 0}</span>
              </div>

              <div className="w-px h-3 bg-gray-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black uppercase text-gray-400">نسبة النجاح:</span>
                {(() => {
                  const sr = automation.metrics?.triggers > 0 ? Math.round((automation.metrics?.completions / automation.metrics?.triggers) * 100) : 0;
                  return (
                    <span className={cn(
                      "text-[11px] font-black",
                      sr >= 70 ? "text-green-600" : sr >= 30 ? "text-orange-500" : "text-gray-900"
                    )}>{sr}%</span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            <Play size={16} /> تجربة التدفق
          </button>
          <button 
            onClick={() => onSave({ ...automation, status: automation.status === 'active' ? 'draft' : 'active', name, steps })}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border",
              automation.status === 'active' 
                ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50" 
                : "bg-green-50 border-transparent text-green-600 hover:bg-green-100"
            )}
          >
            {automation.status === 'active' ? 'إيقاف الأتمتة' : 'تفعيل'}
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-brand text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
            حفظ التغييرات
          </button>
        </div>
      </header>

      {/* Builder Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto relative p-12 custom-scrollbar builder-bg">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60"></div>
          
          <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="relative flex flex-col items-center min-h-full max-w-3xl mx-auto pb-32 w-full pt-8">
            
            {steps.map((step, index) => {
              const isConfigured = step.type.startsWith('trigger') ? true : Object.keys(step.config || {}).length > 0;
              return (
              <Reorder.Item key={step.id} value={step} className="flex flex-col items-center w-full relative">
                <motion.div 
                  layoutId={`step-${step.id}`}
                  onClick={() => setSelectedStep(step.id)}
                  className={cn(
                    "w-80 bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all shadow-sm relative group z-10",
                    selectedStep === step.id ? "border-brand ring-4 ring-brand/10 shadow-xl" : "border-gray-200 hover:border-brand/40"
                  )}
                >
                  <div className="absolute top-1/2 -right-8 -translate-y-1/2 px-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                     <GripVertical size={20} className="text-gray-300 hover:text-gray-500" />
                  </div>
                  {!isConfigured && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-100 text-orange-500 rounded-full border-2 border-white flex items-center justify-center" title="لم يتم تكوين الإعدادات">
                      <AlertCircle size={12} strokeWidth={3} />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 text-brand">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0",
                        step.type?.startsWith('trigger') ? "bg-orange-500" :
                        step.type?.startsWith('action') ? "bg-brand" :
                        "bg-purple-500"
                      )}>
                        {step.type === 'trigger_event' && <Zap size={16} />}
                        {step.type === 'trigger_time' && <Calendar size={16} />}
                        {step.type === 'action_whatsapp' && <MessageSquare size={16} />}
                        {step.type === 'action_email' && <Mail size={16} />}
                        {step.type === 'action_tag' && <Tag size={16} />}
                        {step.type === 'action_webhook' && <Webhook size={16} />}
                        {step.type === 'action_assign' && <UserPlus size={16} />}
                        {step.type === 'logic_delay' && <Clock size={16} />}
                        {step.type === 'logic_condition' && <GitBranch size={16} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {step.type?.startsWith('trigger') ? 'الانطلاق' :
                         step.type?.startsWith('action') ? 'إجراء' :
                         'منطق العمل'}
                      </span>
                    </div>
                    {step.type !== 'trigger' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{step.description}</p>
                </motion.div>

                {/* Connection Line & Add Button */}
                {step.type === 'logic_condition' ? (
                  <div className="flex flex-col items-center w-full relative">
                    <div className="h-8 w-px bg-purple-300"></div>
                    <div className="flex w-full min-w-[480px] max-w-[500px] justify-between relative mt-[-1px]">
                      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-purple-300"></div>
                      
                      {/* Left Branch (IF) */}
                      <div className="flex flex-col items-center w-52 relative">
                        <div className="h-6 w-px bg-purple-300 relative">
                           <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1.5 bg-white border border-purple-200 px-2.5 py-1 rounded-full shadow-sm z-10 w-max">
                              <CheckCircle2 size={12} className="text-purple-600" />
                              <span className="text-[10px] font-black text-purple-600">يتحقق الشرط (نعم)</span>
                           </div>
                        </div>
                        <div className="w-full bg-white border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center p-5 text-center group cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors shadow-sm relative overflow-hidden">
                          <div className="absolute inset-0 bg-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="w-8 h-8 rounded-full bg-purple-50 group-hover:bg-white flex items-center justify-center mb-2 transition-colors border border-transparent group-hover:border-purple-100 relative z-10 shadow-sm">
                            <Plus size={16} className="text-purple-400 group-hover:text-purple-600" />
                          </div>
                          <span className="text-purple-500 font-black text-xs relative z-10">إضافة خطوة للمسار</span>
                        </div>
                      </div>
                      
                      {/* Right Branch (ELSE) */}
                      <div className="flex flex-col items-center w-52 relative">
                        <div className="h-6 w-px bg-purple-300 relative">
                           <div className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-sm z-10 w-max">
                              <X size={12} className="text-gray-500" />
                              <span className="text-[10px] font-black text-gray-500">لم يتحقق (لا)</span>
                           </div>
                        </div>
                        <div className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-5 text-center group cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm relative overflow-hidden">
                          <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center mb-2 transition-colors border border-transparent group-hover:border-gray-200 relative z-10 shadow-sm">
                            <Plus size={16} className="text-gray-400 group-hover:text-gray-600" />
                          </div>
                          <span className="text-gray-500 font-black text-xs relative z-10">إضافة خطوة للمسار</span>
                        </div>
                      </div>
                    </div>
                    {/* Return back to single line if not last */}
                    {index !== steps.length - 1 && (
                       <div className="h-8 w-px bg-gray-300 relative mt-4"></div>
                    )}
                    {(index === steps.length - 1) && (
                      <div className="h-16 w-px bg-transparent relative flex items-end justify-center mt-2">
                        {/* We don't show the master 'add new' cross here directly to encourage adding to branches, but we can */}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-16 w-px bg-gray-300 relative">
                  {(index === steps.length - 1) && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 z-20 group cursor-pointer hover:border-brand hover:text-brand transition-colors">
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-30 overflow-hidden translate-y-2 group-hover:translate-y-0">
                        <div className="p-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-black text-gray-900">إضافة خطوة جديدة</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <p className="text-[10px] font-black uppercase text-gray-400 px-2 py-1 mt-1">إجراءات (Actions)</p>
                          <button onClick={() => handleAddStep('action_whatsapp')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-brand hover:bg-brand/5 text-right flex items-center gap-2 transition-colors">
                            <MessageSquare size={14} className="text-brand shrink-0" /> رسالة واتساب
                          </button>
                          <button onClick={() => handleAddStep('action_email')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-brand hover:bg-brand/5 text-right flex items-center gap-2 transition-colors">
                            <Mail size={14} className="text-brand shrink-0" /> بريد إلكتروني
                          </button>
                          <button onClick={() => handleAddStep('action_tag')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-brand hover:bg-brand/5 text-right flex items-center gap-2 transition-colors">
                            <Tag size={14} className="text-brand shrink-0" /> إضافة وسم (Tag)
                          </button>
                          <button onClick={() => handleAddStep('action_webhook')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-brand hover:bg-brand/5 text-right flex items-center gap-2 transition-colors">
                            <Webhook size={14} className="text-brand shrink-0" /> استدعاء Webhook
                          </button>
                          <button onClick={() => handleAddStep('action_assign')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-brand hover:bg-brand/5 text-right flex items-center gap-2 transition-colors">
                            <UserPlus size={14} className="text-brand shrink-0" /> تعيين لموظف
                          </button>
                          
                          <div className="h-px w-full bg-gray-100 my-2"></div>
                          
                          <p className="text-[10px] font-black uppercase text-gray-400 px-2 py-1">منطق (Logic)</p>
                          <button onClick={() => handleAddStep('logic_delay')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-purple-600 hover:bg-purple-50 text-right flex items-center gap-2 transition-colors">
                            <Clock size={14} className="text-purple-500 shrink-0" /> تأخير زمني
                          </button>
                          <button onClick={() => handleAddStep('logic_condition')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-purple-600 hover:bg-purple-50 text-right flex items-center gap-2 transition-colors">
                            <GitBranch size={14} className="text-purple-500 shrink-0" /> شرط (If/Else)
                          </button>
                        </div>
                      </div>
                      <Plus size={16} />
                    </div>
                  )}
                  </div>
                )}
              </Reorder.Item>
            )})}
            
          </Reorder.Group>
        </div>

        {/* Right Sidebar (Config) */}
        <div className="w-96 bg-white border-r border-gray-100 shrink-0 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-30 relative">
          {activeStepObj ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900">تكوين الحدث</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">تعديل الإعدادات للخطوة المحددة</p>
                </div>
                <button onClick={() => setSelectedStep(null)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">عنوان الخطوة</label>
                  <input 
                    type="text" 
                    value={activeStepObj.title}
                    onChange={(e) => updateStep(activeStepObj.id, { title: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand/40 rounded-xl px-4 py-2.5 font-bold text-sm text-gray-900 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">الوصف</label>
                  <textarea 
                    value={activeStepObj.description}
                    onChange={(e) => updateStep(activeStepObj.id, { description: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand/40 rounded-xl px-4 py-2.5 font-bold text-xs text-gray-600 outline-none transition-all h-20 resize-none" 
                  />
                </div>

                {/* Node-Specific Configuration rendering */}
                {activeStepObj.type.startsWith('trigger_') && (
                  <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={16} className="text-orange-500" />
                      <p className="text-sm font-black text-gray-900">إعدادات الحدث الانطلاقي</p>
                    </div>
                    {activeStepObj.type === 'trigger_event' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">نوع الحدث</label>
                          <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none hover:border-brand/40 focus:border-brand/60 transition-colors appearance-none cursor-pointer shadow-sm">
                            <option>إضافة جهة اتصال جديدة</option>
                            <option>استلام رسالة بكلمة مفتاحية</option>
                            <option>شراء منتج (WooCommerce)</option>
                            <option>الرد خارج أوقات العمل</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">الكلمة المفتاحية (اختياري)</label>
                          <input type="text" placeholder="مثال: سعر، موقع..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none hover:border-brand/40 focus:border-brand/60 transition-colors shadow-sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">اختر التاريخ والوقت</label>
                          <input type="datetime-local" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none hover:border-brand/40 focus:border-brand/60 transition-colors shadow-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeStepObj.type === 'action_whatsapp' && (
                  <div className="bg-white border-2 border-brand/20 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-brand" />
                        <p className="text-sm font-black text-gray-900">رسالة واتساب</p>
                      </div>
                      <button className="text-xs font-bold text-brand hover:underline">المتغيرات {`{}`}</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">نوع الرسالة / القالب</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none hover:border-brand/40 focus:border-brand/60 transition-colors appearance-none cursor-pointer">
                          <option>رسالة نصية مع أزرار (Call To Action)</option>
                          <option>رسالة ترحيبية قياسية</option>
                          <option>رسالة مع قائمة خيارات (List Message)</option>
                          <option>-- رسالة نصية حرة --</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">محتوى الرسالة</label>
                        <textarea 
                          placeholder="مرحباً {contact.name}..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 outline-none hover:border-brand/40 focus:border-brand/60 transition-colors h-32 resize-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 block">أزرار الإجراءات (Call to Action)</label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-brand/5 border border-brand/20 rounded-xl px-3 py-2 flex items-center justify-between">
                             <span className="text-xs font-bold text-brand">رابط الموقع (URL)</span>
                             <button className="text-red-500 opacity-50 hover:opacity-100"><Trash2 size={14} /></button>
                          </div>
                          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between">
                             <span className="text-xs font-bold text-gray-700">تحدث لخدمة العملاء</span>
                             <button className="text-red-500 opacity-50 hover:opacity-100"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <button className="w-full py-2 bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-dashed border-gray-300">
                          <Plus size={14} /> إضافة زر جديد (حد أقصى 3)
                        </button>
                      </div>
                      <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200 mt-4">
                        <Plus size={14} /> إرفاق وسائط (صورة/مستند/فيديو)
                      </button>
                    </div>
                  </div>
                )}

                {activeStepObj.type === 'action_email' && (
                  <div className="bg-white border-2 border-brand/20 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-brand" />
                        <p className="text-sm font-black text-gray-900">بريد إلكتروني</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">عنوان البريد (Subject)</label>
                        <input type="text" placeholder="عنوان الرسالة..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none shadow-sm focus:border-brand/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">محتوى البريد</label>
                        <textarea 
                          placeholder="اكتب رسالتك هنا..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 outline-none hover:border-brand/40 focus:border-brand/60 transition-colors h-32 resize-none cursor-text disabled:opacity-50" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeStepObj.type === 'action_tag' && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Tag size={16} className="text-gray-600" />
                      <p className="text-sm font-black text-gray-900">تحديث الوسوم</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">نوع الإجراء</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                          <button className="flex-1 py-1.5 bg-white shadow-sm rounded-lg text-xs font-bold text-gray-900">إضافة وسم</button>
                          <button className="flex-1 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900">إزالة وسم</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">الوسم (Tag)</label>
                        <input type="text" placeholder="مثال: مهتم، VIP، مكتمل..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none shadow-sm focus:border-brand/50" />
                      </div>
                    </div>
                  </div>
                )}

                {activeStepObj.type === 'action_webhook' && (
                  <div className="bg-white border text-blue-900 border-blue-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Webhook size={16} className="text-blue-600" />
                      <p className="text-sm font-black">استدعاء Webhook خارجي</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <select className="w-24 bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-xs font-bold text-blue-900 outline-none shadow-sm h-[42px]">
                          <option>POST</option>
                          <option>GET</option>
                          <option>PUT</option>
                        </select>
                        <input type="url" placeholder="https://api.example.com/webhook" className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm font-bold text-blue-900 outline-none shadow-sm h-[42px] focus:border-blue-400" dir="ltr" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-blue-400 mb-2 block">الترويسة (Headers)</label>
                        <button className="w-full py-2 bg-white text-blue-600 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
                          <Plus size={14} /> إضافة Header
                        </button>
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase text-blue-400 mb-2 block">حمولة الطلب (Payload)</label>
                         <textarea 
                           placeholder="{&#10;  &quot;contact_id&quot;: &quot;{{contact.id}}&quot;&#10;}"
                           className="w-full bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-xl h-32 border border-blue-200 outline-none focus:ring-2 focus:ring-blue-100"
                           dir="ltr"
                         />
                      </div>
                    </div>
                  </div>
                )}

                {activeStepObj.type === 'action_assign' && (
                  <div className="bg-white border border-brand/20 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <UserPlus size={16} className="text-brand" />
                      <p className="text-sm font-black text-gray-900">تعيين المحادثة لموظف</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">اختيار الموظف أو الفريق</label>
                        <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none shadow-sm hover:border-brand/40 transition-colors appearance-none cursor-pointer">
                          <option>التوزيع التلقائي (Round Robin)</option>
                          <option>فريق المبيعات</option>
                          <option>فريق الدعم الفني</option>
                          <option>أحمد الموظف</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <input type="checkbox" className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand accent-brand" defaultChecked />
                        <span className="text-xs font-bold text-gray-700">إرسال تنبيه للموظف فور التعيين</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStepObj.type === 'logic_delay' && (
                  <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-purple-600" />
                      <p className="text-sm font-black text-gray-900">تأخير زمني</p>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" defaultValue="1" className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-lg font-black text-center outline-none hover:border-purple-300 focus:border-purple-400 transition-colors shadow-sm" />
                      <select className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none hover:border-purple-300 focus:border-purple-400 transition-colors appearance-none cursor-pointer shadow-sm">
                        <option>دقائق</option>
                        <option>ساعات</option>
                        <option>أيام</option>
                      </select>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 mt-3 text-center">سينتظر التدفق هذه المدة قبل الانتقال للخطوة التالية</p>
                  </div>
                )}

                {activeStepObj.type === 'logic_condition' && (
                  <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <GitBranch size={16} className="text-purple-600" />
                      <p className="text-sm font-black text-gray-900">شرط الانقسام (If/Else)</p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Condition Group */}
                      <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-3">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-purple-500">المسار الأول (IF)</span>
                         </div>
                         <div className="flex gap-2">
                           <select className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none shadow-sm">
                            <option>اسم العميل / Contact Name</option>
                            <option>رقم الجوال / Phone</option>
                            <option>المدينة / City</option>
                            <option>الوسوم / Tags</option>
                            <option>حدث سابق / Event Data</option>
                           </select>
                           <select className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none shadow-sm">
                            <option>يساوي / Equals</option>
                            <option>يحتوي على / Contains</option>
                            <option>لا يساوي / Does not equal</option>
                            <option>أكبر من / Greater than</option>
                            <option>موجود / Exists</option>
                           </select>
                         </div>
                         <input type="text" placeholder="القيمة المطلوبة... (مثال: Riyadh)" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-purple-300 transition-colors shadow-sm" />
                         <button className="w-full py-2 bg-purple-50/50 hover:bg-purple-50 text-purple-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-purple-200 border-dashed">
                           <Plus size={14} /> إضافة شرط إضافي (AND)
                         </button>
                      </div>

                      {/* Fallback path */}
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                         <span className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">في حال عدم تحقق الشرط (ELSE)</span>
                         <p className="text-xs font-bold text-gray-400">ستنتقل جهة الاتصال إلى مسار بديل أو تتوقف الأتمتة.</p>
                      </div>

                      <button className="w-full py-2.5 bg-white text-purple-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-purple-200 hover:bg-purple-50 transition-colors mt-2">
                        <GitBranch size={16} /> إضافة مسار جديد (ELSE IF)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center flex-col text-gray-400">
              <MousePointer2 size={40} className="mb-4 opacity-20" />
              <p className="font-bold text-sm text-gray-500">اختر خطوة من المساحة لتعديل خصائصها</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .builder-bg { background-color: #f8fafc; }
      `}</style>
    </motion.div>
  );
}
