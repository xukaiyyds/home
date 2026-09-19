import { KeyboardOne, Close } from "@icon-park/vue-next";

/* ==================== 静态配置 ==================== */

// 弹窗标题
const HELP_TITLE = "本站快捷键";

// 快捷键数据（加一条只需加一行）
const SHORTCUTS = [
  { key: "Alt + H", desc: "回到主页面" },
  { key: "空格", desc: "播放/暂停音乐" },
  { key: "左/右方向键", desc: "上一曲/下一曲" },
  { key: "上/下方向键", desc: "增加/减少音量" },
  { key: "M", desc: "打开/关闭音乐播放器" },
  { key: "Alt + M", desc: "打开/关闭音乐列表" },
  { key: "Tab", desc: "打开/关闭时光胶囊" },
  { key: "Alt + D", desc: "切换浅色/深色主题" },
  { key: "Alt + S", desc: "打开/关闭全网搜索" },
  { key: "鼠标右键", desc: "打开/关闭全局设置" },
  { key: "鼠标中键", desc: "启用/退出壁纸预览" },
  { key: "鼠标滚轮", desc: "滑动网站/捷径列表" },
  { key: "右键捷径链接", desc: "编辑/删除捷径" },
  { key: "双击底栏歌词", desc: "启用/禁用进度图标常驻" },
];

// 行内样式
const ROW_BASE =
  "display:flex; justify-content:space-between; align-items:baseline; padding:4px 0;";
const ROW_DIVIDER = "border-bottom:1px dashed #e0e0e0;";
const KEY_STYLE = "text-align:left; white-space:nowrap; margin-right:20px;";
const DESC_STYLE = "text-align:left; white-space:nowrap; color:#CFD3DC;";

/* ==================== 内容生成 ==================== */

// 生成单行快捷键（最后一行不加分割线）
const buildRow = ({ key, desc }, isLast) =>
  `<div style="${ROW_BASE}${isLast ? "" : ROW_DIVIDER}">` +
  `<span style="${KEY_STYLE}">${key}</span>` +
  `<span style="${DESC_STYLE}">（${desc}）</span>` +
  `</div>`;

// 帮助弹窗内容（由数据驱动生成）
export const helpContent = SHORTCUTS.map((item, index) =>
  buildRow(item, index === SHORTCUTS.length - 1),
).join("");

/* ==================== 弹窗控制 ==================== */

// 弹窗是否已打开（单例）
let isHelpOpen = false;

// 弹窗配置
const ALERT_OPTIONS = {
  dangerouslyUseHTMLString: true,
  modal: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showConfirmButton: false,
  center: true,
  icon: markRaw(KeyboardOne),
  closeIcon: markRaw(Close),
};

export const toggleHelp = () => {
  // 已打开则关闭
  if (isHelpOpen) {
    closeHelp();
    return;
  }

  // 未打开则打开
  ElMessageBox.alert(helpContent, HELP_TITLE, ALERT_OPTIONS)
    .catch(() => {})
    .finally(() => {
      isHelpOpen = false;
    });
  isHelpOpen = true;
};

export const closeHelp = () => {
  if (!isHelpOpen) return;
  ElMessageBox.close();
  isHelpOpen = false;
};
