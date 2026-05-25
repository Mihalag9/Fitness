// API URL
const API_URL = 'https://localhost:7159/api/Trainers';

// DOM-элементы
const tbody = document.getElementById('trainers-body');
const errorDiv = document.getElementById('error-message');
const fullNameInput = document.getElementById('fullName');
const experienceInput = document.getElementById('experience');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');
const totalSpan = document.getElementById('total-count');
const expSpan = document.getElementById('exp-count');
const noExpSpan = document.getElementById('no-exp-count');

// Фильтры
const filterFullName = document.getElementById('filter-fullName');
const filterExperienceSort = document.getElementById('filter-experienceSort');
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
    experienceInput.value = '';
    editIdField.value = '';
    currentEditId = null;
    formTitle.textContent = 'Добавить тренера';
    submitBtn.textContent = 'Добавить';
    cancelBtn.style.display = 'none';
}

// ---- Статистика ----
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        const data = await response.json();
        totalSpan.textContent = data.totalTrainers;
        expSpan.textContent = data.trainersWithExperience;
        noExpSpan.textContent = data.trainersWithoutExperience;
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
        if (filterExperienceSort.value) params.append('experienceSort', filterExperienceSort.value);

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const trainers = await response.json();
        tbody.innerHTML = '';
        trainers.forEach(trainer => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = trainer.trainerId;
            row.insertCell(1).textContent = trainer.fullName;
            row.insertCell(2).textContent = trainer.experience != null ? trainer.experience : '—';
            const actionsCell = row.insertCell(3);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => fillFormForEdit(trainer);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteTrainer(trainer.trainerId);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
        await updateStats();
    } catch (err) {
        showError(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Заполнение формы для редактирования ----
function fillFormForEdit(trainer) {
    fullNameInput.value = trainer.fullName;
    experienceInput.value = trainer.experience != null ? trainer.experience : '';
    editIdField.value = trainer.trainerId;
    currentEditId = trainer.trainerId;
    formTitle.textContent = 'Редактировать тренера';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';
}

// ---- Добавление нового ----
async function createTrainer() {
    const newTrainer = {
        fullName: fullNameInput.value.trim(),
        experience: experienceInput.value ? parseInt(experienceInput.value) : null
    };
    if (!newTrainer.fullName) {
        showError('ФИО обязательно');
        return false;
    }
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
        clearForm();
        await renderTable();
        return true;
    } catch (err) {
        showError(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление существующего ----
async function updateTrainer(id) {
    const updated = {
        trainerId: id,
        fullName: fullNameInput.value.trim(),
        experience: experienceInput.value ? parseInt(experienceInput.value) : null
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
async function deleteTrainer(id) {
    if (!confirm('Удалить этого тренера?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showError('Тренер не найден (возможно, уже удалён)');
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
        await updateTrainer(currentEditId);
    } else {
        await createTrainer();
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
    filterExperienceSort.value = '';
    renderTable();
}

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

// Загружаем данные при старте
renderTable();