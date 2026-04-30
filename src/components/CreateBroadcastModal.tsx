import { 
  X, 
  Send, 
  Users, 
  MessageSquare, 
  Image as ImageIcon, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Zap,
  LayoutTemplate
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CreateBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBroadcastModal({ isOpen, onClose }: CreateBroadcastModalProps) {
  const [step, setStep] = useState(1);
  const [showVariables, setShowVariables] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    audience: 'all',
    message: '',
    schedule: 'now',
    type: 'text',
    templateId: ''
  });

  const insertVariable = (variable: string) => {
    setFormData({...formData, message: formData.message + variable});
    setShowVariables(false);
  };

  const templates = [
    { id: '1', name: 'ترحيب_عميل_جديد', content: 'مرحباً {{1}}، شكراً لانضمامك إلينا.' },
    { id: '2', name: 'تأكيد_طلب_شراء', content: 'لقد تم استلام طلبك برقم {{1}} بنجاح.' },
    { id: '3', name: 'عرض_رمضان_٢٠٢٦', content: 'عرض خاص بمناسبة شهر رمضان: خصم {{1}}% على جميع المنتجات.' },
    { id: '5', name: 'كود_التحقق_otp', content: 'Your verification code is {{1}}.' },
  ];

  if (!isOpen) return null;

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-2xl font-black text-gray-900">إنشاء حملة بث جديدة</h2>
            <p className="text-gray-500 font-medium text-sm">خطوة {step} من ٣: {
              step === 1 ? 'تفاصيل الحملة' : step === 2 ? 'محتوى الرسالة' : 'المراجعة والجدولة'
            }</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 border border-transparent hover:border-gray-100 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="flex h-1.5 bg-gray-100">
          <div className={cn("bg-brand transition-all duration-500", step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full")}></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-900 pr-2">اسم الحملة</label>
                  <input 
                    type="text" 
                    placeholder="مثال: عروض نهاية العام"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-900 pr-2">الجمهور المستهدف</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, audience: 'all'})}
                      className={cn(
                        "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                        formData.audience === 'all' ? "border-brand bg-brand/5 ring-4 ring-brand/5" : "border-gray-100 hover:border-brand/30"
                      )}
                    >
                      <Users className={cn(formData.audience === 'all' ? "text-brand" : "text-gray-400")} />
                      <span className="font-bold text-sm">جميع العملاء</span>
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, audience: 'segmented'})}
                      className={cn(
                        "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                        formData.audience === 'segmented' ? "border-brand bg-brand/5 ring-4 ring-brand/5" : "border-gray-100 hover:border-brand/30"
                      )}
                    >
                      <Zap className={cn(formData.audience === 'segmented' ? "text-brand" : "text-gray-400")} />
                      <span className="font-bold text-sm">قائمة مخصصة</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex gap-4 p-2 bg-gray-50 rounded-2xl">
                  {['text', 'template', 'image', 'file'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setFormData({...formData, type: type})}
                      className={cn(
                        "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all",
                        formData.type === type ? "bg-white shadow-sm text-brand" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {type === 'text' && <MessageSquare size={18} />}
                      {type === 'template' && <LayoutTemplate size={18} />}
                      {type === 'image' && <ImageIcon size={18} />}
                      {type === 'file' && <FileText size={18} />}
                      {type === 'text' ? 'نص' : type === 'template' ? 'قالب' : type === 'image' ? 'صورة' : 'ملف'}
                    </button>
                  ))}
                </div>

                {formData.type === 'template' && (
                  <div className="space-y-3">
                    <label className="text-sm font-black text-gray-900 pr-2">اختر قالب معتمد</label>
                    <div className="relative">
                      <select 
                        value={formData.templateId}
                        onChange={(e) => {
                          const selected = templates.find(t => t.id === e.target.value);
                          setFormData({
                            ...formData, 
                            templateId: e.target.value,
                            message: selected ? selected.content : ''
                          });
                        }}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option value="">-- اختر قالباً --</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-900 pr-2">نص الرسالة {formData.type === 'template' && '(للمعاينة)'}</label>
                  <div className="relative">
                    <textarea 
                      rows={6}
                      placeholder="اكتب رسالتك هنا... استخدم {{contact.name}} لتخصيص الاسم"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-medium font-sans resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      disabled={formData.type === 'template'}
                    />
                    {formData.type !== 'template' && (
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 hover:text-brand transition-colors">
                          إضافة رمز تعبيري
                        </button>
                        <div className="relative">
                          {showVariables && (
                            <div className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl p-2 z-10 flex flex-col gap-1">
                                <div className="text-[10px] font-black uppercase text-gray-400 mb-1 px-2">إدراج متغير</div>
                                <button onClick={() => insertVariable('{{contact.name}}')} className="text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-brand rounded-lg transition-colors">اسم العميل</button>
                                <button onClick={() => insertVariable('{{contact.city}}')} className="text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-brand rounded-lg transition-colors">المدينة</button>
                                <button onClick={() => insertVariable('{{contact.phone}}')} className="text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-brand rounded-lg transition-colors">رقم الجوال</button>
                                <button onClick={() => insertVariable('{{contact.company}}')} className="text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-brand rounded-lg transition-colors">اسم الشركة</button>
                            </div>
                          )}
                          <button 
                            onClick={() => setShowVariables(!showVariables)}
                            className={cn(
                              "px-3 py-1.5 border rounded-lg text-[10px] font-black transition-colors flex items-center gap-1",
                              showVariables ? "bg-brand/10 border-brand/20 text-brand" : "bg-white border-gray-200 text-gray-600 hover:text-brand"
                            )}
                          >
                            معادلات التخصيص {`{ }`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-brand/5 p-6 rounded-2xl border border-brand/10 flex gap-4">
                  <div className="bg-brand text-white p-2 rounded-xl h-fit">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">تلميح ذكي</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">رسائل واتساب التي تبدأ بسؤال تحقق معدل رد أعلى بنسبة ٤٥٪ في السوق المحلي.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-8 border-2 border-brand/20 bg-brand/5 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-brand/5 rounded-full -translate-x-12 -translate-y-12"></div>
                  <h4 className="text-[10px] font-black text-brand uppercase tracking-widest mb-4">معاينة الرسالة</h4>
                  <p className="text-gray-900 font-medium font-sans whitespace-pre-wrap">{formData.message || 'لا يوجد نص للرسالة حالياً'}</p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-black text-gray-900 pr-2">وقت الإرسال</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, schedule: 'now'})}
                      className={cn(
                        "p-4 rounded-xl border-2 flex items-center gap-3 transition-all font-bold text-sm",
                        formData.schedule === 'now' ? "border-brand bg-brand/5 text-brand" : "border-gray-100 text-gray-400"
                      )}
                    >
                      <Send size={18} />
                      إرسال الآن
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, schedule: 'future'})}
                      className={cn(
                        "p-4 rounded-xl border-2 flex items-center gap-3 transition-all font-bold text-sm",
                        formData.schedule === 'future' ? "border-brand bg-brand/5 text-brand" : "border-gray-100 text-gray-400"
                      )}
                    >
                      <Calendar size={18} />
                      جدولة لوقت لاحق
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-50 flex justify-between bg-gray-50/30">
          <button 
            onClick={step === 1 ? onClose : prevStep}
            className="px-8 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <ChevronRight size={20} />
            {step === 1 ? 'إلغاء' : 'السابق'}
          </button>
          
          <button 
            onClick={step === 3 ? onClose : nextStep}
            className="px-12 py-4 bg-brand text-white rounded-2xl font-black text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center gap-2"
          >
            {step === 3 ? 'تأكيد وإرسال' : 'المتابعة'}
            <ChevronLeft size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
