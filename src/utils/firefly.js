const initFirefly = () => {
  const canvas = document.createElement("canvas");
  canvas.id = "fireflyCanvas";
  canvas.style.willChange = "transform";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const fireflies = [];
  let animationFrameId = null;

  const createFireflies = () => {
    const fireflyCount = 25; // 萤火虫数量
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        opacity: Math.random(),
        speedX: Math.random() * 1.5 - 0.75,
        speedY: Math.random() * 1.5 - 0.75,
        radius: Math.random() * 2 + 1,
      });
    }
  };

  const drawFireflies = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
    ctx.beginPath();
    fireflies.forEach((firefly) => {
      ctx.moveTo(firefly.x, firefly.y);
      ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2, true);
    });
    ctx.fill();
    moveFireflies();
  };

  const moveFireflies = () => {
    fireflies.forEach((firefly) => {
      firefly.x += firefly.speedX;
      firefly.y += firefly.speedY;
      if (firefly.x > canvas.width || firefly.x < 0) {
        firefly.speedX *= -1;
      }
      if (firefly.y > canvas.height || firefly.y < 0) {
        firefly.speedY *= -1;
      }
    });
  };

  const updateFireflies = () => {
    drawFireflies();
    animationFrameId = requestAnimationFrame(updateFireflies);
  };

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  createFireflies();
  updateFireflies();

  // 降低帧率
  const intervalId = setInterval(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    updateFireflies();
  }, 1000 / 30);

  // 返回清理函数
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
    window.removeEventListener("resize", resizeCanvas);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    fireflies.length = 0;
  };
};

export default initFirefly;
