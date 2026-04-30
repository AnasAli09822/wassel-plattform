import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video,
  Check,
  CheckCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { InboxSkeleton } from '../components/Skeletons';

const initialChats = [
  { id: 1, name: 'سارة خالد', lastMsg: 'هل يمكنني تغيير موعد التسليم؟', time: '١٠:٣٥ ص', unread: 2, online: true, activeAutomation: true },
  { id: 2, name: 'فهد العتيبي', lastMsg: 'شكراً جزيلاً على المساعدة السريعة، تم استلام الطلب بنجاح.', time: '٠٩:٤٥ ص', unread: 0, online: false, activeAutomation: false },
  { id: 3, name: 'محمد عبدالله', lastMsg: 'أريد الاستفسار عن باقات البرو وكيفية الترقية.', time: 'أمس', unread: 0, online: true, activeAutomation: true },
  { id: 4, name: 'نورة السعيد', lastMsg: 'هل يتوفر اللون الأزرق من هذا المنتج؟', time: 'أمس', unread: 0, online: false, activeAutomation: false },
  { id: 5, name: 'عبدالعزيز حسن', lastMsg: 'تم إرسال التحويل البنكي، يرجى التأكيد.', time: '٢٥ أبريل', unread: 0, online: false, activeAutomation: false },
  { id: 6, name: 'ليلى أحمد', lastMsg: 'الخدمة ممتازة، سأوصي بها لأصدقائي.', time: '٢٤ أبريل', unread: 0, online: true, activeAutomation: false },
];

const messages = [
  { id: 1, text: 'مرحباً، كيف يمكنني مساعدتك اليوم؟', time: '١٠:٣٠ ص', isMe: true, status: 'read' },
  { id: 2, text: 'أهلاً بك، كنت أتساءل عن موعد تسليم طلبي رقم #١٢٣٤٥', time: '١٠:٣٢ ص', isMe: false },
  { id: 3, text: 'موعد التسليم المتوقع هو غداً بين الساعة ٢ و ٥ مساءً.', time: '١٠:٣٣ ص', isMe: true, status: 'read' },
  { id: 4, text: 'هل يمكنني تغيير موعد التسليم؟ لأني سأكون خارج المنزل في هذا الوقت.', time: '١٠:٣٥ ص', isMe: false },
];

