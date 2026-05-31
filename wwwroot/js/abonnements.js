// API URL
const API_URL = '/api/Abonnements';
const PURCH_API = '/api/Purchases';

// DOM-элементы
const tbody = document.getElementById('abonnements-body');
const abonnementTypeInput = document.getElementById('abonnementType');
const priceInput = document.getElementById('price');
const durationMonthsInput = document.getElementById('durationMonths');
const weekdayAccessSelect = document.getElementById('weekdayAccess');
const weekendAccessSelect = document.getElementById('weekendAccess');
const accessTimeRangeInput = document.getElementById('accessTimeRange'); // Одно поле вместо двух
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const totalSpan = document.getElementById('total-count');
const minPriceSpan = document.getElementById('min-price');
const maxPriceSpan = document.getElementById('max-price');
const unlimitedPercentageSpan = document.getElementById('unlimited-percentage');
const addAbonnementBtn = document.getElementById('add-abonnement-btn');

// Модальное окно
const modal = document.getElementById('abonnement-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');

// Фильтры
const filterAbonnementType = document.getElementById('filter-abonnementType');
const filterWeekdayAccess = document.getElementById('filter-weekdayAccess');
const filterWeekendAccess = document.getElementById('filter-weekendAccess');
const filterPriceMin = document.getElementById('filter-priceMin');
const filterPriceMax = document.getElementById('filter-priceMax');
const filterSortField = document.getElementById('filter-sortField');
const filterSortDirection = document.getElementById('filter-sortDirection');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

let currentEditId = null;
let allItems = [];

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        abonnementType: filterAbonnementType.value,
        weekdayAccess: filterWeekdayAccess.value,
        weekendAccess: filterWeekendAccess.value,
        priceMin: filterPriceMin.value,
        priceMax: filterPriceMax.value,
        sortField: filterSortField.value,
        sortDirection: filterSortDirection.value
    };
}

function restoreFiltersToDOM() {
    filterAbonnementType.value = appliedFilters.abonnementType || '';
    filterWeekdayAccess.value = appliedFilters.weekdayAccess || '';
    filterWeekendAccess.value = appliedFilters.weekendAccess || '';
    filterPriceMin.value = appliedFilters.priceMin || '';
    filterPriceMax.value = appliedFilters.priceMax || '';
    filterSortField.value = appliedFilters.sortField || '';
    filterSortDirection.value = appliedFilters.sortDirection || 'asc';
}

function clearAllFilters() {
    appliedFilters = {};
    filterAbonnementType.value = '';
    filterWeekdayAccess.value = '';
    filterWeekendAccess.value = '';
    filterPriceMin.value = '';
    filterPriceMax.value = '';
    filterSortField.value = '';
    filterSortDirection.value = 'asc';
}

// ---- Вспомогательные функции ----
function clearForm() {
    abonnementTypeInput.value = '';
    priceInput.value = '';
    durationMonthsInput.value = '';
    weekdayAccessSelect.value = 'true';
    weekendAccessSelect.value = 'true';
    accessTimeRangeInput.value = '08:00 - 23:00';
    editIdField.value = '';
    currentEditId = null;
}

