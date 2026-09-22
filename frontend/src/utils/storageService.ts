import type { User, StudySet, Sentence, AttemptResult, TopicGroup } from '../types';

// Key định danh trong LocalStorage
const STORAGE_KEYS = {
  USERS: 'pesa_users_v1',
  CURRENT_USER_ID: 'pesa_current_user_id_v1',
  STUDY_SETS: 'pesa_study_sets_v1',
  SENTENCES: 'pesa_sentences_v1',
  ATTEMPTS: 'pesa_attempts_v1',
  SELECTED_VOICE: 'pesa_selected_voice_v1',
};

// Dữ liệu người dùng mặc định
const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Phúc',
    role: 'Học sinh / Sinh viên',
    avatar: '👦',
    daily_goal: 5,
    today_completed: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Mẹ',
    role: 'Nội trợ & Gia đình',
    avatar: '👩',
    daily_goal: 3,
    today_completed: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Thành',
    role: 'Giao tiếp hàng ngày',
    avatar: '👨',
    daily_goal: 3,
    today_completed: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  },
];

// Dữ liệu các Bộ câu mặc định kèm passage_text nguyên văn
const INITIAL_STUDY_SETS: StudySet[] = [
  {
    id: 1,
    title: 'Đời sống hàng ngày',
    description: 'Các mẫu câu chào hỏi, thói quen và sinh hoạt thường nhật',
    category: 'system',
    icon: '☕',
    created_at: '2026-09-21 17:27:34',
    passage_text:
      'Good morning! Did you sleep well last night? I usually drink a cup of warm water every morning. I want to improve my English speaking skills. It is such a beautiful and sunny day today. I am trying to build a healthy daily routine.',
  },
  {
    id: 2,
    title: 'Gia đình thân yêu',
    description: 'Giao tiếp ấm áp, chia sẻ công việc nhà cùng người thân',
    category: 'system',
    icon: '👨‍👩‍👧',
    created_at: '2026-09-21 17:27:34',
    passage_text:
      "Dinner is ready, let's eat together! Could you please help me wash the dishes? Spending quality time with family makes me happy. How was your day at work today, dad?",
  },
  {
    id: 3,
    title: 'Ăn uống & Nấu nướng',
    description: 'Khen ngợi món ăn, gọi đồ uống và khám phá ẩm thực',
    category: 'system',
    icon: '🍜',
    created_at: '2026-09-21 17:27:34',
    passage_text:
      'This soup smells so delicious and fresh. Would you like some more iced coffee? I love eating Vietnamese street food, especially Pho.',
  },
  {
    id: 4,
    title: 'Mua sắm & Đi chợ',
    description: 'Hỏi giá tiền, thanh toán và mua sắm đồ dùng',
    category: 'system',
    icon: '🛍️',
    created_at: '2026-09-21 17:27:34',
    passage_text:
      'Excuse me, how much does this cost? Can I pay with credit card or cash? Do you have this shirt in a medium size?',
  },
  {
    id: 5,
    title: 'Giao tiếp xã giao',
    description: 'Bắt chuyện lịch sự, nói chuyện thời tiết và sở thích',
    category: 'system',
    icon: '💬',
    created_at: '2026-09-21 17:27:34',
    passage_text:
      "Nice to meet you! Where are you from? The weather is so nice and cool today, isn't it? What do you usually do in your free time?",
  },
  {
    id: 6,
    title: 'Du lịch & Đi lại',
    description: 'Hỏi đường, thủ tục di chuyển và trải nghiệm du lịch',
    category: 'system',
    icon: '✈️',
    created_at: '2026-09-21 17:27:34',
    passage_text:
      'Could you show me the way to the nearest bus station? I would like to book a flight ticket to Da Nang. Where can I find the baggage claim area?',
  },
];

