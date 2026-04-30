import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Download,
  Upload,
  UserPlus,
  ArrowRight,
  MessageSquare,
  Activity,
  Tag,
  Zap,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  city: string;
  tags: string[];
  last: string;
  email?: string;
  avatar?: string;
  lastInteractionDate?: string;
  lastInteractionTime?: string;
  lastInteractionDesc?: string;
}

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const contacts: Contact[] = [
    { id: '1', name: 'سارة خالد', phone: '+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧', city: 'الرياض', tags: ['عميل VIP', 'نشط'], last: 'منذ ١٠ دقائق', email: 'sara@example.com', lastInteractionDate: '٢٨ أبريل ٢٠٢٦', lastInteractionTime: '١٠:٣٠ صباحاً', lastInteractionDesc: 'رسالة واردة: استفسار عن الباقات' },
    { id: '2', name: 'فهد العتيبي', phone: '+٩٦٦ ٥٥ ٩٨٧ ٦٥٤٣', city: 'جدة', tags: ['مهتم'], last: 'منذ ساعة', email: 'fahad@example.com', lastInteractionDate: '٢٨ أبريل ٢٠٢٦', lastInteractionTime: '٠٩:١٥ صباحاً', lastInteractionDesc: 'تفاعل مع رابط المتجر' },
    { id: '3', name: 'محمد عبدالله', phone: '+٩٧١ ٥٠ ٣٢١ ٨٨٩٩', city: 'دبي', tags: ['نشط'], last: 'أمس', lastInteractionDate: '٢٧ أبريل ٢٠٢٦', lastInteractionTime: '٠٤:٢٠ مساءً', lastInteractionDesc: 'رد على رسالة ترحيبية' },
    { id: '4', name: 'نورة السعيد', phone: '+٩٦٦ ٥٤ ٥٥٥ ٤٤٣٣', city: 'الخبر', tags: ['جديد'], last: '٢٥ أبريل', lastInteractionDate: '٢٥ أبريل ٢٠٢٦', lastInteractionTime: '١١:٠٠ صباحاً', lastInteractionDesc: 'بداية المحادثة لأول مرة' },
    { id: '5', name: 'ليلى أحمد', phone: '+٩٧٤ ٦٦ ٧٧٧ ٨٨٨٨', city: 'الدوحة', tags: ['عميل VIP'], last: '٢٤ أبريل', lastInteractionDate: '٢٤ أبريل ٢٠٢٦', lastInteractionTime: '٠٢:٤٥ مساءً', lastInteractionDesc: 'عملية شراء مكتملة' },
    { id: '6', name: 'عبدالله السعد', phone: '+٩٦٥ ٩٩ ٠٠٠ ١١١١', city: 'الكويت', tags: ['نشط'], last: '٢٣ أبريل', lastInteractionDate: '٢٣ أبريل ٢٠٢٦', lastInteractionTime: '٠١:١٠ مساءً', lastInteractionDesc: 'استعراض الكتالوج' },
  ];

  const handleExportCSV = () => {
    const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'المدينة', 'الوسوم', 'تاريخ آخر تفاعل', 'تفاصيل التفاعل'];
    
    const csvContent = [
      headers.join(','),
      ...contacts.map(c => [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.email || ''}"`,
        `"${c.city}"`,
        `"${c.tags.join(' - ')}"`,
        `"${c.lastInteractionDate || c.last} ${c.lastInteractionTime || ''}"`,
        `"${c.lastInteractionDesc || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contacts_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!selectedContact ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">إدارة العملاء</h1>
                <p className="text-gray-500 font-medium font-sans">قاعدة بيانات عملائك منظمة وسهلة الوصول.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExportCSV} className="bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Download size={18} /> تصدير CSV
                </button>
                <button className="bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Upload size={18} /> استيراد CSV
                </button>
                <button className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center gap-2">
                  <UserPlus size={20} /> إضافة عميل
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex flex-wrap items-center gap-4 bg-gray-50/50">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم، الرقم أو البريد الإلكتروني..." 
                    className="w-full bg-white border-2 border-gray-100 rounded-xl pr-10 pl-4 py-2.5 text-sm font-medium focus:border-brand/40 focus:outline-none shadow-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-xs font-black text-gray-600 focus:border-brand/40 outline-none">
                    <option>جميع الحالات</option>
                    <option>نشط</option>
                    <option>غير نشط</option>
                  </select>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-100 transition-colors">
                    <Filter size={16} /> تصفية متقدمة
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                      <th className="px-6 py-4">العميل</th>
                      <th className="px-6 py-4">رقم الهاتف</th>
                      <th className="px-6 py-4">المدينة</th>
                      <th className="px-6 py-4">التصنيف</th>
                      <th className="px-6 py-4">آخر نشاط</th>
                      <th className="px-6 py-4 text-left">طلب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contacts.map((user, i) => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedContact(user)}
                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-black shrink-0">
                              {user.name[0]}
                            </div>
                            <div className="font-bold text-gray-900 group-hover:text-brand transition-colors">{user.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-gray-500 font-bold tracking-tight">{user.phone}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                            <MapPin size={12} className="text-gray-400" />
                            {user.city}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-1.5 flex-wrap">
                            {user.tags.map((tag, j) => (
                              <span key={j} className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-full shrink-0",
                                tag === 'نشط' ? "bg-green-50 text-green-600" :
                                tag === 'عميل VIP' ? "bg-purple-50 text-purple-600" :
                                tag === 'مهتم' ? "bg-blue-50 text-blue-600" :
                                "bg-gray-100 text-gray-500"
                              )}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                            <Calendar size={12} />
                            {user.last}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-left">
                          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-50 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">عرض ٦ من أصل ٤٥٠ عميل</p>
                <div className="flex gap-2 text-xs font-bold">
                  <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">السابق</button>
                  <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 hover:bg-gray-100">التالي</button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <ContactJourneyView 
            contact={selectedContact} 
            onBack={() => setSelectedContact(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactJourneyView({ contact, onBack }: { contact: Contact, onBack: () => void }) {
  const journeyEvents = [
    { id: 1, type: 'message_received', title: 'رسالة واردة', description: 'استفسار عن أسعار الباقة الاحترافية', time: '١٠:٣٠ صباحاً', date: 'اليوم', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 2, type: 'automation_triggered', title: 'الرد الآلي', description: 'تم تفعيل أتمتة "ترحيب العملاء الجدد"', time: '١٠:٣٠ صباحاً', date: 'اليوم', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    { id: 3, type: 'message_sent', title: 'رسالة صادرة', description: 'إرسال قائمة الأسعار والتفاصيل', time: '١٠:٣١ صباحاً', date: 'اليوم', icon: Mail, color: 'text-brand', bg: 'bg-brand/10', border: 'border-brand/20' },
    { id: 4, type: 'tag_added', title: 'تم إضافة وسم', description: 'إضافة وسم "مهتم" بواسطة الأتمتة', time: '١٠:٣١ صباحاً', date: 'اليوم', icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
    { id: 5, type: 'activity', title: 'نقر على الرابط', description: 'تم النقر على رابط باقة ٦ أشهر', time: '١١:١٥ صباحاً', date: 'اليوم', icon: Activity, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    { id: 6, type: 'purchase', title: 'عملية شراء', description: 'تم الاشتراك في الباقة الاحترافية', time: '٠١:٢٠ مساءً', date: 'اليوم', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: 7, type: 'tag_added', title: 'تم تعديل الوسوم', description: 'إزالة "مهتم" وإضافة "عميل VIP"', time: '٠١:٢١ مساءً', date: 'اليوم', icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  ].reverse(); // latest first

  return (
    <motion.div 
      key="journey"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full -mt-8 -mx-8 bg-gray-50"
    >
      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowRight size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-black text-xl">
              {contact.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{contact.name}</h2>
              <p className="text-[11px] font-bold text-gray-500 tracking-widest">{contact.phone}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            تعديل البيانات
          </button>
          <button className="px-5 py-2.5 rounded-xl font-bold text-sm bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 flex items-center gap-2">
            <MessageSquare size={16} /> رسالة جديدة
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Contact Info */}
        <div className="w-80 bg-white border-l border-gray-100 shrink-0 p-6 overflow-y-auto">
          <h3 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-widest">تفاصيل العميل</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">رقم الهاتف</p>
              <p className="text-sm font-bold text-gray-900 font-mono">{contact.phone}</p>
            </div>
            
            {contact.email && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">البريد الإلكتروني</p>
                <p className="text-sm font-bold text-gray-900 font-sans">{contact.email}</p>
              </div>
            )}
            
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">المدينة</p>
              <p className="text-sm font-bold text-gray-900">{contact.city}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">الوسوم (Tags)</p>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, i) => (
                  <span key={i} className={cn(
                    "text-[10px] font-black px-2.5 py-1 rounded-lg",
                    tag === 'نشط' ? "bg-green-50 text-green-600 border border-green-100" :
                    tag === 'عميل VIP' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                    tag === 'مهتم' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                    "bg-gray-50 text-gray-600 border border-gray-100"
                  )}>
                    {tag}
                  </span>
                ))}
                <button className="w-6 h-6 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6"></div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" /> آخر تفاعل نشط
              </p>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 shadow-sm">
                 <div className="flex items-center justify-between mb-1.5">
                   <span className="text-xs font-black text-gray-900">{contact.lastInteractionDate}</span>
                   <span className="text-[10px] font-bold text-gray-500">{contact.lastInteractionTime}</span>
                 </div>
                 <p className="text-xs font-bold text-gray-600">{contact.lastInteractionDesc}</p>
                 <span className="mt-2 text-[10px] inline-flex font-black text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded-full">{contact.last}</span>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6"></div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">إحصائيات التفاعل</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-2xl font-black text-gray-900 mb-1">١٢</p>
                  <p className="text-[10px] font-bold text-gray-500">رسالة مستلمة</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-2xl font-black text-gray-900 mb-1">٤</p>
                  <p className="text-[10px] font-bold text-gray-500">تدفقات أتمتة</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Main Content: The Journey Timeline */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-3">
               رحلة العميل <span className="text-brand">(Customer Journey)</span>
            </h2>
            <p className="text-sm font-bold text-gray-500 mb-10">سجل زمني لجميع نقاط التفاعل، الرسائل، والأحداث التلقائية.</p>

            <div className="relative">
              {/* Vertical line spanning the timeline */}
              <div className="absolute right-[23px] top-4 bottom-4 w-0.5 bg-gray-200 rounded-full"></div>

              <div className="space-y-8">
                {journeyEvents.map((event, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={event.id}
                    className="relative flex gap-6 z-10"
                  >
                    {/* Icon Node */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 bg-white relative z-10 shadow-sm",
                      event.color, event.border
                    )}>
                      <event.icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                       <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{event.time}</span>
                              <h4 className="font-bold text-gray-900">{event.title}</h4>
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                              event.bg, event.color, event.border
                            )}>
                              {event.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">{event.description}</p>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Start of Journey Marker */}
              <div className="relative flex gap-6 z-10 mt-8 pt-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gray-100 border-2 border-gray-200 text-gray-400 relative z-10">
                  <UserPlus size={20} />
                </div>
                <div className="flex-1 pt-3">
                  <h4 className="font-bold text-gray-500">تمت إضافة العميل</h4>
                  <p className="text-xs font-bold text-gray-400 mt-1">٢٣ أبريل ٢٠٢٦ - ١٠:٠٠ صباحاً</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

