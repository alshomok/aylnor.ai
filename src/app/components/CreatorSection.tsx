import React from 'react';
import { GitBranch, Globe, Code2, Cpu, Layers, Database } from 'lucide-react';

const techStack = [
  { id: 'tech-nextjs', label: 'Next.js 15', icon: Layers, color: 'text-foreground' },
  { id: 'tech-react', label: 'React 19', icon: Code2, color: 'text-royal-blue-light' },
  { id: 'tech-typescript', label: 'TypeScript', icon: Code2, color: 'text-blue-400' },
  { id: 'tech-python', label: 'Python 3.12', icon: Code2, color: 'text-yellow-400' },
  { id: 'tech-tailwind', label: 'Tailwind CSS', icon: Layers, color: 'text-cyan-400' },
  { id: 'tech-openai', label: 'OpenAI API', icon: Cpu, color: 'text-green-400' },
  { id: 'tech-postgres', label: 'PostgreSQL', icon: Database, color: 'text-blue-300' },
  { id: 'tech-redis', label: 'Redis', icon: Database, color: 'text-red-400' },
];

export default function CreatorSection() {
  return (
    <section id="creator" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
          {/* Creator info */}
          <div className="text-right">
            <div className="inline-flex items-center gap-2 badge-gold px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6">
              عن المطور
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              بُني بواسطة مطور،{' '}
              <span className="text-gold">للمتعلمين</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-6">
              تم إنشاء aylnor.ai بواسطة{' '}
              <span className="text-foreground font-semibold">Aylnor Vasquez</span>، مطور full-stack وخريج علوم حاسوب سئم من التنقل بين خمس أدوات مختلفة للدراسة والبرمجة. الرؤية: مساعد ذكي واحد يفهم السياق الأكاديمي وتحديات البرمجة الواقعية.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              كل ميزة — من أوضاع البوت إلى ذاكرة المحادثات — صُممت حول سير عمل الطلاب والمطورين الفعليين، واختُبرت عبر مئات الجلسات قبل الإطلاق.
            </p>
            <div className="flex items-center gap-4 flex-row-reverse">
              <a
                href="#"
                className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold"
              >
                <GitBranch size={16} />
                عرض الكود المصدري
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground nav-link-hover"
              >
                <Globe size={16} />
                المحفظة
              </a>
            </div>
          </div>

          {/* Tech stack */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-gold/15">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-6 text-right">
              التقنيات المستخدمة
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {techStack?.map((tech) => {
                const TechIcon = tech?.icon;
                return (
                  <div
                    key={tech?.id}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-border hover:border-gold/30 transition-colors flex-row-reverse"
                  >
                    <TechIcon size={16} className={tech?.color} />
                    <span className="text-sm font-medium text-foreground">{tech?.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed text-right">
                aylnor.ai مبني بهندسة full-stack حديثة — ردود مبثوثة عبر Server-Sent Events، وحفظ المحادثات في PostgreSQL، وذاكرة تخزين مؤقت مدعومة بـ Redis لتوجيه الاستجابات في أقل من 100ms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}