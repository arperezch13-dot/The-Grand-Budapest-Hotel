//  Aparición al hacer scroll 
const revealItems = document.querySelectorAll(".booking .reveal");

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
			{ threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
		);

		revealItems.forEach((item) => revealObserver.observe(item));
	} else {
		// Navegadores antiguos: se muestra todo directamente
		revealItems.forEach((item) => item.classList.add("is-visible"));
	}
}

// Estado de la reserva 
const today = new Date();
today.setHours(0, 0, 0, 0);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const GUEST_LIMITS = {
	adults: { min: 1, max: 6 },
	children: { min: 0, max: 4 },
	suites: { min: 1, max: 3 },
};

let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); 
let checkIn = null;
let checkOut = null;
let selectedSuite = null; // { slug, name, price }
const guests = { adults: 2, children: 0, suites: 1 };

// Utilidades de fechas 
const pad = (n) => String(n).padStart(2, "0");

// Clave "AAAA-MM-DD" con la fecha local 

const toKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date, amount) => {
	const copy = new Date(date);
	copy.setDate(copy.getDate() + amount);
	return copy;
};

const nightsBetween = (from, to) => Math.round((to - from) / 86400000);

const formatLong = (date) =>
	`${DAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;

const formatShort = (date) => `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;

const formatPrice = (amount) => `${amount.toLocaleString("en-US")} €`;

// Fechas sin disponibilidad. DEMO: se generan a partir de hoy.

const unavailableDates = new Set(
	[3, 4, 10, 11, 12, 25, 26].map((offset) => toKey(addDays(today, offset)))
);

const isUnavailable = (date) => unavailableDates.has(toKey(date));
const isPast = (date) => date < today;

// Referencias al DOM 

const calMonths = document.getElementById("calMonths");
const rangeAlert = document.getElementById("rangeAlert");
const checkinText = document.getElementById("checkinText");
const checkoutText = document.getElementById("checkoutText");
const nightsCount = document.getElementById("nightsCount");
const nightsLabel = document.getElementById("nightsLabel");
const barSuite = document.getElementById("barSuite");
const barDates = document.getElementById("barDates");
const barGuests = document.getElementById("barGuests");
const barTotal = document.getElementById("barTotal");
const barTotalLabel = document.getElementById("barTotalLabel");
const checkinCell = document.getElementById("checkinCell");
const checkoutCell = document.getElementById("checkoutCell");
const stayTotal = document.getElementById("stayTotal");
const stayNote = document.getElementById("stayNote");
const guideSteps = document.querySelectorAll("#bookingGuide [data-step]");
const nextBtn = document.getElementById("nextBtn");
const modal = document.getElementById("modal");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
let alertTimer = null;

// Calendario  

// Botón pequeño de navegación (mes anterior / siguiente)
function createNavButton(direction, label, symbol, disabled) {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "cal__nav";
	button.dataset.nav = direction;
	button.setAttribute("aria-label", label);
	button.textContent = symbol;
	button.disabled = disabled;
	return button;
}

