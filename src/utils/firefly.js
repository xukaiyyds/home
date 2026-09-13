/* ==================== 静态配置 ==================== */

// 萤火虫数量
const FIREFLY_COUNT = 25;

// 速度范围（正负对称）
const MAX_SPEED = 0.75;

// 半径范围
const RADIUS_MIN = 1;
const RADIUS_MAX = 3;

// 目标帧率：30fps
const FRAME_INTERVAL = 1000 / 30;

// 绘制颜色
const FIREFLY_COLOR = "rgba(255, 255, 0, 0.8)";

/* ==================== 工具函数 ==================== */

const random = (min, max) => min + Math.random() * (max - min);

/* ==================== 主初始化 ==================== */

const initFirefly = () => {
  /* ---- 创建画布 ---- */
  const canvas = document.createElement("canvas");
  canvas.id = "fireflyCanvas";
  canvas.style.willChange = "transform";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  /* ---- 运行时状态 ---- */
  let fireflies = [];
  let animationFrameId = null;
  let lastFrameTime = 0;

  /* ---- 尺寸自适应 ---- */
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  /* ---- 创建萤火虫 ---- */
  const createFireflies = () => {
    fireflies = Array.from({ length: FIREFLY_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speedX: random(-MAX_SPEED, MAX_SPEED),
      speedY: random(-MAX_SPEED, MAX_SPEED),
      radius: random(RADIUS_MIN, RADIUS_MAX),
    }));
  };

  /* ---- 移动：碰到边界反向 ---- */
  const moveFireflies = () => {
    for (const f of fireflies) {
      f.x += f.speedX;
      f.y += f.speedY;
      if (f.x > canvas.width || f.x < 0) f.speedX *= -1;
      if (f.y > canvas.height || f.y < 0) f.speedY *= -1;
    }
  };

  /* ---- 绘制：清屏 + 画所有萤火虫 ---- */
  const drawFireflies = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = FIREFLY_COLOR;
    ctx.beginPath();
    for (const f of fireflies) {
      ctx.moveTo(f.x, f.y);
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2, true);
    }
    ctx.fill();
  };

  /* ---- 每帧更新 ---- */
  const update = () => {
    moveFireflies();
    drawFireflies();
  };

  /* ---- 动画循环（rAF + 时间戳节流，实现 30fps） ---- */
  // 后台标签页时 rAF 会自动暂停，比 setInterval 更省资源
  const loop = (timestamp) => {
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
      lastFrameTime = timestamp;
      update();
    }
    animationFrameId = requestAnimationFrame(loop);
  };

  /* ---- 初始化 ---- */
  resizeCanvas();
  createFireflies();
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
    fireflies = [];
  };
};

export default initFirefly;
