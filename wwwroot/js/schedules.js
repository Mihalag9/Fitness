const API_URL = '/api/Schedules';

let allTrainers = [];
let allWorkouts = [];
let allGyms = [];
let allTypes = [];

let selectedModalTrainerId = null;
let selectedModalWorkoutId = null;
let selectedModalGymId = null;
let selectedModalDuration = 0;
let modalWorkoutList = [];
let modalGymList = [];

let modalTrainerDropdownIndex = -1;
let modalWorkoutDropdownIndex = -1;
let modalGymDropdownIndex = -1;

let filterTrainerDropdownIndex = -1;
let filterGymDropdownIndex = -1;
let filterWorkoutDropdownIndex = -1;

const PAGE_SIZE = 10;
let currentPage = 1;
let currentEditId = null;

const tbody = document.getElementById('schedules-body');
const totalSpan = document.getElementById('total-count');
const groupSpan = document.getElementById('group-count');
const individualSpan = document.getElementById('individual-count');
const trainersCountSpan = document.getElementById('trainers-count');

const modal = document.getElementById('schedule-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const addBtn = document.getElementById('add-schedule-btn');

const modalTrainerInput = document.getElementById('modal-trainer-input');
const modalTrainerDropdown = document.getElementById('modal-trainer-dropdown');
const modalWorkoutInput = document.getElementById('modal-workout-input');
const modalWorkoutDropdown = document.getElementById('modal-workout-dropdown');
const modalGymInput = document.getElementById('modal-gym-input');
const modalGymDropdown = document.getElementById('modal-gym-dropdown');
const modalTypeSelect = document.getElementById('modal-type-select');
const modalDate = document.getElementById('modal-date');
const modalStartTime = document.getElementById('modal-startTime');
const modalEndTime = document.getElementById('modal-endTime');

const filterTrainerInput = document.getElementById('filter-trainer');
const filterTrainerDropdown = document.getElementById('filter-trainer-dropdown');
const filterGymInput = document.getElementById('filter-gym');
const filterGymDropdown = document.getElementById('filter-gym-dropdown');
const filterWorkoutInput = document.getElementById('filter-workout');
const filterWorkoutDropdown = document.getElementById('filter-workout-dropdown');
const filterTypeSelect = document.getElementById('filter-type');
const filterDateFrom = document.getElementById('filter-dateFrom');
const filterDateTo = document.getElementById('filter-dateTo');
const filterClientInput = document.getElementById('filter-client');
const filterClientDropdown = document.getElementById('filter-client-dropdown');
const applyBtn = document.getElementById('apply-filters');
const clearBtn = document.getElementById('clear-filters');

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        trainerName: filterTrainerInput.value,
        gymName: filterGymInput.value,
        workoutName: filterWorkoutInput.value,
        workoutTypeId: filterTypeSelect.value,
        dateFrom: filterDateFrom.value,
        dateTo: filterDateTo.value,
        clientName: filterClientInput.value
    };
}

function restoreFiltersToDOM() {
    filterTrainerInput.value = appliedFilters.trainerName || '';
    filterGymInput.value = appliedFilters.gymName || '';
    filterWorkoutInput.value = appliedFilters.workoutName || '';
    filterTypeSelect.value = appliedFilters.workoutTypeId || '';
    filterDateFrom.value = appliedFilters.dateFrom || '';
    filterDateTo.value = appliedFilters.dateTo || '';
    filterClientInput.value = appliedFilters.clientName || '';
}

function clearAllFilters() {
    appliedFilters = {};
    filterTrainerInput.value = '';
    filterGymInput.value = '';
    filterWorkoutInput.value = '';
    filterTypeSelect.value = '';
    filterDateFrom.value = '';
    filterDateTo.value = '';
    filterClientInput.value = '';
}

function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function setModalDateLimits() {
    const today = new Date();
    const max = new Date();
    max.setDate(today.getDate() + 7);
    modalDate.min = formatDate(today);
    modalDate.max = formatDate(max);
    if (!modalDate.value) modalDate.value = formatDate(today);
}