function resetModal(isEdit) {
    clearForm();
    if (isEdit) {
        modalTitle.textContent = 'Редактировать абонемент';
        submitBtn.textContent = 'Сохранить';
    } else {
        modalTitle.textContent = 'Добавить абонемент';
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

function openEditModal(abonnement) {
    resetModal(true);
    abonnementTypeInput.value = abonnement.abonnementType;
    priceInput.value = abonnement.price;
    durationMonthsInput.value = abonnement.durationMonths;
    weekdayAccessSelect.value = abonnement.weekdayAccess ? 'true' : 'false';
    weekendAccessSelect.value = abonnement.weekendAccess ? 'true' : 'false';

    const start = abonnement.accessStartTime.substring(0, 5);
    const end = abonnement.accessEndTime.substring(0, 5);
    accessTimeRangeInput.value = `${start} - ${end}`;

    editIdField.value = abonnement.abonnementId;
    currentEditId = abonnement.abonnementId;
    openModal();
}

function boolToStr(value) {
    return value ? 'Да' : 'Нет';
}

function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
}

// ---- Валидация формы ----
function validateForm(data) {
    if (!data.abonnementType) {
        showToast('Название абонемента обязательно');
        return false;
    }
    if (data.abonnementType.length < 5) {
        showToast('Название должно содержать не менее 5 символов');
        return false;
    }
    if (data.abonnementType.length > 30) {
        showToast('Название не должно превышать 30 символов');
        return false;
    }
    if (/^\d/.test(data.abonnementType)) {
        showToast('Название не может начинаться с цифры');
        return false;
    }
    if (/^\d+$/.test(data.abonnementType)) {
        showToast('Название не может состоять только из цифр');
        return false;
    }
    if (/[^a-zA-Zа-яА-ЯёЁ\s-]/.test(data.abonnementType)) {
        showToast('Название содержит недопустимые символы');
        return false;
    }
    const duplicate = allItems.some(i =>
        i.abonnementType.toLowerCase() === data.abonnementType.toLowerCase() &&
        i.abonnementId !== currentEditId
    );
    if (duplicate) {
        showToast('Абонемент с таким типом уже существует');
        return false;
    }
    if (isNaN(data.price) || data.price <= 1000) {
        showToast('Цена должна быть больше 1000 рублей');
        return false;
    }
    if (data.price > 100000) {
        showToast('Цена не может превышать 100 000 рублей');
        return false;
    }
    if (isNaN(data.durationMonths) || data.durationMonths < 1 || data.durationMonths > 18) {
        showToast('Срок действия должен быть от 1 до 18 месяцев');
        return false;
    }
    return true;
}

// ---- Статистика ----
// (Функция updateStats была удалена, так как статистика теперь приходит в общем ответе)


// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.abonnementType) params.append('abonnementType', appliedFilters.abonnementType.trim());
        if (appliedFilters.weekdayAccess != null && appliedFilters.weekdayAccess !== '') params.append('weekdayAccess', appliedFilters.weekdayAccess === 'true');
        if (appliedFilters.weekendAccess != null && appliedFilters.weekendAccess !== '') params.append('weekendAccess', appliedFilters.weekendAccess === 'true');
        if (appliedFilters.priceMin) params.append('priceMin', appliedFilters.priceMin);
        if (appliedFilters.priceMax) params.append('priceMax', appliedFilters.priceMax);
        if (appliedFilters.sortField) {
            params.append('sortField', appliedFilters.sortField);
            params.append('sortDirection', appliedFilters.sortDirection);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        allItems = result.items;
        
        // Обновляем таблицу
        tbody.innerHTML = '';
        result.items.forEach(abonnement => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = abonnement.abonnementId;
            row.insertCell(1).textContent = abonnement.abonnementType;
            row.insertCell(2).textContent = formatCurrency(abonnement.price);
            row.insertCell(3).textContent = abonnement.durationMonths;
            row.insertCell(4).textContent = boolToStr(abonnement.weekdayAccess);
            row.insertCell(5).textContent = boolToStr(abonnement.weekendAccess);
            const timeStr = `${abonnement.accessStartTime.substring(0, 5)} - ${abonnement.accessEndTime.substring(0, 5)}`;
            row.insertCell(6).textContent = timeStr;
            const actionsCell = row.insertCell(7);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => openEditModal(abonnement);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteAbonnement(abonnement.abonnementId);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
        
        // Обновляем статистику
        const data = result.statistics;
        totalSpan.textContent = data.totalAbonnements;
        minPriceSpan.textContent = data.minPrice.toLocaleString('ru-RU');
        maxPriceSpan.textContent = data.maxPrice.toLocaleString('ru-RU');
        unlimitedPercentageSpan.textContent = data.unlimitedPercentage;
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Добавление нового ----
async function createAbonnement() {
    const newAbonnement = collectFormData();
    if (!newAbonnement) return false;
    if (!validateForm(newAbonnement)) return false;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAbonnement)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
        closeModal();
        clearAllFilters();
        await renderTable();
        showToast(data?.message || 'Абонемент добавлен', 'success');
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление существующего ----
async function updateAbonnement(id) {
    const updated = collectFormData();
    if (!updated) return false;
    updated.abonnementId = id;
    if (!validateForm(updated)) return false;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
        closeModal();
        restoreFiltersToDOM();
        await renderTable();
        showToast(data?.message || 'Абонемент обновлён', 'success');
        return true;
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

function isValidTimeRange(value) {
    return /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/.test(value.replace(/\s+/g, ''));
}

function collectFormData() {
    let rawValue = accessTimeRangeInput.value || '';
    rawValue = rawValue.trim();
    if (!rawValue) {
        rawValue = '08:00 - 23:00';
    }
    if (!isValidTimeRange(rawValue)) {
        showToast('Формат времени: HH:MM - HH:MM (например 08:00 - 23:00)');
        return null;
    }
    const parts = rawValue.replace(/\s+/g, '').split('-');

    const start = parts[0] || '08:00';
    const end = parts[1] || '23:00';

    let name = abonnementTypeInput.value.trim();
    if (name.length > 0) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    let price = parseFloat(priceInput.value);
    if (!isNaN(price)) {
        price = Math.round(price * 100) / 100;
    }

    return {
        abonnementType: name,
        price: price,
        durationMonths: parseInt(durationMonthsInput.value),
        weekdayAccess: weekdayAccessSelect.value === 'true',
        weekendAccess: weekendAccessSelect.value === 'true',
        // Приводим к виду "HH:mm:00" для бэкенда
        accessStartTime: start.substring(0, 5) + ':00',
        accessEndTime: end.substring(0, 5) + ':00'
    };
}

// ---- Удаление ----
async function deleteAbonnement(id) {
    if (!confirm('Удалить этот абонемент?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);

        if (id === currentEditId) {
            closeModal();
        }

        restoreFiltersToDOM();
        await renderTable();
        showToast(data?.message || 'Абонемент удалён', 'success');
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Обработчик кнопки "Добавить/Сохранить" ----
async function onSubmit() {
    if (currentEditId !== null) {
        await updateAbonnement(currentEditId);
    } else {
        await createAbonnement();
    }
}

// ---- Фильтры ----
function onApplyFilters() {
    snapshotFilters();
    renderTable();
}

// ---- Очистка фильтров ----
function onClearFilters() {
    clearAllFilters();
    renderTable();
}

// ---- Инициализация и обработчики событий (Абонементы) ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', closeModal);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
addAbonnementBtn.addEventListener('click', openCreateModal);

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ==========================================
// ВКЛАДКА «ПРОДАЖИ»
// ==========================================

// DOM-элементы продаж
const purchTbody = document.getElementById('purchases-body');
const purchTotalSpan = document.getElementById('purch-total-count');
const purchActiveSpan = document.getElementById('purch-active-count');
const purchCompletedSpan = document.getElementById('purch-completed-count');
const purchRevenueSpan = document.getElementById('purch-revenue');

const purchClientInput = document.getElementById('purch-client-input');
const purchClientDropdown = document.getElementById('purch-client-dropdown');
const purchAbonnementInput = document.getElementById('purch-abonnement-input');
const purchAbonnementDropdown = document.getElementById('purch-abonnement-dropdown');
const purchDateInput = document.getElementById('purch-date');
const purchExpiryInput = document.getElementById('purch-expiry');
const purchStatusSelect = document.getElementById('purch-status');
const purchSubmitBtn = document.getElementById('purch-submit-btn');
const purchCancelBtn = document.getElementById('purch-cancel-btn');
const purchModal = document.getElementById('purchase-modal');
const purchModalClose = document.getElementById('purch-modal-close');
const purchModalTitle = document.getElementById('purch-modal-title');

const purchFilterClient = document.getElementById('purch-filter-client');
const purchFilterAbonnement = document.getElementById('purch-filter-abonnement');
const purchFilterStatus = document.getElementById('purch-filter-status');
const purchFilterDateFrom = document.getElementById('purch-filter-dateFrom');
const purchFilterDateTo = document.getElementById('purch-filter-dateTo');
const purchApplyFiltersBtn = document.getElementById('purch-apply-filters');
const purchClearFiltersBtn = document.getElementById('purch-clear-filters');
const purchAddBtn = document.getElementById('purch-add-btn');

let allPurchClients = [];
let allPurchAbonnements = [];
let selectedClientId = null;
let selectedAbonnementId = null;
let purchClientDropdownIndex = -1;
let purchAbonnementDropdownIndex = -1;
let purchEditClientId = null;
let purchEditAbonnementId = null;
let purchEditPurchaseDate = null;

let purchAppliedFilters = {};

function purchSnapshotFilters() {
    purchAppliedFilters = {
        clientName: purchFilterClient.value,
        abonnementType: purchFilterAbonnement.value,
        status: purchFilterStatus.value,
        dateFrom: purchFilterDateFrom.value,
        dateTo: purchFilterDateTo.value
    };
}

function purchRestoreFiltersToDOM() {
    purchFilterClient.value = purchAppliedFilters.clientName || '';
    purchFilterAbonnement.value = purchAppliedFilters.abonnementType || '';
    purchFilterStatus.value = purchAppliedFilters.status || '';
    purchFilterDateFrom.value = purchAppliedFilters.dateFrom || '';
    purchFilterDateTo.value = purchAppliedFilters.dateTo || '';
}

function purchClearAllFilters() {
    purchAppliedFilters = {};
    purchFilterClient.value = '';
    purchFilterAbonnement.value = '';
    purchFilterStatus.value = '';
    purchFilterDateFrom.value = '';
    purchFilterDateTo.value = '';
}

// ---- Модальное окно продаж ----
function purchResetModal(isEdit) {
    purchClientInput.value = '';
    purchAbonnementInput.value = '';
    purchDateInput.value = '';
    purchExpiryInput.value = '';
    purchStatusSelect.value = 'активен';
    selectedClientId = null;
    selectedAbonnementId = null;
    purchEditClientId = null;
    purchEditAbonnementId = null;
    purchEditPurchaseDate = null;
    purchClientInput.disabled = false;
    purchAbonnementInput.disabled = false;
    purchDateInput.disabled = false;
    purchStatusSelect.disabled = !isEdit;
    if (isEdit) {
        purchModalTitle.textContent = 'Редактировать продажу';
        purchSubmitBtn.textContent = 'Сохранить';
    } else {
        purchModalTitle.textContent = 'Добавить продажу';
        purchSubmitBtn.textContent = 'Добавить';
    }
}

function purchOpenModal() { purchModal.classList.add('show'); }
function purchCloseModal() { purchModal.classList.remove('show'); purchResetModal(false); }

function purchOpenCreateModal() { purchResetModal(false); purchOpenModal(); }

function purchOpenEditModal(purchase) {
    purchResetModal(true);
    purchClientInput.value = purchase.clientName;
    selectedClientId = purchase.clientId;
    purchAbonnementInput.value = purchase.abonnementType;
    selectedAbonnementId = purchase.abonnementId;
    purchDateInput.value = purchase.purchaseDate;
    if (purchase.status === 'завершен') {
        purchDateInput.disabled = true;
    }
    purchExpiryInput.value = purchase.expiryDate;
    purchStatusSelect.value = purchase.status;
    purchEditClientId = purchase.clientId;
    purchEditAbonnementId = purchase.abonnementId;
    purchEditPurchaseDate = purchase.purchaseDate;
    purchClientInput.disabled = true;
    purchAbonnementInput.disabled = true;
    purchOpenModal();
}

// ---- Валидация продажи ----
function validatePurchForm() {
    if (!selectedClientId) { showToast('Выберите клиента'); return false; }
    if (!selectedAbonnementId) { showToast('Выберите абонемент'); return false; }
    if (!purchDateInput.value) { showToast('Укажите дату начала'); return false; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(purchDateInput.value);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    if (selected < today) { showToast('Дата начала не может быть раньше сегодняшнего дня'); return false; }
    if (selected > maxDate) { showToast('Дата начала не может быть позже 3 месяцев от сегодня'); return false; }

    if (!purchEditClientId) {
        const hasActive = false;
        // Проверка активного абонемента будет на сервере через триггер
    }
    return true;
}

// ---- Автодополнение клиентов ----
function getFilteredClients(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return allPurchClients.filter(c => c.fullName.toLowerCase().includes(q));
}

function renderClientDropdown(filtered) {
    purchClientDropdown.innerHTML = '';
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item no-results';
        div.textContent = 'Ничего не найдено';
        purchClientDropdown.appendChild(div);
        return;
    }
    filtered.forEach((client, i) => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (i === purchClientDropdownIndex) div.classList.add('active');
        div.textContent = client.fullName;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            purchClientInput.value = client.fullName;
            selectedClientId = client.clientId;
            purchClientDropdown.classList.remove('show');
        });
        purchClientDropdown.appendChild(div);
    });
}

function onPurchClientInput() {
    purchClientDropdownIndex = -1;
    selectedClientId = null;
    const query = purchClientInput.value.trim();
    const filtered = getFilteredClients(query);
    renderClientDropdown(filtered);
    if (filtered.length > 0) purchClientDropdown.classList.add('show');
    else purchClientDropdown.classList.remove('show');
}

function onPurchClientKeydown(e) {
    const items = purchClientDropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length > 0) { purchClientDropdownIndex = Math.min(purchClientDropdownIndex + 1, items.length - 1); renderClientDropdown(getFilteredClients(purchClientInput.value.trim())); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length > 0) { purchClientDropdownIndex = Math.max(purchClientDropdownIndex - 1, 0); renderClientDropdown(getFilteredClients(purchClientInput.value.trim())); } }
    else if ((e.key === 'Enter' || e.key === 'Tab') && purchClientDropdownIndex >= 0 && purchClientDropdownIndex < items.length) { e.preventDefault(); items[purchClientDropdownIndex].dispatchEvent(new Event('mousedown')); }
    else if (e.key === 'Escape') { purchClientDropdown.classList.remove('show'); }
}

// ---- Автодополнение абонементов ----
function getFilteredAbonnements(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return allPurchAbonnements.filter(a => a.abonnementType.toLowerCase().includes(q));
}

function renderAbonnementDropdown(filtered) {
    purchAbonnementDropdown.innerHTML = '';
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item no-results';
        div.textContent = 'Ничего не найдено';
        purchAbonnementDropdown.appendChild(div);
        return;
    }
    filtered.forEach((abonnement, i) => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (i === purchAbonnementDropdownIndex) div.classList.add('active');
        div.textContent = `${abonnement.abonnementType} (${abonnement.durationMonths} мес, ${abonnement.price} ₽)`;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            purchAbonnementInput.value = abonnement.abonnementType;
            selectedAbonnementId = abonnement.abonnementId;
            purchAbonnementDropdown.classList.remove('show');
            calcExpiryDate(abonnement.durationMonths);
        });
        purchAbonnementDropdown.appendChild(div);
    });
}

