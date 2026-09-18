/* ==================== 静态配置 ==================== */

// 樱花数量
const SAKURA_COUNT = 25;

// 樱花图片路径（把樱花 PNG 图片放到 public/images/icon/sakura.png）
const SAKURA_IMAGE = "/images/icon/sakura.png";

// 目标帧率：30fps
const FRAME_INTERVAL = 1000 / 30;

// 花瓣基础尺寸（实际大小 = BASE_SIZE × 缩放系数）
const BASE_SIZE = 40;

/* ==================== 工具函数 ==================== */

// 区间随机数
const random = (min, max) => min + Math.random() * (max - min);

// 横向速度函数：随机漂移 + 基础左移
const makeXFn = () => {
  const drift = random(-0.5, 0.5);
  return (x) => x + drift - 1.7;
};

// 纵向速度函数：向下匀速
const makeYFn = () => {
  const speed = random(1.5, 2.2);
  return (y) => y + speed;
};

// 旋转速度函数：缓慢转动
const makeRFn = () => {
  const speed = Math.random() * 0.03;
  return (r) => r + speed;
};

// 出界后重生
const respawn = (p, canvasW, canvasH) => {
  if (Math.random() > 0.4) {
    p.x = Math.random() * canvasW;
    p.y = 0;
  } else {
    p.x = canvasW;
    p.y = Math.random() * canvasH;
  }
  p.s = Math.random();
  p.r = Math.random() * 6;
};

/* ==================== 主初始化 ==================== */

const initSakura = () => {
  // 1. 创建画布
  const canvas = document.createElement("canvas");
  canvas.id = "sakuraCanvas";
  canvas.style.willChange = "transform";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 2. 运行时状态
  let width = 0;
  let height = 0;
  let sakuras = [];
  let animationFrameId = null;
  let lastFrameTime = 0;
  let imageLoaded = false;

  // 3. 加载樱花图片
  const img = new Image();
  img.src = SAKURA_IMAGE;

  // 4. 尺寸自适应
  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };

  // 5. 创建樱花
  const createSakuras = () => {
    sakuras = Array.from({ length: SAKURA_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      s: Math.random(),
      r: Math.random() * 6,
      xFn: makeXFn(),
      yFn: makeYFn(),
      rFn: makeRFn(),
    }));
  };

  // 6. 移动
  const moveSakuras = () => {
    for (const p of sakuras) {
      p.x = p.xFn(p.x);
      p.y = p.yFn(p.y);
      p.r = p.rFn(p.r);
      // 出界 → 重生
      if (p.x > width || p.x < 0 || p.y > height || p.y < 0) {
        respawn(p, width, height);
      }
    }
  };

  // 7. 绘制
  const drawSakuras = () => {
    if (!imageLoaded) return;
    ctx.clearRect(0, 0, width, height);
    for (const p of sakuras) {
      const size = BASE_SIZE * p.s;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  };

  // 8. 每帧更新
  const update = () => {
    moveSakuras();
    drawSakuras();
  };

  // 9. 动画循环（rAF + 时间戳节流）
  const loop = (timestamp) => {
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
      lastFrameTime = timestamp;
      update();
    }
    animationFrameId = requestAnimationFrame(loop);
  };

  // 10. 图片加载完成后启动
  img.onload = () => {
    imageLoaded = true;
    resizeCanvas();
    createSakuras();
    window.addEventListener("resize", resizeCanvas);
    animationFrameId = requestAnimationFrame(loop);
  };

  // 11. 清理函数
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    img.onload = null;
    window.removeEventListener("resize", resizeCanvas);
    canvas.remove();
    sakuras = [];
  };
};

export default initSakura;
