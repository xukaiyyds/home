import { mainStore } from "@/store";

/* ==================== 静态配置 ==================== */

// 气泡数量 = min(画布宽 × 系数, 上限)
const BUBBLE_COUNT_FACTOR = 0.04;
const BUBBLE_MAX_COUNT = 60;

// 气泡属性的随机取值范围
const ALPHA_MIN = 0.1;
const ALPHA_MAX = 0.6;
const ALPHA_CHANGE_MIN = 0.0002;
const ALPHA_CHANGE_MAX = 0.0007;
const SCALE_MIN = 0.2;
const SCALE_MAX = 1.0;
const SCALE_CHANGE_MAX = 0.002;
const SPEED_MIN = 0.1;
const SPEED_MAX = 0.5;

// 绘制参数
const RADIUS_FACTOR = 10; // 半径 = scale × 该系数
const RESPAWN_Y_OFFSET = 100; // 重生时在画布下方的随机偏移

/* ==================== 模块级状态 ==================== */

// 单例 canvas 实例（页面同时间只允许一个气泡特效）
let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let bubbles = [];
let animationFrameId = null;

/* ==================== 工具函数 ==================== */

// 区间随机数
const rand = (min, max) => min + Math.random() * (max - min);

/* ==================== 气泡 ==================== */

class Bubble {
  constructor() {
    this.reset();
  }

  // 重置为随机初始状态（初始化与重生共用）
  reset() {
    this.x = Math.random() * width;
    this.y = height + Math.random() * RESPAWN_Y_OFFSET;
    this.alpha = rand(ALPHA_MIN, ALPHA_MAX);
    this.alphaChange = rand(ALPHA_CHANGE_MIN, ALPHA_CHANGE_MAX);
    this.scale = rand(SCALE_MIN, SCALE_MAX);
    this.scaleChange = Math.random() * SCALE_CHANGE_MAX;
    this.speed = rand(SPEED_MIN, SPEED_MAX);
  }

  draw() {
    // 完全透明后重生
    if (this.alpha <= 0) this.reset();

    // 向上飘 + 淡出 + 放大
    this.y -= this.speed;
    this.alpha -= this.alphaChange;
    this.scale += this.scaleChange;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.scale * RADIUS_FACTOR, 0, 2 * Math.PI, false);
    ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
    ctx.fill();
  }
}

/* ==================== 画布与动画 ==================== */

// 响应窗口尺寸变化
const resize = () => {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
};

// 生成气泡集合
const createBubbles = () => {
  const count = Math.min(Math.floor(width * BUBBLE_COUNT_FACTOR), BUBBLE_MAX_COUNT);
  bubbles = Array.from({ length: count }, () => new Bubble());
};

// 每帧清屏 + 绘制所有气泡
const animate = () => {
  // ctx 为 null 表示特效已被关闭，停止循环
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  for (const bubble of bubbles) bubble.draw();
  animationFrameId = requestAnimationFrame(animate);
};

/* ==================== 生命周期 ==================== */

const closeBubble = () => {
  // 停止动画
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // 移除画布
  if (canvas) {
    canvas.remove();
    canvas = null;
    ctx = null;
  }

  bubbles = [];
  window.removeEventListener("resize", resize);
  mainStore().bubble = false;
};

const initBubble = () => {
  // 如果已有实例，先关闭再重建
  if (canvas || animationFrameId) closeBubble();

  // 创建画布
  canvas = document.createElement("canvas");
  canvas.id = "bubblesCanvas";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  // 初始化并启动
  resize();
  createBubbles();
  animate();
  window.addEventListener("resize", resize);

  mainStore().bubble = true;

  // 返回清理函数，便于调用方手动关闭
  return closeBubble;
};

export default initBubble;
export { closeBubble };