function onPurchAbonnementInput() {
    purchAbonnementDropdownIndex = -1;
    selectedAbonnementId = null;
    purchExpiryInput.value = '';
    const query = purchAbonnementInput.value.trim();
    const filtered = getFilteredAbonnements(query);
    renderAbonnementDropdown(filtered);
    if (filtered.length > 0) purchAbonnementDropdown.classList.add('show');
    else purchAbonnementDropdown.classList.remove('show');
}

function onPurchAbonnementKeydown(e) {
    const items = purchAbonnementDropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length > 0) { purchAbonnementDropdownIndex = Math.min(purchAbonnementDropdownIndex + 1, items.length - 1); renderAbonnementDropdown(getFilteredAbonnements(purchAbonnementInput.value.trim())); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length > 0) { purchAbonnementDropdownIndex = Math.max(purchAbonnementDropdownIndex - 1, 0); renderAbonnementDropdown(getFilteredAbonnements(purchAbonnementInput.value.trim())); } }
    else if ((e.key === 'Enter' || e.key === 'Tab') && purchAbonnementDropdownIndex >= 0 && purchAbonnementDropdownIndex < items.length) { e.preventDefault(); items[purchAbonnementDropdownIndex].dispatchEvent(new Event('mousedown')); }
    else if (e.key === 'Escape') { purchAbonnementDropdown.classList.remove('show'); }
}

