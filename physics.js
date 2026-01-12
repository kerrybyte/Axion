const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const createProjectilePlot = (params) => {
  const { initialSpeed, angle, gravity } = params;
  const theta = toRadians(angle);
  const tMax = (2 * initialSpeed * Math.sin(theta)) / gravity;
  const samples = 80;
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = (tMax * i) / samples;
    const y = initialSpeed * Math.sin(theta) * t - 0.5 * gravity * t * t;
    points.push({ x: t, y });
  }

  return {
    xRange: { min: 0, max: tMax },
    yRange: { min: 0, max: Math.max(...points.map((p) => p.y)) + 1 },
    curves: [
      {
        points,
        color: "#4fd6ff",
        width: 2.5,
      },
    ],
    title: "Height vs Time",
    xLabel: "t (s)",
    yLabel: "y (m)",
  };
};

const createProjectileScene = (state) => {
  const { initialSpeed, angle, gravity } = state.params;
  const theta = toRadians(angle);
  const t = state.time;
  const x = initialSpeed * Math.cos(theta) * t;
  const y = Math.max(0, initialSpeed * Math.sin(theta) * t - 0.5 * gravity * t * t);
  const tMax = (2 * initialSpeed * Math.sin(theta)) / gravity;
  const normalizedTime = clamp(t / tMax, 0, 1);
  const trailPoints = Array.from({ length: 24 }, (_, index) => {
    const trailT = (tMax * index) / 24;
    return {
      x: initialSpeed * Math.cos(theta) * trailT,
      y: Math.max(0, initialSpeed * Math.sin(theta) * trailT - 0.5 * gravity * trailT * trailT),
      alpha: index / 24,
    };
  });

  return {
    world: { xMin: 0, xMax: Math.max(25, initialSpeed * tMax * 0.7), yMin: 0, yMax: 15 },
    background: "#050a16",
    objects: [
      { type: "ground", y: 0 },
      {
        type: "trajectory",
        points: trailPoints,
      },
      {
        type: "projectile",
        x,
        y,
        r: 0.5,
      },
      {
        type: "arrow",
        from: { x, y },
        to: { x: x + 1.8 * Math.cos(theta), y: y + 1.8 * Math.sin(theta) },
        label: "v",
      },
      {
        type: "arrow",
        from: { x, y },
        to: { x, y: y - 2.4 },
        label: "g",
      },
    ],
    progress: normalizedTime,
  };
};

const createBlockScene = () => {
  return {
    world: { xMin: -8, xMax: 12, yMin: 0, yMax: 10 },
    background: "#050a16",
    objects: [
      { type: "ground", y: 0 },
      {
        type: "stickman",
        joints: {
          head: { x: -4, y: 6.6 },
          neck: { x: -4, y: 5.7 },
          shoulderL: { x: -4.8, y: 5.3 },
          shoulderR: { x: -3.2, y: 5.3 },
          hip: { x: -4, y: 4.2 },
          kneeL: { x: -4.6, y: 2.4 },
          kneeR: { x: -3.4, y: 2.4 },
          footL: { x: -4.8, y: 0.8 },
          footR: { x: -3.2, y: 0.8 },
          handL: { x: -5.8, y: 4.6 },
          handR: { x: -2.6, y: 4.6 },
        },
      },
      {
        type: "block",
        x: 1,
        y: 1.2,
        w: 4.5,
        h: 2.4,
        label: "m",
      },
      {
        type: "arrow",
        from: { x: 1, y: 3 },
        to: { x: 6, y: 3 },
        label: "F push",
      },
      {
        type: "arrow",
        from: { x: 3.2, y: 1.2 },
        to: { x: 3.2, y: 4.4 },
        label: "N",
      },
      {
        type: "arrow",
        from: { x: 3.2, y: 1.2 },
        to: { x: 3.2, y: -2.2 },
        label: "mg",
      },
      {
        type: "arrow",
        from: { x: 5, y: 1.6 },
        to: { x: 1.6, y: 1.6 },
        label: "f",
      },
    ],
  };
};