function calculateEndTime() {
    if (!modalStartTime.value || !selectedModalDuration) {
        modalEndTime.value = '';
        return;
    }
    const parts = modalStartTime.value.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const totalMin = h * 60 + m + selectedModalDuration;
    if (totalMin > 23 * 60) {
        modalEndTime.value = '23:00+';
        return;
    }
    const eh = Math.floor(totalMin / 60);
    const em = totalMin % 60;
    modalEndTime.value = String(eh).padStart(2, '0') + ':' + String(em).padStart(2, '0');
}

function openModal() { modal.classList.add('show'); }
function closeModal() {
    modal.classList.remove('show');
    resetModal();
}

function resetModal() {
    modalTrainerInput.value = '';
    modalWorkoutInput.value = '';
    modalGymInput.value = '';
    modalTypeSelect.selectedIndex = 0;
    modalDate.value = '';
    modalStartTime.value = '';
    modalEndTime.value = '';
    selectedModalTrainerId = null;
    selectedModalWorkoutId = null;
    selectedModalGymId = null;
    selectedModalDuration = 0;
    modalWorkoutList.length = 0;
    modalGymList.length = 0;
    editIdField.value = '';
    currentEditId = null;
    setModalDateLimits();
    modalTrainerInput.disabled = false;
    modalWorkoutInput.disabled = true;
    modalGymInput.disabled = true;
    modalTypeSelect.disabled = false;
    modalDate.disabled = false;
    modalStartTime.disabled = false;
}

function openCreateModal() {
    resetModal();
    modalTitle.textContent = 'Добавить запись';
    submitBtn.textContent = 'Добавить';
    openModal();
}

function openEditModal(item) {
    resetModal();
    modalTitle.textContent = 'Редактировать запись';
    submitBtn.textContent = 'Сохранить';
    editIdField.value = item.scheduleId;
    currentEditId = item.scheduleId;
    modalTrainerInput.value = item.trainerName || '';
    selectedModalTrainerId = item.trainerId;
    modalWorkoutInput.value = item.workoutName;
    selectedModalWorkoutId = item.workoutId;
    selectedModalDuration = item.durationMinutes;
    modalWorkoutInput.disabled = true;
    modalGymInput.disabled = false;
    modalGymInput.value = item.gymName;
    selectedModalGymId = item.gymId;
    modalTypeSelect.value = item.workoutTypeId;
    modalTypeSelect.disabled = true;
    modalDate.value = item.workDate.split('T')[0];
    modalStartTime.value = item.startTime.substring(0, 5);
    calculateEndTime();
    fetchGymsByWorkout(item.workoutId);
    openModal();
}

