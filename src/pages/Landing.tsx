import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Zap, 
  BarChart3, 
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100 bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-brand w-10 h-10 rounded-xl flex items-center justify-center text-white">
              <MessageSquare size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">وصل</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-brand font-medium">المميزات</a>
            <a href="#use-cases" className="text-gray-600 hover:text-brand font-medium">حالات الاستخدام</a>
            <a href="#pricing" className="text-gray-600 hover:text-brand font-medium">الأسعار</a>
            <div className="h-6 w-[1px] bg-gray-200"></div>
            <Link to="/login" className="text-gray-600 hover:text-brand font-medium">تسجيل الدخول</Link>
            <Link to="/login" className="bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg hover:shadow-brand/20">
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 shadow-xl"
        >
          <a href="#features" className="block text-gray-600 font-medium px-4 py-2">المميزات</a>
          <a href="#use-cases" className="block text-gray-600 font-medium px-4 py-2">حالات الاستخدام</a>
          <a href="#pricing" className="block text-gray-600 font-medium px-4 py-2">الأسعار</a>
          <Link to="/login" className="block text-gray-600 font-medium px-4 py-2">تسجيل الدخول</Link>
          <Link to="/login" className="block bg-brand text-white px-4 py-3 rounded-xl font-bold text-center">ابدأ مجاناً</Link>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => (
  <section className="pt-32 pb-20 px-4 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#d1fae5_0%,white_70%)] text-center">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 text-brand-dark text-sm font-bold mb-6 border border-brand/20">
          <Zap size={14} className="fill-brand" />
          منصة التسويق الأولى عبر واتساب في العالم العربي
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-[1.1] tracking-tight">
          حول محادثاتك إلى <span className="gradient-text">مبيعات</span> حقيقية.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          نساعد الشركات على أتمتة مبيعاتها وخدمة عملائها عبر واتساب. ابدأ رحلة النمو اليوم مع أقوى منصة أتمتة متكاملة.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl hover:shadow-brand/30 flex items-center justify-center gap-2 group">
            ابدأ تجربتك المجانية
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
            <PlayCircle size={20} className="text-brand" />
            شاهد كيف يعمل
          </a>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-gray-400 grayscale opacity-70">
          <span className="font-bold">موثوق من قبل:</span>
          <div className="flex gap-8">
            <div className="text-xl font-black">LOGO</div>
            <div className="text-xl font-black">COMPANY</div>
            <div className="text-xl font-black">SAAS</div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-16 relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-brand to-brand-dark rounded-[2.5rem] blur opacity-20"></div>
        <div className="relative bg-white rounded-[2.5rem] border border-gray-200 shadow-2xl overflow-hidden aspect-video max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <PlayCircle size={48} />
              </div>
              <p className="font-bold text-gray-400">فيديو توضيحي للمنصة</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-brand/30 hover:shadow-xl transition-all group">
    <div className="w-14 h-14 bg-gray-50 text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed font-normal">{description}</p>
  </div>
);

const Features = () => (
  <section id="features" className="py-24 px-4 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">كل ما تحتاجه للنمو عبر واتساب</h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">أدوات قوية وسهلة الاستخدام مصممة خصيصاً لاحتياجات السوق العربي.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={Send}
          title="حملات البث الذكية"
          description="أرسل آلاف الرسائل المخصصة لعملائك بنقرة واحدة مع ضمان عدم الحظر."
        />
        <FeatureCard 
          icon={Zap}
          title="أتمتة المحادثات"
          description="بناء روبوتات محادثة (Chatbots) ذكية ترد على استفسارات العملاء 24/7."
        />
        <FeatureCard 
          icon={Users}
          title="إدارة العملاء والفرق"
          description="صندوق وراد مشترك لفريق عملك بالكامل لإدارة المحادثات بكفاءة عالية."
        />
        <FeatureCard 
          icon={BarChart3}
          title="تقارير وتحليلات"
          description="راقب أداء حملاتك ونسب الفتح والردود في الوقت الفعلي."
        />
        <FeatureCard 
          icon={CheckCircle2}
          title="تكامل مع CRM"
          description="اربط المنصة بسهولة مع أدواتك الحالية مثل Shopify و Zoho و Salesforce."
        />
        <FeatureCard 
          icon={MessageSquare}
          title="أزرار تفاعلية"
          description="استخدم أزرار الرد السريع والقوائم لجعل تجربة العميل أكثر سلاسة."
        />
      </div>
    </div>
  </section>
);

