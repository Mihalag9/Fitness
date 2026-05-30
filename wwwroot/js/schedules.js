const API_URL = '/api/Schedules';

let allTrainers = [];
let allWorkouts = [];
let allGyms = [];
let allTypes = [];

let selectedModalTrainerId = null;
let selectedModalWorkoutId = null;
let selectedModalGymId = null;
let selectedModalDuration = 0;

let modalTrainerDropdownIndex = -1;
let modalWorkoutDropdownIndex = -1;
let modalGymDropdownIndex = -1;

let filterTrainerDropdownIndex = -1;
let filterGymDropdownIndex = -1;
let filterWorkoutDropdownIndex = -1;

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
        dateTo: filterDateTo.value
    };
}

function restoreFiltersToDOM() {
    filterTrainerInput.value = appliedFilters.trainerName || '';
    filterGymInput.value = appliedFilters.gymName || '';
    filterWorkoutInput.value = appliedFilters.workoutName || '';
    filterTypeSelect.value = appliedFilters.workoutTypeId || '';
    filterDateFrom.value = appliedFilters.dateFrom || '';
    filterDateTo.value = appliedFilters.dateTo || '';
}

function clearAllFilters() {
    appliedFilters = {};
    filterTrainerInput.value = '';
    filterGymInput.value = '';
    filterWorkoutInput.value = '';
    filterTypeSelect.value = '';
    filterDateFrom.value = '';
    filterDateTo.value = '';
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
    editIdField.value = '';
    currentEditId = null;
    setModalDateLimits();
    modalTrainerInput.disabled = false;
    modalWorkoutInput.disabled = false;
    modalGymInput.disabled = false;
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
    modalGymInput.value = item.gymName;
    selectedModalGymId = item.gymId;
    modalTypeSelect.value = item.workoutTypeId;
    modalDate.value = item.workDate.split('T')[0];
    modalStartTime.value = item.startTime.substring(0, 5);
    calculateEndTime();
    openModal();
}

function renderTable(items) {
    tbody.innerHTML = '';
    items.forEach(item => {
        const row = tbody.insertRow();
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
        const editBtn = document.createElement('button');
        editBtn.textContent = '\u270F\uFE0F';
        editBtn.title = 'Редактировать';
        editBtn.onclick = () => openEditModal(item);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '\uD83D\uDDD1\uFE0F';
        deleteBtn.title = 'Удалить';
        deleteBtn.onclick = () => deleteSchedule(item.scheduleId);
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
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

        const url = params.toString() ? `${API_URL}/page-data?${params.toString()}` : `${API_URL}/page-data`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        cacheDictionaries(data);
        renderTable(data.items);
        renderStats(data.statistics);
        renderTypeOptions(allTypes, filterTypeSelect, true);
        renderTypeOptions(allTypes, modalTypeSelect, false);
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
        if (!response.ok) {
            const err = await response.json().catch(() => null);
            throw new Error(err?.message || `HTTP ${response.status}`);
        }
        closeModal();
        await renderPage();
        showToast('Запись добавлена', 'success');
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
        if (!response.ok) {
            const err = await response.json().catch(() => null);
            throw new Error(err?.message || `HTTP ${response.status}`);
        }
        closeModal();
        await renderPage();
        showToast('Запись обновлена', 'success');
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
        if (!response.ok) {
            const err = await response.json().catch(() => null);
            throw new Error(err?.message || `HTTP ${response.status}`);
        }
        await renderPage();
        showToast('Запись удалена', 'success');
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
        if (!query) return [];
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
let filterTrainerAC, filterGymAC, filterWorkoutAC;

function initAutocompletes() {
    modalTrainerAC = setupAutocomplete(
        modalTrainerInput, modalTrainerDropdown, allTrainers,
        (item) => { selectedModalTrainerId = item ? item.trainerId : null; },
        (item) => item.fullName
    );
    modalWorkoutAC = setupAutocomplete(
        modalWorkoutInput, modalWorkoutDropdown, allWorkouts,
        (item) => {
            selectedModalWorkoutId = item ? item.workoutId : null;
            selectedModalDuration = item ? item.durationMinutes : 0;
            calculateEndTime();
        },
        (item) => item.workoutName
    );
    modalGymAC = setupAutocomplete(
        modalGymInput, modalGymDropdown, allGyms,
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
}

modalStartTime.addEventListener('change', calculateEndTime);

submitBtn.addEventListener('click', onFormSubmit);
cancelBtn.addEventListener('click', closeModal);
addBtn.addEventListener('click', openCreateModal);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

applyBtn.addEventListener('click', () => { snapshotFilters(); renderPage(); });
clearBtn.addEventListener('click', () => { clearAllFilters(); renderPage(); });

(async function init() {
    await renderPage();
    initAutocompletes();
})();
