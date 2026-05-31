// API URL
const API_URL = '/api/Trainers';
const REV_API = '/api/Reviews';

// DOM-элементы
const tbody = document.getElementById('trainers-body');
const fullNameInput = document.getElementById('fullName');
const experienceInput = document.getElementById('experience');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const totalSpan = document.getElementById('total-count');
const expSpan = document.getElementById('exp-count');
const noExpSpan = document.getElementById('no-exp-count');
const addTrainerBtn = document.getElementById('add-trainer-btn');

// Модальное окно
const modal = document.getElementById('trainer-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');

// Фильтры
const filterFullName = document.getElementById('filter-fullName');
const filterExperienceSort = document.getElementById('filter-experienceSort');
const filterWorkoutName = document.getElementById('filter-workoutName');
const filterRole = document.getElementById('filter-role');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

let currentEditId = null;

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        fullName: filterFullName.value,
        experienceSort: filterExperienceSort.value,
        workoutName: filterWorkoutName.value,
        role: filterRole.value
    };
}

function restoreFiltersToDOM() {
    filterFullName.value = appliedFilters.fullName || '';
    filterExperienceSort.value = appliedFilters.experienceSort || '';
    filterWorkoutName.value = appliedFilters.workoutName || '';
    filterRole.value = appliedFilters.role || '';
}

function clearAllFilters() {
    appliedFilters = {};
    filterFullName.value = '';
    filterExperienceSort.value = '';
    filterWorkoutName.value = '';
    filterRole.value = '';
}

// ---- Вспомогательные функции ----
function clearForm() {
    fullNameInput.value = '';
    experienceInput.value = '';
    editIdField.value = '';
    currentEditId = null;
}

function resetModal(isEdit) {
    clearForm();
    specSectionHint.textContent = isEdit ? 'Загрузка...' : 'Сохраните тренера, чтобы назначить специализации';
    specSectionHint.classList.remove('hidden');
    specControls.classList.add('hidden');
    specBody.innerHTML = '';
    currentSpecCount = 0;
    if (isEdit) {
        modalTitle.textContent = 'Редактировать тренера';
        submitBtn.textContent = 'Сохранить';
    } else {
        modalTitle.textContent = 'Добавить тренера';
        submitBtn.textContent = 'Добавить';
    }
}

function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
    justCreated = false;
    resetModal(false);
}

function openCreateModal() {
    resetModal(false);
    openModal();
}

function openEditModal(trainer) {
    resetModal(true);
    fullNameInput.value = trainer.fullName;
    experienceInput.value = trainer.experience != null ? trainer.experience : '';
    editIdField.value = trainer.trainerId;
    currentEditId = trainer.trainerId;
    openModal();
    enableSpecSection(trainer.trainerId);
}

// ---- Валидация формы перед отправкой ----
function validateTrainerForm() {
    const fullName = fullNameInput.value.trim();
    const experience = experienceInput.value.trim();

    if (!fullName) {
        showToast('ФИО обязательно');
        return false;
    }
    if (fullName.length > 50) {
        showToast('ФИО не должно превышать 50 символов');
        return false;
    }

    const nameParts = fullName.split(' ').filter(p => p.length > 0);
    if (nameParts.length < 2) {
        showToast('Укажите фамилию и имя (минимум 2 слова)');
        return false;
    }
    if (nameParts.length > 3) {
        showToast('ФИО должно содержать не более 3 слов');
        return false;
    }
    if (/\s{2,}/.test(fullName)) {
        showToast('Пробелы не могут идти подряд');
        return false;
    }

    if (experience && (parseInt(experience) < 0 || parseInt(experience) > 60)) {
        showToast('Стаж должен быть от 0 до 60 лет');
        return false;
    }

    return true;
}

