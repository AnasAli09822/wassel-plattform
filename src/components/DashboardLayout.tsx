import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  Zap, 
  Users, 
  Send, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { useState, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';

const SidebarItem = ({ to, icon: Icon, label, badge }: any) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
      isActive 
        ? "bg-brand text-white shadow-lg shadow-brand/20" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    <Icon size={22} className={cn("shrink-0", "group-hover:scale-110 transition-transform")} />
    <span className="font-bold">{label}</span>
    {badge && (
      <span className="mr-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </NavLink>
);

const searchableItems = [
  { id: '1', title: 'عروض عيد الفطر ٢٠٢٦', type: 'حملة', link: '/dashboard/broadcasts', icon: Send },
  { id: '2', title: 'إطلاق المنتج الجديد (ألفا)', type: 'حملة', link: '/dashboard/broadcasts', icon: Send },
  { id: '3', title: 'أحمد زايد', type: 'عميل', link: '/dashboard/contacts', icon: Users },
  { id: '4', title: 'سارة خليل', type: 'عميل', link: '/dashboard/contacts', icon: Users },
  { id: '5', title: 'شركة التقنية الحديثة', type: 'عميل', link: '/dashboard/contacts', icon: Users },
  { id: '6', title: 'إعدادات الحساب', type: 'صفحة', link: '/dashboard/settings', icon: Settings },
  { id: '7', title: 'رسائل الترحيب', type: 'أتمتة', link: '/dashboard/automations', icon: Zap },
  { id: '8', title: 'تذكير السلة المتروكة', type: 'أتمتة', link: '/dashboard/automations', icon: Zap },
  { id: '9', title: 'صندوق الوارد', type: 'صفحة', link: '/dashboard/inbox', icon: Inbox },
];

const fuse = new Fuse(searchableItems, {
  keys: ['title', 'type'],
  threshold: 0.4,
});

export default function DashboardLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = searchQuery ? fuse.search(searchQuery).map(result => result.item) : [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-gray-100 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-brand w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md">
            <MessageSquare size={24} />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">وصل</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarItem to="/dashboard/home" icon={LayoutDashboard} label="لوحة التحكم" />
          <SidebarItem to="/dashboard/inbox" icon={Inbox} label="صندوق الوارد" badge="١٢" />
          <SidebarItem to="/dashboard/automations" icon={Zap} label="الأتمتة" />
          <SidebarItem to="/dashboard/broadcasts" icon={Send} label="حملات البث" />
          <SidebarItem to="/dashboard/contacts" icon={Users} label="العملاء" />
          
          <div className="pt-8 pb-4">
            <span className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">الإعدادات</span>
          </div>
          
          <SidebarItem to="/dashboard/settings" icon={Settings} label="إعدادات الحساب" />
          
          {profile?.isSuperAdmin && (
            <>
              <div className="pt-8 pb-4">
                <span className="px-4 text-[11px] font-black text-red-400 uppercase tracking-widest">إدارة المنصة</span>
              </div>
              <SidebarItem to="/dashboard/superadmin" icon={BarChart3} label="SuperAdmin" />
            </>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-brand/5 to-brand/10 p-4 rounded-2xl border border-brand/10 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
              <span className="text-xs font-bold text-gray-600">الباقة الاحترافية</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-3">٢,٥٠٠ / ١٠,٠٠٠ رسالة</p>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand h-full w-1/4"></div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 z-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="relative" ref={searchContainerRef}>
            <div className={cn(
              "flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border w-96 transition-colors",
              isSearchFocused ? "border-brand/40 bg-white shadow-sm" : "border-gray-100"
            )}>
              <Search size={18} className={isSearchFocused ? "text-brand" : "text-gray-400"} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="ابحث عن عملاء، حملات أو محادثات..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium outline-none"
              />
            </div>

            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-12 right-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden py-2"
                >
                  {searchResults.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      {searchResults.map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            navigate(item.link);
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-right transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand/5 text-brand flex items-center justify-center shrink-0">
                            <item.icon size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{item.title}</p>
                            <p className="text-[10px] font-bold text-gray-400">{item.type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Search size={24} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-bold">لم نتمكن من العثور على نتائج لـ "{searchQuery}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black">
                ٣
              </span>
            </button>
            <div className="h-8 w-[1px] bg-gray-100"></div>
            <button className="flex items-center gap-3 py-1 px-1 pr-4 rounded-full border border-gray-100 hover:bg-gray-50 transition-all">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{profile?.name || user?.displayName || 'مستخدم'}</p>
                <p className="text-[10px] font-bold text-gray-400">
                  {profile?.isSuperAdmin ? 'مدير المنصة' : profile?.role === 'owner' ? 'مالك الحساب' : 'مسؤول'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-dark/10 flex items-center justify-center text-brand-dark font-black text-lg overflow-hidden">
                {profile?.photoURL || user?.photoURL ? (
                  <img src={profile?.photoURL || user?.photoURL || ''} alt="" />
                ) : (
                  (profile?.name || user?.displayName)?.[0] || 'أ'
                )}
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
