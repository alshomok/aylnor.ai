const PptxGenJS = require('pptxgenjs');
const path = require('path');
const os = require('os');

// Colors from the project
const COLORS = {
  background: '0A0F1E',
  foreground: 'E8EDF8',
  gold: 'D4A017',
  goldLight: 'F0C040',
  goldDark: 'A07810',
  royalBlue: '1B4FD8',
  royalBlueLight: '3B6EF0',
  royalBlueDark: '0D3BAA',
  navy: '0A0F1E',
  navyCard: '111827',
  white: 'FFFFFF'
};

// Create presentation
const pptx = new PptxGenJS();

// Set presentation properties
pptx.author = 'Aylnor Vasquez';
pptx.company = 'aylnor.ai';
pptx.title = 'Aylnor.ai - AI Academic Assistant';
pptx.subject = 'AI-Powered Academic Assistant';

// Slide 1: Title Slide
const slide1 = pptx.addSlide();
slide1.background = { color: COLORS.background };

// Add gradient background effect
slide1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: '100%', h: '100%',
  fill: { color: COLORS.royalBlueDark, transparency: 30 }
});

// Add title
slide1.addText('aylnor.ai', {
  x: 1, y: 2, w: '80%', h: 1.5,
  fontSize: 54,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial',
  align: 'center'
});

slide1.addText('رفيقك الأكاديمي بالذكاء الاصطناعي', {
  x: 1, y: 3.5, w: '80%', h: 1,
  fontSize: 28,
  color: COLORS.foreground,
  fontFace: 'Arial',
  align: 'center'
});

// Add decorative elements
slide1.addShape(pptx.ShapeType.ellipse, {
  x: 0.5, y: 5, w: 1, h: 1,
  fill: { color: COLORS.gold, transparency: 20 }
});

slide1.addShape(pptx.ShapeType.ellipse, {
  x: 8, y: 5.5, w: 1.5, h: 1.5,
  fill: { color: COLORS.royalBlue, transparency: 20 }
});

// Slide 2: About
const slide2 = pptx.addSlide();
slide2.background = { color: COLORS.background };

slide2.addText('عن aylnor.ai', {
  x: 0.5, y: 0.5, w: '90%', h: 0.8,
  fontSize: 36,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial'
});

const aboutPoints = [
  { text: 'مساعد أكاديمي ذكي مدعوم بالذكاء الاصطناعي', color: COLORS.foreground },
  { text: 'يدعم الطلاب في الواجبات والمقالات والبحث', color: COLORS.foreground },
  { text: 'متعدد الأوضاع: سريع، مفكر، ومبرمج', color: COLORS.foreground },
  { text: 'يدعم +40 لغة برمجة', color: COLORS.foreground },
  { text: 'قاعدة معرفة ذكية مع ملفات تعليمية', color: COLORS.foreground }
];

aboutPoints.forEach((point, index) => {
  slide2.addText(point.text, {
    x: 1, y: 1.8 + (index * 0.7), w: '85%', h: 0.5,
    fontSize: 20,
    color: point.color,
    fontFace: 'Arial',
    bullet: true
  });
});

// Slide 3: Features
const slide3 = pptx.addSlide();
slide3.background = { color: COLORS.background };

slide3.addText('المميزات الرئيسية', {
  x: 0.5, y: 0.5, w: '90%', h: 0.8,
  fontSize: 36,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial'
});

const features = [
  { title: 'مساعد أكاديمي', desc: 'الواجبات، المقالات، البحث' },
  { title: 'مساعد البرمجة', desc: '+40 لغة برمجة' },
  { title: 'ذكاء اصطناعي متعدد الأوضاع', desc: 'سريع، متأمل، برمجة' }
];

features.forEach((feature, index) => {
  const yPos = 1.8 + (index * 1.5);
  
  // Feature box
  slide3.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: yPos, w: '90%', h: 1.2,
    fill: { color: COLORS.navyCard },
    line: { color: COLORS.royalBlue, width: 2 }
  });
  
  slide3.addText(feature.title, {
    x: 0.8, y: yPos + 0.2, w: '85%', h: 0.4,
    fontSize: 22,
    bold: true,
    color: COLORS.gold,
    fontFace: 'Arial'
  });
  
  slide3.addText(feature.desc, {
    x: 0.8, y: yPos + 0.6, w: '85%', h: 0.4,
    fontSize: 16,
    color: COLORS.foreground,
    fontFace: 'Arial'
  });
});

// Slide 4: AI Models
const slide4 = pptx.addSlide();
slide4.background = { color: COLORS.background };

slide4.addText('نماذج الذكاء الاصطناعي', {
  x: 0.5, y: 0.5, w: '90%', h: 0.8,
  fontSize: 36,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial'
});

