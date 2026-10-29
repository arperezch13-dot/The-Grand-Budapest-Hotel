
//  Aparición al hacer scroll

const revealItems = document.querySelectorAll(".mendls .reveal");

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
		revealItems.forEach((item) => item.classList.add("is-visible"));
	}
}

// "Order for my suite" preselecciona la pieza en el formulario 

const orderSelect = document.getElementById("pastry");
const guestField = document.getElementById("guest");

document.querySelectorAll(".pastry__order[data-pastry]").forEach((link) => {
	link.addEventListener("click", () => {
		if (!orderSelect) {
			return;
		}

		orderSelect.value = link.dataset.pastry;

		// Espera a que termine el scroll suave antes de mover el foco
		window.setTimeout(() => guestField?.focus({ preventScroll: true }), 650);
	});
});

//  Formulario de pedido: mensaje de confirmación (sin servidor detrás)

const orderForm = document.querySelector(".order");
const orderStatus = document.querySelector(".order__status");

if (orderForm && orderStatus) {
	orderForm.addEventListener("submit", (event) => {
		event.preventDefault();

		const guest = guestField?.value.trim() || "dear guest";
		const pastry = orderSelect?.value || "your selection";
		const time = document.getElementById("time")?.value || "tea time";

		orderStatus.textContent =
			"Telegram sent, " + guest + ". " + pastry + " will reach your suite at " + time + ".";

		orderForm.reset();
	});
}