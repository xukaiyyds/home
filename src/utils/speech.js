/* ==================== 静态配置 ==================== */

// 语音文件目录
const SPEECH_BASE_PATH = "/speechlocal";

/* ==================== 模块级状态 ==================== */

let currentAudio = null; // 当前播放的音频对象
let currentResolve = null; // 当前音频播放结束时 resolve 的 Promise
let timeoutId = null; // 延迟播放的定时器

/* ==================== 停止播放 ==================== */

/**
 * 停止当前播放的语音，清空待播放状态。
 */
export function stopSpeech() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  // 上一个 Promise 无人 resolve，显式结束它，避免调用方悬挂
  if (currentResolve) {
    currentResolve();
    currentResolve = null;
  }
}

/* ==================== 播放语音 ==================== */

/**
 * 播放本地语音文件（可延迟）。
 * 如果上一次调用尚未播放完，会先停止它。
 *
 * @param {string} fileName - 语音文件名（如 "欢迎1.mp3"）
 * @param {number} [delay=0] - 延迟毫秒数
 * @returns {Promise<void>} - 音频播放结束时 resolve
 */
export function SpeechLocal(fileName, delay = 0) {
  return new Promise((resolve, reject) => {
    if (!fileName) {
      reject(new Error("No file name provided"));
      return;
    }

    // 先停止上一次的播放与延迟
    stopSpeech();

    // 记录本次的 resolve，供 stopSpeech 或播放结束时调用
    currentResolve = resolve;

    timeoutId = setTimeout(() => {
      timeoutId = null;

      const audio = new Audio(`${SPEECH_BASE_PATH}/${fileName}`);
      currentAudio = audio;

      audio.oncanplaythrough = () => {
        audio.play().catch(reject);
      };

      audio.onended = () => {
        currentAudio = null;
        currentResolve = null;
        resolve();
      };

      audio.onerror = (error) => {
        currentAudio = null;
        currentResolve = null;
        reject(error);
      };
    }, delay);
  });
}
