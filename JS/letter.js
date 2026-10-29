// Aparición al hacer scroll
const revealItems = document.querySelectorAll(".letter .reveal");

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
			{ threshold: 0.05 }
		);

		revealItems.forEach((item) => revealObserver.observe(item));
	} else {
		// Navegadores antiguos: se muestra todo directamente
		revealItems.forEach((item) => item.classList.add("is-visible"));
	}
}

// Referencias al DOM
const form = document.getElementById("letterForm");
const guestName = document.getElementById("guestName");
const guestSuite = document.getElementById("guestSuite");
const guestMessage = document.getElementById("guestMessage");
const messageCount = document.getElementById("messageCount");
const sendBtn = document.getElementById("sendBtn");
const sendLabel = document.getElementById("sendLabel");
const letterDate = document.getElementById("letterDate");
const letterModal = document.getElementById("letterModal");
const letterModalText = document.getElementById("letterModalText");
const letterModalClose = document.getElementById("letterModalClose");
const dispatchNo = document.getElementById("dispatchNo");

const MIN_MESSAGE_LENGTH = 10;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Fecha del membrete
const today = new Date();
letterDate.textContent = `Nebelsbad, ${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

// Contador de caracteres
function updateCount() {
	messageCount.textContent = guestMessage.value.length;
}

guestMessage.addEventListener("input", updateCount);
updateCount();

// Validación
// Marca o desmarca un campo como inválido y muestra su mensaje
function setFieldError(input, errorId, hasError) {
	const wrapper = input.closest(".field");
	const error = document.getElementById(errorId);

	wrapper.classList.toggle("is-invalid", hasError);
	error.hidden = !hasError;
	input.setAttribute("aria-invalid", hasError ? "true" : "false");

	if (hasError) {
		input.setAttribute("aria-describedby", errorId);
	} else {
		input.removeAttribute("aria-describedby");
	}
}

// Devuelve el primer campo con error (o null si todo está bien)
function validate() {
	const nameBad = guestName.value.trim().length < 2;
	const suiteBad = guestSuite.value.trim().length < 2;
	const messageBad = guestMessage.value.trim().length < MIN_MESSAGE_LENGTH;

	setFieldError(guestName, "guestNameError", nameBad);
	setFieldError(guestSuite, "guestSuiteError", suiteBad);
	setFieldError(guestMessage, "guestMessageError", messageBad);

	if (nameBad) return guestName;
	if (suiteBad) return guestSuite;
	if (messageBad) return guestMessage;
	return null;
}

// Al escribir se quita el error de ese campo
[
	[guestName, "guestNameError"],
	[guestSuite, "guestSuiteError"],
	[guestMessage, "guestMessageError"],
].forEach(([input, errorId]) => {
	input.addEventListener("input", () => {
		if (input.closest(".field").classList.contains("is-invalid")) {
			setFieldError(input, errorId, false);
		}
	});
});

// Envío (simulado)
// Aquí se conectaría el servicio real (Formspree, EmailJS, tu propio servidor...).
function sendLetter(data) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(data), 900);
	});
}

// Número de despacho
function makeDispatchNumber() {
	const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
	const pick = () => letters[Math.floor(Math.random() * letters.length)];
	const digits = String(Math.floor(Math.random() * 900) + 100);
	return `1932-${pick()}${pick()}-${digits}`;
}

function openModal() {
	if (typeof letterModal.showModal === "function") {
		letterModal.showModal();
	} else {
		letterModal.setAttribute("open", "");
	}
}

function closeModal() {
	if (typeof letterModal.close === "function") {
		letterModal.close();
	} else {
		letterModal.removeAttribute("open");
	}
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const firstError = validate();
	if (firstError) {
		firstError.focus();
		return;
	}

	const data = {
		title: form.elements.title.value,
		name: guestName.value.trim(),
		suite: guestSuite.value.trim(),
		reason: form.elements.reason.value,
		message: guestMessage.value.trim(),
		sealedCopy: form.elements.copy.checked,
	};

	// Estado "sellando"
	sendBtn.disabled = true;
	sendBtn.classList.add("is-sealing");
	sendLabel.textContent = "Sealing...";

	try {
		await sendLetter(data);

		dispatchNo.textContent = makeDispatchNumber();
		letterModalText.textContent = data.sealedCopy
			? `Thank you, ${data.title} ${data.name}! Monsieur Gustave will read your letter personally, and Zero Moustafa will deliver a sealed copy to ${data.suite}.`
			: `Thank you, ${data.title} ${data.name}! Monsieur Gustave will read your letter personally and answer at his earliest convenience.`;

		openModal();

		// Se vacía la carta para poder escribir otra
		form.reset();
		updateCount();
	} catch (error) {
		sendLabel.textContent = "Try again";
		alert("The telegraph is down. Please try once more.");
	} finally {
		sendBtn.disabled = false;
		sendBtn.classList.remove("is-sealing");
		if (sendLabel.textContent !== "Try again") {
			sendLabel.textContent = "Seal & send";
		}
	}
});

letterModalClose.addEventListener("click", closeModal);

// Cierra el modal al pulsar fuera de la tarjeta
letterModal.addEventListener("click", (event) => {
	if (event.target === letterModal) {
		closeModal();
	}
});