// Pinta un mes. "position" es 0 para el primero y 1 para el segundo
function createMonth(year, month, position) {
	const wrapper = document.createElement("div");
	wrapper.className = "cal__month";

	// Cabecera: botón anterior (solo en el primer mes) - nombre - botón siguiente (solo en el segundo)
	const head = document.createElement("div");
	head.className = "cal__head";

	const isCurrentView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

	if (position === 0) {
		head.append(createNavButton("-1", "Previous month", "‹", isCurrentView));
	} else {
		head.append(Object.assign(document.createElement("span"), { className: "cal__spacer" }));
	}

	const name = document.createElement("h3");
	name.className = "cal__name";
	name.textContent = `${MONTHS[month]} ${year}`;
	head.append(name);

	if (position === 1) {
		head.append(createNavButton("1", "Next month", "›", false));
	} else {
		head.append(Object.assign(document.createElement("span"), { className: "cal__spacer" }));
	}

	// Días de la semana
	const weekdays = document.createElement("div");
	weekdays.className = "cal__weekdays";
	weekdays.setAttribute("aria-hidden", "true");
	WEEKDAYS.forEach((day) => {
		const cell = document.createElement("span");
		cell.textContent = day;
		weekdays.append(cell);
	});

	// Cuadrícula de días 
	const grid = document.createElement("div");
	grid.className = "cal__grid";

	const firstDay = new Date(year, month, 1);
	const startOffset = (firstDay.getDay() + 6) % 7;
	const totalDays = new Date(year, month + 1, 0).getDate();

	for (let i = 0; i < startOffset; i++) {
		const empty = document.createElement("button");
		empty.type = "button";
		empty.className = "cal__day cal__day--empty";
		empty.disabled = true;
		empty.tabIndex = -1;
		empty.setAttribute("aria-hidden", "true");
		grid.append(empty);
	}

	for (let day = 1; day <= totalDays; day++) {
		const date = new Date(year, month, day);
		const key = toKey(date);
		const button = document.createElement("button");

		button.type = "button";
		button.className = "cal__day";
		button.textContent = day;
		button.dataset.date = key;
		button.setAttribute(
			"aria-label",
			date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
		);

		// Los días pasados se apagan; solo los ocupados salen tachados
		if (isPast(date)) {
			button.disabled = true;
			button.classList.add("cal__day--past");
		} else if (isUnavailable(date)) {
			button.disabled = true;
			button.classList.add("cal__day--off");
		}

		if (key === toKey(today)) {
			button.classList.add("cal__day--today");
		}

		const isStart = checkIn && key === toKey(checkIn);
		const isEnd = checkOut && key === toKey(checkOut);

		if (isStart) {
			button.classList.add("cal__day--start");
		}
		if (isEnd) {
			button.classList.add("cal__day--end");
		}
		if (isStart || isEnd) {
			button.setAttribute("aria-pressed", "true");
		}
		if (checkIn && checkOut && date > checkIn && date < checkOut) {
			button.classList.add("cal__day--range");
		}

		grid.append(button);
	}

	wrapper.append(head, weekdays, grid);
	return wrapper;
}

function renderCalendar() {
	calMonths.replaceChildren();

	const nextMonth = new Date(viewYear, viewMonth + 1, 1);

	calMonths.append(
		createMonth(viewYear, viewMonth, 0),
		createMonth(nextMonth.getFullYear(), nextMonth.getMonth(), 1)
	);
}

function changeMonth(direction) {
	const target = new Date(viewYear, viewMonth + direction, 1);
	viewYear = target.getFullYear();
	viewMonth = target.getMonth();
	renderCalendar();
}

// Botones del calendario 

calMonths.addEventListener("click", (event) => {
	const navButton = event.target.closest("[data-nav]");

	if (navButton) {
		changeMonth(Number(navButton.dataset.nav));
		return;
	}

	const dayButton = event.target.closest("[data-date]");

	if (dayButton) {
		const [year, month, day] = dayButton.dataset.date.split("-").map(Number);
		handleDateClick(new Date(year, month - 1, day));
	}
});

// Vista previa del rango: al elegir la salida, se pintan las noches al pasar el ratón
function clearPreview() {
	calMonths.querySelectorAll(".cal__day--preview").forEach((day) => day.classList.remove("cal__day--preview"));
}

calMonths.addEventListener("mouseover", (event) => {
	clearPreview();

	const dayButton = event.target.closest("[data-date]");

	if (!dayButton || !checkIn || checkOut || dayButton.disabled) {
		return;
	}

	const [year, month, day] = dayButton.dataset.date.split("-").map(Number);
	const hovered = new Date(year, month - 1, day);

	if (hovered <= checkIn || hasUnavailableNight(checkIn, hovered)) {
		return;
	}

	// Las claves "AAAA-MM-DD" se pueden comparar como texto
	calMonths.querySelectorAll("[data-date]").forEach((day) => {
		if (day.dataset.date > toKey(checkIn) && day.dataset.date < dayButton.dataset.date) {
			day.classList.add("cal__day--preview");
		}
	});
});