function calcExpiryDate(durationMonths) {
    const startDate = purchDateInput.value;
    if (!startDate || !durationMonths) { purchExpiryInput.value = ''; return; }
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + durationMonths);
    purchExpiryInput.value = start.toISOString().split('T')[0];
}

// ---- CRUD продаж ----
async function purchCreate() {
    if (!validatePurchForm()) return false;
    try {
        const response = await fetch(PURCH_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: selectedClientId, abonnementId: selectedAbonnementId, purchaseDate: purchDateInput.value })
        });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.message || `HTTP ${response.status}`); }
        purchCloseModal();
        purchClearAllFilters();
        await loadPurchPageData();
        showToast('Продажа добавлена', 'success');
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
    }
}

async function purchUpdate() {
    if (!selectedClientId || !selectedAbonnementId || !purchDateInput.value) { showToast('Заполните все поля'); return; }
    try {
        const response = await fetch(PURCH_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: purchEditClientId, abonnementId: purchEditAbonnementId, purchaseDate: purchEditPurchaseDate, status: purchStatusSelect.value })
        });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.message || `HTTP ${response.status}`); }
        purchCloseModal();
        await loadPurchPageData();
        showToast('Продажа обновлена', 'success');
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
    }
}

async function purchDelete(purchase) {
    if (!confirm('Удалить эту продажу?')) return;
    try {
        const response = await fetch(PURCH_API, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: purchase.clientId, abonnementId: purchase.abonnementId, purchaseDate: purchase.purchaseDate })
        });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.message || `HTTP ${response.status}`); }
        showToast('Продажа удалена', 'success');
        await loadPurchPageData();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

