import type { TopicGroup, ExtractedSentence } from '../types';

/**
 * Tách một khối văn bản thành các câu tiếng Anh hoàn chỉnh
 */
export function extractSentencesFromText(text: string): ExtractedSentence[] {
  // Thay thế xuống dòng thừa
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Tách theo dấu kết thúc câu (. ! ? hoặc xuống dòng)
  const rawChunks = clean.split(/(?<=[.!?])\s+|\n+/);
  const sentences: ExtractedSentence[] = [];

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    // Bỏ qua dòng trống, dòng quá ngắn (<3 từ) hoặc dòng tiêu đề có dấu #
    if (!trimmed || trimmed.startsWith('#')) continue;
    const words = trimmed.split(/\s+/);
    if (words.length < 3) continue;

    // Xác định độ khó cơ bản dựa vào độ dài từ
    let difficulty: 'A1' | 'A2' | 'B1' | 'B2' = 'A2';
    if (words.length <= 6) {
      difficulty = 'A1';
    } else if (words.length <= 12) {
      difficulty = 'A2';
    } else if (words.length <= 18) {
      difficulty = 'B1';
    } else {
      difficulty = 'B2';
    }

    sentences.push({
      text: trimmed,
      translation: 'Nhấp để nghe mẫu và luyện tập phát âm',
      audio_hint: 'Lắng nghe ngữ điệu và phát âm to rõ ràng từng từ.',
      difficulty,
    });
  }

  return sentences;
}

/**
 * Phân tích và tự động chia nhỏ văn bản thành các Chủ đề (Topic)
 * - Nhận diện tiêu đề Markdown (# Topic, ## ...)
 * - Nhận diện từ khóa chủ đề (Topic 1:, Unit 1:, Chủ đề:, Bài 1:, Part 1:)
 * - Hỗ trợ file CSV/Excel
 */
export function detectAndSplitTopics(
  text: string,
  filename: string = 'Tài liệu mới'
): TopicGroup[] {
  const lines = text.split(/\r?\n/);
  const detectedTopics: Array<{ title: string; lines: string[] }> = [];

  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const headingPattern = /^#{1,4}\s+(.+)$/;
  const topicKeywordPattern = /^(Topic|Unit|Chủ đề|Lesson|Bài|Part|Chapter)\s+([0-9A-Za-z]+)?\s*[:\-–]\s*(.+)$/i;
  const simpleTopicPattern = /^(Topic|Unit|Chủ đề|Lesson|Bài|Part|Chapter)\s+([0-9A-Za-z]+)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentLines.length > 0) currentLines.push('');
      continue;
    }

    let isHeader = false;
    let newTitle = '';

    const headMatch = trimmed.match(headingPattern);
    if (headMatch) {
      isHeader = true;
      newTitle = headMatch[1].trim();
    } else {
      const kwMatch = trimmed.match(topicKeywordPattern);
      if (kwMatch) {
        isHeader = true;
        newTitle = trimmed;
      } else {
        const simpleMatch = trimmed.match(simpleTopicPattern);
        if (simpleMatch && trimmed.length < 60) {
          isHeader = true;
          newTitle = trimmed;
        }
      }
    }

    if (isHeader) {
      if (currentTitle && currentLines.length > 0) {
        detectedTopics.push({
          title: currentTitle,
          lines: [...currentLines],
        });
      }
      currentTitle = newTitle;
      currentLines = [];
    } else {
      currentLines.push(trimmed);
    }
  }

  if (currentTitle && currentLines.length > 0) {
    detectedTopics.push({
      title: currentTitle,
      lines: [...currentLines],
    });
  }

  const resultTopics: TopicGroup[] = [];

  // Nếu tìm thấy từ 2 topic trở lên
  if (detectedTopics.length >= 2) {
    for (const dt of detectedTopics) {
      const topicText = dt.lines.join(' ').trim();
      const sentences = extractSentencesFromText(topicText);
      if (sentences.length > 0) {
        resultTopics.push({
          topic_title: dt.title,
          passage_text: topicText,
          sentences,
        });
      }
    }
  }

  // Nếu không nhận diện được nhiều topic riêng biệt -> Coi toàn bộ là 1 Topic/Bộ câu
  if (resultTopics.length === 0) {
    const allText = lines.join(' ').trim();
    const sentences = extractSentencesFromText(allText);

    let baseName = filename.replace(/\.[^/.]+$/, '').trim();
    baseName = baseName.replace(/_/g, ' ').replace(/-/g, ' ');
    if (!baseName || baseName.toLowerCase().includes('document') || baseName.toLowerCase().includes('upload')) {
      baseName = sentences.length > 0 ? `Chủ đề: ${sentences[0].text.slice(0, 30)}...` : 'Bộ câu mới';
    }

    resultTopics.push({
      topic_title: baseName,
      passage_text: allText,
      sentences,
    });
  }

  return resultTopics;
}