function renderSchedulesPage() {
    tbody.innerHTML = '';
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = currentScheduleItems.slice(start, start + PAGE_SIZE);
    pageItems.forEach(item => {
        const row = tbody.insertRow();
        row.style.cursor = 'pointer';
        row.onclick = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
            selectSchedule(item);
        };
        row.insertCell(0).textContent = item.scheduleId;
        row.insertCell(1).textContent = item.trainerName || '—';
        row.insertCell(2).textContent = item.workoutName;
        row.insertCell(3).textContent = item.gymName;
        row.insertCell(4).textContent = item.workoutTypeName;
        const dateCell = row.insertCell(5);
        const d = new Date(item.workDate);
        dateCell.textContent = d.toLocaleDateString('ru-RU');
        row.insertCell(6).textContent = item.startTime.substring(0, 5);
        row.insertCell(7).textContent = item.endTime.substring(0, 5);
        const actionsCell = row.insertCell(8);
        const bookingsBtn = document.createElement('button');
        bookingsBtn.textContent = '\uD83D\uDC65';
        bookingsBtn.title = 'Записи на занятие';
        bookingsBtn.onclick = (e) => { e.stopPropagation(); selectSchedule(item); };
        const editBtn = document.createElement('button');
        editBtn.textContent = '\u270F\uFE0F';
        editBtn.title = 'Редактировать';
        editBtn.onclick = (e) => { e.stopPropagation(); openEditModal(item); };
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '\uD83D\uDDD1\uFE0F';
        deleteBtn.title = 'Удалить';
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteSchedule(item.scheduleId); };
        actionsCell.appendChild(bookingsBtn);
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function renderSchedulesPagination() {
    const totalPages = Math.max(1, Math.ceil(currentScheduleItems.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    document.getElementById('schedules-page-info').textContent = `${currentPage} / ${totalPages} (${currentScheduleItems.length})`;
    document.getElementById('schedules-prev-btn').disabled = currentPage <= 1;
    document.getElementById('schedules-next-btn').disabled = currentPage >= totalPages;
}

function renderTable(items) {
    currentScheduleItems = items;
    currentPage = 1;
    renderSchedulesPage();
    renderSchedulesPagination();
}

function renderStats(stats) {
    totalSpan.textContent = stats.totalSchedules || 0;
    groupSpan.textContent = stats.groupWorkouts || 0;
    individualSpan.textContent = stats.individualWorkouts || 0;
    trainersCountSpan.textContent = stats.trainersCount || 0;
}

function renderTypeOptions(types, selectEl, includeAll) {
    selectEl.innerHTML = '';
    if (includeAll) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Все типы';
        selectEl.appendChild(opt);
    }
    types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.workoutTypeId;
        opt.textContent = t.typeName;
        selectEl.appendChild(opt);
    });
}

function cacheDictionaries(data) {
    allTrainers = data.trainers || [];
    allWorkouts = data.workouts || [];
    allGyms = data.gyms || [];
    allTypes = data.workoutTypes || [];
    allClients = data.clients || [];
}

async function renderPage() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.trainerName) params.append('trainerName', appliedFilters.trainerName.trim());
        if (appliedFilters.gymName) params.append('gymName', appliedFilters.gymName.trim());
        if (appliedFilters.workoutName) params.append('workoutName', appliedFilters.workoutName.trim());
        if (appliedFilters.workoutTypeId) params.append('workoutTypeId', appliedFilters.workoutTypeId);
        if (appliedFilters.dateFrom) params.append('dateFrom', appliedFilters.dateFrom);
        if (appliedFilters.dateTo) params.append('dateTo', appliedFilters.dateTo);
        if (appliedFilters.clientName) params.append('clientName', appliedFilters.clientName.trim());

        const url = params.toString() ? `${API_URL}/page-data?${params.toString()}` : `${API_URL}/page-data`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        cacheDictionaries(data);
        renderTable(data.items);
        renderStats(data.statistics);
        renderTypeOptions(allTypes, filterTypeSelect, true);
        renderTypeOptions(allTypes, modalTypeSelect, false);

        if (selectedScheduleId) {
            if (!data.items.find(i => i.scheduleId === selectedScheduleId)) {
                selectedScheduleId = null;
                bookingsModal.classList.remove('show');
            }
        }
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

async function createSchedule() {
    if (!validateForm()) return false;
    const dto = buildDto();
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }
        closeModal();
        await renderPage();
        showToast(data?.message || 'Запись добавлена', 'success');
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

async function updateSchedule(id) {
    if (!validateForm()) return false;
    const dto = buildDto();
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }
        closeModal();
        await renderPage();
        showToast(data?.message || 'Запись обновлена', 'success');
        return true;
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