// ---- Добавление нового ----
async function createTrainer() {
    if (!validateTrainerForm()) return false;

    const newTrainer = {
        fullName: fullNameInput.value.trim(),
        experience: experienceInput.value ? parseInt(experienceInput.value, 10) : null
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTrainer)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }
        var newId = data.entity.trainerId;
        editIdField.value = newId;
        currentEditId = newId;
        justCreated = true;
        modalTitle.textContent = 'Редактировать тренера';
        submitBtn.textContent = 'Сохранить';
        enableSpecSection(newId);
        await loadPageData();
        showToast(data?.message || 'Тренер добавлен. Теперь можно назначить специализации.', 'success');
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление существующего ----
async function updateTrainer(id) {
    if (!validateTrainerForm()) return false;

    const updated = {
        trainerId: id,
        fullName: fullNameInput.value.trim(),
        experience: experienceInput.value ? parseInt(experienceInput.value, 10) : null
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        const data = await response.json().catch(() => null);
        if (response.status === 400) {
            showToast(data?.message || 'Неверный запрос (несоответствие ID)');
            return false;
        }
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
        closeModal();
        restoreFiltersToDOM();
        await loadPageData();
        showToast(data?.message || 'Тренер обновлён', 'success');
        return true;
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

// ---- Удаление ----
async function deleteTrainer(id) {
    if (!confirm('Удалить этого тренера?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }

        if (id === currentEditId) {
            closeModal();
        }

        restoreFiltersToDOM();
        await loadPageData();
        showToast(data?.message || 'Тренер удалён', 'success');
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Обработчик кнопки "Добавить/Сохранить" ----
let justCreated = false;

async function onSubmit() {
    if (justCreated) { closeModal(); return; }
    if (currentEditId !== null) {
        await updateTrainer(currentEditId);
    } else {
        await createTrainer();
    }
}

// ---- Фильтры ----
function onApplyFilters() {
    snapshotFilters();
    loadPageData();
}

function onClearFilters() {
    clearAllFilters();
    loadPageData();
}

// ---- Автоформатирование ФИО при вводе ----
fullNameInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    val = val.replace(/([a-zA-Zа-яА-ЯёЁ]+)/g, function (match) {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
    this.value = val;
});

fullNameInput.addEventListener('keydown', function (e) {
    if (e.key === ' ') {
        const val = this.value;
        if (val.length > 0 && val[val.length - 1] === ' ') {
            e.preventDefault();
            return;
        }
        const spaceCount = (val.match(/\s/g) || []).length;
        if (spaceCount >= 2) {
            e.preventDefault();
        }
    }
});

// ---- Валидация стажа при вводе ----
experienceInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 1) {
        val = val.replace(/^0+/, '');
    }
    if (val && parseInt(val) > 60) val = '60';
    this.value = val;
});

experienceInput.addEventListener('keydown', function (e) {
    const isDigit = /^\d$/.test(e.key);
    const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
    const isCtrlCmd = e.ctrlKey || e.metaKey;

    if (isCtrlCmd || isNav) return;
    if (!isDigit) {
        e.preventDefault();
    }
});

// ---- Инициализация и обработчики событий (Тренеры) ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', closeModal);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
addTrainerBtn.addEventListener('click', openCreateModal);

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ---- Отрисовка таблицы тренеров (общая) ----
function renderTrainerTable(items, statistics) {
    tbody.innerHTML = '';
    items.forEach(trainer => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = trainer.trainerId;
        row.insertCell(1).textContent = trainer.fullName;
        row.insertCell(2).textContent = (trainer.experience != null && trainer.experience > 0) ? trainer.experience : '—';
        const specCell = row.insertCell(3);
        specCell.textContent = trainer.specializations || '—';
        specCell.style.whiteSpace = 'pre-line';
        specCell.title = trainer.specializations || '';
        const actionsCell = row.insertCell(4);
        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.title = 'Редактировать';
        editBtn.onclick = () => openEditModal(trainer);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Удалить';
        deleteBtn.onclick = () => deleteTrainer(trainer.trainerId);
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
    totalSpan.textContent = statistics.totalTrainers;
    expSpan.textContent = statistics.trainersWithExperience;
    noExpSpan.textContent = statistics.trainersWithoutExperience;
}

// ---- Загрузка всех данных тренеров (1 запрос) ----
async function loadPageData() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.fullName) params.append('fullName', appliedFilters.fullName.trim());
        if (appliedFilters.experienceSort === 'no_exp') {
            params.append('noExperience', 'true');
        } else if (appliedFilters.experienceSort === 'asc' || appliedFilters.experienceSort === 'desc') {
            params.append('experienceSort', appliedFilters.experienceSort);
        }
        if (appliedFilters.workoutName) params.append('workoutName', appliedFilters.workoutName.trim());
        if (appliedFilters.role) params.append('role', appliedFilters.role);

        const url = params.toString() ? `${API_URL}/page-data?${params.toString()}` : `${API_URL}/page-data`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        // Заполняем roles для фильтра
        filterRole.innerHTML = '<option value="">Все роли</option>';
        result.roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            filterRole.appendChild(option);
        });
        restoreFiltersToDOM();

        renderTrainerTable(result.items, result.statistics);
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

