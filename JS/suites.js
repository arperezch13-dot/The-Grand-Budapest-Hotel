
// 1. Aparición al hacer scroll 
const revealItems = document.querySelectorAll(".suites .reveal");

if (revealItems.length) {
	document.documentElement.classList.add("js-ready");

	if ("IntersectionObserver" in window) {
		const revealObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						revealObserver.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
		);

		revealItems.forEach((item) => revealObserver.observe(item));
	} else {
		// Navegadores antiguos: se muestra todo directamente
		revealItems.forEach((item) => item.classList.add("is-visible"));
	}
}

// Contador animado de los precios de la placa del hero
// Sube de 0 al precio final una sola vez; con "reducir movimiento" se salta.
const plaqueValues = document.querySelectorAll(".price-plaque__value[data-value]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (plaqueValues.length && !prefersReducedMotion) {
	plaqueValues.forEach((element) => {
		const finalValue = parseInt(element.dataset.value, 10);
		const duration = 900;
		const start = performance.now();

		const tick = (now) => {
			const progress = Math.min((now - start) / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);

			element.textContent = Math.round(finalValue * eased) + " €";

			if (progress < 1) {
				requestAnimationFrame(tick);
			}
		};

		requestAnimationFrame(tick);
	});
}