const API_URL = 'https://localhost:7159/api/Workouts';

// DOM-элементы
const tbody = document.getElementById('workouts-body');
const errorDiv = document.getElementById('error-message');
const totalSpan = document.getElementById('total-count');
const avgDurationSpan = document.getElementById('avg-duration');
const trainersCountSpan = document.getElementById('trainers-count');

// Фильтры
const filterWorkoutName = document.getElementById('filter-workoutName');
const filterDurationFrom = document.getElementById('filter-durationFrom');
const filterDurationTo = document.getElementById('filter-durationTo');
const filterRangeToggle = document.getElementById('filter-range-toggle');
const filterParticipantsSort = document.getElementById('filter-participantsSort');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');
const addWorkoutBtn = document.getElementById('add-workout-btn');

// Модальное окно
const modal = document.getElementById('workout-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const editIdField = document.getElementById('edit-id');
const workoutNameInput = document.getElementById('workoutName');
const durationMinutesInput = document.getElementById('durationMinutes');
const maxParticipantsInput = document.getElementById('maxParticipants');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Gym section
const gymSectionHint = document.getElementById('gym-section-hint');
const gymControls = document.getElementById('gym-controls');
const gymInput = document.getElementById('gym-input');
const gymDatalist = document.getElementById('gym-datalist');
const addGymLinkBtn = document.getElementById('add-gym-link-btn');
const gymLinksBody = document.getElementById('gym-links-body');

let currentEditId = null;
let allGyms = [];
let currentLinkedGymIds = new Set();
let justCreated = false;

// ---- Helpers ----
function showError(text) {
    errorDiv.textContent = text;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function clearForm() {
    workoutNameInput.value = '';
    durationMinutesInput.value = '';
    maxParticipantsInput.value = '';
    editIdField.value = '';
    currentEditId = null;
    justCreated = false;
}

function resetModal(isEdit) {
    clearForm();
    if (isEdit) {
        modalTitle.textContent = 'Редактировать тренировку';
        submitBtn.textContent = 'Сохранить';
    } else {
        modalTitle.textContent = 'Добавить тренировку';
        submitBtn.textContent = 'Добавить';
    }
    gymControls.classList.add('hidden');
    gymSectionHint.textContent = isEdit ? 'Загрузка...' : 'Сохраните тренировку, чтобы выбрать залы';
    gymSectionHint.classList.remove('hidden');
    gymLinksBody.innerHTML = '';
    currentLinkedGymIds.clear();
}

function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
    resetModal(false);
}

// ---- Валидация формы ----
function validateWorkoutForm() {
    const name = workoutNameInput.value.trim();
    const duration = durationMinutesInput.value.trim();
    const maxP = maxParticipantsInput.value.trim();

    if (!name) { showError('Название тренировки обязательно'); return false; }
    if (name.length > 50) { showError('Название не должно превышать 50 символов'); return false; }
    if (name.length < 3) { showError('Название должно содержать не менее 3 символов'); return false; }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(name)) { showError('Название не может состоять только из цифр и символов'); return false; }
    if (/^\d/.test(name)) { showError('Название не может начинаться с цифры'); return false; }
    if (!/^[A-ZА-ЯЁ]/.test(name)) { showError('Название должно начинаться с заглавной буквы'); return false; }
    if (/\s{2,}/.test(name)) { showError('Пробелы не могут идти подряд'); return false; }

    if (!duration) { showError('Укажите длительность'); return false; }
    const durNum = parseInt(duration, 10);
    if (isNaN(durNum) || durNum < 30) { showError('Длительность должна быть от 30 минут'); return false; }
    if (durNum > 180) { showError('Длительность не должна превышать 180 минут'); return false; }

    if (!maxP) { showError('Укажите максимальное количество участников'); return false; }
    const maxNum = parseInt(maxP, 10);
    if (isNaN(maxNum) || maxNum < 1) { showError('Максимум участников должен быть не менее 1'); return false; }
    if (maxNum > 50) { showError('Максимум участников не должен превышать 50'); return false; }

    return true;
}

// ---- Gym links ----
function refreshGymDatalist() {
    gymDatalist.innerHTML = '';
    allGyms.forEach(gym => {
        if (currentLinkedGymIds.has(gym.gymId)) return;
        const opt = document.createElement('option');
        opt.value = gym.gymName;
        gymDatalist.appendChild(opt);
    });
}

function findGymByName(name) {
    const trimmed = name.trim();
    return allGyms.find(g => g.gymName.toLowerCase() === trimmed.toLowerCase());
}

