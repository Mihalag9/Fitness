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
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        const data = await response.json();
        totalSpan.textContent = data.totalAbonnements;
        minPriceSpan.textContent = data.minPrice.toLocaleString('ru-RU');
        maxPriceSpan.textContent = data.maxPrice.toLocaleString('ru-RU');
        unlimitedPercentageSpan.textContent = data.unlimitedPercentage;
    } catch (err) {
        console.error('Ошибка статистики:', err);
    }
}

// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
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
    // Дробим строку вида "08:00 - 23:00" на две части, удаляя лишние пробелы
    const rawValue = accessTimeRangeInput.value || '';
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

function validateForm(data) {
    if (!data.abonnementType) {
        showError('Название обязательно');
        return false;
    }
    if (isNaN(data.price) || data.price < 1000) {
        showError('Цена должна быть не меньше 1000');
        return false;
    }
    if (isNaN(data.durationMonths) || data.durationMonths < 1 || data.durationMonths > 18) {
        showError('Длительность должна быть целым числом от 1 до 18');
        return false;
    }

    // Проверка формата времени ЧЧ:ММ (регулярное выражение)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const startShort = data.accessStartTime.substring(0, 5);
    const endShort = data.accessEndTime.substring(0, 5);

    if (!timeRegex.test(startShort) || !timeRegex.test(endShort)) {
        showError('Время должно быть в формате ЧЧ:ММ - ЧЧ:ММ (например, 08:00 - 23:00)');
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

        // ФИКС: если удалили запись, которая сейчас редактируется — сбрасываем форму
        if (id === currentEditId) {
            clearForm();
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

// ---- Очистка фильтров ----
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