async function deleteSchedule(id) {
    if (!confirm('Удалить эту запись?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }
        await renderPage();
        showToast(data?.message || 'Запись удалена', 'success');
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

function validateForm() {
    if (!selectedModalWorkoutId) { showToast('Выберите тренировку'); return false; }
    if (!selectedModalGymId) { showToast('Выберите зал'); return false; }
    if (!modalTypeSelect.value) { showToast('Выберите тип тренировки'); return false; }
    if (!modalDate.value) { showToast('Укажите дату'); return false; }
    if (!modalStartTime.value) { showToast('Укажите время начала'); return false; }

    const timeParts = modalStartTime.value.split(':');
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    const totalMin = h * 60 + m;
    if (totalMin < 8 * 60 || totalMin >= 23 * 60) {
        showToast('Время начала должно быть от 08:00 до 22:59');
        return false;
    }

    if (selectedModalDuration) {
        const endMin = totalMin + selectedModalDuration;
        if (endMin > 23 * 60) {
            showToast('Время окончания выходит за пределы 23:00');
            return false;
        }
    }

    return true;
}

function buildDto() {
    return {
        trainerId: selectedModalTrainerId || null,
        workoutId: selectedModalWorkoutId,
        gymId: selectedModalGymId,
        workoutTypeId: parseInt(modalTypeSelect.value),
        workDate: modalDate.value,
        startTime: modalStartTime.value + ':00'
    };
}

function onFormSubmit() {
    if (currentEditId !== null) {
        updateSchedule(currentEditId);
    } else {
        createSchedule();
    }
}

function setupAutocomplete(input, dropdown, items, onSelect, getLabel) {
    let dropdownIndex = -1;

    function getFiltered(query) {
        if (!query) return items.slice();
        const q = query.toLowerCase().trim();
        return items.filter(i => getLabel(i).toLowerCase().includes(q));
    }

    function render(filtered) {
        dropdown.innerHTML = '';
        if (filtered.length === 0) {
            const div = document.createElement('div');
            div.className = 'dropdown-item no-results';
            div.textContent = 'Ничего не найдено';
            dropdown.appendChild(div);
            return;
        }
        filtered.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            if (i === dropdownIndex) div.classList.add('active');
            div.textContent = getLabel(item);
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = getLabel(item);
                onSelect(item);
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(div);
        });
    }

    input.addEventListener('focus', () => {
        const filtered = getFiltered(input.value.trim());
        render(filtered);
        if (filtered.length > 0) dropdown.classList.add('show');
    });

    input.addEventListener('input', () => {
        dropdownIndex = -1;
        onSelect(null);
        const filtered = getFiltered(input.value.trim());
        render(filtered);
        if (filtered.length > 0) dropdown.classList.add('show');
        else dropdown.classList.remove('show');
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length > 0) {
                dropdownIndex = Math.min(dropdownIndex + 1, items.length - 1);
                render(getFiltered(input.value.trim()));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length > 0) {
                dropdownIndex = Math.max(dropdownIndex - 1, 0);
                render(getFiltered(input.value.trim()));
            }
        } else if ((e.key === 'Enter' || e.key === 'Tab') && dropdownIndex >= 0 && dropdownIndex < items.length) {
            e.preventDefault();
            items[dropdownIndex].dispatchEvent(new Event('mousedown'));
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });

    input.addEventListener('blur', () => setTimeout(() => dropdown.classList.remove('show'), 200));

    return { refresh: () => render(getFiltered(input.value.trim())) };
}

let modalTrainerAC, modalWorkoutAC, modalGymAC;
let filterTrainerAC, filterGymAC, filterWorkoutAC, filterClientAC;