const UseCases = () => (
  <section id="use-cases" className="py-24 px-4 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">حلول لكل تخصص</h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg font-medium">سواء كنت في المبيعات أو التسويق أو خدمة العملاء، "وصل" يمنحك القوة.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-12">
          <div className="flex gap-6 group">
            <div className="bg-brand/10 text-brand p-4 rounded-2xl h-fit border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all">
              <BarChart3 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">التسويق والمبيعات</h3>
              <p className="text-gray-600 font-medium leading-relaxed">أرسل العروض الترويجية، استلم الطلبات، وقم بأتمتة المتابعة لزيادة نسبة التحويل بنسبة تصل إلى ٤٠٪.</p>
            </div>
          </div>
          <div className="flex gap-6 group">
            <div className="bg-brand/10 text-brand p-4 rounded-2xl h-fit border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">خدمة العملاء</h3>
              <p className="text-gray-600 font-medium leading-relaxed">وفر دعم فوري ٢٤/٧ باستخدام الردود الآلية والتحويل الذكي للموظفين المختصين عند الحاجة.</p>
            </div>
          </div>
          <div className="flex gap-6 group">
            <div className="bg-brand/10 text-brand p-4 rounded-2xl h-fit border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all">
              <Zap size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">الأتمتة والعمليات</h3>
              <p className="text-gray-600 font-medium leading-relaxed">أتمتة الفواتير، تأكيد الحجوزات، وإشعارات الشحن تلقائياً بمجرد حدوث أي تغيير في نظام الـ CRM الخاص بك.</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1551288049-bbda38a5f67d?auto=format&fit=crop&q=80&w=2070" alt="Dashboard" className="rounded-[2.5rem]" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  </section>
);

const PricingCard = ({ title, price, features, recommended }: any) => (
  <div className={cn(
    "p-10 rounded-[3rem] bg-white border border-gray-100 flex flex-col h-full transition-all hover:shadow-2xl relative",
    recommended ? "ring-4 ring-brand/10 border-brand shadow-xl" : ""
  )}>
    {recommended && (
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">الاكثر طلباً</span>
    )}
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-4xl font-black text-gray-900">${price}</span>
      <span className="text-gray-500 font-bold">/شهرياً</span>
    </div>
    <ul className="space-y-4 mb-10 flex-1">
      {features.map((feature: string, i: number) => (
        <li key={i} className="flex gap-3 text-sm font-bold text-gray-600">
          <CheckCircle2 size={18} className="text-brand shrink-0" />
          {feature}
        </li>
      ))}
    </ul>
    <Link to="/login" className={cn(
      "w-full py-5 rounded-2xl font-black text-center transition-all text-lg",
      recommended ? "bg-brand text-white shadow-xl hover:bg-brand-dark" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
    )}>
      اشترك الآن
    </Link>
  </div>
);

