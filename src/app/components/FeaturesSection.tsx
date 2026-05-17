import React from 'react';
import { BookOpen, Code2, Brain, Zap, FileText, MessageSquare } from 'lucide-react';

const features = [
  {
    id: 'feat-academic',
    icon: BookOpen,
    iconColor: 'text-gold',
    iconBg: 'bg-gold/10',
    title: 'مساعد أكاديمي',
    description:
      'احصل على شروحات مفصلة للمواضيع المعقدة في الرياضيات والعلوم والتاريخ والأدب وغيرها. aylnor يستشهد بالمنطق، ليس فقط الإجابات.',
    tags: ['مساعدة الواجبات', 'البحث العلمي', 'مراجعة المقالات'],
    accent: 'border-gold/20',
  },
  {
    id: 'feat-code',
    icon: Code2,
    iconColor: 'text-royal-blue-light',
    iconBg: 'bg-royal-blue/10',
    title: 'مساعد البرمجة',
    description:
      'توليد وتصحيح وشرح الكود في أكثر من 40 لغة برمجة. احصل على تعليقات مضمنة وتحليل التعقيد واقتراحات أفضل الممارسات.',
    tags: ['Python', 'JavaScript', 'SQL', '+37 أخرى'],
    accent: 'border-royal-blue/20',
  },
  {
    id: 'feat-modes',
    icon: Brain,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    title: 'ذكاء اصطناعي متعدد الأوضاع',
    description:
      'بدّل بين السريع (إجابات فورية) والمتأمل (شروحات عميقة) والبرمجة (أولوية الكود) لتناسب ما تحتاجه بالضبط.',
    tags: ['الوضع السريع', 'الوضع المتأمل', 'وضع البرمجة'],
    accent: 'border-purple-500/20',
  },
  {
    id: 'feat-speed',
    icon: Zap,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
    title: 'ردود فورية',
    description:
      'لا انتظار ولا طوابير. aylnor يبث الردود رمزاً بعد رمز حتى ترى الإجابة تتشكل في الوقت الفعلي — حتى للمسائل المعقدة.',
    tags: ['بث مباشر', 'زمن استجابة منخفض', 'متاح دائماً'],
    accent: 'border-yellow-500/20',
  },
  {
    id: 'feat-history',
    icon: FileText,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    title: 'ذاكرة المحادثات',
    description:
      'كل جلسة تُحفظ وقابلة للبحث. راجع جلسات الدراسة، واستمر من حيث توقفت، وصدّر المحادثات كـ PDF أو Markdown.',
    tags: ['حفظ تلقائي', 'قابل للبحث', 'تصدير'],
    accent: 'border-green-500/20',
  },
  {
    id: 'feat-persona',
    icon: MessageSquare,
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/10',
    title: 'شخصية بوت مخصصة',
    description:
      'حدد شخصية aylnor — أعطه اسماً، اضبط أسلوبه (رسمي، ودود، موجز)، وخصص تركيزه على مجالك الدراسي.',
    tags: ['اسم مخصص', 'التحكم بالأسلوب', 'تركيز المادة'],
    accent: 'border-pink-500/20',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 badge-blue px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5">
            ما يفعله aylnor
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            كل ما تحتاجه <span className="text-gold">للتعلم بشكل أسرع</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            مساعد واحد. ثلاثة أوضاع. مواضيع لا محدودة. مصمم للمتعلمين الجادين والمطورين العاملين.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features?.map((feat) => {
            const FeatIcon = feat?.icon;
            return (
              <div
                key={feat?.id}
                className={`glass-card feature-card-hover rounded-2xl p-5 sm:p-6 border ${feat?.accent}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${feat?.iconBg} flex items-center justify-center mb-4`}
                >
                  <FeatIcon size={22} className={feat?.iconColor} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 text-right">{feat?.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 text-right">
                  {feat?.description}
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {feat?.tags?.map((tag) => (
                    <span
                      key={`${feat?.id}-tag-${tag}`}
                      className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-muted-foreground border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