async function loadGymDictionary() {
    try {
        const response = await fetch(`${API_URL}/gyms/dictionary`);
        if (!response.ok) throw new Error('Не удалось загрузить список залов');
        allGyms = await response.json();
        refreshGymDatalist();
    } catch (err) {
        console.error('Ошибка загрузки залов:', err);
    }
}

async function loadGymLinks(workoutId) {
    try {
        const response = await fetch(`${API_URL}/${workoutId}/gyms`);
        if (!response.ok) throw new Error('Ошибка загрузки связей с залами');
        const gyms = await response.json();

        currentLinkedGymIds.clear();
        gyms.forEach(gym => currentLinkedGymIds.add(gym.gymId));
        refreshGymDatalist();

        gymLinksBody.innerHTML = '';
        gyms.forEach(gym => {
            const row = gymLinksBody.insertRow();
            row.insertCell(0).textContent = gym.gymId;
            row.insertCell(1).textContent = gym.gymName;
            const actionsCell = row.insertCell(2);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Отвязать зал';
            deleteBtn.onclick = () => removeGymLink(workoutId, gym.gymId);
            actionsCell.appendChild(deleteBtn);
        });
    } catch (err) {
        showError(`Ошибка загрузки залов: ${err.message}`);
    }
}

function enableGymSection(workoutId) {
    currentEditId = workoutId;
    gymInput.value = '';
    gymSectionHint.classList.add('hidden');
    gymControls.classList.remove('hidden');
    loadGymDictionary();
    loadGymLinks(workoutId);
}

