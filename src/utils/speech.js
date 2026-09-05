let currentAudio = null;
let audioQueue = [];
let isPlaying = false;
let controller = null;
let timeoutId = null;

/**
 * 停止当前播放的语音，并清空播放队列。
 */
// export function stopSpeech() {
//   if (currentAudio) {
//     currentAudio.pause();
//     currentAudio = null;
//   }
//   audioQueue = [];
//   isPlaying = false;
//   if (controller) {
//     controller.abort();
//     controller = null;
//   }
//   if (timeoutId) {
//     clearTimeout(timeoutId);
//     timeoutId = null;
//   }
// }

export function SpeechLocal(fileName, delay = 0) {
  return new Promise((resolve, reject) => {
    if (!fileName) {
      reject(new Error("No file name provided"));
      return;
    }

    const audioUrl = `/speechlocal/${fileName}`;

    // 如果有现有的等待，取消之前的 timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // 清除之前的音频
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    timeoutId = setTimeout(async () => {
      // 停止当前正在播放的语音
      audioQueue = [];
      isPlaying = false;
      if (controller) {
        controller.abort();
        controller = null;
      }

      // 添加新音频到队列并播放
      audioQueue.push(audioUrl);
      if (!isPlaying) {
        playNext();
      }

      function playNext() {
        if (audioQueue.length === 0) {
          isPlaying = false;
          return;
        }

        isPlaying = true;

        const nextAudioUrl = audioQueue.shift();
        const audio = new Audio();
        audio.src = nextAudioUrl;

        // 确保新的音频对象没有被中途替换
        audio.oncanplaythrough = () => {
          currentAudio = audio;
          currentAudio.play();
        };

        // 在音频播放结束时解析 Promise
        audio.onended = () => {
          resolve();
          playNext();
        };

        // 如果发生错误，拒绝 Promise
        audio.onerror = (error) => {
          reject(error);
          playNext();
        };
      }
    }, delay);
  });
}
