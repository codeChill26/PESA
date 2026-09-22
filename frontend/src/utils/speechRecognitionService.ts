// Khai báo kiểu cho Web Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class ClientSpeechRecorder {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private transcript: string = '';
  private isRecording: boolean = false;
  private startTime: number = 0;
  private duration: number = 0;

  constructor() {
    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  isSupported(): boolean {
    return !!this.recognition && !!navigator.mediaDevices?.getUserMedia;
  }

  async startRecording(
    onInterimTranscript?: (text: string) => void,
    onVolumeChange?: (volume: number) => void
  ): Promise<boolean> {
    try {
      this.transcript = '';
      this.audioChunks = [];
      this.startTime = Date.now();
      this.isRecording = true;

      // 1. Khởi động Micro qua MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;

      // Visualizer volume nếu có callback
      if (onVolumeChange) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!this.isRecording) {
              audioCtx.close().catch(() => {});
              return;
            }
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const vol = Math.min(100, Math.round((avg / 128) * 100));
            onVolumeChange(vol);
            requestAnimationFrame(checkVolume);
          };
          requestAnimationFrame(checkVolume);
        } catch (e) {
          console.warn('Không thể khởi tạo AudioContext visualizer:', e);
        }
      }

      // MediaRecorder cho phép nghe lại giọng mình
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(100);

      // 2. Khởi động SpeechRecognition (Nhận diện giọng nói thành văn bản tiếng Anh)
      if (this.recognition) {
        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          this.transcript = currentTranscript.trim();
          if (onInterimTranscript) {
            onInterimTranscript(this.transcript);
          }
        };

        this.recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
          console.warn('SpeechRecognition warning:', e.error);
        };

        try {
          this.recognition.start();
        } catch (e) {
          // Bỏ qua lỗi nếu đã start
        }
      }

      // Rung nhẹ phản hồi (Haptic feedback) trên điện thoại
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }

      return true;
    } catch (err) {
      console.error('Lỗi khi mở Micro:', err);
      this.isRecording = false;
      return false;
    }
  }

  async stopRecording(): Promise<{
    transcript: string;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
  }> {
    this.isRecording = false;
    this.duration = Math.max(0.5, (Date.now() - this.startTime) / 1000);

    // Dừng nhận diện giọng nói
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    // Dừng MediaRecorder và thu thập Blob
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
        resolve({
          transcript: this.transcript,
          duration: this.duration,
          audioBlob: null,
          audioUrl: null,
        });
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Tắt micro
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Rung nhẹ khi dừng
        if (navigator.vibrate) {
          navigator.vibrate([30, 30, 30]);
        }

        resolve({
          transcript: this.transcript,
          duration: this.duration,
          audioBlob,
          audioUrl,
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        resolve({
          transcript: this.transcript,
          duration: this.duration,
          audioBlob: null,
          audioUrl: null,
        });
      }
    });
  }
}

export const speechRecorder = new ClientSpeechRecorder();
