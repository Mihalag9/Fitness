// API URL
const API_URL = '/api/Abonnements';

// DOM-элементы
const tbody = document.getElementById('abonnements-body');
const abonnementTypeInput = document.getElementById('abonnementType');
const priceInput = document.getElementById('price');
const durationMonthsInput = document.getElementById('durationMonths');
const weekdayAccessSelect = document.getElementById('weekdayAccess');
const weekendAccessSelect = document.getElementById('weekendAccess');
const accessTimeRangeInput = document.getElementById('accessTimeRange');
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

const PAGE_SIZE = 10;

let currentPage = 1;

let currentEditId = null;

accessTimeRangeInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9:\-\s]/g, '');
});

[priceInput, durationMonthsInput].forEach(function (input) {
    input.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 1) val = val.replace(/^0+/, '');
        if (input === priceInput && val && parseInt(val) > 100000) val = '100000';
        if (input === durationMonthsInput && val && parseInt(val) > 18) val = '18';
        this.value = val;
    });
    input.addEventListener('keydown', function (e) {
        const isDigit = /^\d$/.test(e.key);
        const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
        const isCtrlCmd = e.ctrlKey || e.metaKey;
        if (isCtrlCmd || isNav) return;
        if (!isDigit) e.preventDefault();
    });
});

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
    if (/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/.test(data.abonnementType)) {
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

// ---- Отрисовка страницы абонементов ----
function renderAbonnementsPage() {
    tbody.innerHTML = '';
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(start, start + PAGE_SIZE);
    pageItems.forEach(abonnement => {
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
}

function renderAbonnementsPagination() {
    const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    document.getElementById('abonnements-page-info').textContent = `${currentPage} / ${totalPages} (${allItems.length})`;
    document.getElementById('abonnements-prev-btn').disabled = currentPage <= 1;
    document.getElementById('abonnements-next-btn').disabled = currentPage >= totalPages;
}

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
        
        currentPage = 1;
        renderAbonnementsPage();
        renderAbonnementsPagination();

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
    currentPage = 1;
    renderTable();
    showToast('Фильтры применены', 'info');
}

// ---- Очистка фильтров ----
function onClearFilters() {
    clearAllFilters();
    currentPage = 1;
    renderTable();
    showToast('Фильтры сброшены', 'info');
}

// ---- Пагинация абонементов ----
document.getElementById('abonnements-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderAbonnementsPage(); renderAbonnementsPagination(); }
});
document.getElementById('abonnements-next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderAbonnementsPage(); renderAbonnementsPagination(); }
});

// ---- Валидация фильтра цены ----
function clampPriceRange() {
    if (filterPriceMin.value && filterPriceMax.value) {
        const min = parseInt(filterPriceMin.value);
        const max = parseInt(filterPriceMax.value);
        if (min > max) filterPriceMax.value = filterPriceMin.value;
    }
}

[filterPriceMin, filterPriceMax].forEach(function (input) {
    input.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 1) val = val.replace(/^0+/, '');
        if (val && parseInt(val) > 100000) val = '100000';
        this.value = val;
    });
    input.addEventListener('keydown', function (e) {
        if (e.key === ' ') {
            const val = parseInt(this.value);
            if (this.value && val < 1000) this.value = '1000';
            if (this.value && val > 100000) this.value = '100000';
            clampPriceRange();
            e.preventDefault();
            return;
        }
        const isDigit = /^\d$/.test(e.key);
        const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
        const isCtrlCmd = e.ctrlKey || e.metaKey;
        if (!isDigit && !isNav && !isCtrlCmd) e.preventDefault();
    });
    input.addEventListener('blur', function () {
        const val = parseInt(this.value);
        if (this.value && val < 1000) this.value = '1000';
        if (this.value && val > 100000) this.value = '100000';
        clampPriceRange();
    });
});

// ---- Инициализация и обработчики событий (Абонементы) ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', closeModal);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
addAbonnementBtn.addEventListener('click', openCreateModal);

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// Загружаем данные абонементов при старте
renderTable();