async function fetchWorkoutsByTrainer(trainerId) {
    try {
        const response = await fetch(`/api/Trainers/${trainerId}/roles`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const roles = await response.json();
        modalWorkoutList.length = 0;
        roles.forEach(r => {
            const full = allWorkouts.find(w => w.workoutId === r.workoutId);
            modalWorkoutList.push({
                workoutId: r.workoutId,
                workoutName: r.workoutName,
                durationMinutes: full ? full.durationMinutes : 0,
                maxParticipants: full ? full.maxParticipants : 0
            });
        });
        if (modalWorkoutAC) modalWorkoutAC.refresh();
    } catch (err) {
        showToast(`Ошибка загрузки тренировок: ${err.message}`);
    }
}

async function fetchGymsByWorkout(workoutId) {
    try {
        const response = await fetch(`/api/Workouts/${workoutId}/gyms`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const gyms = await response.json();
        modalGymList.length = 0;
        gyms.forEach(g => {
            modalGymList.push({
                gymId: g.gymId,
                gymName: g.gymName
            });
        });
        if (modalGymAC) modalGymAC.refresh();
    } catch (err) {
        showToast(`Ошибка загрузки залов: ${err.message}`);
    }
}

function initAutocompletes() {
    modalTrainerAC = setupAutocomplete(
        modalTrainerInput, modalTrainerDropdown, allTrainers,
        (item) => {
            selectedModalTrainerId = item ? item.trainerId : null;
            selectedModalWorkoutId = null;
            selectedModalGymId = null;
            selectedModalDuration = 0;
            modalWorkoutInput.value = '';
            modalGymInput.value = '';
            modalEndTime.value = '';
            modalWorkoutList.length = 0;
            modalGymList.length = 0;
            if (modalWorkoutAC) modalWorkoutAC.refresh();
            if (modalGymAC) modalGymAC.refresh();
            if (item) {
                modalWorkoutInput.disabled = false;
                modalGymInput.disabled = true;
                fetchWorkoutsByTrainer(item.trainerId);
            } else {
                modalWorkoutInput.disabled = true;
                modalGymInput.disabled = true;
            }
        },
        (item) => item.fullName
    );
    modalWorkoutAC = setupAutocomplete(
        modalWorkoutInput, modalWorkoutDropdown, modalWorkoutList,
        (item) => {
            selectedModalWorkoutId = item ? item.workoutId : null;
            selectedModalDuration = item ? item.durationMinutes : 0;
            calculateEndTime();
            selectedModalGymId = null;
            modalGymInput.value = '';
            modalGymList.length = 0;
            if (modalGymAC) modalGymAC.refresh();
            if (item) {
                modalGymInput.disabled = false;
                fetchGymsByWorkout(item.workoutId);
            } else {
                modalGymInput.disabled = true;
            }
        },
        (item) => item.workoutName
    );
    modalGymAC = setupAutocomplete(
        modalGymInput, modalGymDropdown, modalGymList,
        (item) => { selectedModalGymId = item ? item.gymId : null; },
        (item) => item.gymName
    );

    filterTrainerAC = setupAutocomplete(
        filterTrainerInput, filterTrainerDropdown, allTrainers,
        () => {}, (item) => item.fullName
    );
    filterGymAC = setupAutocomplete(
        filterGymInput, filterGymDropdown, allGyms,
        () => {}, (item) => item.gymName
    );
    filterWorkoutAC = setupAutocomplete(
        filterWorkoutInput, filterWorkoutDropdown, allWorkouts,
        () => {}, (item) => item.workoutName
    );
    filterClientAC = setupAutocomplete(
        filterClientInput, filterClientDropdown, allClients,
        () => {}, (item) => item.fullName
    );
}

modalStartTime.addEventListener('change', calculateEndTime);

// ---- Пагинация расписания ----
document.getElementById('schedules-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderSchedulesPage(); renderSchedulesPagination(); }
});
document.getElementById('schedules-next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(currentScheduleItems.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderSchedulesPage(); renderSchedulesPagination(); }
});

submitBtn.addEventListener('click', onFormSubmit);
cancelBtn.addEventListener('click', closeModal);
addBtn.addEventListener('click', openCreateModal);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

applyBtn.addEventListener('click', () => { snapshotFilters(); currentPage = 1; renderPage(); showToast('Фильтры применены', 'info'); });
clearBtn.addEventListener('click', () => { clearAllFilters(); currentPage = 1; renderPage(); showToast('Фильтры сброшены', 'info'); });

// ==========================================
// ЗАПИСИ НА ЗАНЯТИЯ (BOOKINGS)
// ==========================================

