const initUniverse = () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'universeCanvas';
  canvas.style.willChange = 'transform';
  document.body.appendChild(canvas);

  let n, e, i, h;
  const t = 0.05;
  const s = canvas;
  let o = true;
  const a = "180,184,240"; // 星星颜色
  const r = "226,225,142"; // 方块颜色
  const d = "226,225,224"; // 彗星颜色
  const c = [];

  function m(t) {
    return Math.floor(1000 * Math.random()) + 1 < 10 * t;
  }
  function l(t, i) {
    return Math.random() * (i - t) + t;
  }

  function f() {
    n = window.innerWidth;
    e = window.innerHeight;
    i = 0.216 * n;
    s.setAttribute("width", n);
    s.setAttribute("height", e);
  }

  function u() {
    h.clearRect(0, 0, n, e);
    for (let t = c.length, i = 0; i < t; i++) {
      const s = c[i];
      s.move();
      s.fadeIn();
      s.fadeOut();
      s.draw();
    }
  }

  function y() {
    this.reset = function() {
      this.giant = m(3);
      this.comet = !this.giant && !o && m(10);
      this.x = l(0, n - 10);
      this.y = l(0, e);
      this.r = l(1.1, 2.6);
      this.dx = l(t, 6 * t) + (this.comet + 1 - 1) * t * l(50, 120) + 2 * t;
      this.dy = -l(t, 6 * t) - (this.comet + 1 - 1) * t * l(50, 120);
      this.fadingOut = null;
      this.fadingIn = true;
      this.opacity = 0;
      this.opacityTresh = l(0.2, 1 - 0.4 * (this.comet + 1 - 1));
      this.do = l(5e-4, 0.002) + 0.001 * (this.comet + 1 - 1);
    };
    this.fadeIn = function() {
      if (this.fadingIn) {
        this.fadingIn = !(this.opacity > this.opacityTresh);
        this.opacity += this.do;
      }
    };
    this.fadeOut = function() {
      if (this.fadingOut) {
        this.fadingOut = !(this.opacity < 0);
        this.opacity -= this.do / 2;
        if (this.x > n || this.y < 0) {
          this.fadingOut = false;
          this.reset();
        }
      }
    };
    this.draw = function() {
      h.beginPath();
      if (this.giant) {
        h.fillStyle = "rgba(" + a + "," + this.opacity + ")";
        h.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
      } else if (this.comet) {
        h.fillStyle = "rgba(" + d + "," + this.opacity + ")";
        h.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, false);
        for (let t = 0; t < 30; t++) {
          h.fillStyle = "rgba(" + d + "," + (this.opacity - this.opacity / 20 * t) + ")";
          h.rect(this.x - this.dx / 4 * t, this.y - this.dy / 4 * t - 2, 2, 2);
          h.fill();
        }
      } else {
        h.fillStyle = "rgba(" + r + "," + this.opacity + ")";
        h.rect(this.x, this.y, this.r, this.r);
      }
      h.closePath();
      h.fill();
    };
    this.move = function() {
      this.x += this.dx;
      this.y += this.dy;
      if (false === this.fadingOut) {
        this.reset();
      }
      if (this.x > n - n / 4 || this.y < 0) {
        this.fadingOut = true;
      }
    };
    // 每个粒子创建时设置 o = false（50ms后不再生成彗星）
    setTimeout(function() {
      o = false;
    }, 50);
  }

  f();
  window.addEventListener("resize", f, false);

  h = canvas.getContext("2d");
  for (let t = 0; t < i; t++) {
    c[t] = new y();
    c[t].reset();
  }

  let animationFrameId = null;
  const loop = () => {
    u();
    animationFrameId = requestAnimationFrame(loop);
  };
  loop();

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener('resize', f);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    c.length = 0; // 清空粒子数组
  };

  return cleanup;
};

export default initUniverse;