async function addGymLink() {
    if (!currentEditId) return;
    const name = gymInput.value.trim();
    if (!name) { showError('Введите название зала'); return; }

    const gym = findGymByName(name);
    if (!gym) { showError('Зал с таким названием не найден'); return; }
    if (currentLinkedGymIds.has(gym.gymId)) { showError('Этот зал уже связан с тренировкой'); return; }

    try {
        const response = await fetch(`${API_URL}/${currentEditId}/gyms`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gymId: gym.gymId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        gymInput.value = '';
        await loadGymLinks(currentEditId);
        await renderTable();
    } catch (err) {
        showError(`Ошибка добавления: ${err.message}`);
    }
}

async function removeGymLink(workoutId, gymId) {
    if (!confirm('Отвязать этот зал от тренировки?')) return;
    try {
        const response = await fetch(`${API_URL}/${workoutId}/gyms/${gymId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await loadGymLinks(workoutId);
        await renderTable();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Таблица ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (filterWorkoutName.value) params.append('workoutName', filterWorkoutName.value.trim());
        if (filterParticipantsSort.value === 'asc' || filterParticipantsSort.value === 'desc') {
            params.append('participantsSort', filterParticipantsSort.value);
        }
        if (filterDurationFrom.value) {
            const from = filterDurationFrom.value;
            const to = (filterRangeToggle.checked && filterDurationTo.value) ? filterDurationTo.value : from;
            params.append('durationFrom', from);
            params.append('durationTo', to);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        tbody.innerHTML = '';
        result.items.forEach(workout => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = workout.workoutId;
            row.insertCell(1).textContent = workout.workoutName;
            row.insertCell(2).textContent = workout.durationMinutes;
            row.insertCell(3).textContent = workout.maxParticipants;
            const gymCell = row.insertCell(4);
            gymCell.style.whiteSpace = 'normal';
            gymCell.style.maxWidth = '300px';
            if (workout.gymList) {
                gymCell.innerHTML = `<a href="#" class="gym-link-btn" title="Управлять залами">${workout.gymList}</a>`;
                gymCell.querySelector('.gym-link-btn').onclick = (e) => {
                    e.preventDefault();
                    openEditModal(workout);
                };
            } else {
                gymCell.innerHTML = '<span style="color:#999;">—</span>';
            }
            const actionsCell = row.insertCell(5);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => openEditModal(workout);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteWorkout(workout.workoutId);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });

        const data = result.statistics;
        totalSpan.textContent = data.totalWorkouts;
        avgDurationSpan.textContent = data.avgDuration;
        trainersCountSpan.textContent = data.totalTrainersAssigned;
    } catch (err) {
        showError(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Открыть модалку для создания ----
function openCreateModal() {
    resetModal(false);
    openModal();
}

// ---- Открыть модалку для редактирования ----
function openEditModal(workout) {
    resetModal(true);
    workoutNameInput.value = workout.workoutName;
    durationMinutesInput.value = workout.durationMinutes;
    maxParticipantsInput.value = workout.maxParticipants;
    editIdField.value = workout.workoutId;
    currentEditId = workout.workoutId;

    gymSectionHint.textContent = 'Загрузка...';
    openModal();
    enableGymSection(workout.workoutId);
}

// ---- Создание ----
async function createWorkout() {
    if (!validateWorkoutForm()) return false;

    const newWorkout = {
        workoutName: workoutNameInput.value.trim(),
        durationMinutes: parseInt(durationMinutesInput.value, 10),
        maxParticipants: parseInt(maxParticipantsInput.value, 10)
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWorkout)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errText}`);
        }
        const created = await response.json();
        editIdField.value = created.workoutId;
        submitBtn.textContent = 'Готово';
        justCreated = true;
        enableGymSection(created.workoutId);
        await renderTable();
        return true;
    } catch (err) {
        showError(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление ----
async function updateWorkout(id) {
    if (!validateWorkoutForm()) return false;

    const updated = {
        workoutId: id,
        workoutName: workoutNameInput.value.trim(),
        durationMinutes: parseInt(durationMinutesInput.value, 10),
        maxParticipants: parseInt(maxParticipantsInput.value, 10)
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (response.status === 400) { showError('Неверный запрос (несоответствие ID)'); return false; }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        closeModal();
        await renderTable();
        return true;
    } catch (err) {
        showError(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

// ---- Удаление ----
async function deleteWorkout(id) {
    if (!confirm('Удалить эту тренировку?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) { showError('Тренировка не найдена (возможно, уже удалена)'); }
        else if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (id === currentEditId) closeModal();
        await renderTable();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Submit ----
async function onSubmit() {
    if (justCreated) {
        closeModal();
        return;
    }
    if (currentEditId !== null) {
        await updateWorkout(currentEditId);
    } else {
        await createWorkout();
    }
}

// ---- Фильтры ----
async function onApplyFilters() { await renderTable(); }

function onClearFilters() {
    filterWorkoutName.value = '';
    filterParticipantsSort.value = '';
    filterDurationFrom.value = '';
    filterDurationTo.value = '';
    filterRangeToggle.checked = false;
    document.getElementById('filter-durationTo-group').classList.add('hidden');
    const labelFrom = document.getElementById('filter-durationFrom-label');
    if (labelFrom) labelFrom.textContent = 'Длительность (мин)';
    renderTable();
}

function onToggleRange() {
    const group = document.getElementById('filter-durationTo-group');
    const labelFrom = document.getElementById('filter-durationFrom-label');
    if (filterRangeToggle.checked) {
        group.classList.remove('hidden');
        if (labelFrom) labelFrom.textContent = 'Длительность (от)';
    } else {
        group.classList.add('hidden');
        filterDurationTo.value = '';
        if (labelFrom) labelFrom.textContent = 'Длительность (мин)';
    }
}

// ---- Автоформатирование ----
workoutNameInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    val = val.replace(/([a-zA-Zа-яА-ЯёЁ]+)/g, function (match) {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
    this.value = val;
});

workoutNameInput.addEventListener('keydown', function (e) {
    if (e.key === ' ') {
        const val = this.value;
        if (val.length > 0 && val[val.length - 1] === ' ') { e.preventDefault(); return; }
        const spaceCount = (val.match(/\s/g) || []).length;
        if (spaceCount >= 2) e.preventDefault();
    }
});

durationMinutesInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 1) val = val.replace(/^0+/, '');
    if (val.length > 3) val = val.substring(0, 3);
    this.value = val;
});

durationMinutesInput.addEventListener('keydown', function (e) {
    const isDigit = /^\d$/.test(e.key);
    const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
    const isCtrlCmd = e.ctrlKey || e.metaKey;
    if (isCtrlCmd || isNav) return;
    if (!isDigit) e.preventDefault();
});

maxParticipantsInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 1) val = val.replace(/^0+/, '');
    if (val.length > 4) val = val.substring(0, 4);
    this.value = val;
});

maxParticipantsInput.addEventListener('keydown', function (e) {
    const isDigit = /^\d$/.test(e.key);
    const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
    const isCtrlCmd = e.ctrlKey || e.metaKey;
    if (isCtrlCmd || isNav) return;
    if (!isDigit) e.preventDefault();
});

// ---- Инициализация ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', closeModal);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
filterRangeToggle.addEventListener('change', onToggleRange);
addWorkoutBtn.addEventListener('click', openCreateModal);
addGymLinkBtn.addEventListener('click', addGymLink);

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

renderTable();
