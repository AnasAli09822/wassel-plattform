import { 
  Send, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Users,
  Plus,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import CreateBroadcastModal from '../components/CreateBroadcastModal';
import { BroadcastsSkeleton } from '../components/Skeletons';
import { motion, AnimatePresence } from 'motion/react';

export default function BroadcastsPage() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [dateSort, setDateSort] = useState('desc');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const campaigns = [
    { name: 'عروض عيد الفطر ٢٠٢٦', status: 'مكتملة', audience: '١٠,٠٠٠', sent: '١٠,٠٠٠', open: '٩٤٪', openRaw: 94, replyRate: '١٥٪', replyRateRaw: 15, date: 'منذ يومين', sortDate: '2026-04-25' },
    { name: 'إطلاق المنتج الجديد (ألفا)', status: 'نشطة', audience: '٥,٥٠٠', sent: '٣,٢٠٠', open: '٨٨٪', openRaw: 88, replyRate: '٤٪', replyRateRaw: 4, date: 'جاري الإرسال...', sortDate: '2026-04-27' },
    { name: 'تذكير بفعالية الرياض', status: 'مجدولة', audience: '٢,٢٠٠', sent: '-', open: '-', openRaw: 0, replyRate: '-', replyRateRaw: 0, date: 'غداً، ١٠ ص', sortDate: '2026-04-28' },
    { name: 'تخفيضات نهاية الأسبوع', status: 'مكتملة', audience: '٨,٤٠٠', sent: '٨,٤٠٠', open: '٩١٪', openRaw: 91, replyRate: '٢٢٪', replyRateRaw: 22, date: '٢٤ أبريل', sortDate: '2026-04-24' },
    { name: 'استبيان رضاء العملاء', status: 'مكتملة', audience: '١,٥٠٠', sent: '١,٤٩٠', open: '٨٢٪', openRaw: 82, replyRate: '٤٥٪', replyRateRaw: 45, date: '٢٠ أبريل', sortDate: '2026-04-20' },
  ];

  const filteredAndSortedCampaigns = [...campaigns]
    .filter(c => statusFilter === 'الكل' || c.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.sortDate).getTime();
      const dateB = new Date(b.sortDate).getTime();
      return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const handleDownloadReport = () => {
    // 1. Create CSV header
    const headers = ['اسم الحملة', 'الحالة', 'الجمهور المستهدف', 'الرسائل المُرسلة', 'معدل الفتح', 'معدل التفاعل', 'التاريخ'].join(',');
    
    // 2. Create CSV rows
    const rows = campaigns.map(c => {
      // Escape commas in strings if necessary
      return `"${c.name}","${c.status}","${c.audience}","${c.sent}","${c.open}","${c.replyRate}","${c.date}"`;
    });
    
    // 3. Combine header and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // 4. Create blob and download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \ufeff for BOM to support Arabic in Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `broadcasts_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
          <BroadcastsSkeleton />
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <CreateBroadcastModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">حملات البث (Broadcasts)</h1>
              <p className="text-gray-500 font-medium font-sans">أرسل رسائلك لآلاف العملاء في وقت واحد.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center gap-2 group"
            >
              <Plus size={20} className="group-hover:scale-125 transition-transform" />
              حملة إرسال جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Send size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400">إجمالي الحملات</p>
            <p className="text-2xl font-black text-gray-900">١٢٨</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400">معدل الفتح</p>
            <p className="text-2xl font-black text-gray-900">٩٢٪</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400">الوصول الإجمالي</p>
            <p className="text-2xl font-black text-gray-900">٤٥.٢ ألف</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400">نسبة الرد</p>
            <p className="text-2xl font-black text-gray-900">١٨٪</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث في الحملات..." 
              className="w-full bg-white border-2 border-gray-100 rounded-xl pr-10 pl-4 py-2 text-sm font-medium focus:border-brand/40 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors text-gray-700"
            >
              <Download size={14} /> تحميل التقرير
            </button>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-100 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors text-gray-700 appearance-none cursor-pointer outline-none focus:border-brand/40"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="نشطة">نشطة</option>
              <option value="مجدولة">مجدولة</option>
              <option value="مكتملة">مكتملة</option>
            </select>
            <select 
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-100 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors text-gray-700 appearance-none cursor-pointer outline-none focus:border-brand/40"
            >
              <option value="desc">الأحدث أولاً</option>
              <option value="asc">الأقدم أولاً</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-6 py-4">اسم الحملة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الجمهور المستهدف</th>
                <th className="px-6 py-4">الرسائل المُرسلة</th>
                <th className="px-6 py-4">معدل الفتح</th>
                <th className="px-6 py-4">معدل التفاعل / الرد</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSortedCampaigns.map((campaign, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap",
                      campaign.status === 'نشطة' ? "bg-blue-50 text-blue-600 border border-blue-100" : 
                      campaign.status === 'مجدولة' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                      "bg-green-50 text-green-600 border border-green-100"
                    )}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-xs text-gray-600">{campaign.audience}</td>
                  <td className="px-6 py-4 font-bold text-xs text-gray-900">{campaign.sent}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div className={cn(
                          "h-full rounded-full",
                          campaign.openRaw >= 90 ? "bg-green-500" : campaign.openRaw >= 70 ? "bg-blue-500" : "bg-brand"
                        )} style={{ width: campaign.open === '-' ? '0%' : campaign.openRaw + '%' }}></div>
                      </div>
                      <span className="font-black text-xs text-gray-900 min-w-8">{campaign.open}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                         <div className={cn(
                          "h-full rounded-full",
                          campaign.replyRateRaw >= 20 ? "bg-purple-500" : "bg-gray-400"
                        )} style={{ width: campaign.replyRate === '-' ? '0%' : campaign.replyRateRaw + '%' }}></div>
                      </div>
                      <span className="font-black text-xs text-gray-900 min-w-8">{campaign.replyRate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 whitespace-nowrap">
                      <Clock size={12} />
                      {campaign.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
  );
}