let allClients = [];
let bookedClientsForFilter = [];
let selectedScheduleId = null;
let allBookings = [];
let filteredBookings = [];
let bookingPage = 1;
const BOOKINGS_PER_PAGE = 5;
let bookingFilterClientName = '';
let bookingFilterAttended = '';

const bookingsModal = document.getElementById('bookings-modal');
const bookingsModalClose = document.getElementById('bookings-modal-close');
const bookingsScheduleInfo = document.getElementById('bookings-schedule-info');
const bookingsSlotsInfo = document.getElementById('booking-slots-info');
const bookingsBody = document.getElementById('bookings-body');
const bookingsPagination = document.getElementById('bookings-pagination');
const bookingFilterClientInput = document.getElementById('booking-filter-client');
const bookingFilterClientDropdown = document.getElementById('booking-filter-client-dropdown');
const bookingFilterAttendedSelect = document.getElementById('booking-filter-attended');
const addBookingBtn = document.getElementById('add-booking-btn');

const bookingModal = document.getElementById('booking-modal');
const bookingModalClose = document.getElementById('booking-modal-close');
const bookingClientInput = document.getElementById('booking-client-input');
const bookingClientDropdown = document.getElementById('booking-client-dropdown');
const bookingSubmitBtn = document.getElementById('booking-submit-btn');
const bookingCancelBtn = document.getElementById('booking-cancel-btn');

let selectedBookingClientId = null;
let bookingClientAC = null;
let filterBookingClientAC = null;
let selectedScheduleItem = null;