function purchOnSubmit() {
    if (purchEditClientId !== null) { purchUpdate(); }
    else { purchCreate(); }
}

// ---- Загрузка всех данных продаж (1 запрос) ----
async function loadPurchPageData() {
    try {
        const params = new URLSearchParams();
        if (purchAppliedFilters.clientName) params.append('clientName', purchAppliedFilters.clientName.trim());
        if (purchAppliedFilters.abonnementType) params.append('abonnementType', purchAppliedFilters.abonnementType.trim());
        if (purchAppliedFilters.status) params.append('status', purchAppliedFilters.status);
        if (purchAppliedFilters.dateFrom) params.append('dateFrom', purchAppliedFilters.dateFrom);
        if (purchAppliedFilters.dateTo) params.append('dateTo', purchAppliedFilters.dateTo);

        const url = params.toString() ? `${PURCH_API}/page-data?${params.toString()}` : `${PURCH_API}/page-data`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        // Справочники для автокомплита
        allPurchClients = result.clients;
        allPurchAbonnements = result.abonnements;

        // Отрисовка таблицы
        purchTbody.innerHTML = '';
        result.items.forEach(purchase => {
            const row = purchTbody.insertRow();
            row.insertCell(0).textContent = purchase.clientName;
            row.insertCell(1).textContent = purchase.abonnementType;
            row.insertCell(2).textContent = purchase.purchaseDate;
            row.insertCell(3).textContent = purchase.expiryDate;
            row.insertCell(4).textContent = purchase.status;
            const actionsCell = row.insertCell(5);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => purchOpenEditModal(purchase);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => purchDelete(purchase);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });

        // Статистика
        const stats = result.statistics;
        purchTotalSpan.textContent = stats.totalPurchases;
        purchActiveSpan.textContent = stats.activeCount;
        purchCompletedSpan.textContent = stats.completedCount;
        purchRevenueSpan.textContent = stats.totalRevenue.toLocaleString('ru-RU');
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ==========================================

let purchTabLoaded = false;

document.querySelectorAll('.page-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');

        if (tab.dataset.tab === 'purchases') {
            loadPurchPageData();
        }
    });
});