// Danh sách các câu học khởi tạo phong phú
const INITIAL_SENTENCES: Sentence[] = [
  // Đời sống hàng ngày (set_id = 1)
  {
    id: 1,
    text: 'Good morning! Did you sleep well last night?',
    translation: 'Chào buổi sáng! Tối qua bạn ngủ ngon giấc không?',
    topic: 'daily_life',
    topic_vi: 'Đời sống hàng ngày',
    difficulty: 'A1',
    audio_hint: "Chú ý nối âm 'Did you' đọc nhẹ như /dɪdʒu/.",
    set_id: 1,
    order_index: 1,
  },
  {
    id: 2,
    text: 'I usually drink a cup of warm water every morning.',
    translation: 'Tôi thường uống một cốc nước ấm vào mỗi buổi sáng.',
    topic: 'daily_life',
    topic_vi: 'Đời sống hàng ngày',
    difficulty: 'A1',
    audio_hint: "Phát âm rõ âm /kʌp əv/ khi đọc 'cup of'.",
    set_id: 1,
    order_index: 2,
  },
  {
    id: 3,
    text: 'I want to improve my English speaking skills.',
    translation: 'Tôi muốn cải thiện kỹ năng nói tiếng Anh của mình.',
    topic: 'daily_life',
    topic_vi: 'Đời sống hàng ngày',
    difficulty: 'A2',
    audio_hint: "Nhấn mạnh vào từ 'improve' và 'speaking'.",
    set_id: 1,
    order_index: 3,
  },
  {
    id: 4,
    text: 'It is such a beautiful and sunny day today.',
    translation: 'Hôm nay quả là một ngày đẹp trời và ngập tràn ánh nắng.',
    topic: 'daily_life',
    topic_vi: 'Đời sống hàng ngày',
    difficulty: 'A2',
    audio_hint: "Chú ý từ 'beautiful' đọc 3 âm tiết /ˈbjuːtɪfl/.",
    set_id: 1,
    order_index: 4,
  },
  {
    id: 5,
    text: 'I am trying to build a healthy daily routine.',
    translation: 'Tôi đang cố gắng xây dựng một thói quen sinh hoạt lành mạnh.',
    topic: 'daily_life',
    topic_vi: 'Đời sống hàng ngày',
    difficulty: 'B1',
    audio_hint: "Âm /θ/ trong 'healthy' cần đặt lưỡi chạm nhẹ vào răng trên.",
    set_id: 1,
    order_index: 5,
  },

  // Gia đình (set_id = 2)
  {
    id: 6,
    text: "Dinner is ready, let's eat together!",
    translation: 'Cơm tối đã sẵn sàng rồi, cả nhà cùng ăn nhé!',
    topic: 'family',
    topic_vi: 'Gia đình',
    difficulty: 'A1',
    audio_hint: "Âm đuôi /s/ trong 'let\\'s' cần bật rõ ràng.",
    set_id: 2,
    order_index: 1,
  },
  {
    id: 7,
    text: 'Could you please help me wash the dishes?',
    translation: 'Con/Bạn có thể giúp một tay rửa bát được không?',
    topic: 'family',
    topic_vi: 'Gia đình',
    difficulty: 'A2',
    audio_hint: "Từ 'dishes' có âm /ʃɪz/ ở đuôi.",
    set_id: 2,
    order_index: 2,
  },
  {
    id: 8,
    text: 'Spending quality time with family makes me happy.',
    translation: 'Dành thời gian quý báu bên gia đình khiến tôi rất hạnh phúc.',
    topic: 'family',
    topic_vi: 'Gia đình',
    difficulty: 'B1',
    audio_hint: "Từ 'quality' đọc là /ˈkwɒləti/.",
    set_id: 2,
    order_index: 3,
  },
  {
    id: 9,
    text: 'How was your day at work today, dad?',
    translation: 'Hôm nay ngày làm việc của ba thế nào ạ?',
    topic: 'family',
    topic_vi: 'Gia đình',
    difficulty: 'A2',
    audio_hint: "Lên giọng nhẹ ở cuối câu hỏi 'today, dad?'.",
    set_id: 2,
    order_index: 4,
  },

  // Ăn uống (set_id = 3)
  {
    id: 10,
    text: 'This soup smells so delicious and fresh.',
    translation: 'Món súp này thơm và tươi ngon quá.',
    topic: 'food',
    topic_vi: 'Ăn uống & Nấu nướng',
    difficulty: 'A1',
    audio_hint: "Chú ý âm /ʃ/ trong 'delicious' /dɪˈlɪʃəs/.",
    set_id: 3,
    order_index: 1,
  },
  {
    id: 11,
    text: 'Would you like some more iced coffee?',
    translation: 'Bạn có muốn uống thêm chút cà phê sữa đá không?',
    topic: 'food',
    topic_vi: 'Ăn uống & Nấu nướng',
    difficulty: 'A2',
    audio_hint: "'Would you' nối âm nhẹ thành /wʊdʒu/.",
    set_id: 3,
    order_index: 2,
  },
  {
    id: 12,
    text: 'I love eating Vietnamese street food, especially Pho.',
    translation: 'Tôi rất thích ăn món ăn đường phố Việt Nam, đặc biệt là Phở.',
    topic: 'food',
    topic_vi: 'Ăn uống & Nấu nướng',
    difficulty: 'A2',
    audio_hint: "Từ 'especially' đọc là /ɪˈspeʃəli/.",
    set_id: 3,
    order_index: 3,
  },

  // Mua sắm (set_id = 4)
  {
    id: 13,
    text: 'Excuse me, how much does this cost?',
    translation: 'Xin lỗi cho tôi hỏi, món đồ này giá bao nhiêu?',
    topic: 'shopping',
    topic_vi: 'Mua sắm & Đi chợ',
    difficulty: 'A1',
    audio_hint: "Nối âm /dʌz ðɪs/ khi nói 'does this'.",
    set_id: 4,
    order_index: 1,
  },
  {
    id: 14,
    text: 'Can I pay with credit card or cash?',
    translation: 'Tôi có thể thanh toán bằng thẻ tín dụng hay tiền mặt?',
    topic: 'shopping',
    topic_vi: 'Mua sắm & Đi chợ',
    difficulty: 'A2',
    audio_hint: "Âm /ʃ/ trong 'cash' /kæʃ/ cần phát âm tròn môi.",
    set_id: 4,
    order_index: 2,
  },
  {
    id: 15,
    text: 'Do you have this shirt in a medium size?',
    translation: 'Bạn có chiếc áo sơ mi này cỡ vừa (size M) không?',
    topic: 'shopping',
    topic_vi: 'Mua sắm & Đi chợ',
    difficulty: 'A2',
    audio_hint: "Đọc liền 'in a' thành /ɪnə/.",
    set_id: 4,
    order_index: 3,
  },

  // Giao tiếp (set_id = 5)
  {
    id: 16,
    text: 'Nice to meet you! Where are you from?',
    translation: 'Rất vui được gặp bạn! Bạn đến từ đâu vậy?',
    topic: 'social',
    topic_vi: 'Giao tiếp xã giao',
    difficulty: 'A1',
    audio_hint: "Lên giọng hào hứng ở câu đầu và xuống giọng ở câu hỏi WH.",
    set_id: 5,
    order_index: 1,
  },
  {
    id: 17,
    text: "The weather is so nice and cool today, isn't it?",
    translation: 'Thời tiết hôm nay thật đẹp và mát mẻ, phải không?',
    topic: 'social',
    topic_vi: 'Giao tiếp xã giao',
    difficulty: 'A2',
    audio_hint: "Câu hỏi đuôi 'isn't it' lên giọng nhẹ /ɪznt ɪt/.",
    set_id: 5,
    order_index: 2,
  },
  {
    id: 18,
    text: 'What do you usually do in your free time?',
    translation: 'Bạn thường làm gì vào thời gian rảnh rỗi?',
    topic: 'social',
    topic_vi: 'Giao tiếp xã giao',
    difficulty: 'A2',
    audio_hint: "Trọng âm rơi vào 'usually' và 'free time'.",
    set_id: 5,
    order_index: 3,
  },

  // Du lịch (set_id = 6)
  {
    id: 19,
    text: 'Could you show me the way to the nearest bus station?',
    translation: 'Bạn có thể chỉ đường giúp tôi tới trạm xe buýt gần nhất không?',
    topic: 'travel',
    topic_vi: 'Du lịch & Đi lại',
    difficulty: 'A2',
    audio_hint: "Từ 'nearest' đọc là /ˈnɪərɪst/.",
    set_id: 6,
    order_index: 1,
  },
  {
    id: 20,
    text: 'I would like to book a flight ticket to Da Nang.',
    translation: 'Tôi muốn đặt một vé máy bay đi Đà Nẵng.',
    topic: 'travel',
    topic_vi: 'Du lịch & Đi lại',
    difficulty: 'A2',
    audio_hint: "Cụm 'would like to' đọc lướt tự nhiên /wəd laɪk tə/.",
    set_id: 6,
    order_index: 2,
  },
  {
    id: 21,
    text: 'Where can I find the baggage claim area?',
    translation: 'Tôi có thể tìm khu vực nhận hành lý ở đâu?',
    topic: 'travel',
    topic_vi: 'Du lịch & Đi lại',
    difficulty: 'B1',
    audio_hint: "Từ 'baggage' đọc là /ˈbæɡɪdʒ/.",
    set_id: 6,
    order_index: 3,
  },
];

