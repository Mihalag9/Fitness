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
const phoneSpan = document.getElementById('phone-count');
const activeAbonnementsSpan = document.getElementById('active-abonnements-count');

// Фильтры
const filterFullName = document.getElementById('filter-fullName');
const filterPhone = document.getElementById('filter-phone');
const filterBirthDateFrom = document.getElementById('filter-birthDateFrom');
const filterBirthDateTo = document.getElementById('filter-birthDateTo');
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

// ---- Статистика ----
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        const data = await response.json();
        totalSpan.textContent = data.totalClients;
        phoneSpan.textContent = data.clientsWithPhone;
        activeAbonnementsSpan.textContent = data.activeAbonnements;
    } catch (err) {
        console.error('Ошибка статистики:', err);
    }
}

// ---- Отрисовка таблицы ----
async function renderTable() {
    try {
        // Собираем query string из фильтров
        const params = new URLSearchParams();
        if (filterFullName.value) params.append('fullName', filterFullName.value.trim());
        if (filterPhone.value) params.append('phone', filterPhone.value.trim());
        if (filterBirthDateFrom.value) params.append('birthDateFrom', filterBirthDateFrom.value);
        if (filterBirthDateTo.value) params.append('birthDateTo', filterBirthDateTo.value);

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const clients = await response.json();
        tbody.innerHTML = '';
        clients.forEach(client => {
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
        await updateStats();
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
    const newClient = {
        fullName: fullNameInput.value.trim(),
        birthDate: birthDateInput.value ? birthDateInput.value : null,
        phone: phoneInput.value.trim()
    };
    if (!newClient.fullName) {
        showError('ФИО обязательно');
        return false;
    }
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
    const updated = {
        clientId: id,
        fullName: fullNameInput.value.trim(),
        birthDate: birthDateInput.value ? birthDateInput.value : null,
        phone: phoneInput.value.trim()
    };
    if (!updated.fullName) {
        showError('ФИО не может быть пустым');
        return false;
    }
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
    renderTable();
}

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

// Загружаем данные при старте
renderTable();
