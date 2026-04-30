import { 
  Shield, 
  Lock, 
  MessageSquare, 
  Mail, 
  ArrowLeft,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard/home');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      // Navigation is handled by useEffect
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-brand transition-colors font-bold text-sm mb-8">
            <ChevronLeft size={16} className="rotate-180" />
            العودة للرئيسية
          </Link>
          <div className="bg-brand w-16 h-16 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-brand/40">
            <MessageSquare size={36} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">تسجيل الدخول إلى وصل</h1>
          <p className="text-gray-500 font-medium">ابدأ رحلة أتمتة مبيعاتك اليوم</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100"
        >
          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 border-2 border-gray-100 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="font-black text-gray-700">الدخول بواسطة Google</span>
              {isLoading && <Loader2 className="animate-spin text-brand" size={20} />}
            </button>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">أو</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            <div className="space-y-6 opacity-50 pointer-events-none">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-900 pr-2 block">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    readOnly
                    placeholder="name@company.com"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pr-12 pl-4 py-4 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center pr-2">
                  <label className="text-sm font-black text-gray-900">كلمة المرور</label>
                </div>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    readOnly
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pr-12 pl-4 py-4 font-bold font-sans outline-none"
                  />
                </div>
              </div>

              <button 
                disabled
                className="w-full bg-gray-100 text-gray-400 py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 cursor-not-allowed"
              >
                دخول للمنصة
                <ArrowLeft size={22} />
              </button>
            </div>
            
            <p className="text-center text-xs font-bold text-gray-400 mt-6">
              نوصي باستخدام Google Sign-In لتأمين حسابك بأفضل طريقة ممكنة.
            </p>
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center items-center gap-6 text-gray-400">
          <div className="flex items-center gap-2">
            <Shield size={16} />
            <span className="text-xs font-bold">تشفير SSL آمن</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <Link to="#" className="text-xs font-bold hover:text-brand">سياسة الخصوصية</Link>
        </div>
      </div>
    </div>
  );
}
