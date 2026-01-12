import { createPhysicsBrain } from "./physics.js";
import { renderGraph, renderScene } from "./render.js";

const brand = document.querySelector("[data-brand]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileToggles = document.querySelectorAll("[data-mobile-toggle]");
const mobilePanels = document.querySelectorAll("[data-mobile-panel]");
const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("author-name");

const getNewQuote = async () => {
  try {
    const response = await fetch("https://api.quotable.io/random?tags=science");
    if (!response.ok) {
      throw new Error("Quote request failed");
    }
    const data = await response.json();
    if (quoteText) {
      quoteText.innerText = `"${data.content}"`;
    }
    if (quoteAuthor) {
      quoteAuthor.innerText = `- ${data.author}`;
    }
  } catch (error) {
    if (quoteText) {
      quoteText.innerText = "\"Somewhere, something incredible is waiting to be known.\"";
    }
    if (quoteAuthor) {
      quoteAuthor.innerText = "- Carl Sagan";
    }
  }
};

const startQuoteRotation = () => {
  getNewQuote();
  setInterval(getNewQuote, 10000);
};

brand?.addEventListener("click", () => {
  brand.classList.remove("pulse");
  void brand.offsetWidth;
  brand.classList.add("pulse");
});

const setMobilePanelsOpen = (isOpen) => {
  mobilePanels.forEach((panel) => panel.classList.toggle("open", isOpen));
  mobileToggles.forEach((toggle) => {
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
};

const setMenuState = (isOpen) => {
  if (!mobileMenu) {
    return;
  }
  mobileMenu.classList.toggle("open", isOpen);
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }
  if (!isOpen) {
    setMobilePanelsOpen(false);
  }
};

const toggleMobilePanel = (toggle) => {
  const panelKey = toggle.dataset.mobileToggle;
  if (!panelKey) {
    return;
  }
  const panel = document.querySelector(`[data-mobile-panel="${panelKey}"]`);
  if (!panel) {
    return;
  }
  const isOpen = !panel.classList.contains("open");
  panel.classList.toggle("open", isOpen);
  toggle.classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
};

mobileToggles.forEach((toggle) => {
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMobilePanel(toggle);
  });
});

menuToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = !mobileMenu?.classList.contains("open");
  setMenuState(Boolean(isOpen));
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.tagName === "A") {
    setMenuState(false);
  }
});