// ---- Инициализация продаж ----
purchSubmitBtn.addEventListener('click', purchOnSubmit);
purchCancelBtn.addEventListener('click', purchCloseModal);
purchApplyFiltersBtn.addEventListener('click', () => { purchSnapshotFilters(); loadPurchPageData(); });
purchClearFiltersBtn.addEventListener('click', () => { purchClearAllFilters(); loadPurchPageData(); });
purchAddBtn.addEventListener('click', purchOpenCreateModal);
purchModalClose.addEventListener('click', purchCloseModal);
purchModal.addEventListener('click', (e) => { if (e.target === purchModal) purchCloseModal(); });

purchClientInput.addEventListener('input', onPurchClientInput);
purchClientInput.addEventListener('keydown', onPurchClientKeydown);
purchClientInput.addEventListener('blur', () => setTimeout(() => purchClientDropdown.classList.remove('show'), 200));

purchAbonnementInput.addEventListener('input', onPurchAbonnementInput);
purchAbonnementInput.addEventListener('keydown', onPurchAbonnementKeydown);
purchAbonnementInput.addEventListener('blur', () => setTimeout(() => purchAbonnementDropdown.classList.remove('show'), 200));

purchDateInput.addEventListener('change', () => {
    if (selectedAbonnementId) {
        const abonnement = allPurchAbonnements.find(a => a.abonnementId === selectedAbonnementId);
        if (abonnement) calcExpiryDate(abonnement.durationMonths);
    }
});

// Загружаем данные абонементов при старте
renderTable();