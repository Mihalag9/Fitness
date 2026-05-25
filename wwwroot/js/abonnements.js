// API URL
const API_URL = 'https://localhost:7159/api/Abonnements';

// DOM-элементы
const tbody = document.getElementById('abonnements-body');
const errorDiv = document.getElementById('error-message');
const abonnementTypeInput = document.getElementById('abonnementType');
const priceInput = document.getElementById('price');
const durationMonthsInput = document.getElementById('durationMonths');
const weekdayAccessSelect = document.getElementById('weekdayAccess');
const weekendAccessSelect = document.getElementById('weekendAccess');
const accessStartTimeInput = document.getElementById('accessStartTime');
const accessEndTimeInput = document.getElementById('accessEndTime');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');
const totalSpan = document.getElementById('total-count');
const revenueSpan = document.getElementById('total-revenue');
const avgDurationSpan = document.getElementById('avg-duration');

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

// ---- Вспомогательные функции ----
function showError(text) {
    errorDiv.textContent = text;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function clearForm() {
    abonnementTypeInput.value = '';
    priceInput.value = '';
    durationMonthsInput.value = '';
    weekdayAccessSelect.value = 'true';
    weekendAccessSelect.value = 'true';
    accessStartTimeInput.value = '08:00';
    accessEndTimeInput.value = '23:00';
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
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        const data = await response.json();
        totalSpan.textContent = data.totalAbonnements;
        revenueSpan.textContent = data.totalRevenue.toLocaleString('ru-RU');
        avgDurationSpan.textContent = data.averageDuration;
    } catch (err) {
        console.error('Ошибка статистики:', err);
    }
}

// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
        // Собираем query string из фильтров
        const params = new URLSearchParams();
        if (filterAbonnementType.value) params.append('abonnementType', filterAbonnementType.value.trim());
        if (filterWeekdayAccess.value !== '') params.append('weekdayAccess', filterWeekdayAccess.value === 'true');
        if (filterWeekendAccess.value !== '') params.append('weekendAccess', filterWeekendAccess.value === 'true');
        if (filterPriceMin.value) params.append('priceMin', filterPriceMin.value);
        if (filterPriceMax.value) params.append('priceMax', filterPriceMax.value);
        if (filterSortField.value) {
            params.append('sortField', filterSortField.value);
            params.append('sortDirection', filterSortDirection.value);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const abonnements = await response.json();
        tbody.innerHTML = '';
        abonnements.forEach(abonnement => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = abonnement.abonnementId;
            row.insertCell(1).textContent = abonnement.abonnementType;
            row.insertCell(2).textContent = formatCurrency(abonnement.price);
            row.insertCell(3).textContent = abonnement.durationMonths;
            row.insertCell(4).textContent = boolToStr(abonnement.weekdayAccess);
            row.insertCell(5).textContent = boolToStr(abonnement.weekendAccess);
            const actionsCell = row.insertCell(6);
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
        await updateStats();
    } catch (err) {
        showError(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Заполнение формы для редактирования ----
function fillFormForEdit(abonnement) {
    abonnementTypeInput.value = abonnement.abonnementType;
    priceInput.value = abonnement.price;
    durationMonthsInput.value = abonnement.durationMonths;
    weekdayAccessSelect.value = abonnement.weekdayAccess ? 'true' : 'false';
    weekendAccessSelect.value = abonnement.weekendAccess ? 'true' : 'false';
    accessStartTimeInput.value = abonnement.accessStartTime.substring(0, 5);
    accessEndTimeInput.value = abonnement.accessEndTime.substring(0, 5);
    editIdField.value = abonnement.abonnementId;
    currentEditId = abonnement.abonnementId;
    formTitle.textContent = 'Редактировать абонемент';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';
}

// ---- Добавление нового ----
async function createAbonnement() {
    const newAbonnement = collectFormData();
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
        await renderTable();
        return true;
    } catch (err) {
        showError(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление существующего ----
async function updateAbonnement(id) {
    const updated = collectFormData();
    updated.abonnementId = id;
    if (!validateForm(updated)) return false;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (response.status === 400) {
            showError('Неверный запрос (несоответствие ID)');
            return false;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        clearForm();
        await renderTable();
        return true;
    } catch (err) {
        showError(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

function collectFormData() {
    return {
        abonnementType: abonnementTypeInput.value.trim(),
        price: parseFloat(priceInput.value),
        durationMonths: parseInt(durationMonthsInput.value),
        weekdayAccess: weekdayAccessSelect.value === 'true',
        weekendAccess: weekendAccessSelect.value === 'true',
        accessStartTime: accessStartTimeInput.value ? accessStartTimeInput.value + ':00' : '08:00:00',
        accessEndTime: accessEndTimeInput.value ? accessEndTimeInput.value + ':00' : '23:00:00'
    };
}

function validateForm(data) {
    if (!data.abonnementType) {
        showError('Название обязательно');
        return false;
    }
    if (isNaN(data.price) || data.price < 0) {
        showError('Цена должна быть неотрицательным числом');
        return false;
    }
    if (isNaN(data.durationMonths) || data.durationMonths < 1) {
        showError('Длительность должна быть положительным целым числом');
        return false;
    }
    return true;
}

// ---- Удаление ----
async function deleteAbonnement(id) {
    if (!confirm('Удалить этот абонемент?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showError('Абонемент не найден (возможно, уже удалён)');
        } else if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        await renderTable();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
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

// ---- Отмена редактирования ----
function onCancel() {
    clearForm();
}

// ---- Фильтры ----
async function onApplyFilters() {
    await renderTable();
}

function onClearFilters() {
    filterAbonnementType.value = '';
    filterWeekdayAccess.value = '';
    filterWeekendAccess.value = '';
    filterPriceMin.value = '';
    filterPriceMax.value = '';
    filterSortField.value = '';
    filterSortDirection.value = 'asc';
    renderTable();
}

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

// Загружаем данные при старте
renderTable();