// ==========================================
// СПЕЦИАЛИЗАЦИИ (РОЛИ ТРЕНЕРА)
// ==========================================

const MAX_SPECS = 3;

const specSection = document.getElementById('spec-section');
const specSectionHint = document.getElementById('spec-section-hint');
const specControls = document.getElementById('spec-controls');
const specWorkoutInput = document.getElementById('spec-workout-input');
const specWorkoutDropdown = document.getElementById('spec-workout-dropdown');
const specRoleSelect = document.getElementById('spec-role-select');
const addSpecBtn = document.getElementById('add-spec-btn');
const specLimitHint = document.getElementById('spec-limit-hint');
const specBody = document.getElementById('spec-body');

let allWorkouts = [];
let selectedSpecWorkoutId = null;
let specDropdownIndex = -1;
let currentSpecCount = 0;

function enableSpecSection(trainerId) {
    currentEditId = trainerId;
    specSectionHint.classList.add('hidden');
    specControls.classList.remove('hidden');
    specWorkoutInput.value = '';
    selectedSpecWorkoutId = null;
    loadEditData(trainerId);
}

function updateSpecLimitState() {
    const limitReached = currentSpecCount >= MAX_SPECS;
    specWorkoutInput.disabled = limitReached;
    specRoleSelect.disabled = limitReached;
    addSpecBtn.disabled = limitReached;
    specLimitHint.classList.toggle('hidden', !limitReached);
}

// ---- Загрузка всех данных для модала редактирования (1 запрос) ----
async function loadEditData(trainerId) {
    try {
        const response = await fetch(`${API_URL}/${trainerId}/edit-data`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Справочник тренировок для автокомплита
        allWorkouts = data.workouts;

        // Роли тренера
        renderSpecLinks(data.roles);
    } catch (err) {
        showToast(`Ошибка загрузки данных: ${err.message}`);
    }
}

// ---- Отрисовка специализаций ----
function renderSpecLinks(roles) {
    currentSpecCount = roles.length;
    specBody.innerHTML = '';
    roles.forEach(role => {
        const row = specBody.insertRow();
        row.insertCell(0).textContent = role.workoutName;
        row.insertCell(1).textContent = role.tRole;
        const actionsCell = row.insertCell(2);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Удалить';
        deleteBtn.onclick = () => removeSpec(currentEditId, role.workoutId);
        actionsCell.appendChild(deleteBtn);
    });
    updateSpecLimitState();
}

// ---- Автодополнение тренировок ----
function getFilteredWorkouts(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    const linkedIds = new Set();
    const rows = specBody.querySelectorAll('tr');
    return allWorkouts.filter(w => w.workoutName.toLowerCase().includes(q));
}

function renderWorkoutDropdown(filtered) {
    specWorkoutDropdown.innerHTML = '';
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item no-results';
        div.textContent = 'Ничего не найдено';
        specWorkoutDropdown.appendChild(div);
        return;
    }
    filtered.forEach((workout, i) => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (i === specDropdownIndex) div.classList.add('active');
        div.textContent = workout.workoutName;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            specWorkoutInput.value = workout.workoutName;
            selectedSpecWorkoutId = workout.workoutId;
            specWorkoutDropdown.classList.remove('show');
        });
        specWorkoutDropdown.appendChild(div);
    });
}