// Lịch sử bài tập mẫu
interface StoredAttempt extends AttemptResult {
  sentence_id: number;
  user_id: number;
  attempt_number: number;
  created_at: string;
}

// Khởi tạo và đồng bộ LocalStorage
class StorageService {
  private users: User[] = [];
  private studySets: StudySet[] = [];
  private sentences: Sentence[] = [];
  private attempts: StoredAttempt[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // 1. Users
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) {
        this.users = JSON.parse(rawUsers);
      } else {
        this.users = DEFAULT_USERS;
        this.saveUsers();
      }

      // 2. Study Sets
      const rawSets = localStorage.getItem(STORAGE_KEYS.STUDY_SETS);
      if (rawSets) {
        this.studySets = JSON.parse(rawSets);
      } else {
        this.studySets = INITIAL_STUDY_SETS;
        this.saveStudySets();
      }

      // 3. Sentences
      const rawSentences = localStorage.getItem(STORAGE_KEYS.SENTENCES);
      if (rawSentences) {
        this.sentences = JSON.parse(rawSentences);
      } else {
        this.sentences = INITIAL_SENTENCES;
        this.saveSentences();
      }

      // 4. Attempts
      const rawAttempts = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (rawAttempts) {
        this.attempts = JSON.parse(rawAttempts);
      } else {
        this.attempts = [];
        this.saveAttempts();
      }
    } catch (e) {
      console.warn('Không thể nạp dữ liệu từ LocalStorage, dùng bộ nhớ mặc định:', e);
      this.users = DEFAULT_USERS;
      this.studySets = INITIAL_STUDY_SETS;
      this.sentences = INITIAL_SENTENCES;
      this.attempts = [];
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    } catch (e) {
      console.error('Lỗi lưu users:', e);
    }
  }

  private saveStudySets() {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDY_SETS, JSON.stringify(this.studySets));
    } catch (e) {
      console.error('Lỗi lưu studySets:', e);
    }
  }

  private saveSentences() {
    try {
      localStorage.setItem(STORAGE_KEYS.SENTENCES, JSON.stringify(this.sentences));
    } catch (e) {
      console.error('Lỗi lưu sentences:', e);
    }
  }

  private saveAttempts() {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(this.attempts));
    } catch (e) {
      console.error('Lỗi lưu attempts:', e);
    }
  }

  // --- USERS API ---
  getUsers(): User[] {
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.users.map((u) => {
      // Đếm số câu luyện hoàn thành hôm nay (điểm >= 70)
      const userTodayAttempts = this.attempts.filter(
        (a) =>
          a.user_id === u.id &&
          a.created_at.startsWith(todayStr) &&
          a.overall_score >= 70
      );
      // Đếm số câu độc nhất
      const uniqueSentenceIds = new Set(userTodayAttempts.map((a) => a.sentence_id));
      const totalPoints = this.attempts
        .filter((a) => a.user_id === u.id)
        .reduce((sum, a) => sum + Math.round(a.overall_score), 0);

      return {
        ...u,
        today_completed: uniqueSentenceIds.size,
        total_points: totalPoints,
      };
    });
  }

  createUser(name: string, role: string, avatar: string = '👤'): User {
    const newId = this.users.length > 0 ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id: newId,
      name,
      role,
      avatar,
      daily_goal: 5,
      today_completed: 0,
      total_points: 0,
      created_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  // --- STUDY SETS API ---
  getStudySets(userId?: number): StudySet[] {
    return this.studySets.map((s) => {
      const setSentences = this.sentences.filter((st) => st.set_id === s.id);
      const sentenceIds = setSentences.map((st) => st.id);

      // Đếm số câu user đã hoàn thành (>= 70 điểm)
      let completedCount = 0;
      if (userId && sentenceIds.length > 0) {
        const completedIds = new Set(
          this.attempts
            .filter(
              (a) =>
                a.user_id === userId &&
                sentenceIds.includes(a.sentence_id) &&
                a.overall_score >= 70
            )
            .map((a) => a.sentence_id)
        );
        completedCount = completedIds.size;
      }

      const completionRate =
        setSentences.length > 0
          ? Math.round((completedCount / setSentences.length) * 100)
          : 0;

      return {
        ...s,
        total_sentences: setSentences.length,
        practiced_sentences: completedCount,
        completion_rate: completionRate,
        avg_score: 0,
        best_score: null,
        sentence_count: setSentences.length,
        completed_count: completedCount,
        progress_percent: completionRate,
      };
    });
  }

  getStudySetDetail(setId: number, userId?: number): { set: StudySet; sentences: Sentence[] } | null {
    const targetSet = this.studySets.find((s) => s.id === setId);
    if (!targetSet) return null;

    const setSentences = this.getSentences(userId, setId);
    const completedCount = setSentences.filter((st) => (st.last_score || 0) >= 70).length;

    const decoratedSet: StudySet = {
      ...targetSet,
      sentence_count: setSentences.length,
      completed_count: completedCount,
      progress_percent:
        setSentences.length > 0
          ? Math.round((completedCount / setSentences.length) * 100)
          : 0,
    };

    return { set: decoratedSet, sentences: setSentences };
  }

  saveStudySet(
    title: string,
    description: string,
    icon: string = '📚',
    sentencesData: Array<{ text: string; translation?: string; audio_hint?: string; difficulty?: string }>,
    passageText?: string
  ): { set_id: number; topic_name: string; saved_count: number } {
    const newSetId =
      this.studySets.length > 0 ? Math.max(...this.studySets.map((s) => s.id)) + 1 : 1;

    const newSet: StudySet = {
      id: newSetId,
      title: title.trim(),
      description: description.trim() || `Chủ đề: ${title.trim()}`,
      category: 'custom',
      icon: icon || '📄',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      passage_text: passageText || sentencesData.map((s) => s.text).join(' '),
    };

    this.studySets.unshift(newSet);
    this.saveStudySets();

    let maxSentenceId =
      this.sentences.length > 0 ? Math.max(...this.sentences.map((s) => s.id)) : 0;

    const newSentences: Sentence[] = sentencesData.map((s, idx) => {
      maxSentenceId += 1;
      return {
        id: maxSentenceId,
        text: s.text.trim(),
        translation: s.translation || 'Nhấp nghe mẫu và luyện tập phát âm',
        topic: `custom_${newSetId}`,
        topic_vi: title.trim(),
        difficulty: s.difficulty || 'A2',
        audio_hint: s.audio_hint || 'Lắng nghe ngữ điệu và phát âm to rõ ràng.',
        set_id: newSetId,
        order_index: idx + 1,
      };
    });

    this.sentences.push(...newSentences);
    this.saveSentences();

    return {
      set_id: newSetId,
      topic_name: newSet.title,
      saved_count: newSentences.length,
    };
  }

  saveTopicSets(topics: TopicGroup[]): { success: boolean; created_sets: Array<{ set_id: number; topic_title: string; count: number }> } {
    const createdSets: Array<{ set_id: number; topic_title: string; count: number }> = [];

    for (const t of topics) {
      if (t.sentences && t.sentences.length > 0) {
        const res = this.saveStudySet(
          t.topic_title,
          `Chủ đề: ${t.topic_title}`,
          '📄',
          t.sentences,
          t.passage_text
        );
        createdSets.push({
          set_id: res.set_id,
          topic_title: res.topic_name,
          count: res.saved_count,
        });
      }
    }

    return { success: true, created_sets: createdSets };
  }

  deleteStudySet(setId: number) {
    this.studySets = this.studySets.filter((s) => s.id !== setId);
    this.saveStudySets();
    this.sentences = this.sentences.filter((st) => st.set_id !== setId);
    this.saveSentences();
  }

  // --- SENTENCES API ---
  getSentences(userId?: number, setId?: number): Sentence[] {
    let filtered = this.sentences;
    if (setId) {
      filtered = filtered.filter((s) => s.set_id === setId);
    }

    return filtered.map((s) => {
      if (!userId) return s;
      // Tìm bài tập gần nhất của user cho câu này
      const userAttempts = this.attempts
        .filter((a) => a.user_id === userId && a.sentence_id === s.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const latest = userAttempts[0];
      return {
        ...s,
        last_score: latest ? Math.round(latest.overall_score) : undefined,
        attempts_count: userAttempts.length,
      };
    });
  }

  // --- ATTEMPTS & EVALUATION API ---
  recordAttempt(
    userId: number,
    sentenceId: number,
    attemptResult: AttemptResult,
    attemptNumber: number = 1
  ): StoredAttempt {
    const stored: StoredAttempt = {
      ...attemptResult,
      user_id: userId,
      sentence_id: sentenceId,
      attempt_number: attemptNumber,
      created_at: new Date().toISOString(),
    };

    this.attempts.unshift(stored);
    this.saveAttempts();
    return stored;
  }

  // --- STATS API ---
  getUserStats(userId: number) {
    const userAttempts = this.attempts.filter((a) => a.user_id === userId);
    const todayStr = new Date().toISOString().slice(0, 10);

    const completedIds = new Set(
      userAttempts.filter((a) => a.overall_score >= 70).map((a) => a.sentence_id)
    );

    const todayCompletedIds = new Set(
      userAttempts
        .filter((a) => a.created_at.startsWith(todayStr) && a.overall_score >= 70)
        .map((a) => a.sentence_id)
    );

    const avgScore =
      userAttempts.length > 0
        ? Math.round(
          userAttempts.reduce((sum, a) => sum + a.overall_score, 0) / userAttempts.length
        )
        : 0;

    // Phân bổ điểm
    const excellent = userAttempts.filter((a) => a.overall_score >= 85).length;
    const good = userAttempts.filter((a) => a.overall_score >= 70 && a.overall_score < 85).length;
    const needPractice = userAttempts.filter((a) => a.overall_score < 70).length;

    return {
      total_sentences: this.sentences.length,
      completed_sentences: completedIds.size,
      today_completed: todayCompletedIds.size,
      total_attempts: userAttempts.length,
      avg_score: avgScore,
      score_distribution: {
        excellent,
        good,
        need_practice: needPractice,
      },
      recent_attempts: userAttempts.slice(0, 10),
    };
  }

  // --- BACKUP & RESTORE (JSON EXPORT/IMPORT) ---
  exportBackupJSON(): string {
    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      users: this.users,
      studySets: this.studySets,
      sentences: this.sentences,
      attempts: this.attempts,
    };
    return JSON.stringify(data, null, 2);
  }

  importBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.studySets && data.sentences) {
        if (data.users) this.users = data.users;
        this.studySets = data.studySets;
        this.sentences = data.sentences;
        if (data.attempts) this.attempts = data.attempts;

        this.saveUsers();
        this.saveStudySets();
        this.saveSentences();
        this.saveAttempts();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Lỗi khi khôi phục dữ liệu:', e);
      return false;
    }
  }

  resetToDefault() {
    this.users = DEFAULT_USERS;
    this.studySets = INITIAL_STUDY_SETS;
    this.sentences = INITIAL_SENTENCES;
    this.attempts = [];
    this.saveUsers();
    this.saveStudySets();
    this.saveSentences();
    this.saveAttempts();
  }
}

export const storageService = new StorageService();
