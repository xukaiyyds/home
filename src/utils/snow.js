/* ==================== 静态配置 ==================== */

// 雪花数量
const SNOWFLAKE_COUNT = 50;

// 横向速度范围（正负对称）
const MAX_SPEED_X = 0.75;

// 纵向速度范围（只向下飘）
const MIN_SPEED_Y = 0.5;
const MAX_SPEED_Y = 2.0;

// 半径范围
const RADIUS_MIN = 1;
const RADIUS_MAX = 3.5;

// 目标帧率：30fps
const FRAME_INTERVAL = 1000 / 30;

// 绘制颜色
const SNOWFLAKE_COLOR = "rgba(255, 255, 255, 0.4)";

/* ==================== 工具函数 ==================== */

const random = (min, max) => min + Math.random() * (max - min);

/* ==================== 主初始化 ==================== */

const initSnowfall = () => {
  /* ---- 创建画布 ---- */
  const canvas = document.createElement("canvas");
  canvas.id = "snowfallCanvas";
  canvas.style.willChange = "transform";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  /* ---- 运行时状态 ---- */
  let snowflakes = [];
  let animationFrameId = null;
  let lastFrameTime = 0;

  /* ---- 尺寸自适应 ---- */
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  /* ---- 创建雪花 ---- */
  const createSnowflakes = () => {
    snowflakes = Array.from({ length: SNOWFLAKE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speedX: random(-MAX_SPEED_X, MAX_SPEED_X),
      speedY: random(MIN_SPEED_Y, MAX_SPEED_Y),
      radius: random(RADIUS_MIN, RADIUS_MAX),
    }));
  };

  /* ---- 移动：落到画布底部后从顶部重生 ---- */
  const moveSnowflakes = () => {
    for (const s of snowflakes) {
      s.x += s.speedX;
      s.y += s.speedY;
      if (s.y > canvas.height) {
        s.x = Math.random() * canvas.width;
        s.y = 0;
      }
    }
  };

  /* ---- 绘制：清屏 + 画所有雪花 ---- */
  const drawSnowflakes = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = SNOWFLAKE_COLOR;
    ctx.beginPath();
    for (const s of snowflakes) {
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2, true);
    }
    ctx.fill();
  };

  /* ---- 每帧更新 ---- */
  const update = () => {
    moveSnowflakes();
    drawSnowflakes();
  };

  /* ---- 动画循环（rAF + 时间戳节流，实现 30fps） ---- */
  const loop = (timestamp) => {
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
      lastFrameTime = timestamp;
      update();
    }
    animationFrameId = requestAnimationFrame(loop);
  };

  /* ---- 初始化 ---- */
  resizeCanvas();
  createSnowflakes();
  window.addEventListener("resize", resizeCanvas);
  animationFrameId = requestAnimationFrame(loop);

  /* ---- 清理函数 ---- */
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener("resize", resizeCanvas);
    canvas.remove();
    snowflakes = [];
  };
};

export default initSnowfall;
