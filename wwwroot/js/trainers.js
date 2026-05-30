// API URL
const API_URL = 'https://localhost:7159/api/Trainers';

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
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

let currentEditId = null;

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        fullName: filterFullName.value,
        experienceSort: filterExperienceSort.value
    };
}

function restoreFiltersToDOM() {
    filterFullName.value = appliedFilters.fullName || '';
    filterExperienceSort.value = appliedFilters.experienceSort || '';
}

function clearAllFilters() {
    appliedFilters = {};
    filterFullName.value = '';
    filterExperienceSort.value = '';
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

    return true;
}

// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.fullName) params.append('fullName', appliedFilters.fullName.trim());
        
        if (appliedFilters.experienceSort === 'no_exp') {
            params.append('noExperience', 'true');
        } else if (appliedFilters.experienceSort === 'asc' || appliedFilters.experienceSort === 'desc') {
            params.append('experienceSort', appliedFilters.experienceSort);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        
        tbody.innerHTML = '';
        result.items.forEach(trainer => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = trainer.trainerId;
            row.insertCell(1).textContent = trainer.fullName;
            row.insertCell(2).textContent = (trainer.experience != null && trainer.experience > 0) ? trainer.experience : '—';
            const actionsCell = row.insertCell(3);
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
        
        const data = result.statistics;
        totalSpan.textContent = data.totalTrainers;
        expSpan.textContent = data.trainersWithExperience;
        noExpSpan.textContent = data.trainersWithoutExperience;
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
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
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errText}`);
        }
        closeModal();
        clearAllFilters();
        await renderTable();
        showToast('Тренер добавлен', 'success');
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
        if (response.status === 400) {
            showToast('Неверный запрос (несоответствие ID)');
            return false;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        closeModal();
        restoreFiltersToDOM();
        await renderTable();
        showToast('Тренер обновлён', 'success');
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
        if (response.status === 404) {
            showToast('Тренер не найден (возможно, уже удалён)');
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (id === currentEditId) {
            closeModal();
        }

        restoreFiltersToDOM();
        await renderTable();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
        return;
    }
    showToast('Тренер удалён', 'success');
}

// ---- Обработчик кнопки "Добавить/Сохранить" ----
async function onSubmit() {
    if (currentEditId !== null) {
        await updateTrainer(currentEditId);
    } else {
        await createTrainer();
    }
}

// ---- Фильтры ----
function onApplyFilters() {
    snapshotFilters();
    renderTable();
}

function onClearFilters() {
    clearAllFilters();
    renderTable();
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

// ==========================================
// ВКЛАДКА «ОТЗЫВЫ»
// ==========================================

const REV_API = 'https://localhost:7159/api/Reviews';

// DOM-элементы отзывов
const revTbody = document.getElementById('reviews-body');
const revTotalSpan = document.getElementById('rev-total-count');
const revAvgRatingSpan = document.getElementById('rev-avg-rating');

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

// ---- Отрисовка таблицы отзывов ----
async function revRenderTable() {
    try {
        const params = new URLSearchParams();
        if (revAppliedFilters.clientName) params.append('clientName', revAppliedFilters.clientName.trim());
        if (revAppliedFilters.trainerName) params.append('trainerName', revAppliedFilters.trainerName.trim());
        if (revAppliedFilters.dateFrom) params.append('dateFrom', revAppliedFilters.dateFrom);
        if (revAppliedFilters.dateTo) params.append('dateTo', revAppliedFilters.dateTo);
        if (revAppliedFilters.ratingSort) params.append('ratingSort', revAppliedFilters.ratingSort);

        const url = params.toString() ? `${REV_API}?${params.toString()}` : REV_API;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        revTbody.innerHTML = '';
        result.items.forEach(review => {
            const row = revTbody.insertRow();
            row.insertCell(0).textContent = review.clientName;
            row.insertCell(1).textContent = review.trainerName;
            row.insertCell(2).textContent = new Date(review.createdAt).toLocaleDateString('ru-RU');
            const textCell = row.insertCell(3);
            textCell.textContent = review.reviewText || '—';
            textCell.style.maxWidth = '300px';
            textCell.style.whiteSpace = 'normal';
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

        const stats = result.statistics;
        revTotalSpan.textContent = stats.totalReviews;
        revAvgRatingSpan.textContent = stats.avgRating || '0';
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
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
        await revRenderTable();
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
        await revRenderTable();
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
        await revRenderTable();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

function revOnSubmit() {
    if (revEditClientId !== null) { revUpdate(); }
    else { revCreate(); }
}

// ---- Загрузка справочников ----
async function loadRevDictionaries() {
    try {
        const [clientsResp, trainersResp] = await Promise.all([
            fetch(`${REV_API}/clients`),
            fetch(`${REV_API}/trainers`)
        ]);
        if (clientsResp.ok) allRevClients = await clientsResp.json();
        if (trainersResp.ok) allRevTrainers = await trainersResp.json();
    } catch (err) {
        console.error('Ошибка загрузки справочников:', err);
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
            loadRevDictionaries();
            revRenderTable();
        }
    });
});

// ---- Инициализация отзывов ----
revSubmitBtn.addEventListener('click', revOnSubmit);
revCancelBtn.addEventListener('click', revCloseModal);
revApplyFiltersBtn.addEventListener('click', () => { revSnapshotFilters(); revRenderTable(); });
revClearFiltersBtn.addEventListener('click', () => { revClearAllFilters(); revRenderTable(); });
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
renderTable();