const Pricing = () => (
  <section id="pricing" className="py-24 px-4 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">باقات تناسب نموك</h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg font-medium">اختر الباقة المناسبة لمشروعك وابدأ في التواصل مع عملائك باحترافية.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <PricingCard 
          title="الباقة الاقتصادية"
          price="٤٩"
          features={[
            "١,٠٠٠ رسالة شهرياً",
            "موظف واحد فقط",
            "صندوق وراد أساسي",
            "بوت ترحيبي بسيط",
            "دعم عبر البريد"
          ]}
        />
        <PricingCard 
          recommended
          title="الباقة الاحترافية"
          price="٩٩"
          features={[
            "٥,٠٠٠ رسالة شهرياً",
            "٥ موظفين",
            "أتمتة متقدمة",
            "تكامل مع Shopify",
            "تقارير يومية",
            "دعم أولوية"
          ]}
        />
        <PricingCard 
          title="باقة المؤسسات"
          price="٢٤٩"
          features={[
            "رسائل غير محدودة*",
            "عدد غير محدود من الموظفين",
            "API مخصص",
            "مدير حساب مخصص",
            "تخصيص كامل",
            "دعم ٢٤/٧"
          ]}
        />
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white py-16 px-4">
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
      <div className="col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-brand w-10 h-10 rounded-xl flex items-center justify-center text-white">
            <MessageSquare size={24} />
          </div>
          <span className="text-2xl font-black tracking-tight">وصل</span>
        </div>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          المنصة الأولى في الشرق الأوسط لأتمتة التسويق والأعمال عبر واتساب. نساعدك على تحويل المحادثات إلى مبيعات.
        </p>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors cursor-pointer">
            <span className="font-bold">X</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors cursor-pointer">
            <span className="font-bold">in</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-bold mb-6">روابط سريعة</h4>
        <ul className="space-y-4 text-gray-400">
          <li><a href="#" className="hover:text-brand transition-colors">المميزات</a></li>
          <li><a href="#" className="hover:text-brand transition-colors">الأسعار</a></li>
          <li><a href="#" className="hover:text-brand transition-colors">عن المنصة</a></li>
          <li><a href="#" className="hover:text-brand transition-colors">المدونة</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-bold mb-6">الدعم القانوني</h4>
        <ul className="space-y-4 text-gray-400">
          <li><a href="#" className="hover:text-brand transition-colors">سياسة الخصوصية</a></li>
          <li><a href="#" className="hover:text-brand transition-colors">شروط الاستخدام</a></li>
          <li><a href="#" className="hover:text-brand transition-colors">اتفاقية مستوى الخدمة</a></li>
        </ul>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 font-medium">
      <p>© 2026 وصل (Wassal). جميع الحقوق محفوظة.</p>
    </div>
  </footer>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <UseCases />
      <Pricing />
      
      {/* Social Proof Section */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 items-center gap-16">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">انضم إلى آلاف الشركات التي تثق بـ "وصل"</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-brand/10 text-brand p-2 rounded-lg h-fit">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">دعم فني باللغة العربية</h4>
                  <p className="text-gray-600">فريقنا معك في كل خطوة لمساعدتك على النجاح.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-brand/10 text-brand p-2 rounded-lg h-fit">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">أمان كامل لبياناتك</h4>
                  <p className="text-gray-600">تشفير كامل وحماية لبيانات عملائك وفق أعلى المعايير.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-brand/5 p-12 rounded-[3rem] border border-brand/10 text-center">
            <div className="text-6xl font-black text-brand mb-2">+١٠,٠٠٠</div>
            <div className="text-xl font-bold text-gray-700 mb-8">عميل نشط يومياً</div>
            <p className="text-gray-500 italic">"استفدنا من وصل في تحسين مبيعاتنا بنسبة ٤٠٪ خلال أول شهر من الاستخدام."</p>
            <div className="mt-6 font-bold text-gray-900">— عبدالله، مدير مبيعات</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-brand rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -translate-x-32 translate-y-32 blur-3xl"></div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">هل أنت جاهز للنمو؟</h2>
          <p className="text-xl mb-10 text-white/90 relative z-10 max-w-2xl mx-auto font-medium">ابدأ الآن واحصل على ١٤ يوماً تجربة مجانية لكافة المميزات. لا حاجة لبطاقة ائتمان.</p>
          <Link to="/login" className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-2xl relative z-10">
            سجل الآن مجاناً
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
