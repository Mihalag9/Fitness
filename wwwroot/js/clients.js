const API_URL = '/api/Clients';

// DOM-элементы
const tbody = document.getElementById('clients-body');
const fullNameInput = document.getElementById('fullName');
const birthDateInput = document.getElementById('birthDate');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const totalSpan = document.getElementById('total-count');
const activeAbonnementsSpan = document.getElementById('active-abonnements-count');
const addClientBtn = document.getElementById('add-client-btn');

// Модальное окно
const modal = document.getElementById('client-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');

// Фильтры
const filterFullName = document.getElementById('filter-fullName');
const filterPhone = document.getElementById('filter-phone');
const filterBirthDateFrom = document.getElementById('filter-birthDateFrom');
const filterBirthDateTo = document.getElementById('filter-birthDateTo');
const filterRangeToggle = document.getElementById('filter-range-toggle');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

const PAGE_SIZE = 10;
let currentPage = 1;
let currentEditId = null;
let allClients = [];

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        fullName: filterFullName.value,
        phone: filterPhone.value,
        birthDateFrom: filterBirthDateFrom.value,
        birthDateTo: filterBirthDateTo.value,
        rangeToggle: filterRangeToggle.checked
    };
}

function restoreFiltersToDOM() {
    filterFullName.value = appliedFilters.fullName || '';
    filterPhone.value = appliedFilters.phone || '';
    filterBirthDateFrom.value = appliedFilters.birthDateFrom || '';
    filterBirthDateTo.value = appliedFilters.birthDateTo || '';
    filterRangeToggle.checked = appliedFilters.rangeToggle || false;
    const group = document.getElementById('filter-birthDateTo-group');
    const labelFrom = document.getElementById('filter-birthDateFrom-label');
    if (filterRangeToggle.checked) {
        group.classList.remove('hidden');
        if (labelFrom) labelFrom.textContent = 'Дата рождения (от)';
    } else {
        group.classList.add('hidden');
        filterBirthDateTo.value = '';
        if (labelFrom) labelFrom.textContent = 'Дата рождения';
    }
}

function clearAllFilters() {
    appliedFilters = {};
    filterFullName.value = '';
    filterPhone.value = '';
    filterBirthDateFrom.value = '';
    filterBirthDateTo.value = '';
    filterRangeToggle.checked = false;
    document.getElementById('filter-birthDateTo-group').classList.add('hidden');
    const labelFrom = document.getElementById('filter-birthDateFrom-label');
    if (labelFrom) labelFrom.textContent = 'Дата рождения';
    currentPage = 1;
}

const PHONE_MAX_LEN = 12;

// ---- Вспомогательные функции ----
function clearForm() {
    fullNameInput.value = '';
    birthDateInput.value = '';
    phoneInput.value = '';
    editIdField.value = '';
    currentEditId = null;
}

