import type { AttemptResult, WordResult } from '../types';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s']/g, ''); // Giữ chữ cái, số, dấu nháy đơn (I'm, don't)
}

export function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^\w']/g, '');
}

/**
 * Tính tỉ lệ tương đồng giữa 2 từ (0.0 đến 1.0) dựa trên khoảng cách Levenshtein
 */
export function calculateSimilarity(w1: string, w2: string): number {
  const s1 = cleanWord(w1);
  const s2 = cleanWord(w2);
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const dp: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Xóa
        dp[i][j - 1] + 1, // Chèn
        dp[i - 1][j - 1] + cost // Thay thế
      );
    }
  }

  const distance = dp[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, 1.0 - distance / maxLen);
}

/**
 * Đánh giá bài nói của người học (Client-side Speech Evaluation):
 * - So khớp từng từ giữa câu đích (targetSentence) và văn bản nhận diện từ micro (transcript).
 * - Phân loại 4 trạng thái: correct, warning, error, missing.
 * - Tính toán 4 chỉ số: overall_score, accuracy_score, completeness_score, fluency_score.
 * - Sinh lời khuyên tiếng Việt thiết thực cho người học.
 */
export function evaluateSpeech(
  targetSentence: string,
  transcript: string,
  audioDuration: number = 0.0
): AttemptResult {
  const rawTargetWords = targetSentence.trim().split(/\s+/).filter(Boolean);
  const normTargetWords = rawTargetWords.map((w) => cleanWord(w));

  const normTranscript = normalizeText(transcript);
  const recWords = normTranscript ? normTranscript.split(/\s+/).filter(Boolean) : [];

  const wordResults: WordResult[] = [];
  const matchedScores: number[] = [];
  const problematicWords: string[] = [];

  // Duyệt qua từng từ của câu mẫu và tìm từ tương đồng nhất trong vùng lân cận
  const windowSize = 3;
  for (let i = 0; i < rawTargetWords.length; i++) {
    const origW = rawTargetWords[i];
    const targetW = normTargetWords[i];
    let bestSim = 0.0;
    let bestRecW = '';

    const startIdx = Math.max(0, i - windowSize);
    const endIdx = Math.min(recWords.length, i + windowSize + 1);

    for (let j = startIdx; j < endIdx; j++) {
      const sim = calculateSimilarity(targetW, recWords[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestRecW = recWords[j];
      }
    }

    let status: 'correct' | 'warning' | 'error' | 'missing' = 'missing';
    let score = 0;
    let feedback = 'Bạn dường như đã bỏ sót từ này hoặc phát âm quá nhỏ.';

    if (bestSim >= 0.88) {
      status = 'correct';
      score = 100;
      feedback = 'Phát âm rất chuẩn! ✓';
    } else if (bestSim >= 0.65) {
      status = 'warning';
      score = Math.round(bestSim * 100);
      feedback = `Nghe gần giống '${bestRecW}'. Hãy nghe mẫu và phát âm rõ hơn nhé!`;
      problematicWords.push(origW);
    } else if (bestSim > 0.35) {
      status = 'error';
      score = Math.round(bestSim * 70);
      feedback = `AI nghe ra '${bestRecW}'. Cần luyện lại từ này.`;
      problematicWords.push(origW);
    } else {
      status = 'missing';
      score = 0;
      feedback = 'Bạn dường như đã bỏ sót từ này hoặc phát âm quá nhỏ.';
      problematicWords.push(origW);
    }

    wordResults.push({
      target_word: origW,
      spoken_word: bestRecW || undefined,
      status,
      score,
      feedback,
    });
    matchedScores.push(score);
  }

  // 1. Điểm Accuracy: Trung bình điểm các từ
  const accuracyScore =
    matchedScores.length > 0
      ? Math.round(matchedScores.reduce((sum, s) => sum + s, 0) / matchedScores.length)
      : 0;

  // 2. Điểm Completeness: Tỉ lệ từ được nói (correct + warning)
  const spokenCount = wordResults.filter((w) => w.status === 'correct' || w.status === 'warning').length;
  const completenessScore =
    wordResults.length > 0 ? Math.round((spokenCount / wordResults.length) * 100) : 0;

  // 3. Điểm Fluency (Độ lưu loát)
  let fluencyScore = 75;
  if (audioDuration > 0) {
    const expectedWps = 2.0; // Tốc độ nói tự nhiên ~2 từ/giây
    const idealDuration = rawTargetWords.length / expectedWps;
    const ratio = audioDuration / Math.max(idealDuration, 0.5);

    if (ratio >= 0.6 && ratio <= 1.6) {
      fluencyScore = 90;
    } else if (ratio >= 0.4 && ratio <= 2.2) {
      fluencyScore = 75;
    } else {
      fluencyScore = 60;
    }
  } else {
    fluencyScore = Math.round(accuracyScore * 0.4 + completenessScore * 0.6);
  }

  // 4. Overall Score (Tổng điểm)
  // Tỉ trọng: Độ chính xác 50%, Độ trọn vẹn 30%, Độ lưu loát 20%
  let overallScore = Math.round(accuracyScore * 0.5 + completenessScore * 0.3 + fluencyScore * 0.2);
  overallScore = Math.max(0, Math.min(100, overallScore));

  // Lời khuyên tổng kết
  let feedbackSummary = '';
  if (!normTranscript || recWords.length === 0) {
    feedbackSummary =
      'Chưa nhận thấy âm thanh từ micro (hoặc âm lượng quá nhỏ). Hãy kiểm tra micro và nói to, rõ ràng hơn nhé!';
  } else if (overallScore >= 85) {
    feedbackSummary =
      'Xuất sắc! Bạn phát âm rất chuẩn xác và tự nhiên. Hãy tự tin chuyển sang câu tiếp theo!';
  } else if (overallScore >= 70) {
    if (problematicWords.length > 0) {
      const wordsStr = problematicWords.slice(0, 3).map((w) => `'${w}'`).join(', ');
      feedbackSummary = `Rất tốt! Bạn nói khá trôi chảy. Hãy bấm nghe lại các từ ${wordsStr} rồi bấm 'Thử lại' nhé!`;
    } else {
      feedbackSummary = 'Khá tốt! Bạn đã phát âm đủ câu, chỉ cần giữ nhịp điệu tự tin hơn một chút.';
    }
  } else if (overallScore >= 50) {
    const wordsStr =
      problematicWords.length > 0
        ? problematicWords.slice(0, 3).map((w) => `'${w}'`).join(', ')
        : 'một số từ';
    feedbackSummary = `Cố gắng lên! Bạn hãy bấm nghe lại giọng mẫu, tập trung vào ${wordsStr} rồi đọc lại nhé!`;
  } else {
    feedbackSummary =
      'Chưa chuẩn lắm. Hãy bấm nút "🎧 Nghe giọng mẫu" để nghe kỹ từng âm rồi bấm thu âm lại nhé!';
  }

  return {
    overall_score: overallScore,
    accuracy_score: accuracyScore,
    completeness_score: completenessScore,
    fluency_score: fluencyScore,
    spoken_text: transcript.trim(),
    feedback_summary: feedbackSummary,
    word_results: wordResults,
  };
}
