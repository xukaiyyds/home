const initSnowfall = () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'snowfallCanvas';
  canvas.style.willChange = 'transform';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const snowflakes = [];
  let animationFrameId = null;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const createSnowflakes = () => {
    const snowflakeCount = 50; // 雪花数量
    for (let i = 0; i < snowflakeCount; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        opacity: Math.random(),
        speedX: Math.random() * 1.5 - 0.75,
        speedY: Math.random() * 1.5 + 0.5,
        radius: Math.random() * 2.5 + 1,
      });
    }
  };
  createSnowflakes();

  const moveSnowflakes = () => {
    snowflakes.forEach((snowflake) => {
      snowflake.x += snowflake.speedX;
      snowflake.y += snowflake.speedY;
      if (snowflake.y > canvas.height) {
        snowflake.x = Math.random() * canvas.width;
        snowflake.y = 0;
      }
    });
  };

  const drawSnowflakes = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    snowflakes.forEach((snowflake) => {
      ctx.moveTo(snowflake.x, snowflake.y);
      ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2, true);
    });
    ctx.fill();
    moveSnowflakes();
  };

  const updateSnowfall = () => {
    drawSnowflakes();
    animationFrameId = requestAnimationFrame(updateSnowfall);
  };

  const frameInterval = 1000 / 30;
  let lastTime = performance.now();
  const loop = (time) => {
    if (time - lastTime >= frameInterval) {
      drawSnowflakes();
      lastTime = time;
    }
    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener('resize', resizeCanvas);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    snowflakes.length = 0;
  };

  return cleanup;
};

export default initSnowfall;
