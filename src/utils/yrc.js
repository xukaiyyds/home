/**
 * 解析 YRC 逐字歌词
 * @param {string} yrcText - 原始 YRC 文本
 * @returns {Array} - [{ start, duration, words: [{ start, duration, text }] }]
 */
export const parseYRC = (yrcText) => {
  if (!yrcText || typeof yrcText !== "string") return [];

  const lines = [];
  const lineReg = /^\[(\d+),(\d+)\](.*)$/;
  const wordReg = /\((\d+),(\d+),\d+\)([^(]*)/g;

  yrcText.split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line || line.startsWith("{")) return; // 跳过 JSON 元数据行

    const m = line.match(lineReg);
    if (!m) return;

    const lineStart = parseInt(m[1]);
    const lineDuration = parseInt(m[2]);
    const content = m[3];

    const words = [];
    let wm;
    wordReg.lastIndex = 0;
    while ((wm = wordReg.exec(content)) !== null) {
      const text = wm[3];
      if (!text || !text.trim()) continue;
      words.push({
        start: parseInt(wm[1]),
        duration: parseInt(wm[2]),
        // 英文单词尾随空格换成两个不换行空格，视觉上加宽
        text:
          /[a-zA-Z]/.test(text) && text.endsWith(" ") ? text.slice(0, -1) + "\u00a0\u00a0" : text,
      });
    }

    if (words.length) {
      lines.push({ start: lineStart, duration: lineDuration, words });
    }
  });

  return lines.sort((a, b) => a.start - b.start);
};

export const findYrcLineIndex = (lines, timeMs) => {
  let result = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].start <= timeMs) result = i;
    else break;
  }
  return result;
};

export const findYrcWordIndex = (words, timeMs) => {
  for (let i = 0; i < words.length; i++) {
    if (timeMs >= words[i].start && timeMs < words[i].start + words[i].duration) {
      return i;
    }
  }
  let result = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].start <= timeMs) result = i;
    else break;
  }
  return result;
};