function onSpecWorkoutInput() {
    specDropdownIndex = -1;
    selectedSpecWorkoutId = null;
    const query = specWorkoutInput.value.trim();
    const filtered = getFilteredWorkouts(query);
    renderWorkoutDropdown(filtered);
    if (filtered.length > 0) specWorkoutDropdown.classList.add('show');
    else specWorkoutDropdown.classList.remove('show');
}

function onSpecWorkoutKeydown(e) {
    const items = specWorkoutDropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length > 0) { specDropdownIndex = Math.min(specDropdownIndex + 1, items.length - 1); renderWorkoutDropdown(getFilteredWorkouts(specWorkoutInput.value.trim())); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length > 0) { specDropdownIndex = Math.max(specDropdownIndex - 1, 0); renderWorkoutDropdown(getFilteredWorkouts(specWorkoutInput.value.trim())); } }
    else if ((e.key === 'Enter' || e.key === 'Tab') && specDropdownIndex >= 0 && specDropdownIndex < items.length) { e.preventDefault(); items[specDropdownIndex].dispatchEvent(new Event('mousedown')); }
    else if (e.key === 'Escape') { specWorkoutDropdown.classList.remove('show'); }
}

// ---- Добавление специализации ----
async function addSpec() {
    if (!currentEditId) return;
    if (!selectedSpecWorkoutId) { showToast('Выберите тренировку'); return; }

    const role = specRoleSelect.value;
    const response = await fetch(`${API_URL}/${currentEditId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId: selectedSpecWorkoutId, role })
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        showToast(err?.message || 'Ошибка добавления');
        return;
    }
    const result = await response.json();
    specWorkoutInput.value = '';
    selectedSpecWorkoutId = null;
    renderSpecLinks(result.roles);
    renderTrainerTable(result.items, result.statistics);
    showToast(result.message || 'Специализация добавлена', 'success');
}

// ---- Удаление специализации ----
async function removeSpec(trainerId, workoutId) {
    if (!confirm('Удалить эту специализацию?')) return;
    const response = await fetch(`${API_URL}/${trainerId}/roles/${workoutId}`, { method: 'DELETE' });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        showToast(err?.message || 'Ошибка удаления');
        return;
    }
    const result = await response.json();
    renderSpecLinks(result.roles);
    renderTrainerTable(result.items, result.statistics);
    showToast(result.message || 'Специализация удалена', 'success');
}

// ---- Обработчики специализаций ----
addSpecBtn.addEventListener('click', addSpec);
specWorkoutInput.addEventListener('input', onSpecWorkoutInput);
specWorkoutInput.addEventListener('keydown', onSpecWorkoutKeydown);
specWorkoutInput.addEventListener('blur', () => setTimeout(() => specWorkoutDropdown.classList.remove('show'), 200));

// ==========================================
// ВКЛАДКА «ОТЗЫВЫ»
// ==========================================

// DOM-элементы отзывов
const revTbody = document.getElementById('reviews-body');
const revTotalSpan = document.getElementById('rev-total-count');
const revBestTrainerSpan = document.getElementById('rev-best-trainer');

const revClientInput = document.getElementById('rev-client-input');
const revClientDropdown = document.getElementById('rev-client-dropdown');
const revTrainerInput = document.getElementById('rev-trainer-input');
const revTrainerDropdown = document.getElementById('rev-trainer-dropdown');
const revRatingSelect = document.getElementById('rev-rating');
const revTextInput = document.getElementById('rev-text');
const revSubmitBtn = document.getElementById('rev-submit-btn');
const revCancelBtn = document.getElementById('rev-cancel-btn');
const revModal = document.getElementById('review-modal');
const revModalClose = document.getElementById('rev-modal-close');
const revModalTitle = document.getElementById('rev-modal-title');

const revFilterClient = document.getElementById('rev-filter-client');
const revFilterTrainer = document.getElementById('rev-filter-trainer');
const revFilterDateFrom = document.getElementById('rev-filter-dateFrom');
const revFilterDateTo = document.getElementById('rev-filter-dateTo');
const revFilterRatingSort = document.getElementById('rev-filter-ratingSort');
const revApplyFiltersBtn = document.getElementById('rev-apply-filters');
const revClearFiltersBtn = document.getElementById('rev-clear-filters');
const revAddBtn = document.getElementById('rev-add-btn');

let allRevClients = [];
let allRevTrainers = [];
let selectedRevClientId = null;
let selectedRevTrainerId = null;
let revClientDropdownIndex = -1;
let revTrainerDropdownIndex = -1;
let revEditClientId = null;
let revEditTrainerId = null;

let revAppliedFilters = {};

function revSnapshotFilters() {
    revAppliedFilters = {
        clientName: revFilterClient.value,
        trainerName: revFilterTrainer.value,
        dateFrom: revFilterDateFrom.value,
        dateTo: revFilterDateTo.value,
        ratingSort: revFilterRatingSort.value
    };
}

function revRestoreFiltersToDOM() {
    revFilterClient.value = revAppliedFilters.clientName || '';
    revFilterTrainer.value = revAppliedFilters.trainerName || '';
    revFilterDateFrom.value = revAppliedFilters.dateFrom || '';
    revFilterDateTo.value = revAppliedFilters.dateTo || '';
    revFilterRatingSort.value = revAppliedFilters.ratingSort || '';
}

function revClearAllFilters() {
    revAppliedFilters = {};
    revFilterClient.value = '';
    revFilterTrainer.value = '';
    revFilterDateFrom.value = '';
    revFilterDateTo.value = '';
    revFilterRatingSort.value = '';
}

// ---- Модальное окно отзывов ----
function revResetModal(isEdit) {
    revClientInput.value = '';
    revTrainerInput.value = '';
    revRatingSelect.value = '5';
    revTextInput.value = '';
    selectedRevClientId = null;
    selectedRevTrainerId = null;
    revEditClientId = null;
    revEditTrainerId = null;
    revClientInput.disabled = false;
    revTrainerInput.disabled = false;
    if (isEdit) {
        revModalTitle.textContent = 'Редактировать отзыв';
        revSubmitBtn.textContent = 'Сохранить';
    } else {
        revModalTitle.textContent = 'Добавить отзыв';
        revSubmitBtn.textContent = 'Добавить';
    }
}

function revOpenModal() { revModal.classList.add('show'); }
function revCloseModal() { revModal.classList.remove('show'); revResetModal(false); }

function revOpenCreateModal() { revResetModal(false); revOpenModal(); }

function revOpenEditModal(review) {
    revResetModal(true);
    revClientInput.value = review.clientName;
    selectedRevClientId = review.clientId;
    revTrainerInput.value = review.trainerName;
    selectedRevTrainerId = review.trainerId;
    revRatingSelect.value = review.rating || '5';
    revTextInput.value = review.reviewText || '';
    revEditClientId = review.clientId;
    revEditTrainerId = review.trainerId;
    revClientInput.disabled = true;
    revTrainerInput.disabled = true;
    revOpenModal();
}

// ---- Валидация отзыва ----
function validateRevForm() {
    if (!selectedRevClientId) { showToast('Выберите клиента'); return false; }
    if (!selectedRevTrainerId) { showToast('Выберите тренера'); return false; }
    const rating = parseInt(revRatingSelect.value);
    if (isNaN(rating) || rating < 1 || rating > 5) { showToast('Рейтинг должен быть от 1 до 5'); return false; }
    const text = revTextInput.value.trim();
    if (text.length > 300) { showToast('Текст отзыва не должен превышать 300 символов'); return false; }
    return true;
}

// ---- Автодополнение клиентов ----
function getFilteredRevClients(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return allRevClients.filter(c => c.fullName.toLowerCase().includes(q));
}

function renderRevClientDropdown(filtered) {
    revClientDropdown.innerHTML = '';
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item no-results';
        div.textContent = 'Ничего не найдено';
        revClientDropdown.appendChild(div);
        return;
    }
    filtered.forEach((client, i) => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (i === revClientDropdownIndex) div.classList.add('active');
        div.textContent = client.fullName;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            revClientInput.value = client.fullName;
            selectedRevClientId = client.clientId;
            revClientDropdown.classList.remove('show');
        });
        revClientDropdown.appendChild(div);
    });
}

function onRevClientInput() {
    revClientDropdownIndex = -1;
    selectedRevClientId = null;
    const query = revClientInput.value.trim();
    const filtered = getFilteredRevClients(query);
    renderRevClientDropdown(filtered);
    if (filtered.length > 0) revClientDropdown.classList.add('show');
    else revClientDropdown.classList.remove('show');
}

function onRevClientKeydown(e) {
    const items = revClientDropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length > 0) { revClientDropdownIndex = Math.min(revClientDropdownIndex + 1, items.length - 1); renderRevClientDropdown(getFilteredRevClients(revClientInput.value.trim())); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length > 0) { revClientDropdownIndex = Math.max(revClientDropdownIndex - 1, 0); renderRevClientDropdown(getFilteredRevClients(revClientInput.value.trim())); } }
    else if ((e.key === 'Enter' || e.key === 'Tab') && revClientDropdownIndex >= 0 && revClientDropdownIndex < items.length) { e.preventDefault(); items[revClientDropdownIndex].dispatchEvent(new Event('mousedown')); }
    else if (e.key === 'Escape') { revClientDropdown.classList.remove('show'); }
}

// ---- Автодополнение тренеров ----
function getFilteredRevTrainers(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return allRevTrainers.filter(t => t.fullName.toLowerCase().includes(q));
}

function renderRevTrainerDropdown(filtered) {
    revTrainerDropdown.innerHTML = '';
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item no-results';
        div.textContent = 'Ничего не найдено';
        revTrainerDropdown.appendChild(div);
        return;
    }
    filtered.forEach((trainer, i) => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (i === revTrainerDropdownIndex) div.classList.add('active');
        div.textContent = trainer.fullName;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            revTrainerInput.value = trainer.fullName;
            selectedRevTrainerId = trainer.trainerId;
            revTrainerDropdown.classList.remove('show');
        });
        revTrainerDropdown.appendChild(div);
    });
}

function onRevTrainerInput() {
    revTrainerDropdownIndex = -1;
    selectedRevTrainerId = null;
    const query = revTrainerInput.value.trim();
    const filtered = getFilteredRevTrainers(query);
    renderRevTrainerDropdown(filtered);
    if (filtered.length > 0) revTrainerDropdown.classList.add('show');
    else revTrainerDropdown.classList.remove('show');
}

function onRevTrainerKeydown(e) {
    const items = revTrainerDropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length > 0) { revTrainerDropdownIndex = Math.min(revTrainerDropdownIndex + 1, items.length - 1); renderRevTrainerDropdown(getFilteredRevTrainers(revTrainerInput.value.trim())); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length > 0) { revTrainerDropdownIndex = Math.max(revTrainerDropdownIndex - 1, 0); renderRevTrainerDropdown(getFilteredRevTrainers(revTrainerInput.value.trim())); } }
    else if ((e.key === 'Enter' || e.key === 'Tab') && revTrainerDropdownIndex >= 0 && revTrainerDropdownIndex < items.length) { e.preventDefault(); items[revTrainerDropdownIndex].dispatchEvent(new Event('mousedown')); }
    else if (e.key === 'Escape') { revTrainerDropdown.classList.remove('show'); }
}

// ---- CRUD отзывов ----
async function revCreate() {
    if (!validateRevForm()) return;
    try {
        const response = await fetch(REV_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: selectedRevClientId,
                trainerId: selectedRevTrainerId,
                reviewText: revTextInput.value.trim() || null,
                rating: parseInt(revRatingSelect.value)
            })
        });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.message || `HTTP ${response.status}`); }
        revCloseModal();
        revClearAllFilters();
        await loadReviewsPageData();
        showToast('Отзыв добавлен', 'success');
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
    }
}

async function revUpdate() {
    if (!selectedRevClientId || !selectedRevTrainerId) { showToast('Заполните все поля'); return; }
    try {
        const response = await fetch(REV_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: revEditClientId,
                trainerId: revEditTrainerId,
                reviewText: revTextInput.value.trim() || null,
                rating: parseInt(revRatingSelect.value)
            })
        });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.message || `HTTP ${response.status}`); }
        revCloseModal();
        await loadReviewsPageData();
        showToast('Отзыв обновлён', 'success');
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
    }
}

async function revDelete(review) {
    if (!confirm('Удалить этот отзыв?')) return;
    try {
        const response = await fetch(REV_API, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: review.clientId, trainerId: review.trainerId })
        });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.message || `HTTP ${response.status}`); }
        showToast('Отзыв удалён', 'success');
        await loadReviewsPageData();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

function revOnSubmit() {
    if (revEditClientId !== null) { revUpdate(); }
    else { revCreate(); }
}

// ---- Загрузка всех данных отзывов (1 запрос) ----
async function loadReviewsPageData() {
    try {
        const params = new URLSearchParams();
        if (revAppliedFilters.clientName) params.append('clientName', revAppliedFilters.clientName.trim());
        if (revAppliedFilters.trainerName) params.append('trainerName', revAppliedFilters.trainerName.trim());
        if (revAppliedFilters.dateFrom) params.append('dateFrom', revAppliedFilters.dateFrom);
        if (revAppliedFilters.dateTo) params.append('dateTo', revAppliedFilters.dateTo);
        if (revAppliedFilters.ratingSort) params.append('ratingSort', revAppliedFilters.ratingSort);

        const url = params.toString() ? `${REV_API}/page-data?${params.toString()}` : `${REV_API}/page-data`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        // Справочники для автокомплита
        allRevClients = result.clients;
        allRevTrainers = result.trainers;

        // Отрисовка таблицы
        revTbody.innerHTML = '';
        result.items.forEach(review => {
            const row = revTbody.insertRow();
            row.insertCell(0).textContent = review.clientName;
            row.insertCell(1).textContent = review.trainerName;
            row.insertCell(2).textContent = new Date(review.createdAt).toLocaleDateString('ru-RU');
            const textCell = row.insertCell(3);
            textCell.textContent = review.reviewText || '—';
            textCell.title = review.reviewText || '';
            row.insertCell(4).textContent = review.rating || '—';
            const actionsCell = row.insertCell(5);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => revOpenEditModal(review);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => revDelete(review);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });

        // Статистика
        const stats = result.statistics;
        revTotalSpan.textContent = stats.totalReviews;
        revBestTrainerSpan.textContent = stats.bestTrainerName
            ? `${stats.bestTrainerName} (${stats.bestTrainerAvg})`
            : '—';
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ==========================================

let revTabLoaded = false;

document.querySelectorAll('.page-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');

        if (tab.dataset.tab === 'reviews' && !revTabLoaded) {
            revTabLoaded = true;
            loadReviewsPageData();
        }
    });
});

// ---- Инициализация отзывов ----
revSubmitBtn.addEventListener('click', revOnSubmit);
revCancelBtn.addEventListener('click', revCloseModal);
revApplyFiltersBtn.addEventListener('click', () => { revSnapshotFilters(); loadReviewsPageData(); });
revClearFiltersBtn.addEventListener('click', () => { revClearAllFilters(); loadReviewsPageData(); });
revAddBtn.addEventListener('click', revOpenCreateModal);
revModalClose.addEventListener('click', revCloseModal);
revModal.addEventListener('click', (e) => { if (e.target === revModal) revCloseModal(); });

revClientInput.addEventListener('input', onRevClientInput);
revClientInput.addEventListener('keydown', onRevClientKeydown);
revClientInput.addEventListener('blur', () => setTimeout(() => revClientDropdown.classList.remove('show'), 200));

revTrainerInput.addEventListener('input', onRevTrainerInput);
revTrainerInput.addEventListener('keydown', onRevTrainerKeydown);
revTrainerInput.addEventListener('blur', () => setTimeout(() => revTrainerDropdown.classList.remove('show'), 200));

// Загружаем данные тренеров при старте
loadPageData();