export default function InboxPage() {
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(initialChats[0]);
  const [msgInput, setMsgInput] = useState('');

  // Filtering states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [activeAutomationOnly, setActiveAutomationOnly] = useState(false);

  const chats = initialChats.filter(chat => {
    if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (unreadOnly && chat.unread === 0) return false;
    if (onlineOnly && !chat.online) return false;
    if (activeAutomationOnly && !chat.activeAutomation) return false;
    return true;
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} className="h-full">
          <InboxSkeleton />
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex gap-6 overflow-hidden">
          {/* Chat List */}
          <div className="w-96 bg-white rounded-[2rem] border border-gray-100 flex flex-col shadow-sm overflow-hidden shrink-0">
            <div className="p-6 border-b border-gray-50 space-y-4">
              <div className="flex justify-between items-center relative">
                <h2 className="text-xl font-black text-gray-900">المحادثات</h2>
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showFilters || unreadOnly || onlineOnly || activeAutomationOnly ? "bg-brand/10 text-brand" : "hover:bg-gray-50 text-gray-400"
                  )}
                >
                  <Filter size={20} />
                </button>
                
                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-12 left-0 w-64 bg-white border border-gray-100 rounded-3xl shadow-xl z-20 p-5 font-sans"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-gray-900 text-sm">تصفية المحادثات</h3>
                        {(unreadOnly || onlineOnly || activeAutomationOnly) && (
                          <button 
                            onClick={() => {
                              setUnreadOnly(false);
                              setOnlineOnly(false);
                              setActiveAutomationOnly(false);
                            }}
                             className="text-[10px] font-bold text-brand hover:underline"
                          >
                            مسح الفلاتر
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors",
                            unreadOnly ? "bg-brand border-brand" : "border-gray-200 group-hover:border-brand/50"
                          )}>
                            {unreadOnly && <Check size={12} className="text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={unreadOnly} onChange={() => setUnreadOnly(!unreadOnly)} />
                          <span className="text-sm font-bold text-gray-700">رسائل غير مقروءة</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors",
                            onlineOnly ? "bg-brand border-brand" : "border-gray-200 group-hover:border-brand/50"
                          )}>
                            {onlineOnly && <Check size={12} className="text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={onlineOnly} onChange={() => setOnlineOnly(!onlineOnly)} />
                          <span className="text-sm font-bold text-gray-700">متصل الآن</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors",
                            activeAutomationOnly ? "bg-brand border-brand" : "border-gray-200 group-hover:border-brand/50"
                          )}>
                            {activeAutomationOnly && <Check size={12} className="text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={activeAutomationOnly} onChange={() => setActiveAutomationOnly(!activeAutomationOnly)} />
                          <span className="text-sm font-bold text-gray-700">محادثات بأتمتة نشطة</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن محادثة..." 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:border-brand/40 focus:ring-4 focus:ring-brand/10 outline-none transition-all font-bold text-gray-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="font-bold text-sm">لا توجد نتائج تطابق بحثك</p>
                </div>
              ) : (
                chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full p-4 flex gap-3 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 relative group",
                    selectedChat.id === chat.id && "bg-brand/5 hover:bg-brand/5"
                  )}
                >
                  {selectedChat.id === chat.id && (
                    <motion.div layoutId="activeChatIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-brand"></motion.div>
                  )}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black">
                      {chat.name[0]}
                    </div>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-gray-900 truncate">{chat.name}</h4>
                      <span className="text-[10px] font-bold text-gray-400">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-xs text-gray-500 truncate leading-relaxed font-sans">{chat.lastMsg}</p>
                      {chat.unread > 0 && (
                        <span className="bg-brand text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 flex flex-col shadow-sm overflow-hidden min-w-0">
            {/* Chat Header */}
            <div className="p-4 px-6 border-b border-gray-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                  {selectedChat.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedChat.name}</h3>
                  <p className="text-[10px] font-bold text-green-500">{selectedChat.online ? 'نشط الآن' : 'غير متصل'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                  <Phone size={20} />
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                  <Video size={20} />
                </button>
                <div className="h-6 w-[1px] bg-gray-100"></div>
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm uppercase tracking-widest">
                  اليوم
                </span>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    key={msg.id}
                    className={cn(
                      "flex group",
                      msg.isMe ? "justify-start" : "justify-end"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] p-4 rounded-2xl relative shadow-sm",
                      msg.isMe 
                        ? "bg-brand text-white rounded-tr-none" 
                        : "bg-white text-gray-900 border border-gray-100 rounded-tl-none"
                    )}>
                      <p className="text-sm font-sans leading-relaxed">{msg.text}</p>
                      <div className={cn(
                        "mt-2 flex items-center justify-end gap-1.5",
                        msg.isMe ? "text-white/70" : "text-gray-400"
                      )}>
                        <span className="text-[10px] font-bold">{msg.time}</span>
                        {msg.isMe && (
                          msg.status === 'read' ? <CheckCheck size={12} className="text-white" /> : <Check size={12} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 px-6 border-t border-gray-50 bg-white shrink-0">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-2 pr-4 shadow-inner border border-gray-100">
                <button className="p-2 text-gray-400 hover:text-brand transition-colors">
                  <Smile size={22} />
                </button>
                <button className="p-2 text-gray-400 hover:text-brand transition-colors">
                  <Paperclip size={22} />
                </button>
                <input 
                  type="text" 
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setMsgInput('');
                  }}
                />
                <button 
                  onClick={() => setMsgInput('')}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    msgInput.trim() ? "bg-brand text-white shadow-lg shadow-brand/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send size={20} className="rotate-180 translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Details Bar */}
          <div className="w-80 bg-white rounded-[2rem] border border-gray-100 flex flex-col shadow-sm overflow-hidden shrink-0">
            <div className="p-8 text-center border-b border-gray-50">
              <div className="w-24 h-24 rounded-full bg-brand/10 text-brand flex items-center justify-center text-4xl font-black mx-auto mb-4 border-4 border-white shadow-lg">
                {selectedChat.name[0]}
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1">{selectedChat.name}</h3>
              <p className="text-sm font-bold text-gray-400">+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧</p>
              <div className="flex justify-center gap-2 mt-4">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-full">عميل VIP</span>
                <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2 py-1 rounded-full">مهتم بالعروض</span>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
              <div className="space-y-3">
                <h4 className="text-sm font-black text-gray-900 border-r-4 border-brand pr-2">معلومات العميل</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">المدينة</p>
                    <p className="font-bold text-gray-700">الرياض، السـعودية</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">تاريخ التسجيل</p>
                    <p className="font-bold text-gray-700">١٢ يناير ٢٠٢٤</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">إجمالي المشتريات</p>
                    <p className="font-bold text-gray-700 text-brand">١٢,٤٠٠ ر.س</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">آخر طلب</p>
                    <p className="font-bold text-gray-700">منذ ٣ أيام</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-gray-900 border-r-4 border-brand pr-2">ملاحظات الأتمتة</h4>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex gap-2">
                    <Zap size={14} className="text-brand shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed font-bold">تم الرد بواسطة بوت الترحيب الذكي في ١٠:٣٠ ص</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed font-bold">تم إدراج العميل في حملة "عروض رمضان"</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 mt-auto">
              <button className="w-full py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                عرض الملف الشخصي الكامل
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
