// Aparición al hacer scroll
const revealItems = document.querySelectorAll(".checkin .reveal");

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

// Reservas de ejemplo
// Sustituir por una consulta real (fetch a tu servidor) cuando exista.
const BOOKINGS = {
	"GBH-1932-48": {
		lastName: "moustafa",
		suite: "The Mendl’s Suite",
		checkIn: "2026-11-14",
		checkOut: "2026-11-17",
		adults: 2,
		children: 0,
	},
	"GBH-1932-07": {
		lastName: "gustave",
		suite: "The Concierge Master",
		checkIn: "2026-12-02",
		checkOut: "2026-12-04",
		adults: 1,
		children: 0,
	},
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Referencias al DOM
const form = document.getElementById("checkinForm");
const bookingRef = document.getElementById("bookingRef");
const lastName = document.getElementById("lastName");
const findBtn = document.getElementById("findBtn");
const bookingError = document.getElementById("bookingError");
const bookingFound = document.getElementById("bookingFound");
const arrivalDate = document.getElementById("arrivalDate");
const arrivalTime = document.getElementById("arrivalTime");
const docNumber = document.getElementById("docNumber");
const rules = document.getElementById("rules");
const rulesError = document.getElementById("rulesError");
const completeBtn = document.getElementById("completeBtn");
const stepItems = document.querySelectorAll("#checkinSteps .checkin-steps__item");

const sumRef = document.getElementById("sumRef");
const sumSuite = document.getElementById("sumSuite");
const sumStay = document.getElementById("sumStay");
const sumArrival = document.getElementById("sumArrival");
const sumGuests = document.getElementById("sumGuests");

const modal = document.getElementById("checkinModal");
const modalCode = document.getElementById("checkinCode");
const modalText = document.getElementById("checkinModalText");
const modalClose = document.getElementById("checkinModalClose");

// Reserva encontrada (null hasta que se busca con éxito)
let currentBooking = null;

// Utilidades
// Convierte "2026-11-14" en "14 Nov" sin pasar por Date (evita desfases de zona horaria)
function formatShort(key) {
	const [, month, day] = key.split("-").map(Number);
	return `${day} ${MONTHS_SHORT[month - 1]}`;
}

function nightsBetween(a, b) {
	const [y1, m1, d1] = a.split("-").map(Number);
	const [y2, m2, d2] = b.split("-").map(Number);
	return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function pluralize(n, one, many) {
	return `${n} ${n === 1 ? one : many}`;
}

function getMode() {
	return form.elements.mode.value;
}

// Error de un campo
function setFieldError(input, errorId, hasError) {
	const wrapper = input.closest(".field");
	const error = document.getElementById(errorId);

	wrapper.classList.toggle("is-invalid", hasError);
	error.hidden = !hasError;
	input.setAttribute("aria-invalid", hasError ? "true" : "false");
}

// Resumen y pasos
function updateSummary() {
	const mode = getMode();
	const time = arrivalTime.value;

	if (currentBooking) {
		const b = currentBooking;
		const nights = nightsBetween(b.checkIn, b.checkOut);
		const guests = pluralize(b.adults, "adult", "adults") + (b.children ? `, ${pluralize(b.children, "child", "children")}` : "");

		sumRef.textContent = b.ref;
		sumSuite.textContent = b.suite;
		sumStay.textContent = `${formatShort(b.checkIn)} – ${formatShort(b.checkOut)} · ${pluralize(nights, "night", "nights")}`;
		sumGuests.textContent = guests;
	} else {
		sumRef.textContent = "—";
		sumSuite.textContent = "—";
		sumStay.textContent = "—";
		sumGuests.textContent = "—";
	}

	sumArrival.textContent = time ? `${mode} · ${time}` : mode;
	updateSteps();
}

// Marca los pasos del hero: completados y actual
function updateSteps() {
	const done = [
		Boolean(currentBooking),
		Boolean(currentBooking && arrivalDate.value && arrivalTime.value),
		Boolean(currentBooking && docNumber.value.trim().length >= 5),
	];

	let current = done.indexOf(false);
	if (current === -1) current = 2;

	stepItems.forEach((item, index) => {
		item.classList.toggle("is-done", done[index]);
		item.classList.toggle("is-current", index === current && !done[index]);
		if (index === current && !done[index]) {
			item.setAttribute("aria-current", "step");
		} else {
			item.removeAttribute("aria-current");
		}
	});
}

// Paso 1: buscar la reserva
function findBooking() {
	const ref = bookingRef.value.trim().toUpperCase();
	const name = lastName.value.trim().toLowerCase();
	const booking = BOOKINGS[ref];

	if (booking && booking.lastName === name) {
		currentBooking = { ...booking, ref };

		// El día de llegada solo puede estar dentro de la estancia
		arrivalDate.min = booking.checkIn;
		arrivalDate.max = booking.checkOut;
		arrivalDate.value = booking.checkIn;
		setFieldError(arrivalDate, "arrivalDateError", false);

		bookingError.hidden = true;
		bookingFound.hidden = false;
		bookingFound.textContent = `Booking found: ${booking.suite} · ${formatShort(booking.checkIn)} – ${formatShort(booking.checkOut)}`;
	} else {
		currentBooking = null;
		bookingFound.hidden = true;
		bookingError.hidden = false;
	}

	updateSummary();
}

findBtn.addEventListener("click", findBooking);

// Pulsar Enter en la referencia o en el apellido también busca la reserva
[bookingRef, lastName].forEach((input) => {
	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			findBooking();
		}
	});
});

