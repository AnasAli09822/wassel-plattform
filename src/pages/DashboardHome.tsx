import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  Send, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { DashboardHomeSkeleton } from '../components/Skeletons';
import { useAuth } from '../components/AuthProvider';

const StatCard = ({ title, value, change, isPositive, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-brand">
        <Icon size={24} />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full",
        isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
      )}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </div>
    </div>
    <h3 className="text-gray-500 font-bold text-sm mb-1">{title}</h3>
    <p className="text-3xl font-black text-gray-900">{value}</p>
  </motion.div>
);

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  
  const firstName = (profile?.name || user?.displayName || 'مستخدم').split(' ')[0];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
          <DashboardHomeSkeleton />
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">مرحباً بك مجدداً، {firstName} 👋</h1>
              <p className="text-gray-500 font-medium font-sans">إليك ملخص أداء حسابك لليوم.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">تصدير التقارير</button>
              <button className="bg-brand text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">حملة جديدة</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="إجمالي العملاء" value="١٢,٤٦٨" change="+٢٤٪" isPositive={true} icon={Users} />
            <StatCard title="محادثات اليوم" value="٤٢١" change="+١٥٪" isPositive={true} icon={MessageSquare} />
            <StatCard title="رسائل الشهر الحالي" value="٨٨,٩٢٠" change="+٨٪" isPositive={true} icon={Send} />
            <StatCard title="متوسط سرعة الرد" value="٤.٥ ق" change="-١٢٪" isPositive={true} icon={Clock} />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Chart Placeholder */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-gray-900">نمو المحادثات</h3>
                  <select className="bg-gray-50 border-none rounded-lg text-sm font-bold text-gray-500 focus:ring-0">
                    <option>آخر ٧ أيام</option>
                    <option>آخر ٣٠ يوم</option>
                  </select>
                </div>
                <div className="h-64 flex items-end gap-2 px-2">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
                        className="w-full bg-brand/10 group-hover:bg-brand rounded-t-lg transition-colors relative"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {h * 10} رسالة
                        </div>
                      </motion.div>
                      <span className="text-[10px] font-bold text-gray-400">الاثنين</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-lg font-black text-gray-900">أحدث الحملات</h3>
                  <button className="text-brand text-sm font-bold flex items-center gap-1 hover:underline">
                    شاهد الكل <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { name: 'عروض رمضان ٢٠٢٦', status: 'مكتملة', sent: '٥,٠٠٠', opened: '٤,٨٥٠' },
                    { name: 'تنبيه السلة المتروكة', status: 'نشطة', sent: '١,٢٠٠', opened: '٩٨٠' },
                    { name: 'ترحيب بالمشتركين الجدد', status: 'نشطة', sent: '٨٠٠', opened: '٧٥٠' },
                  ].map((campaign, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{campaign.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">تم الإرسال لـ {campaign.sent} عميل</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-1 rounded-full",
                          campaign.status === 'نشطة' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                        )}>
                          {campaign.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 font-bold">{campaign.opened} فتحوا الرسالة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-6">نشاط المحادثات الأخير</h3>
                <div className="space-y-6">
                  {[
                    { name: 'سارة خالد', time: 'منذ دقيقتين', msg: 'هل يمكنني تغيير موعد التسليم؟', color: 'bg-orange-100 text-orange-600' },
                    { name: 'فهد العتيبي', time: 'منذ ١٠ دقائق', msg: 'شكراً جزيلاً على المساعدة السريعة', color: 'bg-blue-100 text-blue-600' },
                    { name: 'محمد عبدالله', time: 'منذ ساعة', msg: 'أريد الاستفسار عن باقات البرو', color: 'bg-purple-100 text-purple-600' },
                    { name: 'نورة السعيد', time: 'منذ ساعتين', msg: 'صور المنتج تبدو رائعة، متى ستتوفر؟', color: 'bg-green-100 text-green-600' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={cn("w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-black", item.color)}>
                        {item.name[0]}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className="font-bold text-sm text-gray-900 truncate">{item.name}</h4>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold shrink-0">
                            <Clock size={10} />
                            {item.time}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate leading-relaxed font-sans">{item.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 bg-gray-50 rounded-xl text-gray-900 font-bold text-sm hover:bg-gray-100 transition-colors">
                  عرض كل المحادثات
                </button>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full translate-x-16 -translate-y-16 blur-2xl group-hover:bg-brand/20 transition-all"></div>
                <h3 className="text-xl font-black mb-3 relative z-10">تحتاج لنصيحة خبير؟</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed font-sans relative z-10">جدول اتصالاً استشارياً مجانياً مع أحد خبراء الأتمتة لدينا لتحليل احتياجاتك وتطوير دورة عملك.</p>
                <button className="w-full py-4 bg-brand text-white rounded-2xl font-black text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 relative z-10 flex items-center justify-center gap-2">
                  <Phone size={18} />
                  حجز موعد استشاري
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