document.addEventListener("click", (event) => {
  if (!mobileMenu?.classList.contains("open")) {
    return;
  }
  const isInsideMobile = mobileMenu.contains(event.target);
  const isMenuToggle = menuToggle?.contains(event.target);
  if (!isInsideMobile && !isMenuToggle) {
    setMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

// --- ArchonX state machine ---
class ArchonController {
  constructor({ panel, sprite, speech }) {
    this.panel = panel;
    this.sprite = sprite;
    this.speech = speech;
    this.mood = "neutral";
    this.text = "";
    this.blinkTimer = null;
  }

  setMood(mood) {
    if (!this.panel) {
      return;
    }
    const nextMood = ["neutral", "happy", "thinking", "surprised"].includes(mood) ? mood : "neutral";
    this.mood = nextMood;
    this.panel.classList.remove("archon-neutral", "archon-happy", "archon-thinking", "archon-surprised");
    this.panel.classList.add(`archon-${nextMood}`);
  }

  say(text) {
    if (!this.speech) {
      return;
    }
    this.text = text;
    this.speech.innerText = text;
  }

  showTemporary(text, mood, ms = 2000) {
    const previousMood = this.mood;
    const previousText = this.text;
    this.setMood(mood);
    this.say(text);
    window.setTimeout(() => {
      this.setMood(previousMood);
      this.say(previousText);
    }, ms);
  }

  blink() {
    if (!this.panel) {
      return;
    }
    this.panel.classList.add("archon-blink");
    window.setTimeout(() => {
      this.panel.classList.remove("archon-blink");
    }, 180);
  }

  startBlinkLoop() {
    const scheduleBlink = () => {
      const delay = 5000 + Math.random() * 3000;
      this.blinkTimer = window.setTimeout(() => {
        this.blink();
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
  }
}

const createArchonController = () => {
  const panel = document.getElementById("archon-panel");
  const sprite = document.getElementById("archon-sprite");
  const speech = document.getElementById("archon-speech");

  if (!panel || !sprite || !speech) {
    return null;
  }

  const archon = new ArchonController({ panel, sprite, speech });
  archon.setMood("neutral");
  archon.say("Hello, I’m ArchonX. Ask me something about physics!");
  archon.startBlinkLoop();
  return archon;
};

// --- XSuper console wiring ---
const physicsBrain = createPhysicsBrain();
let currentMode = "graphs";
let animationFrameId = null;
let lastTimestamp = 0;

const parseTopic = (text) => {
  const lower = text.toLowerCase();
  if (["projectile", "throw", "launch"].some((word) => lower.includes(word))) {
    return "projectile";
  }
  if (["push", "block", "force", "friction"].some((word) => lower.includes(word))) {
    return "block_push";
  }
  if (["orbit", "satellite", "planet", "gravity"].some((word) => lower.includes(word))) {
    return "orbit";
  }
  return null;
};

const updateExplanation = (explainText, formulaBox, bullets) => {
  const info = physicsBrain.getExplanation();
  if (explainText) {
    explainText.textContent = info.summary;
  }
  if (formulaBox) {
    formulaBox.innerHTML = info.formulasHTML;
  }
  if (bullets) {
    bullets.innerHTML = "";
    info.bullets.forEach((bullet) => {
      const li = document.createElement("li");
      li.textContent = bullet;
      bullets.appendChild(li);
    });
  }
};

const stopSceneLoop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const startSceneLoop = (sceneCanvas) => {
  stopSceneLoop();
  const loop = (timestamp) => {
    const dt = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0.016;
    lastTimestamp = timestamp;
    physicsBrain.update(dt);
    renderScene(sceneCanvas, physicsBrain.getSceneConfig());
    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);
};

const setMode = (mode, elements, archon) => {
  currentMode = mode;
  const { graphCanvas, sceneCanvas, explainPanel, statusEl, modeButtons } = elements;

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  if (graphCanvas) {
    graphCanvas.classList.toggle("hidden", mode !== "graphs");
  }
  if (sceneCanvas) {
    sceneCanvas.classList.toggle("hidden", mode !== "scenes");
  }
  if (explainPanel) {
    explainPanel.classList.toggle("hidden", mode !== "explain");
  }

  if (statusEl) {
    statusEl.textContent = `Mode: ${mode}`;
  }

  if (mode !== "scenes") {
    stopSceneLoop();
  }

  if (mode === "graphs" && graphCanvas) {
    renderGraph(graphCanvas, physicsBrain.getPlotConfig());
  }

  if (mode === "scenes" && sceneCanvas) {
    startSceneLoop(sceneCanvas);
  }

  if (mode === "explain") {
    updateExplanation(elements.explainText, elements.formulaBox, elements.explainBullets);
  }

  if (archon) {
    onModeChange(mode, archon);
  }
};

// --- ArchonX hooks ---
const onUserSubmitQuestion = (questionText, archon) => {
  if (!archon) {
    return;
  }
  archon.setMood("thinking");
  archon.say(`Thinking about: ${questionText}`);
};

const onSimulationReady = (archon) => {
  if (!archon) {
    return;
  }
  archon.setMood("happy");
  archon.say("Here is the simulation. Try changing the parameters!");
};

const onModeChange = (mode, archon) => {
  if (!archon) {
    return;
  }
  if (mode === "graphs") {
    archon.say("Plotting motion on the console.");
  }
  if (mode === "scenes") {
    archon.say("Let me animate what’s happening.");
  }
  if (mode === "explain") {
    archon.say("I’ll break down the ideas in plain language.");
  }
};

const onError = (message, archon) => {
  if (!archon) {
    return;
  }
  archon.setMood("surprised");
  archon.say(`Oops, something went wrong: ${message}`);
};

// --- App init ---
const initConsole = (archon) => {
  const graphCanvas = document.getElementById("graphCanvas");
  const sceneCanvas = document.getElementById("sceneCanvas");
  const explainPanel = document.getElementById("explainPanel");
  const explainText = document.getElementById("explainText");
  const formulaBox = document.getElementById("formulaBox");
  const explainBullets = document.getElementById("explainBullets");
  const statusEl = document.getElementById("consoleStatus");
  const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));

  const elements = {
    graphCanvas,
    sceneCanvas,
    explainPanel,
    explainText,
    formulaBox,
    explainBullets,
    statusEl,
    modeButtons,
  };

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode, elements, archon);
    });
  });

  window.addEventListener("resize", () => {
    if (currentMode === "graphs" && graphCanvas) {
      renderGraph(graphCanvas, physicsBrain.getPlotConfig());
    }
    if (currentMode === "scenes" && sceneCanvas) {
      renderScene(sceneCanvas, physicsBrain.getSceneConfig());
    }
  });

  setMode(currentMode, elements, archon);
  updateExplanation(explainText, formulaBox, explainBullets);

  return elements;
};

const initControls = (elements, archon) => {
  const form = document.getElementById("topicForm");
  const topicInput = document.getElementById("topicInput");
  const moduleSelect = document.getElementById("moduleSelect");
  const speedInput = document.getElementById("speedInput");
  const angleInput = document.getElementById("angleInput");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const topicText = topicInput?.value?.trim() || "physics";
    onUserSubmitQuestion(topicText, archon);
    const parsedMode = parseTopic(topicText);
    const selectedMode = moduleSelect?.value || "projectile";
    physicsBrain.setMode(parsedMode || selectedMode);
    physicsBrain.setParams({
      initialSpeed: Number(speedInput?.value ?? 22),
      angle: Number(angleInput?.value ?? 45),
    });

    updateExplanation(elements.explainText, elements.formulaBox, elements.explainBullets);

    if (currentMode === "graphs" && elements.graphCanvas) {
      renderGraph(elements.graphCanvas, physicsBrain.getPlotConfig());
    }
    if (currentMode === "scenes" && elements.sceneCanvas) {
      startSceneLoop(elements.sceneCanvas);
    }
    if (currentMode === "explain") {
      updateExplanation(elements.explainText, elements.formulaBox, elements.explainBullets);
    }

    if (elements.statusEl) {
      elements.statusEl.textContent = `Loaded: ${physicsBrain.mode}`;
    }
    onSimulationReady(archon);
  });
};

if (document.body.dataset.page === "home") {
  startQuoteRotation();
}

window.addEventListener("DOMContentLoaded", () => {
  const archon = createArchonController();
  const elements = initConsole(archon);
  initControls(elements, archon);
  if (!archon) {
    onError("ArchonX panel not found", archon);
  }
});
