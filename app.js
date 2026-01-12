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

if (document.body.dataset.page === "home") {
  startQuoteRotation();
}