function selectSchedule(item) {
    selectedScheduleId = item.scheduleId;
    selectedScheduleItem = item;
    bookingPage = 1;
    bookingFilterClientName = '';
    bookingFilterAttended = '';
    bookingFilterClientInput.value = '';
    bookingFilterAttendedSelect.value = '';

    const d = new Date(item.workDate);
    const dateStr = d.toLocaleDateString('ru-RU');
    bookingsScheduleInfo.textContent =
        `${item.workoutName} | ${item.trainerName || '—'} | ${dateStr} | ${item.startTime.substring(0, 5)}–${item.endTime.substring(0, 5)}`;

    bookingsModal.classList.add('show');
    bookedClientsForFilter.splice(0, bookedClientsForFilter.length);
    if (filterBookingClientAC) filterBookingClientAC.refresh();
    loadBookingsForSchedule(selectedScheduleId);

    const scheduleDate = new Date(item.workDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const addBookingBtn = document.getElementById('add-booking-btn');
    if (scheduleDate < today) {
        addBookingBtn.disabled = true;
        addBookingBtn.title = 'Занятие уже прошло';
    } else {
        addBookingBtn.disabled = false;
        addBookingBtn.title = '';
    }
}

function loadBookingsFromCache() {
    filteredBookings = allBookings.filter(b => {
        if (b.scheduleId !== selectedScheduleId) return false;
        if (bookingFilterClientName && !b.clientName.toLowerCase().includes(bookingFilterClientName.toLowerCase())) return false;
        if (bookingFilterAttended !== '' && String(b.attended) !== bookingFilterAttended) return false;
        return true;
    });
    renderBookingsTable();
    renderBookingsPagination();
    renderBookingsSlotsInfo();
}

// --- Функция renderBookingsTable ---
function renderBookingsTable() {
    bookingsBody.innerHTML = '';
    const startIndex = (bookingPage - 1) * BOOKINGS_PER_PAGE;
    const pageItems = filteredBookings.slice(startIndex, startIndex + BOOKINGS_PER_PAGE);

    if (pageItems.length === 0) {
        const row = bookingsBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4; // Увеличиваем colspan до 4, так как в таблице 4 столбца
        cell.textContent = 'Нет записей';
        cell.style.textAlign = 'center';
        cell.style.color = '#999';
        return;
    }

    // Проверяем, выбрано ли расписание и есть ли у него дата и время
    const scheduleSelected = selectedScheduleItem && selectedScheduleItem.workDate && selectedScheduleItem.startTime;

    pageItems.forEach(b => {
        const row = bookingsBody.insertRow();
        row.insertCell(0).textContent = b.clientName;

        const dateCell = row.insertCell(1);
        const bookedAt = new Date(b.bookedAt);
        dateCell.textContent = `${bookedAt.toLocaleDateString('ru-RU')} ${bookedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

        const attendedCell = row.insertCell(2);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = b.attended === true;
        checkbox.style.cursor = 'pointer';
        checkbox.onchange = () => toggleAttended(b.clientId); // Оставляем только обработчик клика

        let isDisabled = false;
        let titleText = '';

        if (scheduleSelected) {
            const schDate = new Date(selectedScheduleItem.workDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Начало сегодняшнего дня по местному времени

            // Сценарий 1: Занятие уже прошло
            if (schDate < today) {
                isDisabled = true;
                titleText = 'Занятие уже прошло';
            }
            // Сценарий 2: Занятие сегодня или в будущем
            else {
                const [startHour, startMinute] = selectedScheduleItem.startTime.split(':').map(Number);
                const nowLocal = new Date(); // Текущее локальное время пользователя

                // Устанавливаем дату занятия и время старта для сравнения
                schDate.setHours(startHour, startMinute, 0, 0);

                // Сценарий 3: Время начала еще не наступило (сегодня)
                if (nowLocal < schDate) {
                    isDisabled = true;
                    titleText = 'Отметить можно только после начала занятия';
                }
            }
        } else {
            // Если данные о расписании некорректны, просто блокируем
            isDisabled = true;
            titleText = 'Данные о занятии недоступны';
        }

        checkbox.disabled = isDisabled;
        checkbox.title = titleText;
        attendedCell.appendChild(checkbox);

        const actionsCell = row.insertCell(3);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '\uD83D\uDDD1\uFE0F'; // Unicode иконка корзины
        deleteBtn.title = 'Удалить запись';
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteBooking(b.clientId); };
        actionsCell.appendChild(deleteBtn);
    });
}

function renderBookingsPagination() {
    bookingsPagination.innerHTML = '';
    const totalPages = Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '\u25C0';
    prevBtn.disabled = bookingPage <= 1;
    prevBtn.onclick = () => { bookingPage--; renderBookingsTable(); renderBookingsPagination(); };
    bookingsPagination.appendChild(prevBtn);

    const label = document.createElement('span');
    label.textContent = `Стр. ${bookingPage} из ${totalPages}`;
    bookingsPagination.appendChild(label);

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '\u25B6';
    nextBtn.disabled = bookingPage >= totalPages;
    nextBtn.onclick = () => { bookingPage++; renderBookingsTable(); renderBookingsPagination(); };
    bookingsPagination.appendChild(nextBtn);
}

function renderBookingsSlotsInfo() {
    if (!selectedScheduleItem) return;
    const booked = allBookings.filter(b => b.scheduleId === selectedScheduleId).length;
    const isIndividual = selectedScheduleItem.workoutTypeName === 'индивидуальная';
    const max = isIndividual ? 1 : (selectedScheduleItem.maxParticipants || 0);
    bookingsSlotsInfo.textContent = `Занято: ${booked} / ${max} мест`;
}

async function loadBookingsForSchedule(scheduleId) {
    try {
        const response = await fetch(`${API_URL}/${scheduleId}/bookings`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allBookings = allBookings.filter(b => b.scheduleId !== scheduleId);
        (data.items || []).forEach(b => {
            allBookings.push({ ...b, scheduleId });
        });

        bookedClientsForFilter.splice(0, bookedClientsForFilter.length);
        const seen = new Set();
        (data.items || []).forEach(b => {
            if (!seen.has(b.clientId)) {
                seen.add(b.clientId);
                bookedClientsForFilter.push({ clientId: b.clientId, fullName: b.clientName });
            }
        });
        if (filterBookingClientAC) filterBookingClientAC.refresh();

        loadBookingsFromCache();
    } catch (err) {
        showToast(`Ошибка загрузки записей: ${err.message}`);
    }
}

async function createBooking() {
    if (!selectedBookingClientId) { showToast('Выберите клиента'); return; }
    if (!selectedScheduleId) { showToast('Выберите расписание'); return; }

    try {
        const response = await fetch(`${API_URL}/${selectedScheduleId}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: selectedBookingClientId })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);

        closeBookingModal();
        await renderPage();
        if (selectedScheduleId) await loadBookingsForSchedule(selectedScheduleId);
        showToast(data?.message || 'Клиент добавлен', 'success');
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
    }
}

