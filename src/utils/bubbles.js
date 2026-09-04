import { mainStore } from "@/store";

let animationFrameId = null;
let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let bubbles = [];
let animateHeader = true;

function resize() {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function Bubble() {
  const _this = this;
  (function init() {
    _this.pos = {};
    _this.pos.x = Math.random() * width;
    _this.pos.y = height + Math.random() * 100;
    _this.alpha = 0.1 + Math.random() * 0.5;
    _this.alpha_change = 0.0002 + Math.random() * 0.0005;
    _this.scale = 0.2 + Math.random() * 0.8;
    _this.scale_change = Math.random() * 0.002;
    _this.speed = 0.1 + Math.random() * 0.4;
  })();

  this.draw = function () {
    if (_this.alpha <= 0) {
      _this.pos.x = Math.random() * width;
      _this.pos.y = height + Math.random() * 100;
      _this.alpha = 0.1 + Math.random() * 0.5;
      _this.scale = 0.2 + Math.random() * 0.8;
      _this.speed = 0.1 + Math.random() * 0.4;
    }
    _this.pos.y -= _this.speed;
    _this.alpha -= _this.alpha_change;
    _this.scale += _this.scale_change;
    ctx.beginPath();
    ctx.arc(_this.pos.x, _this.pos.y, _this.scale * 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(255,255,255," + _this.alpha + ")";
    ctx.fill();
  };
}

function initBubbles() {
  const num = Math.min(Math.floor(width * 0.04), 60);
  for (let i = 0; i < num; i++) {
    bubbles.push(new Bubble());
  }
}

function animate() {
  if (!animateHeader) return;
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  for (const bubble of bubbles) {
    bubble.draw();
  }
  animationFrameId = requestAnimationFrame(animate);
}

function initBubble() {
  if (animationFrameId || canvas) {
    closeBubble();
  }
  canvas = document.createElement("canvas");
  canvas.id = "bubblesCanvas";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  resize();
  initBubbles();
  animateHeader = true;
  animate();
  window.addEventListener("resize", resize);
  const store = mainStore();
  store.bubble = true;
  return closeBubble;
}

function closeBubble() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (canvas && canvas.parentNode === document.body) {
    document.body.removeChild(canvas);
    canvas = null;
    ctx = null;
  }
  bubbles = [];
  window.removeEventListener("resize", resize);
  const store = mainStore();
  store.bubble = false;
}

export default initBubble;
export { closeBubble };
