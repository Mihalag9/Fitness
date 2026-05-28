// API URL
const API_URL = 'https://localhost:7159/api/Abonnements';

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
const formTitle = document.getElementById('form-title');
const totalSpan = document.getElementById('total-count');
const minPriceSpan = document.getElementById('min-price');
const maxPriceSpan = document.getElementById('max-price');
const unlimitedPercentageSpan = document.getElementById('unlimited-percentage');

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
    accessTimeRangeInput.value = '08:00 - 23:00'; // Дефолтное значение
    editIdField.value = '';
    currentEditId = null;
    formTitle.textContent = 'Добавить абонемент';
    submitBtn.textContent = 'Добавить';
    cancelBtn.style.display = 'none';
}

function boolToStr(value) {
    return value ? 'Да' : 'Нет';
}

function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
}

// ---- Статистика ----
// (Функция updateStats была удалена, так как статистика теперь приходит в общем ответе)


// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.abonnementType) params.append('abonnementType', appliedFilters.abonnementType.trim());
        if (appliedFilters.weekdayAccess !== '') params.append('weekdayAccess', appliedFilters.weekdayAccess === 'true');
        if (appliedFilters.weekendAccess !== '') params.append('weekendAccess', appliedFilters.weekendAccess === 'true');
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
            editBtn.onclick = () => fillFormForEdit(abonnement);
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

// ---- Заполнение формы для редактирования ----
function fillFormForEdit(abonnement) {
    abonnementTypeInput.value = abonnement.abonnementType;
    priceInput.value = abonnement.price;
    durationMonthsInput.value = abonnement.durationMonths;
    weekdayAccessSelect.value = abonnement.weekdayAccess ? 'true' : 'false';
    weekendAccessSelect.value = abonnement.weekendAccess ? 'true' : 'false';

    // Склеиваем "HH:mm" старта и конца в одну строку для единого инпута
    const start = abonnement.accessStartTime.substring(0, 5);
    const end = abonnement.accessEndTime.substring(0, 5);
    accessTimeRangeInput.value = `${start} - ${end}`;

    editIdField.value = abonnement.abonnementId;
    currentEditId = abonnement.abonnementId;
    formTitle.textContent = 'Редактировать абонемент';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';
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
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errText}`);
        }
        clearForm();
        clearAllFilters();
        await renderTable();
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
        return false;
    }
    showToast('Абонемент добавлен', 'success');
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
        if (response.status === 400) {
            showToast('Неверный запрос (несоответствие ID)');
            return false;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        clearForm();
        restoreFiltersToDOM();
        await renderTable();
        showToast('Абонемент обновлён', 'success');
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
    const rawValue = accessTimeRangeInput.value || '';
    if (!isValidTimeRange(rawValue)) {
        showToast('Формат времени: HH:MM - HH:MM (например 08:00 - 23:00)');
        return null;
    }
    const parts = rawValue.replace(/\s+/g, '').split('-');

    const start = parts[0] || '08:00';
    const end = parts[1] || '23:00';

    return {
        abonnementType: abonnementTypeInput.value.trim(),
        price: parseFloat(priceInput.value),
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
        if (response.status === 404) {
            showToast('Абонемент не найден (возможно, уже удалён)');
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // ФИКС: если удалили запись, которая сейчас редактируется — сбрасываем форму
        if (id === currentEditId) {
            clearForm();
        }

        restoreFiltersToDOM();
        await renderTable();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
        return;
    }
    showToast('Абонемент удалён', 'success');
}

// ---- Обработчик кнопки "Добавить/Сохранить" ----
async function onSubmit() {
    if (currentEditId !== null) {
        await updateAbonnement(currentEditId);
    } else {
        await createAbonnement();
    }
}

// ---- Отмена редактирования ----
function onCancel() {
    clearForm();
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

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

// Загружаем данные при старте
renderTable();