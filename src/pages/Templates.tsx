import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText,
  Copy,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  X,
  Filter,
  LayoutGrid,
  LayoutList
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

type TemplateStatus = 'approved' | 'pending' | 'rejected';
type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication';

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  language: string;
  content: string;
  updated: string;
  isRecent?: boolean;
}

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [templates, setTemplates] = useState<Template[]>([
    { id: '1', name: 'ترحيب_عميل_جديد', category: 'Marketing', status: 'approved', language: 'Arabic', content: 'مرحباً {{1}}، شكراً لانضمامك إلينا.', updated: 'منذ ساعتين', isRecent: true },
    { id: '2', name: 'تأكيد_طلب_شراء', category: 'Utility', status: 'approved', language: 'Arabic', content: 'لقد تم استلام طلبك برقم {{1}} بنجاح.', updated: 'منذ يوم', isRecent: true },
    { id: '3', name: 'عرض_رمضان_٢٠٢٦', category: 'Marketing', status: 'pending', language: 'Arabic', content: 'عرض خاص بمناسبة شهر رمضان: خصم {{1}}% على جميع المنتجات.', updated: 'منذ ٣ ساعات' },
    { id: '4', name: 'تذكير_موعد', category: 'Utility', status: 'rejected', language: 'Arabic', content: 'نذكرك بموعدك غداً الساعة {{1}}.', updated: 'منذ أسبوع' },
    { id: '5', name: 'كود_التحقق_otp', category: 'Authentication', status: 'approved', language: 'English', content: 'Your verification code is {{1}}.', updated: 'منذ شهر' },
  ]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Template>>({});

  const tabMapping: Record<string, TemplateCategory | 'الكل'> = {
    'الكل': 'الكل',
    'التسويق': 'Marketing',
    'الخدمات': 'Utility',
    'المصادقة': 'Authentication'
  };

  const statusMapping: Record<string, TemplateStatus | 'الكل'> = {
    'الكل': 'الكل',
    'معتمد': 'approved',
    'قيد المراجعة': 'pending',
    'مرفوض': 'rejected'
  };

  const filteredTemplates = templates.filter(t => {
    const matchCategory = selectedCategory === 'الكل' || t.category === tabMapping[selectedCategory];
    const matchStatus = selectedStatus === 'الكل' || t.status === statusMapping[selectedStatus];
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });

  const handleDelete = (id: string, e: import('react').MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleCopyContent = (content: string, e: import('react').MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    alert('تم نسخ محتوى القالب');
  };

  const openForm = (template?: Template) => {
    if (template) {
      setFormData(template);
      setActiveTemplate(template);
    } else {
      setFormData({
        name: '',
        category: 'Marketing',
        language: 'Arabic',
        content: '',
        status: 'pending',
      });
      setActiveTemplate(null);
    }
    setIsFormOpen(true);
  };

  const handleSave = (e: import('react').FormEvent) => {
    e.preventDefault();
    if (activeTemplate) {
      setTemplates(templates.map(t => t.id === activeTemplate.id ? { ...t, ...formData, updated: 'الآن' } as Template : t));
    } else {
      setTemplates([...templates, { 
        ...formData, 
        id: Math.random().toString(36).substr(2, 9),
        updated: 'الآن',
        status: formData.status || 'pending'
      } as Template]);
    }
    setIsFormOpen(false);
  };

  const openView = (template: Template) => {
    setActiveTemplate(template);
    setIsViewOpen(true);
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">قوالب واتساب <span className="text-brand">(Templates)</span></h1>
          <p className="text-gray-500 font-medium font-sans text-sm">إنشاء وإدارة القوالب الرسمية المعتمدة من شركة Meta ومراقبة حالتها.</p>
        </div>
        <button onClick={() => openForm()} className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center gap-2 group whitespace-nowrap">
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          إنشاء قالب جديد
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 min-w-[280px]">
             <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="البحث باسم القالب..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white border border-gray-200 rounded-xl pr-12 pl-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all"
             />
          </div>
          <div className="flex gap-2">
            <div className="bg-white border text-gray-400 border-gray-200 rounded-xl flex shadow-sm p-1">
              <button 
                onClick={() => setViewMode('card')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'card' ? "bg-brand/10 text-brand" : "hover:text-gray-900")}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'table' ? "bg-brand/10 text-brand" : "hover:text-gray-900")}
              >
                <LayoutList size={18} />
              </button>
            </div>
            <div className="relative">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 pr-10 py-3 text-sm font-bold text-gray-700 outline-none focus:border-brand/40 shadow-sm appearance-none cursor-pointer"
              >
                {['الكل', 'التسويق', 'الخدمات', 'المصادقة'].map((tab, i) => (
                  <option key={i} value={tab}>{tab}</option>
                ))}
              </select>
              <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 pr-10 py-3 text-sm font-bold text-gray-700 outline-none focus:border-brand/40 shadow-sm appearance-none cursor-pointer"
              >
                {['الكل', 'معتمد', 'قيد المراجعة', 'مرفوض'].map((tab, i) => (
                  <option key={i} value={tab}>{tab}</option>
                ))}
              </select>
              <FileText size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {searchQuery === '' && selectedCategory === 'الكل' && selectedStatus === 'الكل' && templates.some(t => t.isRecent) && (
          <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-brand" /> استُخدمت مؤخراً
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {templates.filter(t => t.isRecent).map((template, i) => (
                <div 
                  key={i} 
                  className="min-w-[280px] max-w-[300px] bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-brand/30 hover:shadow-md transition-all cursor-pointer space-y-3" 
                  onClick={() => openView(template)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-bold text-gray-900 truncate" dir="ltr">{template.name}</div>
                    <button 
                      className="text-gray-400 hover:text-brand bg-gray-50 hover:bg-brand/10 p-1.5 rounded-lg transition-colors shrink-0" 
                      title="نسخ المحتوى"
                      onClick={(e) => handleCopyContent(template.content, e)}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{template.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={cn("p-8 overflow-y-auto bg-gray-50/30", viewMode === 'card' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6")}>
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <FileText className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-gray-500 font-bold text-lg mb-1">لا توجد قوالب تطابق بحثك</p>
              <p className="text-gray-400 text-sm">حاول تغيير خيارات البحث أو التصفية.</p>
            </div>
          ) : viewMode === 'card' ? (
            filteredTemplates.map((template, i) => (
              <motion.div 
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-brand/20 hover:shadow-xl transition-all relative overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1 cursor-pointer" onClick={() => openView(template)}>
                  <div className="flex justify-between items-start mb-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                      template.status === 'approved' ? "bg-green-50 text-green-600 border border-green-100" :
                      template.status === 'pending' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                      "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {template.status === 'approved' ? <CheckCircle2 size={24} /> :
                       template.status === 'pending' ? <Clock size={24} /> :
                       <AlertCircle size={24} />}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleCopyContent(template.content, e)} className="p-2 hover:bg-brand/10 hover:text-brand rounded-xl text-gray-400 transition-colors bg-white shadow-sm border border-gray-100" title="نسخ المحتوى">
                        <FileText size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openForm(template); }} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-400 transition-colors bg-white shadow-sm border border-gray-100" title="تعديل">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => handleDelete(template.id, e)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-400 transition-colors bg-white shadow-sm border border-gray-100" title="حذف">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-gray-900 mb-2 truncate" dir="ltr">{template.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-100 px-2.5 py-1 rounded-lg">{template.category}</span>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-100 px-2.5 py-1 rounded-lg">{template.language}</span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-2">
                    <p className="text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">
                      {template.content || <span className="opacity-50">لا يوجد محتوى...</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 border-t border-gray-50 bg-gray-50/50">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest">
                    <span className={cn(
                      template.status === 'approved' ? "text-green-600" :
                      template.status === 'pending' ? "text-orange-600" :
                      "text-red-600"
                    )}>
                      {template.status === 'approved' ? 'معتمد' : 
                       template.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{template.updated}</span>
                </div>
                
                <div 
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(template.name); alert('تم نسخ اسم القالب'); }}
                  className="absolute inset-x-0 bottom-0 py-2.5 px-6 bg-brand text-white text-[11px] font-black tracking-widest uppercase text-center translate-y-full group-hover:translate-y-0 transition-transform cursor-pointer flex items-center justify-center gap-2 shadow-inner"
                >
                  <Copy size={14} />
                  نسخ المعرف (Template Name)
                </div>
              </motion.div>
            ))
          ) : (
             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-right border-collapse">
                 <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">اسم القالب</th>
                     <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">الفئة</th>
                     <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">اللغة</th>
                     <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">الحالة</th>
                     <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">تحديث</th>
                     <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-center">إجراءات</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {filteredTemplates.map((template, i) => (
                      <motion.tr 
                        key={template.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        onClick={() => openView(template)}
                      >
                         <td className="px-6 py-4">
                           <div className="font-black text-gray-900" dir="ltr">{template.name}</div>
                           <div className="text-xs text-gray-500 font-medium truncate max-w-[200px]" dir="auto">{template.content}</div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-100 px-2.5 py-1 rounded-lg">{template.category}</span>
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-100 px-2.5 py-1 rounded-lg">{template.language}</span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest">
                             {template.status === 'approved' ? <CheckCircle2 size={14} className="text-green-600" /> :
                              template.status === 'pending' ? <Clock size={14} className="text-orange-600" /> :
                              <AlertCircle size={14} className="text-red-600" />}
                             <span className={cn(
                               template.status === 'approved' ? "text-green-600" :
                               template.status === 'pending' ? "text-orange-600" :
                               "text-red-600"
                             )}>
                               {template.status === 'approved' ? 'معتمد' : 
                                template.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                             </span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-[11px] font-bold text-gray-400">{template.updated}</td>
                         <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => handleCopyContent(template.content, e)} className="p-2 hover:bg-brand/10 hover:text-brand rounded-xl text-gray-400 transition-colors" title="نسخ المحتوى">
                               <FileText size={16} />
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(template.name); alert('تم نسخ اسم القالب'); }} className="p-2 hover:bg-gray-100 hover:text-gray-900 rounded-xl text-gray-400 transition-colors" title="نسخ المعرف">
                               <Copy size={16} />
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); openForm(template); }} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-400 transition-colors" title="تعديل">
                               <Edit2 size={16} />
                             </button>
                             <button onClick={(e) => handleDelete(template.id, e)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-400 transition-colors" title="حذف">
                               <Trash2 size={16} />
                             </button>
                           </div>
                         </td>
                      </motion.tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">
                  {activeTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white p-2 rounded-xl transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">اسم القالب (Template Name)</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                      placeholder="welcome_message_1"
                      dir="ltr"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all"
                      required
                    />
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5">يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط.</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">الفئة (Category)</label>
                    <select 
                      value={formData.category || 'Marketing'}
                      onChange={(e) => setFormData({...formData, category: e.target.value as TemplateCategory})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all appearance-none"
                    >
                      <option value="Marketing">تسويق (Marketing)</option>
                      <option value="Utility">خدمات (Utility)</option>
                      <option value="Authentication">مصادقة (Authentication)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">اللغة (Language)</label>
                    <select 
                      value={formData.language || 'Arabic'}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all appearance-none"
                    >
                      <option value="Arabic">العربية (Ar)</option>
                      <option value="English">English (En)</option>
                      <option value="French">French (Fr)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">محتوى الرسالة (Message Body)</label>
                    <textarea 
                      value={formData.content || ''}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="أهلاً بك {{1}} في متجرنا..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 shadow-sm transition-all min-h-[150px] resize-y leading-relaxed"
                      required
                    />
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">استخدم المتغيرات <code className="bg-gray-100 text-brand px-1 py-0.5 rounded text-xs">{`{{1}}`}</code>, <code className="bg-gray-100 text-brand px-1 py-0.5 rounded text-xs">{`{{2}}`}</code> لإضافة الحقول الديناميكية.</p>
                  </div>
                  <div className="md:col-span-2">
                     <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest block mb-2">حالة القالب (للتجربة)</label>
                     <select 
                        value={formData.status || 'pending'}
                        onChange={(e) => setFormData({...formData, status: e.target.value as TemplateStatus})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-gray-400 shadow-sm transition-all appearance-none"
                      >
                        <option value="pending">قيد المراجعة (Pending)</option>
                        <option value="approved">معتمد (Approved)</option>
                        <option value="rejected">مرفوض (Rejected)</option>
                      </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                    إلغاء
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-brand text-white border border-transparent rounded-xl text-sm font-black hover:bg-brand-dark transition-colors shadow-xl shadow-brand/20">
                    {activeTemplate ? 'حفظ التعديلات' : 'إرسال للمراجعة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Modal */}
        {isViewOpen && activeTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
             <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900 line-clamp-1" dir="ltr">{activeTemplate.name}</h3>
                <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white p-2 rounded-xl transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-100 px-3 py-1 rounded-lg">{activeTemplate.category}</span>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-100 px-3 py-1 rounded-lg">{activeTemplate.language}</span>
                  </div>
                  
                  <div className="bg-[#EFEAE2] p-4 rounded-2xl relative shadow-inner">
                    <div className="bg-white p-3 rounded-xl shadow-sm text-sm text-gray-800 leading-relaxed max-w-[85%] whitespace-pre-wrap">
                      {activeTemplate.content}
                      <p className="text-[10px] text-gray-400 mt-2 font-bold text-right">09:41</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">الحالة</p>
                    <div className="flex items-center gap-1.5 text-sm font-black uppercase tracking-widest">
                      <span className={cn(
                        activeTemplate.status === 'approved' ? "text-green-600" :
                        activeTemplate.status === 'pending' ? "text-orange-600" :
                        "text-red-600"
                      )}>
                        {activeTemplate.status === 'approved' ? 'معتمد (Approved)' : 
                         activeTemplate.status === 'pending' ? 'قيد المراجعة (Pending)' : 'مرفوض (Rejected)'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { setIsViewOpen(false); openForm(activeTemplate); }} className="px-5 py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700 text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-sm">
                     <Edit2 size={14} /> تعديل
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