function resetModal(isEdit) {
    clearForm();
    if (isEdit) {
        modalTitle.textContent = 'Редактировать клиента';
        submitBtn.textContent = 'Сохранить';
    } else {
        modalTitle.textContent = 'Добавить клиента';
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

function openEditModal(client) {
    resetModal(true);
    fullNameInput.value = client.fullName;
    birthDateInput.value = client.birthDate ? client.birthDate.split('T')[0] : '';
    phoneInput.value = client.phone || '';
    editIdField.value = client.clientId;
    currentEditId = client.clientId;
    openModal();
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('ru-RU');
}

function isValidBirthDate(dateString) {
    return dateString >= '1939-01-01' && dateString <= '2019-12-31';
}

// ---- Валидация формы перед отправкой ----
function validateClientForm() {
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const birthDate = birthDateInput.value;

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

    if (!phone) {
        showToast('Телефон обязателен');
        return false;
    }
    if (!/^\+7\d{10}$/.test(phone)) {
        showToast('Телефон должен быть в формате +79001234501');
        return false;
    }
    const duplicate = allClients.some(c =>
        c.phone === phone && c.clientId !== currentEditId
    );
    if (duplicate) {
        showToast('Клиент с таким номером телефона уже существует');
        return false;
    }

    if (!birthDate) {
        showToast('Дата рождения обязательна');
        return false;
    }
    if (!isValidBirthDate(birthDate)) {
        showToast('Дата рождения должна быть в диапазоне с 1939 по 2019 год');
        return false;
    }

    return true;
}

// ---- Отрисовка страницы клиентов ----
function renderClientPage() {
    tbody.innerHTML = '';
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = allClients.slice(start, start + PAGE_SIZE);

    pageItems.forEach(client => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = client.clientId;
        row.insertCell(1).textContent = client.fullName;
        row.insertCell(2).textContent = client.birthDate ? formatDate(client.birthDate) : '';
        row.insertCell(3).textContent = client.phone || 'не указан';
        const actionsCell = row.insertCell(4);
        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.title = 'Редактировать';
        editBtn.onclick = () => openEditModal(client);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Удалить';
        deleteBtn.onclick = () => deleteClient(client.clientId);
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

// ---- Пагинация клиентов ----
function renderClientsPagination() {
    const totalPages = Math.max(1, Math.ceil(allClients.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    document.getElementById('clients-page-info').textContent = `${currentPage} / ${totalPages} (${allClients.length})`;
    document.getElementById('clients-prev-btn').disabled = currentPage <= 1;
    document.getElementById('clients-next-btn').disabled = currentPage >= totalPages;
}

// ---- Загрузка и отрисовка ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.fullName) params.append('fullName', appliedFilters.fullName.trim());
        if (appliedFilters.phone) params.append('phone', appliedFilters.phone.trim());

        if (appliedFilters.birthDateFrom) {
            const from = appliedFilters.birthDateFrom;
            const to = (appliedFilters.rangeToggle && appliedFilters.birthDateTo)
                ? appliedFilters.birthDateTo
                : from;
            params.append('birthDateFrom', from);
            params.append('birthDateTo', to);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        allClients = result.items;
        
        currentPage = 1;
        renderClientPage();
        renderClientsPagination();

        const data = result.statistics;
        totalSpan.textContent = data.totalClients;
        activeAbonnementsSpan.textContent = data.activeAbonnements;
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Добавление нового ----
async function createClient() {
    if (!validateClientForm()) return false;

    const newClient = {
        fullName: fullNameInput.value.trim(),
        birthDate: birthDateInput.value ? birthDateInput.value : null,
        phone: phoneInput.value.trim() || null
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }
        closeModal();
        clearAllFilters();
        await renderTable();
        showToast(data?.message || 'Клиент добавлен', 'success');
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление существующего ----
async function updateClient(id) {
    if (!validateClientForm()) return false;

    const updated = {
        clientId: id,
        fullName: fullNameInput.value.trim(),
        birthDate: birthDateInput.value ? birthDateInput.value : null,
        phone: phoneInput.value.trim() || null
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }
        closeModal();
        restoreFiltersToDOM();
        await renderTable();
        showToast(data?.message || 'Клиент обновлён', 'success');
        return true;
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

// ---- Удаление ----
async function deleteClient(id) {
    if (!confirm('Удалить этого клиента?')) return;
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
        await renderTable();
        showToast(data?.message || 'Клиент удалён', 'success');
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Обработчик кнопки "Добавить/Сохранить" ----
async function onSubmit() {
    if (currentEditId !== null) {
        await updateClient(currentEditId);
    } else {
        await createClient();
    }
}

// ---- Фильтры ----
function onApplyFilters() {
    snapshotFilters();
    renderTable();
    showToast('Фильтры применены', 'info');
}

function onClearFilters() {
    clearAllFilters();
    renderTable();
    showToast('Фильтры сброшены', 'info');
}

// ---- Переключение диапазона ----
function onToggleRange() {
    const group = document.getElementById('filter-birthDateTo-group');
    const labelFrom = document.getElementById('filter-birthDateFrom-label');
    if (filterRangeToggle.checked) {
        group.classList.remove('hidden');
        if (labelFrom) labelFrom.textContent = 'Дата рождения (от)';
    } else {
        group.classList.add('hidden');
        filterBirthDateTo.value = '';
        if (labelFrom) labelFrom.textContent = 'Дата рождения';
    }
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

// ---- Автоформатирование телефона ----
phoneInput.addEventListener('focus', function () {
    if (!this.value) {
        this.value = '+7';
    }
});

phoneInput.addEventListener('keydown', function (e) {
    const isDigit = /^\d$/.test(e.key);
    const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
    const isCtrlCmd = e.ctrlKey || e.metaKey;

    if (isCtrlCmd || isNav) return;

    if (!isDigit) {
        e.preventDefault();
        return;
    }

    if (this.value.length >= PHONE_MAX_LEN && this.selectionStart === this.selectionEnd) {
        e.preventDefault();
    }
});

phoneInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^+\d]/g, '');

    if (!val.startsWith('+7')) {
        val = val.replace(/\+/g, '');
        val = '+7' + val;
    }

    if (val.length > PHONE_MAX_LEN) {
        val = val.substring(0, PHONE_MAX_LEN);
    }

    this.value = val;
});

// ---- Пагинация ----
document.getElementById('clients-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderClientPage(); renderClientsPagination(); }
});
document.getElementById('clients-next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(allClients.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderClientPage(); renderClientsPagination(); }
});

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', closeModal);
applyFiltersBtn.addEventListener('click', () => { currentPage = 1; onApplyFilters(); });
clearFiltersBtn.addEventListener('click', () => { currentPage = 1; onClearFilters(); });
filterRangeToggle.addEventListener('change', onToggleRange);
addClientBtn.addEventListener('click', openCreateModal);

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (Клиенты / Продажи)
// ==========================================

const PURCH_API = '/api/Purchases';
const PURCH_PAGE_SIZE = 10;

let purchTabLoaded = false;
let salesChartInstance = null;

document.querySelectorAll('.page-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');

        if (tab.dataset.tab === 'purchases' && !purchTabLoaded) {
            purchTabLoaded = true;
            loadPurchPageData();
        }
    });
});

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

// ---- Отрисовка страницы продаж ----
function renderPurchasesPage() {
    purchTbody.innerHTML = '';
    const start = (purchCurrentPage - 1) * PURCH_PAGE_SIZE;
    const pageItems = allPurchItems.slice(start, start + PURCH_PAGE_SIZE);
    pageItems.forEach(purchase => {
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
}

function renderPurchasesPagination() {
    const totalPages = Math.max(1, Math.ceil(allPurchItems.length / PURCH_PAGE_SIZE));
    if (purchCurrentPage > totalPages) purchCurrentPage = totalPages;
    document.getElementById('purchases-page-info').textContent = `${purchCurrentPage} / ${totalPages} (${allPurchItems.length})`;
    document.getElementById('purchases-prev-btn').disabled = purchCurrentPage <= 1;
    document.getElementById('purchases-next-btn').disabled = purchCurrentPage >= totalPages;
}

let purchCurrentPage = 1;
let allPurchItems = [];

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

        allPurchClients = result.clients;
        allPurchAbonnements = result.abonnements;

        allPurchItems = result.items;
        purchCurrentPage = 1;
        renderPurchasesPage();
        renderPurchasesPagination();

        const stats = result.statistics;
        purchTotalSpan.textContent = stats.totalPurchases;
        purchActiveSpan.textContent = stats.activeCount;
        purchCompletedSpan.textContent = stats.completedCount;
        purchRevenueSpan.textContent = stats.totalRevenue.toLocaleString('ru-RU');

        renderSalesChart(result.monthlySales);
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

function renderSalesChart(data) {
    if (!data || data.length === 0) {
        document.getElementById('purchases-chart-card').style.display = 'none';
        return;
    }

    if (salesChartInstance) {
        salesChartInstance.destroy();
        salesChartInstance = null;
    }

    const labels = data.map(d => `${d.month}.${d.year}`);
    const counts = data.map(d => d.count);

    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Продано абонементов',
                data: counts,
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    document.getElementById('purchases-chart-card').style.display = 'block';
}

// ---- Пагинация продаж ----
document.getElementById('purchases-prev-btn').addEventListener('click', () => {
    if (purchCurrentPage > 1) { purchCurrentPage--; renderPurchasesPage(); renderPurchasesPagination(); }
});
document.getElementById('purchases-next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(allPurchItems.length / PURCH_PAGE_SIZE);
    if (purchCurrentPage < totalPages) { purchCurrentPage++; renderPurchasesPage(); renderPurchasesPagination(); }
});

// ---- Инициализация продаж ----
purchSubmitBtn.addEventListener('click', purchOnSubmit);
purchCancelBtn.addEventListener('click', purchCloseModal);
purchApplyFiltersBtn.addEventListener('click', () => { purchCurrentPage = 1; purchSnapshotFilters(); loadPurchPageData(); showToast('Фильтры применены', 'info'); });
purchClearFiltersBtn.addEventListener('click', () => { purchCurrentPage = 1; purchClearAllFilters(); loadPurchPageData(); showToast('Фильтры сброшены', 'info'); });
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

// Загружаем данные клиентов при старте
renderTable();
