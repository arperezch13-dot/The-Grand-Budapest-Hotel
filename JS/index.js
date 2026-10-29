// Current time event listener para darle funcionalidad a los botones del carrousel
const video = document.getElementById("gbhvideo");
const buttons = document.querySelectorAll(".Mendls-btn");

const changeVideoTime = (event) => {
    const button = event.currentTarget;
    const time = parseFloat(button.querySelector("img").dataset.time);
    if (!isNaN(time)) {
        video.currentTime = time;
    }
};

buttons.forEach((button) => {
    button.addEventListener("click", changeVideoTime);
}); 

// Menu toggle + drawer (nav toggle v2)
// La clase "nav-open" va en <body>; el CSS reacciona a ella.

const navToggle = document.querySelector(".nav-toggle");
const navDrawer = document.querySelector(".drawer-panel");
const navBackdrop = document.querySelector(".nav-backdrop");
const navCloseBtn = document.querySelector(".drawer-close-btn");

if (navToggle && navDrawer) {
	const FOCUSABLE = "a[href], button:not([disabled])";
	const isNavOpen = () => document.body.classList.contains("nav-open");

	// Pinta el estado (clase + atributos ARIA)
	const renderNav = (open) => {
		document.body.classList.toggle("nav-open", open);
		navToggle.setAttribute("aria-expanded", String(open));
		navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		navDrawer.setAttribute("aria-hidden", String(!open));
	};

	// Abre/cierra y gestiona el foco
	const setNavOpen = (open) => {
		if (open === isNavOpen()) {
			return;
		}

		const focusWasInside = navDrawer.contains(document.activeElement);
		renderNav(open);

		if (open) {
			navCloseBtn?.focus({ preventScroll: true });
		} else if (focusWasInside) {
			navToggle.focus({ preventScroll: true });
		}
	};

	navToggle.addEventListener("click", () => setNavOpen(!isNavOpen()));
	navCloseBtn?.addEventListener("click", () => setNavOpen(false));
	navBackdrop?.addEventListener("click", () => setNavOpen(false));

	// Cierra al pulsar cualquier enlace del drawer
	navDrawer.addEventListener("click", (event) => {
		if (event.target.closest("a[href]")) {
			setNavOpen(false);
		}
	});

	document.addEventListener("keydown", (event) => {
		if (!isNavOpen()) {
			return;
		}

		if (event.key === "Escape") {
			setNavOpen(false);
			return;
		}

		// Mantiene el foco dentro del drawer mientras está abierto
		if (event.key === "Tab") {
			const items = Array.from(navDrawer.querySelectorAll(FOCUSABLE));
			if (!items.length) {
				return;
			}

			const first = items[0];
			const last = items[items.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	});

	// Estado inicial: cerrado
	renderNav(false);
}


// Header: se encoge al bajar y marca la página actual en el menú

const siteHeader = document.querySelector("header");

if (siteHeader) {
	let headerShrunk = false;

	const updateHeaderOnScroll = () => {
		const shouldShrink = window.scrollY > 40;

		if (shouldShrink !== headerShrunk) {
			siteHeader.classList.toggle("is-scrolled", shouldShrink);
			headerShrunk = shouldShrink;
		}
	};

	window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
	updateHeaderOnScroll();
}

// Marca con aria-current la tarjeta del menú que apunta a esta página (el CSS la resalta)
const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".drawer-menu .nav-card").forEach((card) => {
	const target = (card.getAttribute("href") || "").split("/").pop();

	if (target && target === currentPage) {
		card.setAttribute("aria-current", "page");
	}
});


// typewriter effect en el título
const title = document.getElementById("main-title");

function typeWriterEffect( typingSpeed, startDelay) {

	if (!title) {
		return;
	}

	const safeTypingSpeed = Math.max(typingSpeed, 40);// Asegura una velocdiadnminima de 40ms para evitar que sea demasiado rápida

	const fullText = title.textContent || "";
	title.textContent = ""; // Limpia el texto para iniciar el efecto

	let index = 0;

	const typeEffect = () => {
		if (index < fullText.length) {
			title.textContent += fullText.charAt(index);
			index += 1;
			setTimeout(typeEffect, safeTypingSpeed);
		}
	};

	setTimeout(typeEffect, startDelay);
}

document.addEventListener("DOMContentLoaded", () => {
	typeWriterEffect(150, 500);
});



// Scroll animation para el título de la sección hero

const heroSection = document.querySelector(".hero__container");
const heroTitle = document.querySelector(".hero__container .hero__block h2");
const glimmersWord = document.querySelector(".hero__container .glimmers-word");
const gallerySection = document.querySelector(".gallery");
const galleryBlock = document.querySelector(".gallery__block");
const leftPhoto = document.querySelector(".gallery-image.left");
const rightPhoto = document.querySelector(".gallery-image.right");
const centerText = document.querySelector(".staff-text");
const compactGalleryQuery = window.matchMedia("(max-width: 1024px)");
const pinkWave = document.querySelector(".pink__wave");
const purpleWave = document.querySelector(".purple__wave");
let scrollFrameId = null;

const splitHeroTextIntoLetters = (root) => {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const textNodes = [];

	while (walker.nextNode()) {
		if ((walker.currentNode.textContent || "").trim()) {
			textNodes.push(walker.currentNode);
		}
	}

	textNodes.forEach((node) => {
		const fragment = document.createDocumentFragment();

		for (const character of node.textContent || "") {
			if (character === " ") {
				fragment.appendChild(document.createTextNode(character));
			} else {
				const span = document.createElement("span");
				span.className = "hero-letter";
				span.textContent = character;
				fragment.appendChild(span);
			}
		}

		node.replaceWith(fragment);
	});
};

if (heroSection && heroTitle) {
	splitHeroTextIntoLetters(heroTitle);

	const heroLetters = Array.from(heroTitle.querySelectorAll(".hero-letter"));
	let heroStart = heroSection.offsetTop;
	let heroScrollRange = Math.max(heroSection.offsetHeight * 0.18, window.innerHeight * 0.35, 1);
	let galleryStart = gallerySection ? gallerySection.offsetTop : 0;
	let galleryScrollRange = gallerySection ? Math.max(gallerySection.offsetHeight - window.innerHeight, 1) : 1;
	let galleryTextStart = 0.1;
	let activeHeroLetters = 0;
	let highlightedGlimmers = false;
	let lastHeroStep = -1;

	const updateHeroMetrics = () => {
		heroStart = heroSection.offsetTop;
		heroScrollRange = Math.max(heroSection.offsetHeight * 0.18, window.innerHeight * 0.35, 1);
	};

	const updateGalleryMetrics = () => {
		if (!gallerySection) {
			return;
		}

		galleryStart = gallerySection.offsetTop;
		galleryScrollRange = Math.max(gallerySection.offsetHeight - window.innerHeight, 1);
		galleryTextStart = 0.1;

		if (compactGalleryQuery.matches && galleryBlock && centerText) {
			const viewport = window.innerHeight;

			// Empieza a abrirse cuando el bloque llega al 80% de la pantalla...
			galleryStart = gallerySection.offsetTop + galleryBlock.offsetTop - viewport * 0.8;
			// y termina de abrirse en medio recorrido de pantalla (rápido)
			galleryScrollRange = Math.max(viewport * 0.5, 1);

			// El texto aparece cuando el hueco entre las fotos ya es tan ancho como él
			const widest = Array.from(centerText.children).reduce((max, element) => {
				const range = document.createRange();
				range.selectNodeContents(element);
				return Math.max(max, range.getBoundingClientRect().width);
			}, 0);
			const textRatio = Math.min((widest + 24) / window.innerWidth, 0.95);
			galleryTextStart = Math.max(0.1, textRatio - 0.12);
		}
	};

	const updateLayoutMetrics = () => {
		updateHeroMetrics();
		updateGalleryMetrics();
	};

	const updateHeroLetters = () => {
		const progress = Math.min(Math.max((window.scrollY - heroStart) / heroScrollRange, 0), 1);
		const heroStep = Math.round(progress * 12);

		if (heroStep !== lastHeroStep) {
			const nextActiveLetters = Math.ceil((heroStep / 12) * heroLetters.length);

			if (nextActiveLetters > activeHeroLetters) {
				for (let index = activeHeroLetters; index < nextActiveLetters; index += 1) {
					heroLetters[index]?.classList.add("is-active");
				}
			} else if (nextActiveLetters < activeHeroLetters) {
				for (let index = nextActiveLetters; index < activeHeroLetters; index += 1) {
					heroLetters[index]?.classList.remove("is-active");
				}
			}

			activeHeroLetters = nextActiveLetters;
			lastHeroStep = heroStep;
		}

		const shouldHighlightGlimmers = progress >= 0.08;
		if (glimmersWord && shouldHighlightGlimmers !== highlightedGlimmers) {
			glimmersWord.classList.toggle("is-highlighted", shouldHighlightGlimmers);
			highlightedGlimmers = shouldHighlightGlimmers;
		}
	};

	const updateGalleryScroll = () => {
		if (!gallerySection || !galleryBlock || !leftPhoto || !rightPhoto || !centerText) {
			return;
		}

		const scrollY = window.scrollY;
		const sectionTop = galleryStart;
		const sectionHeight = galleryScrollRange;

		if (scrollY > sectionTop && scrollY < (sectionTop + sectionHeight)) {
			const progress = (scrollY - sectionTop) / sectionHeight;
			leftPhoto.style.transform = `translateX(-${progress * 100}%)`;
			rightPhoto.style.transform = `translateX(${progress * 100}%)`;

			const textProgress = Math.min(Math.max((progress - galleryTextStart) / 0.12, 0), 1);
			centerText.style.opacity = String(textProgress);
			centerText.style.transform = `translateX(-50%) scale(${0.9 + (0.1 * textProgress)})`;
		} else if (scrollY >= (sectionTop + sectionHeight)) {
			// Pasado el tramo de la animación, las fotos quedan abiertas del todo
			leftPhoto.style.transform = "translateX(-100%)";
			rightPhoto.style.transform = "translateX(100%)";
			centerText.style.opacity = "1";
			centerText.style.transform = "translateX(-50%) scale(1)";
		} else if (scrollY < sectionTop) {
			leftPhoto.style.transform = "translateX(0)";
			rightPhoto.style.transform = "translateX(0)";
			centerText.style.opacity = "0";
			centerText.style.transform = "translateX(-50%) scale(0.9)";
		}
	};

	const updateScrollEffects = () => {
		scrollFrameId = null;
		updateHeroLetters();
		updateGalleryScroll();
	};

	const scheduleScrollEffects = () => {
		if (scrollFrameId !== null) {
			return;
		}

		scrollFrameId = window.requestAnimationFrame(updateScrollEffects);
	};

	window.addEventListener("scroll", scheduleScrollEffects, { passive: true });
	window.addEventListener("resize", () => {
		updateLayoutMetrics();
		scheduleScrollEffects();
	});
	updateLayoutMetrics();
	scheduleScrollEffects();
}

p
// Staff cards: aparición escalonada cuando llegan a la pantalla 

const staffCards = document.querySelector(".staff-cards");

if (staffCards && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
	const cards = staffCards.querySelectorAll(".staff-card");

	// Se oculta con JS; si JS falla, las cards se ven igualmente
	staffCards.classList.add("is-ready");

	const staffObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				cards.forEach((card) => card.classList.add("is-visible"));
				staffObserver.disconnect();
			}
		});
	}, { threshold: 0.15 });

	staffObserver.observe(staffCards);
}