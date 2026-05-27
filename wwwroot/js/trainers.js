// API URL
const API_URL = 'https://localhost:7159/api/Trainers';
const ROLES_API_URL = 'https://localhost:7159/api/Trainers';
const WORKOUTS_API_URL = 'https://localhost:7159/api/Workouts';

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
const modalOverlay = document.getElementById('roles-modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.querySelector('.modal-close');
const currentRolesDiv = document.getElementById('current-roles');
const modalWorkoutSelect = document.getElementById('modal-workout');
const modalTRoleInput = document.getElementById('modal-trole');
const modalAddRoleBtn = document.getElementById('modal-add-role');
const modalError = document.getElementById('modal-error');

let currentEditId = null;

// Роли
let allRolesMap = new Map();
let workouts = [];
let currentRolesTrainerId = null;
let currentRolesTrainerName = '';

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
        
        // ВАЖНО: Если выбрана пустая опция, мы вообще не добавляем noExperience,
        // чтобы бэкенд не фильтровал по умолчанию.
        if (filterExperienceSort.value === 'no_exp') {
            params.append('noExperience', 'true');
        } else if (filterExperienceSort.value === 'asc' || filterExperienceSort.value === 'desc') {
            params.append('experienceSort', filterExperienceSort.value);
        }
        // Если выбрано "", ничего не добавляем, параметры не фильтруются.

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        
        // Обновляем таблицу
        tbody.innerHTML = '';
        result.items.forEach(trainer => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = trainer.trainerId;
            row.insertCell(1).textContent = trainer.fullName;
            row.insertCell(2).textContent = (trainer.experience != null && trainer.experience > 0) ? trainer.experience : '—';
            const rolesCell = row.insertCell(3);
            rolesCell.className = 'roles-cell';
            const trainerRoles = allRolesMap.get(trainer.trainerId) || [];
            if (trainerRoles.length > 0) {
                trainerRoles.forEach(role => {
                    const badge = document.createElement('span');
                    badge.className = 'role-badge';
                    badge.innerHTML = `${role.workoutName} <span class="badge-role">(${role.tRole})</span>`;
                    rolesCell.appendChild(badge);
                });
            }
            const manageBtn = document.createElement('button');
            manageBtn.className = 'btn-manage-roles';
            manageBtn.textContent = '⚙️';
            manageBtn.title = 'Управлять ролями';
            manageBtn.onclick = () => openRolesModal(trainer.trainerId, trainer.fullName);
            rolesCell.appendChild(manageBtn);
            const actionsCell = row.insertCell(4);
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
        
        // Обновляем статистику
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

// ---- Загрузка ролей и тренировок ----
async function loadAllRoles() {
    try {
        const response = await fetch(`${ROLES_API_URL}/roles`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const roles = await response.json();
        allRolesMap.clear();
        roles.forEach(role => {
            if (!allRolesMap.has(role.trainerId)) {
                allRolesMap.set(role.trainerId, []);
            }
            allRolesMap.get(role.trainerId).push(role);
        });
    } catch (err) {
        console.error('Ошибка загрузки ролей:', err);
    }
}

async function loadWorkouts() {
    try {
        const response = await fetch(WORKOUTS_API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        workouts = await response.json();
    } catch (err) {
        console.error('Ошибка загрузки тренировок:', err);
        workouts = [];
    }
}

// ---- Модальное окно ролей ----
function showModalError(text) {
    modalError.textContent = text;
    modalError.classList.remove('hidden');
    setTimeout(() => modalError.classList.add('hidden'), 5000);
}

function populateWorkoutSelect(excludeTrainerId) {
    const ownedIds = new Set((allRolesMap.get(excludeTrainerId) || []).map(r => r.workoutId));
    modalWorkoutSelect.innerHTML = '<option value="">— выберите тренировку —</option>';
    workouts.forEach(w => {
        if (!ownedIds.has(w.workoutId)) {
            const opt = document.createElement('option');
            opt.value = w.workoutId;
            opt.textContent = w.workoutName;
            modalWorkoutSelect.appendChild(opt);
        }
    });
}

async function openRolesModal(trainerId, trainerName) {
    currentRolesTrainerId = trainerId;
    currentRolesTrainerName = trainerName;
    modalTitle.textContent = `Роли тренера: ${trainerName}`;
    modalTRoleInput.value = '';
    modalError.classList.add('hidden');
    await loadRolesForModal(trainerId);
    modalOverlay.classList.add('show');
}

function closeRolesModal() {
    modalOverlay.classList.remove('show');
    currentRolesTrainerId = null;
    currentRolesTrainerName = '';
}

async function loadRolesForModal(trainerId) {
    try {
        const response = await fetch(`${ROLES_API_URL}/${trainerId}/roles`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const roles = await response.json();

        // Обновляем allRolesMap для бейджей
        allRolesMap.set(trainerId, roles);

        populateWorkoutSelect(trainerId);
        renderCurrentRoles(roles);
    } catch (err) {
        showModalError(`Ошибка загрузки ролей: ${err.message}`);
    }
}

function renderCurrentRoles(roles) {
    currentRolesDiv.innerHTML = '';

    if (!roles || roles.length === 0) {
        currentRolesDiv.innerHTML = '<div class="no-roles-msg">У тренера пока нет ролей</div>';
        return;
    }

    roles.forEach(role => {
        const row = document.createElement('div');
        row.className = 'role-row';
        row.innerHTML = `
            <div class="role-row-info">
                <span class="workout-name">${role.workoutName}</span>
                <span class="role-name">${role.tRole}</span>
            </div>
        `;
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete-role';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = () => handleDeleteRole(role.trainerId, role.workoutId);
        row.appendChild(delBtn);
        currentRolesDiv.appendChild(row);
    });
}

async function handleAddRole() {
    const workoutId = parseInt(modalWorkoutSelect.value, 10);
    const tRole = modalTRoleInput.value.trim();

    if (!workoutId) {
        showModalError('Выберите тренировку');
        return;
    }
    if (!tRole) {
        showModalError('Укажите роль');
        return;
    }
    if (tRole.length > 100) {
        showModalError('Роль не должна превышать 100 символов');
        return;
    }

    try {
        const response = await fetch(`${ROLES_API_URL}/${currentRolesTrainerId}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workoutId: workoutId,
                tRole: tRole
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errText}`);
        }
        modalTRoleInput.value = '';
        await loadRolesForModal(currentRolesTrainerId);
        renderTable();
    } catch (err) {
        showModalError(`Не удалось добавить роль: ${err.message}`);
    }
}

async function handleDeleteRole(trainerId, workoutId) {
    if (!confirm('Удалить эту роль?')) return;
    try {
        const response = await fetch(`${ROLES_API_URL}/${trainerId}/roles/${workoutId}`, {
            method: 'DELETE'
        });
        if (!response.ok && response.status !== 404) {
            throw new Error(`HTTP ${response.status}`);
        }
        await loadRolesForModal(currentRolesTrainerId);
        renderTable();
    } catch (err) {
        showModalError(`Ошибка удаления: ${err.message}`);
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
modalClose.addEventListener('click', closeRolesModal);
modalAddRoleBtn.addEventListener('click', handleAddRole);
modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeRolesModal();
});
modalTRoleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleAddRole();
});

// Загружаем данные при старте
async function init() {
    await Promise.all([loadAllRoles(), loadWorkouts()]);
    renderTable();
}
init();