// Si se cambia la referencia o el apellido, la reserva anterior deja de valer
[bookingRef, lastName].forEach((input) => {
	input.addEventListener("input", () => {
		if (currentBooking) {
			currentBooking = null;
			bookingFound.hidden = true;
			arrivalDate.value = "";
			updateSummary();
		}
	});
});

// Cualquier cambio en el formulario refresca el resumen
form.addEventListener("input", updateSummary);
form.addEventListener("change", updateSummary);

// Envío (simulado)
// Aquí se conectaría el servicio real (Formspree, tu servidor...).
// Debe devolver una promesa que se resuelva cuando el check-in esté guardado.
function sendCheckin(data) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(data), 900);
	});
}

function makeCode() {
	const digits = String(Math.floor(Math.random() * 9000) + 1000);
	return `GBH-${digits}`;
}

function openModal() {
	if (typeof modal.showModal === "function") {
		modal.showModal();
	} else {
		// Navegadores sin <dialog>: se usa el atributo open
		modal.setAttribute("open", "");
	}
}

function closeModal() {
	if (typeof modal.close === "function") {
		modal.close();
	} else {
		modal.removeAttribute("open");
	}
}

// Devuelve el primer campo con error (o null si todo está bien)
function validate() {
	const bookingBad = !currentBooking;
	const dateBad = !arrivalDate.value;
	const timeBad = !arrivalTime.value;
	const docBad = docNumber.value.trim().length < 5;
	const rulesBad = !rules.checked;

	bookingError.hidden = !bookingBad;
	setFieldError(arrivalDate, "arrivalDateError", dateBad);
	setFieldError(arrivalTime, "arrivalTimeError", timeBad);
	setFieldError(docNumber, "docNumberError", docBad);
	rulesError.hidden = !rulesBad;

	if (bookingBad) return bookingRef;
	if (dateBad) return arrivalDate;
	if (timeBad) return arrivalTime;
	if (docBad) return docNumber;
	if (rulesBad) return rules;
	return null;
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const firstError = validate();
	if (firstError) {
		firstError.focus();
		return;
	}

	const data = {
		ref: currentBooking.ref,
		lastName: lastName.value.trim(),
		mode: getMode(),
		date: arrivalDate.value,
		time: arrivalTime.value,
		docType: form.elements.docType.value,
		docNumber: docNumber.value.trim(),
		requests: form.elements.requests.value.trim(),
	};

	// Se desactiva el botón para evitar doble envío
	completeBtn.disabled = true;
	completeBtn.textContent = "Checking in...";

	try {
		await sendCheckin(data);

		modalCode.textContent = makeCode();
		modalText.textContent = `Welcome, ${data.lastName}. ${currentBooking.suite} will be ready on ${formatShort(data.date)}, and your key will be waiting when you arrive (${data.mode.toLowerCase()}, ${data.time}).`;
		openModal();

		// Se vacía el formulario para empezar de nuevo
		form.reset();
		currentBooking = null;
		bookingFound.hidden = true;
		arrivalDate.value = "";
		updateSummary();
	} catch (error) {
		alert("The telegraph is down. Please try once more.");
	} finally {
		completeBtn.disabled = false;
		completeBtn.textContent = "Complete check-in";
	}
});

modalClose.addEventListener("click", closeModal);

// Cierra el modal al pulsar fuera de la tarjeta
modal.addEventListener("click", (event) => {
	if (event.target === modal) {
		closeModal();
	}
});

updateSummary();