const models = [
  { name: 'Gemini 1.5 Flash', provider: 'Google', key: 'GEMINI_API_KEY_1' },
  { name: 'Gemini 2.0 Flash', provider: 'Google', key: 'GEMINI_API_KEY_2' },
  { name: 'Llama 3.1 8B', provider: 'Groq', key: 'GROQ_API_KEY_1' },
  { name: 'Gemma2 9B IT', provider: 'Groq', key: 'GROQ_API_KEY_2' }
];

models.forEach((model, index) => {
  const yPos = 1.8 + (index * 1.2);
  
  slide4.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: yPos, w: '90%', h: 1,
    fill: { color: COLORS.navyCard },
    line: { color: COLORS.gold, width: 1 }
  });
  
  slide4.addText(`${model.name} (${model.provider})`, {
    x: 0.8, y: yPos + 0.2, w: '85%', h: 0.4,
    fontSize: 18,
    bold: true,
    color: COLORS.royalBlueLight,
    fontFace: 'Arial'
  });
  
  slide4.addText(`مفتاح: ${model.key}`, {
    x: 0.8, y: yPos + 0.55, w: '85%', h: 0.3,
    fontSize: 14,
    color: COLORS.foreground,
    fontFace: 'Arial'
  });
});

// Slide 5: Modes
const slide5 = pptx.addSlide();
slide5.background = { color: COLORS.background };

slide5.addText('أوضاع العمل', {
  x: 0.5, y: 0.5, w: '90%', h: 0.8,
  fontSize: 36,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial'
});

const modes = [
  { name: 'السريع', limit: 'بدون حد', desc: 'ردود سريعة للاستفسارات البسيطة' },
  { name: 'المفكر', limit: '50 رسالة/ساعة', desc: 'ردود متعمقة ومفصلة' },
  { name: 'المبرمج', limit: '50 رسالة/ساعة', desc: 'مساعدة برمجية متقدمة' }
];

modes.forEach((mode, index) => {
  const yPos = 1.8 + (index * 1.3);
  
  slide5.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: yPos, w: '90%', h: 1.1,
    fill: { color: COLORS.royalBlueDark, transparency: 40 },
    line: { color: COLORS.royalBlue, width: 2 }
  });
  
  slide5.addText(mode.name, {
    x: 0.8, y: yPos + 0.15, w: '85%', h: 0.35,
    fontSize: 20,
    bold: true,
    color: COLORS.gold,
    fontFace: 'Arial'
  });
  
  slide5.addText(`${mode.limit} - ${mode.desc}`, {
    x: 0.8, y: yPos + 0.55, w: '85%', h: 0.35,
    fontSize: 16,
    color: COLORS.foreground,
    fontFace: 'Arial'
  });
});

// Slide 6: Technology Stack
const slide6 = pptx.addSlide();
slide6.background = { color: COLORS.background };

slide6.addText('التقنيات المستخدمة', {
  x: 0.5, y: 0.5, w: '90%', h: 0.8,
  fontSize: 36,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial'
});

const techStack = [
  'Next.js 15 - React Framework',
  'Supabase - Database & Auth',
  'Google Gemini AI',
  'Groq AI Models',
  'TailwindCSS - Styling',
  'TypeScript - Type Safety'
];

techStack.forEach((tech, index) => {
  slide6.addText(tech, {
    x: 1, y: 1.8 + (index * 0.6), w: '85%', h: 0.5,
    fontSize: 18,
    color: COLORS.foreground,
    fontFace: 'Arial',
    bullet: { code: '2022', color: COLORS.gold }
  });
});

// Slide 7: Contact
const slide7 = pptx.addSlide();
slide7.background = { color: COLORS.background };

slide7.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: '100%', h: '100%',
  fill: { color: COLORS.royalBlueDark, transparency: 40 }
});

slide7.addText('شكراً لكم', {
  x: 1, y: 2.5, w: '80%', h: 1,
  fontSize: 48,
  bold: true,
  color: COLORS.gold,
  fontFace: 'Arial',
  align: 'center'
});

slide7.addText('aylnor.ai', {
  x: 1, y: 3.8, w: '80%', h: 0.8,
  fontSize: 32,
  bold: true,
  color: COLORS.foreground,
  fontFace: 'Arial',
  align: 'center'
});

slide7.addText('بُني بواسطة Aylnor Vasquez', {
  x: 1, y: 5, w: '80%', h: 0.6,
  fontSize: 20,
  color: COLORS.royalBlueLight,
  fontFace: 'Arial',
  align: 'center'
});

slide7.addText('© 2026 - جميع الحقوق محفوظة', {
  x: 1, y: 6, w: '80%', h: 0.5,
  fontSize: 16,
  color: COLORS.foreground,
  fontFace: 'Arial',
  align: 'center'
});

// Save to desktop
const desktopPath = path.join(os.homedir(), 'Desktop', 'Aylnor-Presentation.pptx');
pptx.writeFile({ fileName: desktopPath })
  .then(fileName => {
    console.log(`تم إنشاء العرض التقديمي بنجاح: ${fileName}`);
  })
  .catch(err => {
    console.error('خطأ في إنشاء العرض التقديمي:', err);
  });
