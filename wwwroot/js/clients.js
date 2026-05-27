// API URL (порт уточните по своему проекту)
const API_URL = 'https://localhost:7159/api/Clients';

// DOM-элементы
const tbody = document.getElementById('clients-body');
const errorDiv = document.getElementById('error-message');
const fullNameInput = document.getElementById('fullName');
const birthDateInput = document.getElementById('birthDate');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');
const totalSpan = document.getElementById('total-count');
const activeAbonnementsSpan = document.getElementById('active-abonnements-count');

// Фильтры
const filterFullName = document.getElementById('filter-fullName');
const filterPhone = document.getElementById('filter-phone');
const filterBirthDateFrom = document.getElementById('filter-birthDateFrom');
const filterBirthDateTo = document.getElementById('filter-birthDateTo');
const filterRangeToggle = document.getElementById('filter-range-toggle');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

let currentEditId = null;
const PHONE_MAX_LEN = 12; // +7 + 10 цифр

// ---- Вспомогательные функции ----
function showError(text) {
    errorDiv.textContent = text;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function clearForm() {
    fullNameInput.value = '';
    birthDateInput.value = '';
    phoneInput.value = '';
    editIdField.value = '';
    currentEditId = null;
    formTitle.textContent = 'Добавить клиента';
    submitBtn.textContent = 'Добавить';
    cancelBtn.style.display = 'none';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('ru-RU');
}

// Проверка даты рождения: от 1939 до 2019 включительно
function isValidBirthDate(dateString) {
    if (!dateString) return true;
    return dateString >= '1939-01-01' && dateString <= '2019-12-31';
}

// ---- Валидация формы перед отправкой ----
function validateClientForm() {
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const birthDate = birthDateInput.value;

    // ФИО
    if (!fullName) {
        showError('ФИО обязательно');
        return false;
    }
    if (fullName.length > 50) {
        showError('ФИО не должно превышать 50 символов');
        return false;
    }

    const nameParts = fullName.split(' ').filter(p => p.length > 0);
    if (nameParts.length < 2) {
        showError('Укажите фамилию и имя (минимум 2 слова)');
        return false;
    }
    if (nameParts.length > 3) {
        showError('ФИО должно содержать не более 3 слов');
        return false;
    }
    if (/\s{2,}/.test(fullName)) {
        showError('Пробелы не могут идти подряд');
        return false;
    }

    // Телефон (если указан)
    if (phone && !/^\+7\d{10}$/.test(phone)) {
        showError('Телефон должен быть в формате +79001234501');
        return false;
    }

    // Дата рождения
    if (!isValidBirthDate(birthDate)) {
        showError('Дата рождения должна быть в диапазоне с 1939 по 2019 год');
        return false;
    }

    return true;
}

// ---- Статистика ----
// (Функция updateStats была удалена)

// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (filterFullName.value) params.append('fullName', filterFullName.value.trim());
        if (filterPhone.value) params.append('phone', filterPhone.value.trim());

        if (filterBirthDateFrom.value) {
            const from = filterBirthDateFrom.value;
            const to = (filterRangeToggle.checked && filterBirthDateTo.value)
                ? filterBirthDateTo.value
                : from;
            params.append('birthDateFrom', from);
            params.append('birthDateTo', to);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        
        // Обновляем таблицу
        tbody.innerHTML = '';
        result.items.forEach(client => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = client.clientId;
            row.insertCell(1).textContent = client.fullName;
            row.insertCell(2).textContent = client.birthDate ? formatDate(client.birthDate) : '';
            row.insertCell(3).textContent = client.phone || 'не указан';
            const actionsCell = row.insertCell(4);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => fillFormForEdit(client);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteClient(client.clientId);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
        
        // Обновляем статистику
        const data = result.statistics;
        totalSpan.textContent = data.totalClients;
        activeAbonnementsSpan.textContent = data.activeAbonnements;
    } catch (err) {
        showError(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Заполнение формы для редактирования ----
function fillFormForEdit(client) {
    fullNameInput.value = client.fullName;
    birthDateInput.value = client.birthDate ? client.birthDate.split('T')[0] : '';
    phoneInput.value = client.phone || '';
    editIdField.value = client.clientId;
    currentEditId = client.clientId;
    formTitle.textContent = 'Редактировать клиента';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';
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

// ---- Удаление ----
async function deleteClient(id) {
    if (!confirm('Удалить этого клиента?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showError('Клиент не найден (возможно, уже удалён)');
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
        await updateClient(currentEditId);
    } else {
        await createClient();
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
    filterFullName.value = '';
    filterPhone.value = '';
    filterBirthDateFrom.value = '';
    filterBirthDateTo.value = '';
    filterRangeToggle.checked = false;
    document.getElementById('filter-birthDateTo-group').classList.add('hidden');
    const labelFrom = document.getElementById('filter-birthDateFrom-label');
    if (labelFrom) labelFrom.textContent = 'Дата рождения';
    renderTable();
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

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
filterRangeToggle.addEventListener('change', onToggleRange);

// Загружаем данные при старте
renderTable();