/* ==================== 静态配置 ==================== */

// 鼠标跟随平滑系数（越小越"拖尾"）
const LERP_FACTOR = 0.35;

// 光标相对鼠标的偏移量
const CURSOR_OFFSET = 8;

// 自定义光标 SVG（内联 data URI）
const CURSOR_STYLE = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='10px' height='10px'><circle cx='4' cy='4' r='4' fill='white' /></svg>") 4 4, auto !important}`;

/* ==================== 工具函数 ==================== */

// 线性插值
const lerp = (a, b, n) => (1 - n) * a + n * b;

/* ==================== 光标类 ==================== */

class Cursor {
  constructor() {
    this.pos = { curr: null, prev: null };
    this.rafId = null;

    this.create();
    this.init();
    this.render();
  }

  /* ---------- DOM 创建 ---------- */

  create() {
    if (!this.cursor) {
      this.cursor = document.createElement("div");
      this.cursor.id = "cursor";
      this.cursor.classList.add("xs-hidden", "hidden");
      document.body.appendChild(this.cursor);
    }

    // 全局替换原生光标为 SVG 圆点
    this.scr = document.createElement("style");
    this.scr.innerHTML = CURSOR_STYLE;
    document.body.appendChild(this.scr);
  }

  /* ---------- 事件监听 ---------- */

  init() {
    // 保存引用以便 destroy 时移除
    this.handleMouseMove = (e) => {
      const x = e.clientX - CURSOR_OFFSET;
      const y = e.clientY - CURSOR_OFFSET;
      // 首次移动时直接跳转，避免从 (0,0) 平滑飘过来
      if (this.pos.curr === null) this.move(x, y);
      this.pos.curr = { x, y };
      this.cursor.classList.remove("hidden");
    };

    this.handleMouseEnter = () => this.cursor.classList.remove("hidden");
    this.handleMouseLeave = () => this.cursor.classList.add("hidden");
    this.handleMouseDown = () => this.cursor.classList.add("active");
    this.handleMouseUp = () => this.cursor.classList.remove("active");

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseenter", this.handleMouseEnter);
    document.addEventListener("mouseleave", this.handleMouseLeave);
    document.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  /* ---------- 位置更新 ---------- */

  move(left, top) {
    this.cursor.style.left = `${left}px`;
    this.cursor.style.top = `${top}px`;
  }

  /* ---------- 渲染循环 ---------- */

  render() {
    if (this.pos.prev && this.pos.curr) {
      this.pos.prev.x = lerp(this.pos.prev.x, this.pos.curr.x, LERP_FACTOR);
      this.pos.prev.y = lerp(this.pos.prev.y, this.pos.curr.y, LERP_FACTOR);
      this.move(this.pos.prev.x, this.pos.prev.y);
    } else if (this.pos.curr) {
      // 首次移动时，prev 直接对齐 curr
      this.pos.prev = { ...this.pos.curr };
    }

    this.rafId = requestAnimationFrame(() => this.render());
  }

  /* ---------- 刷新（重建光标与样式） ---------- */

  refresh() {
    this.scr?.remove();
    this.cursor?.classList.remove("active");
    this.pos = { curr: null, prev: null };

    this.create();
    this.init();
    this.render();
  }

  /* ---------- 销毁 ---------- */

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseenter", this.handleMouseEnter);
    document.removeEventListener("mouseleave", this.handleMouseLeave);
    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mouseup", this.handleMouseUp);

    this.cursor?.remove();
    this.scr?.remove();
    this.cursor = null;
    this.scr = null;
  }
}

/* ==================== 单例入口 ==================== */

let mainCursor = null;

const cursorInit = () => {
  // 已有实例时先销毁旧的，避免重复挂载
  if (mainCursor) mainCursor.destroy();
  mainCursor = new Cursor();
  return mainCursor;
};

export default cursorInit;