calMonths.addEventListener("mouseleave", clearPreview);

// Selección de llegada y salida 
function showRangeAlert() {
	rangeAlert.hidden = false;
	window.clearTimeout(alertTimer);
	alertTimer = window.setTimeout(() => {
		rangeAlert.hidden = true;
	}, 4500);
}

function hasUnavailableNight(from, to) {
	let current = addDays(from, 1);

	while (current < to) {
		if (isUnavailable(current)) {
			return true;
		}
		current = addDays(current, 1);
	}

	return false;
}

function handleDateClick(date) {
	rangeAlert.hidden = true;

	if (!checkIn || checkOut) {
		// Empieza una selección nueva
		checkIn = date;
		checkOut = null;
	} else if (date <= checkIn) {
		// Clic en una fecha anterior: se toma como nueva llegada
		checkIn = date;
	} else if (hasUnavailableNight(checkIn, date)) {
		// Hay noches ocupadas en medio: se avisa y se empieza desde esta fecha
		checkIn = date;
		showRangeAlert();
	} else {
		checkOut = date;
	}

	renderCalendar();
	updateSummary();
}

//  Suites 

const suiteInputs = document.querySelectorAll('input[name="suite"]');

function selectSuite(input) {
	selectedSuite = {
		slug: input.value,
		name: input.dataset.name,
		price: Number(input.dataset.price),
	};

	suiteInputs.forEach((item) => {
		item.closest(".pick").classList.toggle("is-selected", item === input);
	});

	updateSummary();
}

suiteInputs.forEach((input) => {
	input.addEventListener("change", () => selectSuite(input));
});

// Si llegas desde Suites & Tariffs esa suite sale elegida
const requestedSuite = new URLSearchParams(window.location.search).get("suite");

if (requestedSuite) {
	const match = [...suiteInputs].find((input) => input.value === requestedSuite);

	if (match) {
		match.checked = true;
		selectSuite(match);
	}
}

// Huéspedes 
const guestButtons = document.querySelectorAll("[data-guest]");

function renderGuests() {
	Object.keys(guests).forEach((type) => {
		document.getElementById(`${type}Value`).textContent = guests[type];
	});

	guestButtons.forEach((button) => {
		const limits = GUEST_LIMITS[button.dataset.guest];
		const value = guests[button.dataset.guest];
		const step = Number(button.dataset.step);

		button.disabled = (step < 0 && value <= limits.min) || (step > 0 && value >= limits.max);
	});
}

guestButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const type = button.dataset.guest;
		const limits = GUEST_LIMITS[type];

		guests[type] = Math.min(limits.max, Math.max(limits.min, guests[type] + Number(button.dataset.step)));
		renderGuests();
		updateSummary();
	});
});

// Texto de huéspedes: "2 adults · 1 child · 2 suites"
function guestsText() {
	const parts = [`${guests.adults} adult${guests.adults > 1 ? "s" : ""}`];

	if (guests.children > 0) {
		parts.push(`${guests.children} child${guests.children > 1 ? "ren" : ""}`);
	}
	if (guests.suites > 1) {
		parts.push(`${guests.suites} suites`);
	}

	return parts.join(" · ");
}

// Resumen y total 

