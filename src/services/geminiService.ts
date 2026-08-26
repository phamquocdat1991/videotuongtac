import { InteractionPoint, AiProvider } from '../types';
import { generateContentWithFallback, GEMINI_DEFAULT_MODEL } from './aiClientFactory';

export interface GenerateScriptParams {
  apiKey?: string;
  provider?: AiProvider;
  selectedModel?: string;
  videoTitle: string;
  videoDuration: number;
  lessonContent: string;
  subject?: string;
  grade?: string;
  interactionCount?: number;
  onModelFallbackNotice?: (fromModel: string, toModel: string, reason: string) => void;
}

export async function generateInteractionsWithGemini(
  params: GenerateScriptParams
): Promise<{ interactions: InteractionPoint[]; usedModel: string }> {
  const {
    apiKey,
    provider = 'gemini',
    selectedModel = GEMINI_DEFAULT_MODEL,
    videoTitle,
    videoDuration = 180,
    lessonContent,
    subject = 'Tổng hợp',
    grade = 'THPT',
    interactionCount = 3,
    onModelFallbackNotice,
  } = params;

  // 1. NẾU CÓ API KEY -> GỌI AI THẬT QUA CLIENT FACTORY VÀ FALLBACK MODEL
  if (apiKey && apiKey.trim().length >= 8) {
    const systemPrompt = `
Bạn là Chuyên gia Công nghệ Giáo dục (EdTech Instructional Designer & Pedagogical Specialist) hàng đầu tại Việt Nam.
Nhiệm vụ: Phân tích nội dung bài học và độ dài video để tạo kịch bản các điểm dừng tương tác sư phạm (interactive video checkpoints) chuẩn mực nhất.

Quy chuẩn sư phạm:
1. Phân bổ các mốc thời gian (timestamp) đều đặn và hợp lý dọc theo dòng thời gian video (từ 10s đến ${Math.max(20, Math.round(videoDuration - 10))}s).
2. Đa dạng hóa các loại hình câu hỏi để kích thích tư duy người học:
   - "quiz": Trắc nghiệm 1 đáp án đúng (có 4 lựa chọn A, B, C, D; correctAnswer là chỉ số 0..3).
   - "multi_choice": Trắc nghiệm chọn nhiều đáp án đúng (correctAnswers là mảng các chỉ số đúng).
   - "true_false": Câu nhận định Đúng hoặc Sai (statement kèm isCorrect: true/false).
   - "drag_drop": Hoạt động kéo thả ghép nối/phân loại vào 2-3 nhóm danh mục.
   - "fill_blank": Điền từ/công thức vào chỗ trống {...}.
   - "checkpoint_note": Thẻ tóm tắt kiến thức trọng tâm của phân đoạn vừa xem.
3. Nếu bài giảng thuộc môn Toán học, Vật lý, Hóa học: Luôn viết công thức khoa học trong cặp dấu $...$ (ví dụ: $x^2 + y^2 = 1$, $\\Delta = b^2 - 4ac$, $C_6H_{12}O_6$).
4. Mọi câu hỏi BẮT BUỘC có lời giải thích (explanation) rõ ràng, mang tính động viên và khắc sâu kiến thức.
5. Trả về định dạng JSON thuần túy (mảng các điểm dừng tương tác).
`;

    const userPrompt = `
Thông tin bài học:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Tiêu đề video: "${videoTitle || 'Bài giảng tương tác'}"
- Tổng thời lượng video: ${Math.round(videoDuration)} giây (khoảng ${Math.floor(videoDuration / 60)} phút ${Math.round(videoDuration % 60)} giây)
- Nội dung giáo án / Tài liệu bài giảng:
"""
${lessonContent || 'Bài học kiến thức tổng quan, phân tích khái niệm lý thuyết và bài tập vận dụng.'}
"""

Yêu cầu xuất:
Hãy tạo đúng ${Math.max(2, Math.min(8, interactionCount))} điểm dừng tương tác sư phạm. Cấu trúc JSON mẫu:

[
  {
    "id": "point_1",
    "timestamp": 25,
    "title": "Kiểm tra nhận biết khái niệm",
    "data": {
      "type": "quiz",
      "question": "Nội dung câu hỏi trắc nghiệm?",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correctAnswer": 0,
      "explanation": "Giải thích chi tiết vì sao đáp án này chính xác."
    }
  },
  {
    "id": "point_2",
    "timestamp": 75,
    "title": "Phân loại kiến thức",
    "data": {
      "type": "drag_drop",
      "instruction": "Kéo các nội dung vào đúng nhóm phân loại tương ứng:",
      "categories": ["Nhóm 1", "Nhóm 2"],
      "items": [
        {"id": "d1", "text": "Khái niệm 1", "targetCategory": "Nhóm 1"},
        {"id": "d2", "text": "Khái niệm 2", "targetCategory": "Nhóm 2"},
        {"id": "d3", "text": "Khái niệm 3", "targetCategory": "Nhóm 1"}
      ],
      "explanation": "Giải thích phân loại chi tiết."
    }
  },
  {
    "id": "point_3",
    "timestamp": 120,
    "title": "Điền khuyết công thức trọng tâm",
    "data": {
      "type": "fill_blank",
      "sentence": "Công thức tính diện tích hình tròn là: S = {...}",
      "blankAnswer": "\\pi R^2",
      "hint": "Chứa số Pi và bình phương bán kính",
      "explanation": "Diện tích hình tròn bán kính R là S = \\pi R^2."
    }
  }
]
`;

    try {
      const { text, usedModel } = await generateContentWithFallback({
        apiKey,
        provider,
        selectedModel,
        systemInstruction: systemPrompt,
        contents: userPrompt,
        responseMimeType: 'application/json',
        // Bật thinking mode HIGH cho tác vụ phân tích sư phạm (api.md mục IV)
        // Gemini 3.x: thinking giúp lập bản đồ nội dung chính xác hơn
        useThinking: true,
        // Tăng maxOutputTokens để kịch bản dài không bị cắt giữa chừng
        maxOutputTokens: 8192,
        onModelFallbackNotice,
      });

      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const validatedInteractions: InteractionPoint[] = parsed.map((item, idx) => ({
          id: item.id || `point_${Date.now()}_${idx}`,
          timestamp: Math.max(
            5,
            Math.min(
              Math.round(videoDuration - 5),
              Number(item.timestamp) || Math.round((idx + 1) * (videoDuration / (parsed.length + 1)))
            )
          ),
          title: item.title || `Điểm dừng tương tác ${idx + 1}`,
          data: item.data,
        }));

        validatedInteractions.sort((a, b) => a.timestamp - b.timestamp);
        return { interactions: validatedInteractions, usedModel };
      }
    } catch (err: any) {
      console.warn('Gọi AI thất bại:', err);
      throw err; // Ném lỗi rõ ràng để UI hiển thị thông báo chính xác
    }
  }

  // 2. CHẾ ĐỘ MÔ PHỎNG SƯ PHẠM THÔNG MINH (KHI CHƯA CÓ API KEY)
  await new Promise((res) => setTimeout(res, 900));
  const duration = videoDuration > 30 ? videoDuration : 180;
  const isBiology = /quang hợp|sinh học|tế bào|thực vật|động vật/i.test(lessonContent + videoTitle + subject);
  const isMath = /toán|hình học|đại số|phương trình|tích phân|lượng giác/i.test(lessonContent + videoTitle + subject);
  const isEnglish = /tiếng anh|english|grammar|vocabulary|tenses/i.test(lessonContent + videoTitle + subject);
  const isPhysics = /vật lý|lực|chuyển động|điện xoay chiều|sóng ánh sáng/i.test(lessonContent + videoTitle + subject);

  let simulatedPoints: InteractionPoint[] = [];

  if (isBiology) {
    simulatedPoints = [
      {
        id: `point_bio_1`,
        timestamp: Math.round(duration * 0.2),
        title: 'Khái niệm Lục lạp & Sắc tố',
        data: {
          type: 'quiz',
          question: 'Bào quan nào trong tế bào thực vật là nơi diễn ra quá trình quang hợp?',
          options: [
            'Ti thể (Mitochondria)',
            'Lục lạp (Chloroplast)',
            'Không bào (Vacuole)',
            'Nhân tế bào (Nucleus)',
          ],
          correctAnswer: 1,
          explanation: 'Lục lạp chứa chất diệp lục có khả năng hấp thụ năng lượng quang năng ánh sáng mặt trời.',
        },
      },
      {
        id: `point_bio_2`,
        timestamp: Math.round(duration * 0.55),
        title: 'Phân loại Pha Sáng & Pha Tối',
        data: {
          type: 'drag_drop',
          instruction: 'Kéo các sản phẩm và phản ứng vào đúng pha quang hợp tương ứng:',
          categories: ['Pha Sáng (Tilacôit)', 'Pha Tối (Chất nền Stroma)'],
          items: [
            { id: 'dd_1', text: 'Quang phân ly $H_2O$ giải phóng $O_2$', targetCategory: 'Pha Sáng (Tilacôit)' },
            { id: 'dd_2', text: 'Cố định $CO_2$ tạo Glucose $C_6H_{12}O_6$', targetCategory: 'Pha Tối (Chất nền Stroma)' },
            { id: 'dd_3', text: 'Tổng hợp năng lượng ATP & NADPH', targetCategory: 'Pha Sáng (Tilacôit)' },
            { id: 'dd_4', text: 'Chu trình Calvin', targetCategory: 'Pha Tối (Chất nền Stroma)' },
          ],
          explanation: 'Pha sáng cần ánh sáng trực tiếp tại màng Tilacôit; pha tối diễn ra ở chất nền Stroma không cần ánh sáng trực tiếp.',
        },
      },
      {
        id: `point_bio_3`,
        timestamp: Math.round(duration * 0.82),
        title: 'Điền từ: Phương trình quang hợp',
        data: {
          type: 'fill_blank',
          sentence: 'Phương trình tổng quát: $6CO_2 + 6H_2O \\xrightarrow{\\text{Ánh sáng, Diệp lục}} {...} + 6O_2$',
          blankAnswer: 'C6H12O6',
          hint: 'Công thức phân tử của đường Glucose',
          explanation: 'Sản phẩm hữu cơ chính của quá trình quang hợp là đường Glucose ($C_6H_{12}O_6$).',
        },
      },
    ];
  } else if (isMath) {
    simulatedPoints = [
      {
        id: `point_math_1`,
        timestamp: Math.round(duration * 0.25),
        title: 'Công thức lượng giác cơ bản',
        data: {
          type: 'quiz',
          question: 'Đẳng thức lượng giác cơ bản nào sau đây luôn đúng với mọi góc $x$?',
          options: [
            '$\\sin^2(x) + \\cos^2(x) = 1$',
            '$\\sin^2(x) - \\cos^2(x) = 1$',
            '$\\tan(x) \\cdot \\cot(x) = 0$',
            '$\\sin(2x) = 2\\sin(x)$',
          ],
          correctAnswer: 0,
          explanation: 'Hệ thức Pitago trong đường tròn lượng giác: $\\sin^2(x) + \\cos^2(x) = 1$.',
        },
      },
      {
        id: `point_math_2`,
        timestamp: Math.round(duration * 0.6),
        title: 'Phân loại tập nghiệm phương trình',
        data: {
          type: 'drag_drop',
          instruction: 'Kéo các phương trình sau vào đúng tính chất tập nghiệm:',
          categories: ['Luôn có nghiệm thực trên $\\mathbb{R}$', 'Vô nghiệm trên $\\mathbb{R}$'],
          items: [
            { id: 'm1', text: '$x^2 - 4 = 0$', targetCategory: 'Luôn có nghiệm thực trên $\\mathbb{R}$' },
            { id: 'm2', text: '$x^2 + 9 = 0$', targetCategory: 'Vô nghiệm trên $\\mathbb{R}$' },
            { id: 'm3', text: '$2x + 5 = 0$', targetCategory: 'Luôn có nghiệm thực trên $\\mathbb{R}$' },
            { id: 'm4', text: '$\\sin(x) = 3$', targetCategory: 'Vô nghiệm trên $\\mathbb{R}$' },
          ],
          explanation: '$x^2 + 9 > 0$ và $\\sin(x) \\in [-1, 1]$ nên hai phương trình đó vô nghiệm.',
        },
      },
      {
        id: `point_math_3`,
        timestamp: Math.round(duration * 0.85),
        title: 'Thẻ ghi nhớ trọng tâm',
        data: {
          type: 'checkpoint_note',
          title: 'Tóm tắt: Đạo hàm cơ bản',
          summary: 'Ghi nhớ các công thức đạo hàm hàm số lũy thừa và lượng giác.',
          keyTakeaways: [
            '$(x^n)\' = n \\cdot x^{n-1}$',
            '$(\\sin x)\' = \\cos x$',
            '$(\\cos x)\' = -\\sin x$',
          ],
          reflectionQuestion: 'Hãy nhẩm lại đạo hàm của hàm số $f(x) = x^3 + \\sin(x)$ trước khi xem tiếp!',
        },
      },
    ];
  } else if (isPhysics) {
    simulatedPoints = [
      {
        id: `point_phy_1`,
        timestamp: Math.round(duration * 0.25),
        title: 'Định luật II Newton',
        data: {
          type: 'quiz',
          question: 'Biểu thức của định luật II Newton về mối quan hệ giữa lực $\\vec{F}$, khối lượng $m$ và gia tốc $\\vec{a}$ là:',
          options: [
            '$\\vec{F} = m \\cdot \\vec{a}$',
            '$\\vec{F} = \\frac{\\vec{a}}{m}$',
            '$\\vec{a} = m \\cdot \\vec{F}$',
            '$\\vec{F} = m \\cdot v$',
          ],
          correctAnswer: 0,
          explanation: 'Định luật II Newton phát biểu gia tốc tỉ lệ thuận với lực tác dụng và tỉ lệ nghịch với khối lượng: $\\vec{a} = \\frac{\\vec{F}}{m} \\Rightarrow \\vec{F} = m\\vec{a}$.',
        },
      },
      {
        id: `point_phy_2`,
        timestamp: Math.round(duration * 0.65),
        title: 'Điền công thức động năng',
        data: {
          type: 'fill_blank',
          sentence: 'Công thức tính động năng của một vật khối lượng $m$ chuyển động với vận tốc $v$ là: $W_đ = {...}$',
          blankAnswer: '\\frac{1}{2}mv^2',
          hint: 'Nửa tích khối lượng và bình phương vận tốc',
          explanation: 'Động năng là năng lượng do chuyển động: $W_đ = \\frac{1}{2}mv^2$.',
        },
      },
    ];
  } else if (isEnglish) {
    simulatedPoints = [
      {
        id: `point_eng_1`,
        timestamp: Math.round(duration * 0.25),
        title: 'Grammar: Present Perfect Tense',
        data: {
          type: 'quiz',
          question: 'Choose the correct verb form: "They ______ in Da Nang for five years."',
          options: ['live', 'are living', 'have lived', 'lived'],
          correctAnswer: 2,
          explanation: '"For five years" signals the Present Perfect tense (have/has + V3/ed).',
        },
      },
      {
        id: `point_eng_2`,
        timestamp: Math.round(duration * 0.65),
        title: 'Word Formation Classification',
        data: {
          type: 'drag_drop',
          instruction: 'Classify the following words into Nouns or Adjectives:',
          categories: ['Nouns (Danh từ)', 'Adjectives (Tính từ)'],
          items: [
            { id: 'e1', text: 'Education', targetCategory: 'Nouns (Danh từ)' },
            { id: 'e2', text: 'Innovative', targetCategory: 'Adjectives (Tính từ)' },
            { id: 'e3', text: 'Knowledge', targetCategory: 'Nouns (Danh từ)' },
            { id: 'e4', text: 'Effective', targetCategory: 'Adjectives (Tính từ)' },
          ],
          explanation: 'Suffixes -tion, -edge indicate nouns; -ive indicates adjectives.',
        },
      },
    ];
  } else {
    simulatedPoints = [
      {
        id: `point_gen_1`,
        timestamp: Math.round(duration * 0.2),
        title: 'Khái niệm trọng tâm',
        data: {
          type: 'quiz',
          question: `Dựa vào phần vừa giảng của "${videoTitle || 'bài học'}", mục tiêu cốt lõi của nội dung này là gì?`,
          options: [
            'Nắm vững khái niệm nền tảng và phương pháp áp dụng',
            'Chỉ cần ghi nhớ lý thuyết mà không cần thực hành',
            'Bỏ qua các bước phân tích ban đầu',
            'Chỉ áp dụng trong một trường hợp cá biệt',
          ],
          correctAnswer: 0,
          explanation: 'Việc nắm vững khái niệm và phương pháp áp dụng là mục tiêu cốt lõi của bài giảng.',
        },
      },
      {
        id: `point_gen_2`,
        timestamp: Math.round(duration * 0.55),
        title: 'Kéo thả hệ thống hóa kiến thức',
        data: {
          type: 'drag_drop',
          instruction: 'Kéo các nội dung sau vào đúng cột nhóm tương ứng:',
          categories: ['Ưu điểm trọng tâm', 'Lưu ý khi thực hiện'],
          items: [
            { id: 'g1', text: 'Tăng tương tác chủ động cho học sinh', targetCategory: 'Ưu điểm trọng tâm' },
            { id: 'g2', text: 'Cần phân bổ thời gian hợp lý', targetCategory: 'Lưu ý khi thực hiện' },
            { id: 'g3', text: 'Đánh giá năng lực theo thời gian thực', targetCategory: 'Ưu điểm trọng tâm' },
            { id: 'g4', text: 'Kiểm tra đường truyền internet', targetCategory: 'Lưu ý khi thực hiện' },
          ],
          explanation: 'Sắp xếp đúng giúp học sinh hệ thống hóa kiến thức toàn diện.',
        },
      },
      {
        id: `point_gen_3`,
        timestamp: Math.round(duration * 0.82),
        title: 'Tổng kết & Vận dụng',
        data: {
          type: 'quiz',
          question: 'Để đạt hiệu quả học tập cao nhất, học sinh nên làm gì sau khi xem xong video bài giảng?',
          options: [
            'Luyện tập bài tập mở rộng và ghi chép lại các điểm cốt lõi',
            'Đóng video và không xem lại',
            'Bỏ qua các câu hỏi tương tác',
            'Không cần làm bài tập vận dụng',
          ],
          correctAnswer: 0,
          explanation: 'Thực hành mở rộng và tổng kết giúp kiến thức được khắc sâu dài hạn.',
        },
      },
    ];
  }

  return { interactions: simulatedPoints, usedModel: 'Smart Pedagogical Preset' };
}
