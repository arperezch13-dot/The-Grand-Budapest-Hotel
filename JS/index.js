

// Current time event listener para darle funcionalidad a los botones del carrousel
const video = document.getElementById("gbhvideo");
const buttons = document.querySelectorAll(".Mendls-btn");
const header = document.querySelector("header");
const navToggle = document.querySelector(".nav-toggle");
const navBackdrop = document.querySelector(".nav-backdrop");
const navIcon = navToggle ? navToggle.querySelector("i") : null;
const navLinks = document.querySelectorAll("#primary-navigation a");

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

// Menu toggle para dispositivos móviles y tablets

const syncNavToggle = () => {
	if (!header || !navToggle || !navIcon) {
		return;
	}

	const isOpen = header.classList.contains("nav-open");
	const isMobile = window.matchMedia("(max-width: 1024px)").matches;
	const navigation = document.querySelector("#primary-navigation");

	if (navigation && isMobile) {
		navigation.style.display = isOpen ? "flex" : "none";
	}

	if (navBackdrop && isMobile) {
		navBackdrop.style.display = isOpen ? "block" : "none";
	}

	if (header && isMobile) {
		const drawerShadow = document.querySelector(".drawer-shadow");
		if (drawerShadow) {
			drawerShadow.style.display = isOpen ? "block" : "none";
		}
	}

	navToggle.setAttribute("aria-expanded", String(isOpen));
	navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
	navIcon.className = isOpen ? "ri-close-line" : "ri-menu-3-line";
};

if (header && navToggle) {
	navToggle.addEventListener("click", () => {
		header.classList.toggle("nav-open");
		if (window.matchMedia("(max-width: 1024px)").matches) {
			const navigation = document.querySelector("#primary-navigation");
			const isOpen = header.classList.contains("nav-open");
			if (navigation) {
				navigation.style.display = isOpen ? "flex" : "none";
			}
			if (navBackdrop) {
				navBackdrop.style.display = isOpen ? "block" : "none";
			}
			const drawerShadow = document.querySelector(".drawer-shadow");
			if (drawerShadow) {
				drawerShadow.style.display = isOpen ? "block" : "none";
			}
		}
		syncNavToggle();
	});

	if (navBackdrop) {
		navBackdrop.addEventListener("click", () => {
			header.classList.remove("nav-open");
			syncNavToggle();
		});
	}

	navLinks.forEach((link) => {
		link.addEventListener("click", () => {
			if (window.matchMedia("(max-width: 1024px)").matches) {
				header.classList.remove("nav-open");
				syncNavToggle();
			}
		});
	});

	window.addEventListener("resize", () => {
		if (!window.matchMedia("(max-width: 1024px)").matches) {
			header.classList.remove("nav-open");
			syncNavToggle();
		}
	});

	window.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			header.classList.remove("nav-open");
			syncNavToggle();
		}
	});

	syncNavToggle();
}


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

			const textProgress = Math.min(Math.max((progress - 0.1) / 0.15, 0), 1);
			centerText.style.opacity = String(textProgress);
			centerText.style.transform = `translateX(-50%) scale(${0.9 + (0.1 * textProgress)})`;
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


// Scroll animation para las olas en la sección hero

if (pinkWave && purpleWave) {
	let waveFrameId = null;
	let pinkX = 0;
	let purpleX = 0;
	let lastWaveScrollY = window.scrollY;
	let pendingDelta = 0;
	const WAVE_LIMIT = 48;
	const WAVE_SCROLL_FACTOR = 0.22;

	const updateWaveScroll = () => {
		waveFrameId = null;

		if (pendingDelta === 0) {
			return;
		}

		const waveShift = pendingDelta * WAVE_SCROLL_FACTOR;
		pendingDelta = 0;

		pinkX = Math.max(-WAVE_LIMIT, Math.min(WAVE_LIMIT, pinkX + waveShift));
		purpleX = Math.max(-WAVE_LIMIT, Math.min(WAVE_LIMIT, purpleX + waveShift));

		pinkWave.style.transform = `translate3d(${pinkX}px, 0, 0)`;
		purpleWave.style.transform = `translate3d(${purpleX}px, 0, 0)`;
	};

	const scheduleWaveScroll = () => {
		if (waveFrameId !== null) {
			return;
		}

		waveFrameId = window.requestAnimationFrame(updateWaveScroll);
	};

	window.addEventListener("resize", () => {
		lastWaveScrollY = window.scrollY;
		scheduleWaveScroll();
	});
	window.addEventListener("scroll", () => {
		const currentScrollY = window.scrollY;
		pendingDelta += currentScrollY - lastWaveScrollY;
		lastWaveScrollY = currentScrollY;
		scheduleWaveScroll();
	}, { passive: true });
	scheduleWaveScroll();
}