function updateSummary() {
	const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
	const total = selectedSuite ? nights * selectedSuite.price * guests.suites : 0;

	// Llegada y salida: la celda que toca rellenar lleva un filo dorado
	checkinText.textContent = checkIn ? formatLong(checkIn) : "Choose a date";
	checkoutText.textContent = checkOut ? formatLong(checkOut) : checkIn ? "Now pick your departure" : "Choose a date";
	checkinCell.classList.toggle("is-next", !checkIn);
	checkoutCell.classList.toggle("is-next", Boolean(checkIn) && !checkOut);

	// Guía de dos pasos sobre el calendario
	guideSteps.forEach((step) => {
		const isIn = step.dataset.step === "in";
		step.classList.toggle("is-done", isIn ? Boolean(checkIn) : Boolean(checkOut));
		step.classList.toggle("is-active", isIn ? !checkIn : Boolean(checkIn) && !checkOut);
	});

	// Total en la tarjeta dorada
	nightsCount.textContent = nights;
	nightsLabel.textContent = nights === 1 ? "night" : "nights";

	if (nights > 0 && selectedSuite) {
		stayTotal.textContent = formatPrice(total);
		stayNote.textContent = `${formatPrice(selectedSuite.price)} × ${nights} night${nights > 1 ? "s" : ""}${guests.suites > 1 ? ` × ${guests.suites} suites` : ""}`;
	} else if (selectedSuite) {
		stayTotal.textContent = `${formatPrice(selectedSuite.price)} / night`;
		stayNote.textContent = "Pick your dates to see the total";
	} else {
		stayTotal.textContent = "—";
		stayNote.textContent = nights > 0 ? "Choose a suite to see the price" : "Choose your dates and a suite";
	}

	// Barra inferior
	barSuite.textContent = selectedSuite ? selectedSuite.name : "Choose a suite";
	barGuests.textContent = guestsText();

	if (checkIn && checkOut) {
		barDates.textContent = `${formatShort(checkIn)} – ${formatShort(checkOut)} · ${nights} night${nights > 1 ? "s" : ""}`;
	} else if (checkIn) {
		barDates.textContent = `${formatShort(checkIn)} → now pick your departure`;
	} else {
		barDates.textContent = "Pick your arrival date";
	}

	// Total de la barra: sin fechas muestra el precio por noche
	if (nights > 0 && selectedSuite) {
		barTotalLabel.textContent = "Total";
		barTotal.textContent = formatPrice(total);
	} else if (selectedSuite) {
		barTotalLabel.textContent = "Per night";
		barTotal.textContent = formatPrice(selectedSuite.price);
	} else {
		barTotalLabel.textContent = "Total";
		barTotal.textContent = "—";
	}

	nextBtn.disabled = !(checkIn && checkOut && selectedSuite);
}

//  Modal (info del hotel y confirmación) 

function fillModal(eyebrow, title, lines, closeLabel) {
	modalEyebrow.textContent = eyebrow;
	modalTitle.textContent = title;
	modalClose.textContent = closeLabel;
	modalText.replaceChildren();

	lines.forEach((line) => {
		const paragraph = document.createElement("p");
		paragraph.textContent = line.text;

		if (line.className) {
			paragraph.className = line.className;
		}

		modalText.append(paragraph);
	});
}

function openModal() {
	if (typeof modal.showModal === "function") {
		modal.showModal();
	} else {
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

document.getElementById("openInfo").addEventListener("click", () => {
	fillModal(
		"The hotel",
		"The Grand Budapest Hotel",
		[{ text: "Check-in from 14:00 · Check-out until 11:00" }, { text: "Tel. +00 123 456 789" }],
		"Close"
	);
	openModal();
});

nextBtn.addEventListener("click", () => {
	if (!(checkIn && checkOut && selectedSuite)) {
		return;
	}

	const nights = nightsBetween(checkIn, checkOut);
	const total = nights * selectedSuite.price * guests.suites;

	fillModal(
		"Almost there",
		"Your stay is ready",
		[
			{ text: selectedSuite.name },
			{ text: `${formatLong(checkIn)} → ${formatLong(checkOut)}` },
			{ text: `${nights} night${nights > 1 ? "s" : ""} · ${guestsText()}` },
			{ text: formatPrice(total), className: "booking-modal__total" },
			{ text: "The extras and payment steps come next." },
		],
		"Continue"
	);
	openModal();
});

modalClose.addEventListener("click", closeModal);

// Clic en el fondo oscuro cierra el modal

modal.addEventListener("click", (event) => {
	if (event.target === modal) {
		closeModal();
	}
});

// Arranque 

renderCalendar();
renderGuests();
updateSummary();