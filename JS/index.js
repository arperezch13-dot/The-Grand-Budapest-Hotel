

// Current time event listener para darle funcionalidad a los botones del carrousel
const video = document.getElementById("gbhvideo");
const buttons = document.querySelectorAll(".Mendls-btn");
const header = document.querySelector("header");
const navToggle = document.querySelector(".nav-toggle");
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

const syncNavToggle = () => {
	if (!header || !navToggle || !navIcon) {
		return;
	}

	const isOpen = header.classList.contains("nav-open");
	navToggle.setAttribute("aria-expanded", String(isOpen));
	navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
	navIcon.className = isOpen ? "ri-close-line" : "ri-menu-3-line";
};

if (header && navToggle) {
	navToggle.addEventListener("click", () => {
		header.classList.toggle("nav-open");
		syncNavToggle();
	});

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

	const updateHeroLetters = () => {
		const heroStart = heroSection.offsetTop;
		const scrollRange = Math.max(heroSection.offsetHeight * 0.18, window.innerHeight * 0.35, 1);
		const progress = Math.min(Math.max((window.scrollY - heroStart) / scrollRange, 0), 1);
		const activeLetters = Math.ceil(progress * heroLetters.length);// Calcula cuántas letras deben estar activas según el progreso. 

		heroLetters.forEach((letter, index) => {
			letter.classList.toggle("is-active", index < activeLetters); // Activa las letras según el progreso.
		});

		if (glimmersWord) {
			glimmersWord.classList.toggle("is-highlighted", progress >= 1);
		}
	};

	window.addEventListener("scroll", updateHeroLetters, { passive: true });
	window.addEventListener("resize", updateHeroLetters);
	updateHeroLetters();
}


// Scroll animation para la sección del staff

window.addEventListener('scroll', () => {

    const revealStage = document.querySelector('.gallery');
    const stickyContainer = document.querySelector('.gallery__block');
    const leftPhoto = document.querySelector('.gallery-image.left');
    const rightPhoto = document.querySelector('.gallery-image.right');
    const centerText = document.querySelector('.staff-text');

	if (!revealStage || !stickyContainer || !leftPhoto || !rightPhoto || !centerText) {
		return;
	}

    let scrollY = window.scrollY;
    let sectionTop = revealStage.offsetTop;
    let sectionHeight = revealStage.offsetHeight - window.innerHeight; 
    if (scrollY > sectionTop && scrollY < (sectionTop + sectionHeight)) {

        let progress = (scrollY - sectionTop) / sectionHeight; // Calcula el progreso del scroll dentro de la sección (0 a 1)

        leftPhoto.style.transform = `translateX(-${progress * 100}%)`;
        rightPhoto.style.transform = `translateX(${progress * 100}%)`;

		const textProgress = Math.min(Math.max((progress - 0.1) / 0.15, 0), 1);
		centerText.style.opacity = String(textProgress);
		centerText.style.transform = `translateX(-50%) scale(${0.9 + (0.1 * textProgress)})`; // Escala el texto de 0.9 a 1.0 a medida que se vuelve visible
    } else if (scrollY < sectionTop) {
        leftPhoto.style.transform = `translateX(0)`;
        rightPhoto.style.transform = `translateX(0)`;
        centerText.style.opacity = "0";
		centerText.style.transform = "translateX(-50%) scale(0.9)"; // Asegura que el texto esté en su estado inicial cuando no se ha scrolleado a la sección
    }
})

