// API URL
const API_URL = 'https://localhost:7159/api/Trainers';

// DOM-элементы
const tbody = document.getElementById('trainers-body');
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
    formTitle.textContent = 'Добавить тренера';
    submitBtn.textContent = 'Добавить';
    cancelBtn.style.display = 'none';
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
            editBtn.onclick = () => fillFormForEdit(trainer);
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
        clearForm();
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
        clearForm();
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
            clearForm();
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

// ---- Отмена редактирования ----
function onCancel() {
    clearForm();
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

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

// Загружаем данные при старте
renderTable();