async function deleteBooking(clientId) {
    if (!confirm('Удалить эту запись?')) return;
    try {
        const response = await fetch(`${API_URL}/${selectedScheduleId}/bookings/${clientId}`, { method: 'DELETE' });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);

        await renderPage();
        if (selectedScheduleId) await loadBookingsForSchedule(selectedScheduleId);
        showToast(data?.message || 'Запись удалена', 'success');
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

async function toggleAttended(clientId) {
    if (!selectedScheduleId || !clientId || !selectedScheduleItem) {
        showToast('Ошибка: недостаточно данных.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${selectedScheduleId}/bookings/${clientId}/attended`, { method: 'PUT' });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);

        const booking = allBookings.find(b => b.clientId === clientId && b.scheduleId === selectedScheduleId);
        if (booking) {
            booking.attended = !booking.attended;
            renderBookingsTable();
        }
        showToast(data?.message || 'Статус посещения обновлен', 'success');
    } catch (err) {
        showToast(`Ошибка: ${err.message}`);
    }
}

let currentScheduleItems = [];

function openBookingModal() {
    bookingClientInput.value = '';
    selectedBookingClientId = null;
    bookingModal.classList.add('show');
}

function closeBookingModal() {
    bookingModal.classList.remove('show');
    bookingClientInput.value = '';
    selectedBookingClientId = null;
}

bookingSubmitBtn.addEventListener('click', createBooking);
bookingCancelBtn.addEventListener('click', closeBookingModal);
bookingModalClose.addEventListener('click', closeBookingModal);
bookingModal.addEventListener('click', (e) => { if (e.target === bookingModal) closeBookingModal(); });

bookingsModalClose.addEventListener('click', () => { bookingsModal.classList.remove('show'); });
bookingsModal.addEventListener('click', (e) => { if (e.target === bookingsModal) bookingsModal.classList.remove('show'); });

bookingFilterAttendedSelect.addEventListener('change', () => {
    bookingFilterAttended = bookingFilterAttendedSelect.value;
    bookingPage = 1;
    loadBookingsFromCache();
});

addBookingBtn.addEventListener('click', openBookingModal);

bookingFilterClientInput.addEventListener('input', () => {
    bookingFilterClientName = bookingFilterClientInput.value.trim();
    bookingPage = 1;
    loadBookingsFromCache();
});

(async function init() {
    await renderPage();
    initAutocompletes();

    filterBookingClientAC = setupAutocomplete(
        bookingFilterClientInput, bookingFilterClientDropdown, bookedClientsForFilter,
        (item) => {
            bookingFilterClientName = bookingFilterClientInput.value.trim();
            bookingPage = 1;
            loadBookingsFromCache();
        },
        (item) => item.fullName
    );

    bookingClientAC = setupAutocomplete(
        bookingClientInput, bookingClientDropdown, allClients,
        (item) => {
            selectedBookingClientId = item ? item.clientId : null;
            if (item) bookingClientInput.value = item.fullName;
        },
        (item) => {
            if (item.abonnementType) {
                return item.fullName + ' — ' + item.abonnementType + ' (до ' + item.expiryDate + ')';
            }
            return item.fullName + ' — ❌ нет абонемента';
        }
    );
})();
