/* ==================== 静态配置 ==================== */

// 基础速度
const BASE_SPEED = 0.05;

// 粒子类型概率（千分比，即 m(3) 表示 3‰）
const GIANT_PROBABILITY = 3;
const COMET_PROBABILITY = 10;

// 粒子数量 = 画布宽 × 系数
const PARTICLE_COUNT_FACTOR = 0.216;

// 粒子随机属性范围
const RADIUS_MIN = 1.1;
const RADIUS_MAX = 2.6;

// 速度倍率范围（用于彗星的长尾速度）
const COMET_SPEED_MIN = 50;
const COMET_SPEED_MAX = 120;

// 透明度与淡入速度
const OPACITY_THRESHOLD_MIN = 0.2;
const OPACITY_THRESHOLD_MAX = 0.6;
const OPACITY_SPEED_MIN = 5e-4;
const OPACITY_SPEED_MAX = 0.002;
const OPACITY_COMET_BONUS = 0.001;

// 彗星尾巴长度
const COMET_TAIL_LENGTH = 30;
const COMET_TAIL_SAMPLE = 20;
const COMET_TAIL_DIVISOR = 4;

// 粒子颜色（RGB 字符串）
const COLOR_STAR = "180,184,240"; // 大星星
const COLOR_COMET = "226,225,224"; // 彗星
const COLOR_SQUARE = "226,225,142"; // 方块

// 彗星停止生成的时间窗口（毫秒）
const COMET_GENERATION_WINDOW = 50;

/* ==================== 工具函数 ==================== */

// 区间随机数
const random = (min, max) => Math.random() * (max - min) + min;

// 概率判断：返回 true 的概率约为 (probability / 1000)
const hitChance = (probability) => Math.floor(1000 * Math.random()) + 1 < 10 * probability;

/* ==================== 粒子类 ==================== */

class Particle {
  constructor(width, height, allowComet) {
    this.width = width;
    this.height = height;
    this.allowComet = allowComet;
    this.reset();
  }

  // 重置为随机初始状态（初始化与重生共用）
  reset() {
    this.giant = hitChance(GIANT_PROBABILITY);
    this.comet = !this.giant && this.allowComet && hitChance(COMET_PROBABILITY);

    this.x = random(0, this.width - 10);
    this.y = random(0, this.height);
    this.r = random(RADIUS_MIN, RADIUS_MAX);

    // 基础速度 + 彗星额外的速度加成
    const cometBoost = this.comet ? 1 : 0;
    this.dx =
      random(BASE_SPEED, 6 * BASE_SPEED) +
      cometBoost * BASE_SPEED * random(COMET_SPEED_MIN, COMET_SPEED_MAX) +
      2 * BASE_SPEED;
    this.dy =
      -random(BASE_SPEED, 6 * BASE_SPEED) -
      cometBoost * BASE_SPEED * random(COMET_SPEED_MIN, COMET_SPEED_MAX);

    this.fadingOut = null;
    this.fadingIn = true;
    this.opacity = 0;
    this.opacityThreshold = random(OPACITY_THRESHOLD_MIN, OPACITY_THRESHOLD_MAX - 0.4 * cometBoost);
    this.opacitySpeed =
      random(OPACITY_SPEED_MIN, OPACITY_SPEED_MAX) + OPACITY_COMET_BONUS * cometBoost;
  }

  // 淡入：透明度上升到阈值
  fadeIn() {
    if (!this.fadingIn) return;
    this.fadingIn = this.opacity <= this.opacityThreshold;
    this.opacity += this.opacitySpeed;
  }

  // 淡出：透明度下降到 0；出界后重置
  fadeOut() {
    if (!this.fadingOut) return;
    this.fadingOut = this.opacity >= 0;
    this.opacity -= this.opacitySpeed / 2;

    // 移出画布后重生
    if (this.x > this.width || this.y < 0) {
      this.fadingOut = false;
      this.reset();
    }
  }

  // 移动 + 出界判断
  move() {
    this.x += this.dx;
    this.y += this.dy;

    if (this.fadingOut === false) this.reset();
    if (this.x > this.width - this.width / 4 || this.y < 0) {
      this.fadingOut = true;
    }
  }

  // 绘制到画布
  draw(ctx) {
    ctx.beginPath();

    if (this.giant) {
      // 大星星
      ctx.fillStyle = `rgba(${COLOR_STAR},${this.opacity})`;
      ctx.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
    } else if (this.comet) {
      // 彗星 + 尾迹
      ctx.fillStyle = `rgba(${COLOR_COMET},${this.opacity})`;
      ctx.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, false);

      for (let i = 0; i < COMET_TAIL_LENGTH; i++) {
        ctx.fillStyle = `rgba(${COLOR_COMET},${this.opacity - (this.opacity / COMET_TAIL_SAMPLE) * i})`;
        ctx.rect(
          this.x - (this.dx / COMET_TAIL_DIVISOR) * i,
          this.y - (this.dy / COMET_TAIL_DIVISOR) * i - 2,
          2,
          2,
        );
        ctx.fill();
      }
    } else {
      // 普通方块
      ctx.fillStyle = `rgba(${COLOR_SQUARE},${this.opacity})`;
      ctx.rect(this.x, this.y, this.r, this.r);
    }

    ctx.closePath();
    ctx.fill();
  }
}

/* ==================== 主初始化 ==================== */

const initUniverse = () => {
  /* ---- 创建画布 ---- */
  const canvas = document.createElement("canvas");
  canvas.id = "universeCanvas";
  canvas.style.willChange = "transform";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  /* ---- 运行时状态 ---- */
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrameId = null;

  // 彗星是否允许生成（初始化后 50ms 内允许）
  let allowComet = true;
  const cometTimer = setTimeout(() => {
    allowComet = false;
  }, COMET_GENERATION_WINDOW);

  /* ---- 尺寸自适应 ---- */
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
  };

  /* ---- 每帧更新 ---- */
  const update = () => {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.move();
      p.fadeIn();
      p.fadeOut();
      p.draw(ctx);
    }
  };

  /* ---- 动画循环 ---- */
  const loop = () => {
    update();
    animationFrameId = requestAnimationFrame(loop);
  };

  /* ---- 初始化 ---- */
  resize();
  window.addEventListener("resize", resize);

  const count = PARTICLE_COUNT_FACTOR * width;
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(width, height, allowComet));
  }

  loop();

  /* ---- 清理函数 ---- */
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    clearTimeout(cometTimer);
    window.removeEventListener("resize", resize);
    canvas.remove();
    particles = [];
  };
};

export default initUniverse;
