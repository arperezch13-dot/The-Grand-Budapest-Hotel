  // ─── STATE ───
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentYear = today.getFullYear();
        let currentMonth = today.getMonth();

        let checkIn = null;
        let checkOut = null;
        let selecting = 'in'; // 'in' | 'out'

        let selectedRoom = null;
        let selectedPrice = 0;

        let guests = { adults: 1, children: 0, rooms: 1 };

        // ─── UNAVAILABLE DATES ─── 
        const unavailableDates = new Set([
            formatDate(addDays(today, 3)),
            formatDate(addDays(today, 4)),
            formatDate(addDays(today, 10)),
            formatDate(addDays(today, 11)),
            formatDate(addDays(today, 12)),
        ]);

        function addDays(date, n) {
            const d = new Date(date);
            d.setDate(d.getDate() + n);
            return d;
        }

        function formatDate(d) {
            return d.toISOString().split('T')[0];
        }

        function parseDate(str) {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d);
        }

        function isUnavailable(d) {
            return unavailableDates.has(formatDate(d));
        }

        function isPast(d) {
            return d < today;
        }

        // ─── CALENDAR RENDER ───
        const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        function renderCalendar() {
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);

            document.getElementById('calMonthYear').textContent =
                MONTHS_ES[currentMonth] + ' ' + currentYear;

            // Disable prev if current month is this month
            const prevBtn = document.getElementById('prevMonthBtn');
            const isCurrentMonth = (currentYear === today.getFullYear() && currentMonth === today.getMonth());
            prevBtn.disabled = isCurrentMonth;

            // Day of week of first day (Mon=0)
            let startDow = firstDay.getDay(); // 0=Sun
            startDow = (startDow === 0) ? 6 : startDow - 1; // convert to Mon=0

            const grid = document.getElementById('calDates');
            grid.innerHTML = '';

            // Empty cells
            for (let i = 0; i < startDow; i++) {
                const empty = document.createElement('button');
                empty.className = 'cal-date empty';
                empty.disabled = true;
                grid.appendChild(empty);
            }

            for (let day = 1; day <= lastDay.getDate(); day++) {
                const d = new Date(currentYear, currentMonth, day);
                const btn = document.createElement('button');
                btn.textContent = day;
                btn.className = 'cal-date';

                const past = isPast(d);
                const unavail = isUnavailable(d);

                if (past || unavail) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.onclick = () => handleDateClick(d);
                }

                // Today marker
                if (formatDate(d) === formatDate(today)) {
                    btn.classList.add('today');
                }

                // Check-in / check-out / range
                if (checkIn && formatDate(d) === formatDate(checkIn)) {
                    btn.classList.add('check-in');
                }
                if (checkOut && formatDate(d) === formatDate(checkOut)) {
                    btn.classList.add('check-out');
                }
                if (checkIn && checkOut) {
                    if (d > checkIn && d < checkOut) {
                        btn.classList.add('in-range');
                    }
                }

                grid.appendChild(btn);
            }
        }

        function changeMonth(dir) {
            currentMonth += dir;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar();
        }

        // ─── DATE SELECTION ───
        function handleDateClick(d) {
            if (selecting === 'in') {
                checkIn = d;
                checkOut = null;
                selecting = 'out';
            } else {
                if (d <= checkIn) {
                    // Restart
                    checkIn = d;
                    checkOut = null;
                    selecting = 'out';
                } else {
                    // Check no unavailable dates in range
                    let hasBlock = false;
                    let cur = addDays(checkIn, 1);
                    while (cur < d) {
                        if (isUnavailable(cur)) { hasBlock = true; break; }
                        cur = addDays(cur, 1);
                    }
                    if (hasBlock) {
                        checkIn = d;
                        checkOut = null;
                        selecting = 'out';
                        document.getElementById('noAvailMsg').classList.add('visible');
                        setTimeout(() => document.getElementById('noAvailMsg').classList.remove('visible'), 4000);
                    } else {
                        checkOut = d;
                        selecting = 'in';
                        document.getElementById('noAvailMsg').classList.remove('visible');
                    }
                }
            }
            renderCalendar();
            updateSummary();
        }

        // ─── SUMMARY & TOTAL ───
        function updateSummary() {
            const ciEl = document.getElementById('checkinDisplay');
            const coEl = document.getElementById('checkoutDisplay');
            const nbEl = document.getElementById('nightsBadge');
            const ncEl = document.getElementById('nightsCount');
            const dsEl = document.getElementById('datesDisplay');

            if (checkIn) {
                ciEl.innerHTML = formatDisplay(checkIn);
            } else {
                ciEl.innerHTML = '<span class="empty">Sin seleccionar</span>';
            }

            if (checkOut) {
                coEl.innerHTML = formatDisplay(checkOut);
            } else {
                coEl.innerHTML = '<span class="empty">Sin seleccionar</span>';
            }

            if (checkIn && checkOut) {
                const nights = Math.round((checkOut - checkIn) / 86400000);
                ncEl.textContent = nights;
                nbEl.style.display = 'block';
                dsEl.textContent = formatShort(checkIn) + ' — ' + formatShort(checkOut) + ' ▾';
            } else {
                nbEl.style.display = 'none';
                dsEl.textContent = checkIn ? (formatShort(checkIn) + ' → ... ▾') : 'Selecciona fechas ▾';
            }

            updateTotal();
        }

        function formatDisplay(d) {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        }

        function formatShort(d) {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return d.getDate() + ' ' + months[d.getMonth()];
        }

        function updateTotal() {
            const nights = (checkIn && checkOut)
                ? Math.round((checkOut - checkIn) / 86400000) : 0;

            document.getElementById('totalNights').textContent = nights > 0 ? nights + ' noche' + (nights > 1 ? 's' : '') : '—';
            document.getElementById('totalPerNight').textContent = selectedPrice > 0 ? '€' + selectedPrice : '—';
            document.getElementById('totalRoomName').textContent = selectedRoom || '—';

            const total = nights * selectedPrice;
            document.getElementById('totalAmount').textContent = total > 0 ? '€' + total : '€0';

            const btn = document.getElementById('nextBtn');
            btn.disabled = !(checkIn && checkOut && selectedRoom);
        }

        // ─── ROOM SELECTION ───
        function selectRoom(el, name, price) {
            document.querySelectorAll('.room-option').forEach(r => r.classList.remove('selected'));
            el.classList.add('selected');
            selectedRoom = name;
            selectedPrice = price;
            updateTotal();
        }

        // ─── GUESTS ───
        function toggleGuestsDropdown() {
            const dd = document.getElementById('guestsDropdown');
            const ov = document.getElementById('guestsOverlay');
            const isOpen = dd.classList.contains('open');
            if (isOpen) {
                dd.classList.remove('open');
                ov.classList.remove('open');
            } else {
                dd.classList.add('open');
                ov.classList.add('open');
            }
        }

        function closeGuestsDropdown() {
            document.getElementById('guestsDropdown').classList.remove('open');
            document.getElementById('guestsOverlay').classList.remove('open');
        }

        document.getElementById('guestsSearchItem').addEventListener('click', function (e) {
            e.stopPropagation();
            toggleGuestsDropdown();
        });

        function changeGuests(type, delta) {
            guests[type] = Math.max(type === 'adults' || type === 'rooms' ? 1 : 0,
                guests[type] + delta);

            document.getElementById('adultsVal').textContent = guests.adults;
            document.getElementById('childrenVal').textContent = guests.children;
            document.getElementById('roomsVal').textContent = guests.rooms;

            // Update buttons
            document.getElementById('adultMinus').disabled = guests.adults <= 1;
            document.getElementById('childMinus').disabled = guests.children <= 0;
            document.getElementById('roomMinus').disabled = guests.rooms <= 1;

            const parts = [];
            parts.push(guests.rooms + ' hab');
            parts.push(guests.adults + ' adulto' + (guests.adults > 1 ? 's' : ''));
            if (guests.children > 0) parts.push(guests.children + ' niño' + (guests.children > 1 ? 's' : ''));
            document.getElementById('guestsDisplay').textContent = parts.join(', ') + ' ▾';
        }

        // ─── NEXT / MODAL ───
        function goToNext() {
            const nights = Math.round((checkOut - checkIn) / 86400000);
            const total = nights * selectedPrice;
            document.querySelector('#infoModal .modal-icon').textContent = '✅';
            document.querySelector('#infoModal .modal-title').textContent = '¡Reserva lista para confirmar!';
            document.querySelector('#infoModal .modal-text').innerHTML =
                `<strong>${selectedRoom}</strong><br>
        ${formatDisplay(checkIn)} → ${formatDisplay(checkOut)}<br>
        ${nights} noche${nights > 1 ? 's' : ''} · ${guests.adults} adulto${guests.adults > 1 ? 's' : ''}
        ${guests.children > 0 ? ' · ' + guests.children + ' niño' + (guests.children > 1 ? 's' : '') : ''}<br><br>
        <strong style="font-size:24px;color:#2d4a3e;">Total: €${total}</strong><br><br>
        Aquí continuaría con la selección de extras y el formulario de pago.`;
            document.querySelector('#infoModal .modal-close').textContent = 'Continuar';
            document.getElementById('infoModal').classList.add('open');
        }

        function showInfoModal() {
            document.querySelector('#infoModal .modal-icon').textContent = '🏨';
            document.querySelector('#infoModal .modal-title').textContent = 'The grand Budapest Hotel';
            document.querySelector('#infoModal .modal-text').innerHTML =
                `Situado en la bahía de Pomena, en el corazón del Parque Nacional de Mljet,
        el Hotel Odisej ofrece una experiencia única rodeada de naturaleza mediterránea,
        aguas cristalinas y pinares centenarios.<br><br>
        Check-in: 14:00 &nbsp;·&nbsp; Check-out: 11:00<br>
        ☎ +385 20 362 111`;
            document.querySelector('#infoModal .modal-close').textContent = 'Cerrar';
            document.getElementById('infoModal').classList.add('open');
        }

        function closeInfoModal() {
            document.getElementById('infoModal').classList.remove('open');
        }

        // Close modal on overlay click
        document.getElementById('infoModal').addEventListener('click', function (e) {
            if (e.target === this) closeInfoModal();
        });

        // ─── INIT ───
        renderCalendar();
        updateTotal();