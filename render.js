const resizeCanvas = (canvas) => {
  const { width, height } = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  return canvas.getContext("2d");
};

export const drawGrid = (ctx, config) => {
  const { width, height } = ctx.canvas;
  const {
    xMin,
    xMax,
    yMin,
    yMax,
    gridStep = 1,
    axisColor = "rgba(79, 214, 255, 0.65)",
    gridColor = "rgba(148, 163, 184, 0.18)",
  } = config;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(5, 10, 20, 0.9)";
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const xStep = gridStep;
  const yStep = gridStep;

  for (let x = xMin; x <= xMax; x += xStep) {
    const px = ((x - xMin) / xRange) * width;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }

  for (let y = yMin; y <= yMax; y += yStep) {
    const py = height - ((y - yMin) / yRange) * height;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }

  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.6;
  const xAxisY = height - ((0 - yMin) / yRange) * height;
  const yAxisX = ((0 - xMin) / xRange) * width;
  ctx.beginPath();
  ctx.moveTo(0, xAxisY);
  ctx.lineTo(width, xAxisY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(yAxisX, 0);
  ctx.lineTo(yAxisX, height);
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
  ctx.font = "12px 'Funnel Display', sans-serif";

  for (let x = xMin; x <= xMax; x += xStep * 2) {
    const px = ((x - xMin) / xRange) * width;
    ctx.fillText(String(x.toFixed(0)), px + 4, xAxisY - 6);
  }

  for (let y = yMin; y <= yMax; y += yStep * 2) {
    const py = height - ((y - yMin) / yRange) * height;
    ctx.fillText(String(y.toFixed(0)), yAxisX + 6, py - 4);
  }

  ctx.restore();
};

export const drawCurves = (ctx, curves, ranges) => {
  const { width, height } = ctx.canvas;
  const { xMin, xMax, yMin, yMax } = ranges;
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  curves.forEach((curve) => {
    ctx.strokeStyle = curve.color;
    ctx.lineWidth = curve.width || 2;
    ctx.beginPath();
    curve.points.forEach((point, index) => {
      const px = ((point.x - xMin) / xRange) * width;
      const py = height - ((point.y - yMin) / yRange) * height;
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();
  });
};

export const renderGraph = (canvas, plot) => {
  if (!canvas) {
    return;
  }
  const ctx = resizeCanvas(canvas);
  const { xRange, yRange, curves, title, xLabel, yLabel } = plot;

  drawGrid(ctx, {
    xMin: xRange.min,
    xMax: xRange.max,
    yMin: yRange.min,
    yMax: yRange.max,
    gridStep: (xRange.max - xRange.min) / 6,
  });

  drawCurves(ctx, curves, {
    xMin: xRange.min,
    xMax: xRange.max,
    yMin: yRange.min,
    yMax: yRange.max,
  });

  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "14px 'Funnel Display', sans-serif";
  ctx.fillText(title ?? "", 16, 24);
  ctx.fillText(xLabel ?? "", ctx.canvas.width - 60, ctx.canvas.height - 14);
  ctx.save();
  ctx.translate(12, ctx.canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel ?? "", 0, 0);
  ctx.restore();
};

const toScreen = (point, bounds, canvas) => {
  const { xMin, xMax, yMin, yMax } = bounds;
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  return {
    x: ((point.x - xMin) / xRange) * canvas.width,
    y: canvas.height - ((point.y - yMin) / yRange) * canvas.height,
  };
};

const drawArrow = (ctx, from, to, label) => {
  const headLength = 10;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.strokeStyle = "#4fd6ff";
  ctx.fillStyle = "#4fd6ff";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.fillStyle = "#eaf1ff";
    ctx.font = "12px 'Funnel Display', sans-serif";
    ctx.fillText(label, to.x + 6, to.y - 6);
  }
};

export const renderScene = (canvas, scene) => {
  if (!canvas) {
    return;
  }
  const ctx = resizeCanvas(canvas);
  ctx.fillStyle = scene.background || "#050a16";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const bounds = scene.world;

  scene.objects.forEach((obj) => {
    if (obj.type === "ground") {
      const groundY = toScreen({ x: 0, y: obj.y }, bounds, ctx.canvas).y;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(ctx.canvas.width, groundY);
      ctx.stroke();
      return;
    }

    if (obj.type === "trajectory") {
      ctx.strokeStyle = "rgba(79, 214, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      obj.points.forEach((point, index) => {
        const screen = toScreen(point, bounds, ctx.canvas);
        if (index === 0) {
          ctx.moveTo(screen.x, screen.y);
        } else {
          ctx.lineTo(screen.x, screen.y);
        }
      });
      ctx.stroke();
      return;
    }

    if (obj.type === "projectile") {
      const screen = toScreen(obj, bounds, ctx.canvas);
      ctx.fillStyle = "#9fa0ff";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, obj.r * 10, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (obj.type === "block") {
      const topLeft = toScreen({ x: obj.x, y: obj.y + obj.h }, bounds, ctx.canvas);
      const bottomRight = toScreen({ x: obj.x + obj.w, y: obj.y }, bounds, ctx.canvas);
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.strokeStyle = "rgba(79, 214, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      if (obj.label) {
        ctx.fillStyle = "#eaf1ff";
        ctx.font = "12px 'Funnel Display', sans-serif";
        ctx.fillText(obj.label, topLeft.x + 8, topLeft.y + 16);
      }
      return;
    }

    if (obj.type === "stickman") {
      const joints = obj.joints;
      const drawLine = (a, b) => {
        const start = toScreen(joints[a], bounds, ctx.canvas);
        const end = toScreen(joints[b], bounds, ctx.canvas);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      };
      ctx.strokeStyle = "#eaf1ff";
      ctx.lineWidth = 3;
      drawLine("head", "neck");
      drawLine("neck", "hip");
      drawLine("neck", "shoulderL");
      drawLine("neck", "shoulderR");
      drawLine("hip", "kneeL");
      drawLine("hip", "kneeR");
      drawLine("kneeL", "footL");
      drawLine("kneeR", "footR");
      drawLine("shoulderL", "handL");
      drawLine("shoulderR", "handR");
      const head = toScreen(joints.head, bounds, ctx.canvas);
      ctx.beginPath();
      ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (obj.type === "planet") {
      const screen = toScreen(obj, bounds, ctx.canvas);
      ctx.fillStyle = obj.face ? "#4fd6ff" : "#9fa0ff";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, obj.r * 12, 0, Math.PI * 2);
      ctx.fill();
      if (obj.face) {
        ctx.fillStyle = "#0a0f1a";
        ctx.beginPath();
        ctx.arc(screen.x - 6, screen.y - 4, 2.5, 0, Math.PI * 2);
        ctx.arc(screen.x + 6, screen.y - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (obj.label) {
        ctx.fillStyle = "#eaf1ff";
        ctx.font = "12px 'Funnel Display', sans-serif";
        ctx.fillText(obj.label, screen.x + 10, screen.y - 10);
      }
      return;
    }

    if (obj.type === "orbit") {
      const center = toScreen({ x: obj.x, y: obj.y }, bounds, ctx.canvas);
      ctx.strokeStyle = "rgba(79, 214, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, obj.r * 12, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (obj.type === "arrow") {
      const from = toScreen(obj.from, bounds, ctx.canvas);
      const to = toScreen(obj.to, bounds, ctx.canvas);
      drawArrow(ctx, from, to, obj.label);
    }
  });
};
