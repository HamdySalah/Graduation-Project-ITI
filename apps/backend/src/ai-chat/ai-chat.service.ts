import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiChatService {
  private readonly openai: OpenAI | null = null;
  private readonly logger = new Logger(AiChatService.name);
  private readonly fallbackToMock: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.fallbackToMock = true; // Always use fallback if OpenAI fails
    
    if (!apiKey) {
      this.logger.warn('OpenAI API key is not defined in environment variables');
      this.logger.warn('AI chat will use mock responses only');
    }
    
    try {
      if (apiKey) {
        this.openai = new OpenAI({
          apiKey,
        });
        this.logger.log('OpenAI client initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client:', error);
    }
  }

  async generateResponse(message: string): Promise<string> {
    try {
      if (!message.trim()) {
        throw new BadRequestException('Message cannot be empty');
      }
      
      this.logger.log(`Processing chat message: "${message.substring(0, 20)}..."`);
      
      // First try with OpenAI if client is initialized
      if (this.openai) {
        try {
          this.logger.log('Attempting to use OpenAI API first');
          
          const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant for a nursing platform. Provide concise, helpful information about nursing services, healthcare advice, and how to use the platform. Respond in the same language as the user query. If the query is in Arabic, respond in Arabic.',
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          });
          
          this.logger.log('OpenAI API response received successfully');
          return response.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response. Please try again.';
        } catch (openaiError: any) {
          this.logger.warn(`OpenAI API failed, falling back to mock responses: ${openaiError?.message || 'Unknown error'}`);
          
          // If we're configured to fallback, continue to mock responses
          if (this.fallbackToMock) {
            this.logger.log('Using fallback mock response system');
            return this.getSmartMockResponse(message);
          }
          
          // If not configured to fallback, re-throw the error
          throw openaiError;
        }
      } else {
        // OpenAI client not initialized, use mock responses
        this.logger.log('OpenAI client not initialized, using mock response system');
        return this.getSmartMockResponse(message);
      }
    } catch (error: any) {
      this.logger.error(`Error generating AI response: ${error?.message || 'Unknown error'}`, error?.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error?.status === 429) {
        throw new InternalServerErrorException('Too many requests to the AI service. Please try again later.');
      }
      
      if (error?.type === 'insufficient_quota') {
        throw new InternalServerErrorException('OpenAI API quota exceeded. Please check billing details.');
      }
      
      throw new InternalServerErrorException('Failed to generate AI response: ' + (error?.message || 'Unknown error'));
    }
  }

  /**
   * Enhanced mock response system that provides more contextual answers
   * based on the user's query by analyzing the message content more deeply
   */
  /**
   * Enhanced smart response system that provides contextually appropriate answers
   * based on message patterns, keywords, and language detection
   */
  private getSmartMockResponse(message: string): string {
    // Convert message to lowercase for easier pattern matching
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if message is in Arabic
    const isArabic = /[\u0600-\u06FF]/.test(message);
    
    // Define nursing specialties for better matching
    const specialties = [
      'pediatric', 'geriatric', 'cardiac', 'orthopedic', 'oncology', 
      'psychiatric', 'mental health', 'surgical', 'emergency', 'neonatal',
      'intensive care', 'critical care', 'rehabilitation', 'home care',
      'wound care', 'dialysis', 'respiratory', 'palliative', 'hospice',
      'أطفال', 'كبار السن', 'قلب', 'عظام', 'أورام', 'نفسية', 'صحة نفسية',
      'جراحة', 'طوارئ', 'حديثي الولادة', 'العناية المركزة', 'تأهيل', 'رعاية منزلية',
      'رعاية الجروح', 'غسيل كلى', 'رعاية تنفسية', 'رعاية تلطيفية', 'رعاية المحتضرين'
    ];
    
    // Define common health conditions for better matching
    const conditions = [
      'diabetes', 'hypertension', 'heart disease', 'cancer', 'alzheimer',
      'dementia', 'stroke', 'arthritis', 'asthma', 'covid', 'pneumonia',
      'injury', 'surgery', 'recovery', 'pregnancy', 'birth', 'postpartum',
      'parkinson', 'multiple sclerosis', 'depression', 'anxiety', 'copd',
      'kidney disease', 'liver disease', 'wound', 'infection', 'fracture',
      'سكري', 'ضغط الدم', 'أمراض القلب', 'سرطان', 'الزهايمر',
      'خرف', 'سكتة دماغية', 'التهاب المفاصل', 'ربو', 'كوفيد', 'كورونا', 
      'التهاب رئوي', 'إصابة', 'جراحة', 'تعافي', 'حمل', 'ولادة', 'نفاس',
      'باركنسون', 'تصلب متعدد', 'اكتئاب', 'قلق', 'انسداد رئوي',
      'مرض كلوي', 'مرض كبدي', 'جرح', 'عدوى', 'كسر'
    ];
    
    // GREETING PATTERNS
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|مرحبا|السلام|صباح|مساء)\\b/i.test(message) || 
        message.length < 15 && /hi|hey|hello|مرحبا|السلام/i.test(message)) {
      
      if (isArabic) {
        return 'مرحباً! أنا مساعد منصة التمريض. كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في البحث عن ممرضين مؤهلين، أو حجز مواعيد، أو الإجابة على أسئلتك حول خدماتنا.';
      } else {
        return 'Hello! I\'m the Nursing Platform assistant. How can I help you today? I can assist you with finding qualified nurses, booking appointments, or answering your questions about our services.';
      }
    }
    
    // FIND NURSE PATTERNS
    if ((lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking for') || 
         lowerMessage.includes('need') || lowerMessage.includes('ابحث') || lowerMessage.includes('أريد')) && 
        (lowerMessage.includes('nurse') || lowerMessage.includes('nursing') || lowerMessage.includes('ممرض') || lowerMessage.includes('ممرضة'))) {
      
      // Check if asking for a specific specialty
      const matchedSpecialty = specialties.find(specialty => lowerMessage.includes(specialty));
      
      if (matchedSpecialty) {
        return `للبحث عن ممرض متخصص في ${matchedSpecialty}، يمكنك اتباع هذه الخطوات:
          1. انتقل إلى قسم "البحث عن ممرض" في الصفحة الرئيسية
          2. استخدم فلتر التخصصات واختر "${matchedSpecialty}"
          3. يمكنك تحديد نطاق السعر والموقع الجغرافي أيضاً
          4. استعرض الملفات الشخصية والتقييمات
          5. اختر الممرض المناسب وقم بحجز موعد
          
          هل تحتاج إلى مساعدة إضافية في العثور على ممرض متخصص في ${matchedSpecialty}؟`;
      }
      
      // Check if asking for a specific condition
      const matchedCondition = conditions.find(condition => lowerMessage.includes(condition));
      
      if (matchedCondition) {
        return `للبحث عن ممرض مؤهل للتعامل مع حالات ${matchedCondition}، أنصحك بما يلي:
          1. انتقل إلى قسم "البحث عن ممرض" في الصفحة الرئيسية
          2. استخدم خانة البحث واكتب "${matchedCondition}" أو اختر من قائمة الحالات الصحية
          3. سيعرض النظام الممرضين ذوي الخبرة في التعامل مع هذه الحالة
          4. يمكنك تصفية النتائج حسب التقييمات والخبرة والأسعار
          5. اختر الممرض المناسب وراجع تفاصيل خبرته قبل حجز موعد
          
          هل تحتاج لمعلومات أكثر تحديداً حول الرعاية التمريضية لحالات ${matchedCondition}؟`;
      }
      
      // General nurse search response
      return `للبحث عن ممرض مناسب على منصتنا، إليك الخطوات:
        1. انتقل إلى قسم "البحث عن ممرض" في الصفحة الرئيسية
        2. استخدم المرشحات لتحديد احتياجاتك (التخصص، الموقع، التوافر، إلخ)
        3. استعرض الملفات الشخصية للممرضين المتاحين مع تقييماتهم ومراجعات المرضى السابقين
        4. يمكنك مقارنة المرشحين من حيث الخبرة والمؤهلات والأسعار
        5. اختر الممرض المناسب وقم بحجز موعد
        
        هل يمكنني مساعدتك في تحديد نوع الرعاية التمريضية التي تبحث عنها؟`;
    }
    
    // BOOKING & APPOINTMENTS
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || 
        lowerMessage.includes('حجز') || lowerMessage.includes('موعد')) {
      
      if (lowerMessage.includes('cancel') || lowerMessage.includes('إلغاء')) {
        return `لإلغاء موعد محجوز، يرجى اتباع الخطوات التالية:
          1. قم بتسجيل الدخول إلى حسابك
          2. انتقل إلى "مواعيدي" في لوحة التحكم
          3. حدد الموعد الذي ترغب في إلغائه
          4. انقر على زر "إلغاء الموعد"
          5. اختر سبب الإلغاء (اختياري) وأكد الإلغاء
          
          يرجى ملاحظة أن الإلغاء قبل 24 ساعة من الموعد لا يترتب عليه رسوم، بينما قد يتم فرض رسوم على الإلغاء في وقت متأخر.`;
      }
      
      if (lowerMessage.includes('reschedule') || lowerMessage.includes('change') || lowerMessage.includes('تغيير') || lowerMessage.includes('تعديل')) {
        return `لتغيير موعد محجوز، اتبع هذه الخطوات:
          1. قم بتسجيل الدخول إلى حسابك
          2. انتقل إلى "مواعيدي" في لوحة التحكم
          3. حدد الموعد الذي ترغب في تغييره
          4. انقر على زر "تعديل الموعد"
          5. اختر التاريخ والوقت الجديدين من الأوقات المتاحة
          6. أكد التغيير
          
          هل تحتاج إلى مساعدة في تعديل موعدك؟`;
      }
      
      return `لحجز موعد مع ممرض عبر منصتنا، اتبع هذه الخطوات:
        1. ابحث عن الممرض المناسب لاحتياجاتك
        2. انقر على ملفه الشخصي لعرض التفاصيل الكاملة
        3. انقر على زر "حجز موعد"
        4. اختر التاريخ والوقت المناسبين من الأوقات المتاحة
        5. أدخل تفاصيل الحالة والاحتياجات الخاصة بك
        6. اختر طريقة الدفع وأكمل الحجز
        
        سيتم تأكيد الموعد عبر البريد الإلكتروني والرسائل النصية. هل تحتاج إلى مساعدة في نوع معين من المواعيد؟`;
    }
    
    // PRICING & PAYMENT
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee') || 
        lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('expensive') || 
        lowerMessage.includes('سعر') || lowerMessage.includes('أسعار') || lowerMessage.includes('تكلفة') || lowerMessage.includes('دفع') ||
        lowerMessage.includes('تكلف') || lowerMessage.includes('ثمن') || lowerMessage.includes('مصاريف')) {
      
      if (lowerMessage.includes('insurance') || lowerMessage.includes('تأمين')) {
        return `بخصوص التأمين الصحي، منصتنا تتعامل مع العديد من شركات التأمين، منها:
          • شركات التأمين الصحي الحكومية
          • معظم شركات التأمين الخاصة الكبرى
          
          لمعرفة ما إذا كان تأمينك الصحي مغطى:
          1. انتقل إلى صفحة "وسائل الدفع والتأمين"
          2. ابحث عن شركة التأمين الخاصة بك في القائمة
          3. أو اتصل بخدمة العملاء للتأكد من التغطية
          
          في حال كان التأمين الخاص بك مغطى، سيتم خصم الرسوم تلقائياً من شركة التأمين ولن تحتاج للدفع مقدماً.`;
      }
      
      if (lowerMessage.includes('refund') || lowerMessage.includes('استرداد')) {
        return `سياسة استرداد المدفوعات على منصتنا:
          • إلغاء الموعد قبل 24 ساعة: استرداد كامل
          • إلغاء الموعد خلال 24 ساعة: استرداد 50% من المبلغ
          • عدم الحضور دون إلغاء: لا يوجد استرداد
          
          لطلب استرداد المبلغ:
          1. انتقل إلى "مواعيدي" في لوحة التحكم
          2. حدد الموعد الملغي
          3. انقر على "طلب استرداد"
          4. اختر طريقة الاسترداد المفضلة
          
          ستتم معالجة طلب الاسترداد خلال 3-5 أيام عمل.`;
      }
      
      return `تختلف أسعار الخدمات التمريضية على منصتنا حسب:
        • تخصص الممرض وخبرته
        • نوع الرعاية المطلوبة
        • مدة الزيارة أو الرعاية
        • الموقع الجغرافي
        
        نطاقات الأسعار التقريبية:
        • زيارات منزلية قصيرة: $50-100 للساعة
        • رعاية متخصصة: $75-150 للساعة
        • رعاية مستمرة: أسعار مخفضة للباقات
        
        يمكنك الاطلاع على السعر المحدد لكل ممرض على صفحة ملفه الشخصي قبل الحجز. نقبل الدفع بالبطاقات الائتمانية والتحويل البنكي والتأمين الصحي.`;
    }
    
    // SERVICES
    if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('provide') || 
        lowerMessage.includes('خدمة') || lowerMessage.includes('خدمات')) {
      
      return `منصتنا تقدم مجموعة متنوعة من الخدمات التمريضية، تشمل:
        
        • الرعاية المنزلية: زيارات منزلية للمساعدة في تناول الأدوية، تغيير الضمادات، وغيرها
        • رعاية ما بعد العمليات الجراحية: متابعة الحالة والعناية بالجروح والتعافي
        • الرعاية المتخصصة: للأمراض المزمنة مثل السكري، أمراض القلب، والسرطان
        • رعاية كبار السن: مساعدة في الأنشطة اليومية والتنقل والرعاية الشخصية
        • رعاية الأطفال: للأطفال ذوي الاحتياجات الخاصة أو في فترة التعافي
        • التثقيف الصحي: تقديم معلومات حول إدارة الأمراض والوقاية منها
        
        ما نوع الخدمة التي تبحث عنها تحديداً؟ يمكنني تقديم معلومات أكثر تفصيلاً عن أي خدمة.`;
    }
    
    // ACCOUNT & REGISTRATION
    if (lowerMessage.includes('account') || lowerMessage.includes('register') || lowerMessage.includes('sign up') || 
        lowerMessage.includes('login') || lowerMessage.includes('حساب') || lowerMessage.includes('تسجيل')) {
      
      if (lowerMessage.includes('forgot') || lowerMessage.includes('reset') || lowerMessage.includes('password') || 
          lowerMessage.includes('نسيت') || lowerMessage.includes('كلمة المرور')) {
        return `لإعادة تعيين كلمة المرور:
          1. انتقل إلى صفحة تسجيل الدخول
          2. انقر على "نسيت كلمة المرور؟"
          3. أدخل عنوان بريدك الإلكتروني المسجل
          4. ستتلقى رسالة بريد إلكتروني تحتوي على رابط لإعادة تعيين كلمة المرور
          5. انقر على الرابط وأدخل كلمة مرور جديدة
          
          إذا لم تتلق رسالة البريد الإلكتروني، تحقق من مجلد الرسائل غير المرغوب فيها أو اتصل بخدمة العملاء.`;
      }
      
      if (lowerMessage.includes('delete') || lowerMessage.includes('حذف')) {
        return `لحذف حسابك:
          1. قم بتسجيل الدخول إلى حسابك
          2. انتقل إلى "الإعدادات"
          3. اختر "إدارة الحساب"
          4. انقر على "حذف الحساب"
          5. اقرأ المعلومات حول تبعات الحذف
          6. أكد حذف الحساب
          
          يرجى ملاحظة أنه بمجرد حذف الحساب، لن يمكن استعادة بياناتك أو سجل المواعيد السابقة.`;
      }
      
      return `لإنشاء حساب جديد على منصتنا:
        1. انقر على "تسجيل" في الصفحة الرئيسية
        2. اختر نوع الحساب: "مريض" أو "مقدم رعاية"
        3. أدخل معلوماتك الشخصية وعنوان بريدك الإلكتروني
        4. أنشئ كلمة مرور قوية
        5. أكمل معلومات ملفك الشخصي وتفضيلاتك
        6. تحقق من بريدك الإلكتروني وانقر على رابط التأكيد
        
        بعد إنشاء الحساب، يمكنك البحث عن ممرضين، حجز مواعيد، وإدارة سجلاتك الصحية بسهولة.`;
    }
    
    // REVIEW & RATINGS
    if (lowerMessage.includes('review') || lowerMessage.includes('rating') || lowerMessage.includes('feedback') || 
        lowerMessage.includes('تقييم') || lowerMessage.includes('مراجعة')) {
      
      return `نظام التقييمات والمراجعات على منصتنا:
      
        • يمكن للمرضى تقييم الممرضين بعد إكمال الخدمة
        • التقييم يشمل نجوم (1-5) وتعليقات نصية
        • يمكنك قراءة تقييمات المرضى السابقين على الملف الشخصي لكل ممرض
        • التقييمات تساعد المرضى الآخرين في اختيار الممرض المناسب
        • يمكنك تصفية نتائج البحث حسب التقييمات العالية
        
        لكتابة مراجعة بعد تلقي الخدمة:
        1. انتقل إلى "مواعيدي السابقة"
        2. حدد الموعد المكتمل
        3. انقر على "إضافة تقييم"
        4. قدم تقييمك النجمي وأضف تعليقات مفصلة عن تجربتك
        
        نحن نقدر تعليقاتك الصادقة التي تساعد في تحسين خدماتنا.`;
    }
    
    // SPECIALIZATIONS
    const specialtyMatch = specialties.find(specialty => lowerMessage.includes(specialty));
    if (specialtyMatch) {
      return `بخصوص تخصص ${specialtyMatch}، منصتنا توفر ممرضين متخصصين في هذا المجال. ممرضو ${specialtyMatch} مدربون على:
        
        • تقديم الرعاية المتخصصة المناسبة لهذا المجال
        • التعامل مع الحالات المعقدة ضمن تخصصهم
        • توفير النصائح والإرشادات الصحية المتعلقة بهذا التخصص
        
        للبحث عن ممرض متخصص في ${specialtyMatch}:
        1. استخدم فلتر التخصصات في صفحة البحث
        2. حدد "${specialtyMatch}" من القائمة
        3. استعرض الملفات الشخصية للممرضين المتخصصين
        
        هل تبحث عن معلومات محددة حول خدمات ${specialtyMatch} التي نقدمها؟`;
    }
    
    // HEALTH CONDITIONS
    const conditionMatch = conditions.find(condition => lowerMessage.includes(condition));
    if (conditionMatch) {
      return `بالنسبة للرعاية التمريضية لحالات ${conditionMatch}، منصتنا توفر ممرضين مؤهلين للتعامل مع هذه الحالة. تشمل الخدمات:
        
        • مراقبة الحالة الصحية والأعراض
        • إدارة الأدوية والعلاجات
        • تقديم الرعاية المتخصصة اللازمة
        • التثقيف الصحي للمريض ومقدمي الرعاية
        
        الممرضون المتخصصون في ${conditionMatch} يمتلكون المهارات والخبرة اللازمة للتعامل مع تحديات هذه الحالة والمساعدة في تحسين نوعية الحياة للمرضى.
        
        هل ترغب في معرفة المزيد عن كيفية مساعدة ممرضينا لمرضى ${conditionMatch}؟`;
    }
    
    // COVID-19 SPECIFIC
    if (lowerMessage.includes('covid') || lowerMessage.includes('coronavirus') || lowerMessage.includes('pandemic') || 
        lowerMessage.includes('كوفيد') || lowerMessage.includes('كورونا')) {
      
      return `فيما يتعلق بخدمات الرعاية المرتبطة بـ COVID-19، نقدم:
        
        • رعاية منزلية للمرضى المصابين بـ COVID-19
        • فحوصات COVID-19 المنزلية
        • مراقبة الأعراض والحالة الصحية
        • دعم التعافي بعد الإصابة
        • تقديم المشورة حول العزل والوقاية
        
        جميع ممرضينا المتعاملين مع حالات COVID-19 مدربون على بروتوكولات مكافحة العدوى ويستخدمون معدات الوقاية الشخصية المناسبة لضمان سلامة الجميع.
        
        هل تحتاج إلى رعاية متعلقة بـ COVID-19 أو لديك أسئلة محددة حول هذا الموضوع؟`;
    }
    
    // EMERGENCY CASES
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('immediate') || 
        lowerMessage.includes('طوارئ') || lowerMessage.includes('عاجل')) {
      
      return `تنبيه مهم: منصتنا غير مخصصة لحالات الطوارئ الطبية!
      
        إذا كنت تواجه حالة طبية طارئة، يرجى:
        • الاتصال بالإسعاف على الرقم المحلي للطوارئ (911 أو 999 أو 112 حسب بلدك)
        • التوجه لأقرب قسم طوارئ في المستشفى
        
        منصتنا مصممة لخدمات الرعاية المجدولة والمتابعة، وليست بديلاً عن خدمات الطوارئ. بعد استقرار الحالة، يمكننا المساعدة في:
        • تنسيق رعاية المتابعة
        • توفير رعاية تمريضية منزلية للتعافي
        • المساعدة في إدارة الحالة بعد الخروج من المستشفى
        
        سلامتك هي الأولوية القصوى.`;
    }
    
    // FAQ & PLATFORM INFO
    if (lowerMessage.includes('faq') || lowerMessage.includes('question') || lowerMessage.includes('how does') || 
        lowerMessage.includes('what is') || lowerMessage.includes('how do i') || lowerMessage.includes('how can i') ||
        lowerMessage.includes('أسئلة شائعة') || lowerMessage.includes('كيف يمكنني') || lowerMessage.includes('ما هي')) {
      
      const response = isArabic ? 
        `يمكنك العثور على إجابات للأسئلة الشائعة في قسم "الأسئلة الشائعة" على موقعنا. نغطي مواضيع مثل:
          • كيفية استخدام المنصة
          • عملية اختيار الممرضين والحجز
          • سياسات الدفع والإلغاء
          • معلومات عن خدماتنا التمريضية
          
          هل هناك سؤال محدد تبحث عن إجابة له؟` :
        `You can find answers to frequently asked questions in the "FAQ" section on our website. We cover topics such as:
          • How to use the platform
          • The process of selecting nurses and booking
          • Payment and cancellation policies
          • Information about our nursing services
          
          Do you have a specific question you're looking for an answer to?`;
      
      return response;
    }
    
    // PLATFORM DESCRIPTION
    if (lowerMessage.includes('about') || lowerMessage.includes('platform') || lowerMessage.includes('website') ||
        lowerMessage.includes('عن المنصة') || lowerMessage.includes('عن الموقع') || lowerMessage.includes('ما هي المنصة')) {
      
      const response = isArabic ?
        `منصتنا هي منصة رقمية متخصصة تربط المرضى بممرضين مؤهلين ومعتمدين. نهدف إلى تسهيل الوصول إلى الرعاية التمريضية عالية الجودة من خلال:
          • توفير قاعدة بيانات شاملة للممرضين المتخصصين
          • نظام حجز سهل الاستخدام للزيارات المنزلية والاستشارات
          • التحقق من مؤهلات وخبرات جميع الممرضين
          • نظام تقييم شفاف لمساعدة المرضى في اتخاذ قرارات مستنيرة
          
          تأسست المنصة بهدف تحسين تجربة الرعاية الصحية المنزلية وجعلها أكثر سهولة وموثوقية للجميع.` :
        `Our platform is a specialized digital platform that connects patients with qualified and certified nurses. We aim to facilitate access to high-quality nursing care by:
          • Providing a comprehensive database of specialized nurses
          • An easy-to-use booking system for home visits and consultations
          • Verifying the qualifications and experience of all nurses
          • A transparent rating system to help patients make informed decisions
          
          The platform was established with the aim of improving the home healthcare experience and making it easier and more reliable for everyone.`;
      
      return response;
    }
    
    // TERMS OF SERVICE
    if (lowerMessage.includes('terms') || lowerMessage.includes('conditions') || lowerMessage.includes('policy') ||
        lowerMessage.includes('privacy') || lowerMessage.includes('شروط') || lowerMessage.includes('خصوصية') ||
        lowerMessage.includes('سياسة')) {
      
      const response = isArabic ?
        `يمكنك الاطلاع على شروط الخدمة وسياسة الخصوصية الخاصة بنا على موقعنا. تغطي هذه المستندات:
          • كيفية استخدام المنصة
          • حقوق ومسؤوليات المستخدمين
          • كيفية حماية بياناتك الشخصية
          • سياسات الإلغاء والاسترداد
          
          لعرض هذه المستندات، انتقل إلى الجزء السفلي من أي صفحة على موقعنا وانقر على "شروط الاستخدام" أو "سياسة الخصوصية".` :
        `You can view our terms of service and privacy policy on our website. These documents cover:
          • How to use the platform
          • User rights and responsibilities
          • How your personal data is protected
          • Cancellation and refund policies
          
          To view these documents, go to the bottom of any page on our website and click on "Terms of Use" or "Privacy Policy".`;
      
      return response;
    }
    
    // DEFAULT RESPONSE FOR UNRECOGNIZED QUERIES
    if (isArabic) {
      return `شكراً على سؤالك حول "${message.substring(0, 30)}...".
      
        منصتنا توفر خدمات تمريضية متكاملة تشمل:
        • البحث عن ممرضين مؤهلين حسب التخصص والموقع
        • حجز زيارات منزلية أو استشارات
        • خدمات رعاية مخصصة للاحتياجات المختلفة
        • متابعة الحالة الصحية وإدارة العلاجات
        
        يمكنني مساعدتك في:
        • البحث عن ممرض
        • حجز أو إدارة المواعيد
        • الاستفسار عن الخدمات والأسعار
        • معلومات حول التخصصات التمريضية المختلفة
        
        هل يمكنك توضيح استفسارك بشكل أكثر تحديداً لأقدم لك المساعدة المناسبة؟`;
    } else {
      return `Thank you for your question about "${message.substring(0, 30)}...".
      
        Our platform provides comprehensive nursing services including:
        • Finding qualified nurses by specialty and location
        • Booking home visits or consultations
        • Customized care services for different needs
        • Health condition monitoring and treatment management
        
        I can help you with:
        • Finding a nurse
        • Booking or managing appointments
        • Inquiring about services and prices
        • Information about different nursing specialties
        
        Can you please clarify your inquiry more specifically so I can provide you with appropriate assistance?`;
    }
  }
}