const createOrbitScene = (state) => {
  const radius = 7.5;
  const angularSpeed = 0.6;
  const angle = state.time * angularSpeed;
  const satelliteX = radius * Math.cos(angle);
  const satelliteY = radius * Math.sin(angle) + 2;

  return {
    world: { xMin: -12, xMax: 12, yMin: -6, yMax: 12 },
    background: "#050a16",
    objects: [
      {
        type: "planet",
        x: 0,
        y: 2,
        r: 3.2,
        label: "Earth",
        face: true,
      },
      {
        type: "orbit",
        x: 0,
        y: 2,
        r: radius,
      },
      {
        type: "planet",
        x: satelliteX,
        y: satelliteY,
        r: 1.1,
        label: "Satellite",
        face: false,
      },
      {
        type: "arrow",
        from: { x: satelliteX, y: satelliteY },
        to: { x: satelliteX - 2.2 * Math.cos(angle), y: satelliteY - 2.2 * Math.sin(angle) },
        label: "Fg",
      },
      {
        type: "arrow",
        from: { x: satelliteX, y: satelliteY },
        to: { x: satelliteX - 2.4 * Math.sin(angle), y: satelliteY + 2.4 * Math.cos(angle) },
        label: "v",
      },
    ],
  };
};

const explanations = {
  projectile: {
    summary: "A projectile launched upward follows a parabolic path because gravity accelerates it downward at a constant rate.",
    formulasHTML: "y = v<sub>0</sub>t sin(θ) - 1/2 g t<sup>2</sup><br/>x = v<sub>0</sub>t cos(θ)",
    bullets: [
      "Horizontal velocity stays constant when air resistance is ignored.",
      "Maximum height occurs when vertical velocity becomes zero.",
      "Range depends on both launch speed and angle.",
    ],
  },
  block_push: {
    summary: "A pushed block experiences applied force, friction, weight, and the normal force from the surface.",
    formulasHTML: "ΣF = ma<br/>f = μN",
    bullets: [
      "Normal force balances weight when there is no vertical acceleration.",
      "Friction opposes the direction of motion.",
      "Net force determines acceleration of the block.",
    ],
  },
  orbit: {
    summary: "A satellite stays in orbit when gravity provides the centripetal force needed for circular motion.",
    formulasHTML: "F<sub>g</sub> = GMm / r<sup>2</sup><br/>v = √(GM / r)",
    bullets: [
      "Velocity is tangential to the orbit path.",
      "Gravity always points toward the central body.",
      "Higher orbits require slower speeds.",
    ],
  },
};

export function createPhysicsBrain() {
  const state = {
    mode: "projectile",
    params: {
      initialSpeed: 22,
      angle: 45,
      gravity: 9.81,
    },
    time: 0,
  };

  return {
    get mode() {
      return state.mode;
    },

    get params() {
      return state.params;
    },

    setMode(modeName) {
      state.mode = modeName;
      state.time = 0;
    },

    setParams(newParams) {
      state.params = { ...state.params, ...newParams };
    },

    update(dt) {
      state.time += dt;
      if (state.mode === "projectile") {
        const theta = toRadians(state.params.angle);
        const tMax = (2 * state.params.initialSpeed * Math.sin(theta)) / state.params.gravity;
        if (state.time > tMax) {
          state.time = 0;
        }
      }
    },

    getPlotConfig() {
      if (state.mode === "projectile") {
        return createProjectilePlot(state.params);
      }

      if (state.mode === "block_push") {
        return {
          xRange: { min: 0, max: 8 },
          yRange: { min: 0, max: 8 },
          curves: [
            {
              points: [
                { x: 0, y: 0 },
                { x: 2, y: 1.5 },
                { x: 4, y: 3.4 },
                { x: 6, y: 5.2 },
                { x: 8, y: 6 },
              ],
              color: "#9fa0ff",
              width: 2.5,
            },
          ],
          title: "Velocity vs Time",
          xLabel: "t (s)",
          yLabel: "v (m/s)",
        };
      }

      return {
        xRange: { min: 0, max: 12 },
        yRange: { min: 0, max: 8 },
        curves: [
          {
            points: [
              { x: 0, y: 4 },
              { x: 4, y: 4.2 },
              { x: 8, y: 3.8 },
              { x: 12, y: 4 },
            ],
            color: "#4fd6ff",
            width: 2.5,
          },
        ],
        title: "Orbital Speed",
        xLabel: "t (s)",
        yLabel: "v (km/s)",
      };
    },

    getSceneConfig() {
      if (state.mode === "projectile") {
        return createProjectileScene(state);
      }

      if (state.mode === "block_push") {
        return createBlockScene();
      }

      return createOrbitScene(state);
    },

    getExplanation() {
      return explanations[state.mode] ?? explanations.projectile;
    },
  };
}
