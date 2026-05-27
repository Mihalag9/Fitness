// API URL
const API_URL = 'https://localhost:7159/api/Trainers';
const API_URL_ROLES = 'https://localhost:7159/api/TrainerRoles';
const API_URL_WORKOUTS = 'https://localhost:7159/api/Workouts';

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

// Модальное окно ролей
const roleModal = document.getElementById('role-modal');
const modalTrainerName = document.getElementById('modal-trainer-name');
const modalCloseBtn = document.getElementById('modal-close');
const modalError = document.getElementById('modal-error');
const modalWorkoutSelect = document.getElementById('modal-workout');
const modalRoleInput = document.getElementById('modal-role');
const modalAddBtn = document.getElementById('modal-add-btn');
const modalRolesBody = document.getElementById('modal-roles-body');

let currentEditId = null;

// Роли и тренировки
let allWorkouts = [];
let allRoles = [];
let currentModalTrainerId = null;
let currentModalTrainerName = '';

// ---- Вспомогательные функции ----
function showError(text) {
    errorDiv.textContent = text;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function showModalError(text) {
    modalError.textContent = text;
    modalError.classList.remove('hidden');
    setTimeout(() => modalError.classList.add('hidden'), 5000);
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

// ---- Валидация формы перед отправкой ----
function validateTrainerForm() {
    const fullName = fullNameInput.value.trim();
    const experience = experienceInput.value.trim();

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

    if (experience !== '') {
        const expNum = parseInt(experience, 10);
        if (isNaN(expNum) || expNum < 0) {
            showError('Стаж должен быть неотрицательным числом');
            return false;
        }
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
        
        if (filterExperienceSort.value === 'no_exp') {
            params.append('noExperience', 'true');
        } else if (filterExperienceSort.value === 'asc' || filterExperienceSort.value === 'desc') {
            params.append('experienceSort', filterExperienceSort.value);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const [trainersRes, rolesRes, workoutsRes] = await Promise.all([
            fetch(url),
            fetch(API_URL_ROLES),
            fetch(API_URL_WORKOUTS)
        ]);
        if (!trainersRes.ok) throw new Error(`HTTP ${trainersRes.status}`);
        const result = await trainersRes.json();
        allRoles = await rolesRes.json();
        allWorkouts = await workoutsRes.json();
        
        tbody.innerHTML = '';
        result.items.forEach(trainer => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = trainer.trainerId;
            row.insertCell(1).textContent = trainer.fullName;
            row.insertCell(2).textContent = (trainer.experience != null && trainer.experience > 0) ? trainer.experience : '—';

            const specCell = row.insertCell(3);
            specCell.className = 'spec-cell';
            const trainerRoles = allRoles.filter(r => r.trainerId === trainer.trainerId);
            if (trainerRoles.length > 0) {
                const wrap = document.createElement('div');
                wrap.className = 'role-tags-wrap';
                trainerRoles.forEach(r => {
                    const workout = allWorkouts.find(w => w.workoutId === r.workoutId);
                    const tag = document.createElement('span');
                    tag.className = 'role-tag';
                    tag.textContent = `${workout ? workout.workoutName : '?'} (${r.tRole})`;
                    wrap.appendChild(tag);
                });
                specCell.appendChild(wrap);
            } else {
                specCell.innerHTML = '<span class="role-empty">—</span>';
            }

            const actionsCell = row.insertCell(4);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => fillFormForEdit(trainer);
            const roleBtn = document.createElement('button');
            roleBtn.textContent = '🎯';
            roleBtn.title = 'Роли/специализация';
            roleBtn.onclick = () => openRoleModal(trainer);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteTrainer(trainer.trainerId);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(roleBtn);
            actionsCell.appendChild(deleteBtn);
        });
        
        const data = result.statistics;
        totalSpan.textContent = data.totalTrainers;
        expSpan.textContent = data.trainersWithExperience;
        noExpSpan.textContent = data.trainersWithoutExperience;
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
        await renderTable();
        return true;
    } catch (err) {
        showError(`Не удалось добавить: ${err.message}`);
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

// ---- Модальное окно: Специализация / Роли ----
function openRoleModal(trainer) {
    currentModalTrainerId = trainer.trainerId;
    currentModalTrainerName = trainer.fullName;
    modalTrainerName.textContent = trainer.fullName;
    modalRoleInput.value = '';
    roleModal.classList.remove('hidden');
    loadModalRoles();
}

function closeRoleModal() {
    roleModal.classList.add('hidden');
    currentModalTrainerId = null;
}

async function loadModalRoles() {
    try {
        const [rolesRes, workoutsRes] = await Promise.all([
            fetch(API_URL_ROLES),
            fetch(API_URL_WORKOUTS)
        ]);
        allRoles = await rolesRes.json();
        allWorkouts = await workoutsRes.json();

        const trainerRoleIds = allRoles
            .filter(r => r.trainerId === currentModalTrainerId)
            .map(r => r.workoutId);

        modalWorkoutSelect.innerHTML = '<option value="">-- Выберите --</option>';
        allWorkouts.forEach(w => {
            if (!trainerRoleIds.includes(w.workoutId)) {
                const opt = document.createElement('option');
                opt.value = w.workoutId;
                opt.textContent = w.workoutName;
                modalWorkoutSelect.appendChild(opt);
            }
        });

        const trainerRoles = allRoles.filter(r => r.trainerId === currentModalTrainerId);
        modalRolesBody.innerHTML = '';
        trainerRoles.forEach(r => {
            const workout = allWorkouts.find(w => w.workoutId === r.workoutId);
            const row = modalRolesBody.insertRow();
            row.insertCell(0).textContent = workout ? workout.workoutName : '?';
            row.insertCell(1).textContent = r.tRole;
            const delCell = row.insertCell(2);
            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑️';
            delBtn.title = 'Удалить';
            delBtn.onclick = () => deleteTrainerRole(r.trainerId, r.workoutId);
            delCell.appendChild(delBtn);
        });
    } catch (err) {
        showModalError(`Ошибка загрузки: ${err.message}`);
    }
}

async function addTrainerRole() {
    const workoutId = parseInt(modalWorkoutSelect.value);
    const role = modalRoleInput.value.trim();

    if (!workoutId) { showModalError('Выберите тренировку'); return; }
    if (!role) { showModalError('Укажите роль'); return; }

    try {
        const response = await fetch(`${API_URL}/${currentModalTrainerId}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workoutId: workoutId,
                tRole: role
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }
        modalRoleInput.value = '';
        await loadModalRoles();
        await renderTable();
    } catch (err) {
        showModalError(`Ошибка: ${err.message}`);
    }
}

async function deleteTrainerRole(trainerId, workoutId) {
    if (!confirm('Удалить эту специализацию?')) return;
    try {
        const response = await fetch(`${API_URL}/${trainerId}/roles/${workoutId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await loadModalRoles();
        await renderTable();
    } catch (err) {
        showModalError(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Инициализация и обработчики событий ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

modalCloseBtn.addEventListener('click', closeRoleModal);
modalAddBtn.addEventListener('click', addTrainerRole);
roleModal.addEventListener('click', function (e) {
    if (e.target === roleModal) closeRoleModal();
});

// Загружаем данные при старте
renderTable();