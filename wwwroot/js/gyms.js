const API_URL = 'https://localhost:7159/api/Gyms';

const tbody = document.getElementById('gyms-body');
const errorDiv = document.getElementById('error-message');
const gymNameInput = document.getElementById('gymName');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');

const filterGymName = document.getElementById('filter-gymName');
const filterHasEquipment = document.getElementById('filter-hasEquipment');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

const totalSpan = document.getElementById('total-count');
const totalEquipmentSpan = document.getElementById('total-equipment');

// Inventory elements
const inventoryCard = document.getElementById('inventory-card');
const inventoryGymName = document.getElementById('inventory-gym-name');
const equipmentSelect = document.getElementById('equipment-select');
const equipmentQuantity = document.getElementById('equipment-quantity');
const addEquipmentBtn = document.getElementById('add-equipment-btn');
const inventoryBody = document.getElementById('inventory-body');

let currentEditId = null;
let allEquipment = [];

// ---- Helpers ----
function showError(text) {
    errorDiv.textContent = text;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function clearForm() {
    gymNameInput.value = '';
    editIdField.value = '';
    currentEditId = null;
    formTitle.textContent = 'Добавить зал';
    submitBtn.textContent = 'Добавить';
    cancelBtn.style.display = 'none';
    inventoryCard.classList.add('hidden');
    inventoryBody.innerHTML = '';
}

function validateGymForm() {
    const name = gymNameInput.value.trim();
    if (!name) {
        showError('Название зала обязательно');
        return false;
    }
    if (name.length > 100) {
        showError('Название не должно превышать 100 символов');
        return false;
    }
    return true;
}

// ---- Statistics ----
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        const data = await response.json();
        totalSpan.textContent = data.totalGyms;
        totalEquipmentSpan.textContent = data.totalEquipmentUnits;
    } catch (err) {
        console.error('Ошибка статистики:', err);
    }
}

// ---- Equipment dictionary ----
async function loadEquipmentDictionary() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) throw new Error('Не удалось загрузить справочник оборудования');
        allEquipment = await response.json();
        equipmentSelect.innerHTML = '<option value="">— Выберите оборудование —</option>';
        allEquipment.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.equipmentId;
            opt.textContent = `${eq.equipmentName}${eq.brand ? ' (' + eq.brand + ')' : ''}`;
            equipmentSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Ошибка загрузки оборудования:', err);
    }
}

// ---- Inventory management ----
async function loadInventory(gymId) {
    try {
        const response = await fetch(`${API_URL}/${gymId}/inventory`);
        if (!response.ok) throw new Error('Ошибка загрузки инвентаря');
        const items = await response.json();
        inventoryBody.innerHTML = '';
        items.forEach(item => {
            const row = inventoryBody.insertRow();
            row.insertCell(0).textContent = item.equipmentId;
            row.insertCell(1).textContent = item.equipmentName;
            row.insertCell(2).textContent = item.brand || '—';
            row.insertCell(3).textContent = item.model || '—';
            row.insertCell(4).textContent = item.quantity;
            const actionsCell = row.insertCell(5);

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать количество';
            editBtn.onclick = () => {
                equipmentSelect.value = item.equipmentId;
                equipmentQuantity.value = item.quantity;
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить из зала';
            deleteBtn.onclick = () => deleteInventoryItem(gymId, item.equipmentId);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    } catch (err) {
        showError(`Ошибка инвентаря: ${err.message}`);
    }
}

async function addOrUpdateInventory() {
    if (!currentEditId) return;
    const equipmentId = parseInt(equipmentSelect.value, 10);
    const quantity = parseInt(equipmentQuantity.value, 10);

    if (!equipmentId) {
        showError('Выберите оборудование');
        return;
    }
    if (isNaN(quantity) || quantity < 1) {
        showError('Количество должно быть не менее 1');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${currentEditId}/inventory`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ equipmentId, quantity })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        equipmentSelect.value = '';
        equipmentQuantity.value = '1';
        await loadInventory(currentEditId);
        await renderTable(); // обновляем агрегированный список в основной таблице
        await updateStats();
    } catch (err) {
        showError(`Ошибка обновления: ${err.message}`);
    }
}

async function deleteInventoryItem(gymId, equipmentId) {
    if (!confirm('Удалить это оборудование из зала?')) return;
    try {
        const response = await fetch(`${API_URL}/${gymId}/inventory/${equipmentId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await loadInventory(gymId);
        await renderTable();
        await updateStats();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Main table ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (filterGymName.value) params.append('gymName', filterGymName.value.trim());
        if (filterHasEquipment.value) params.append('hasEquipment', filterHasEquipment.value);

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const gyms = await response.json();

        tbody.innerHTML = '';
        gyms.forEach(gym => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = gym.gymId;
            row.insertCell(1).textContent = gym.gymName;
            const equipCell = row.insertCell(2);
            equipCell.textContent = gym.equipmentList || '—';
            equipCell.style.whiteSpace = 'normal';
            equipCell.style.maxWidth = '400px';

            const actionsCell = row.insertCell(3);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => fillFormForEdit(gym);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteGym(gym.gymId);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
        await updateStats();
    } catch (err) {
        showError(`Ошибка загрузки: ${err.message}`);
    }
}

function fillFormForEdit(gym) {
    gymNameInput.value = gym.gymName;
    editIdField.value = gym.gymId;
    currentEditId = gym.gymId;
    formTitle.textContent = 'Редактировать зал';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';

    inventoryCard.classList.remove('hidden');
    inventoryGymName.textContent = gym.gymName;
    loadInventory(gym.gymId);
}

// ---- CRUD Gym ----
async function createGym() {
    if (!validateGymForm()) return false;
    const newGym = { gymName: gymNameInput.value.trim() };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGym)
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

async function updateGym(id) {
    if (!validateGymForm()) return false;
    const updated = { gymId: id, gymName: gymNameInput.value.trim() };

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

async function deleteGym(id) {
    if (!confirm('Удалить этот зал? Всё оборудование будет отвязано.')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showError('Зал не найден (возможно, уже удалён)');
        } else if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        if (id === currentEditId) clearForm();
        await renderTable();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Handlers ----
async function onSubmit() {
    if (currentEditId !== null) {
        await updateGym(currentEditId);
    } else {
        await createGym();
    }
}

function onCancel() {
    clearForm();
}

async function onApplyFilters() {
    await renderTable();
}

function onClearFilters() {
    filterGymName.value = '';
    filterHasEquipment.value = '';
    renderTable();
}

// ---- Input formatting ----
gymNameInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\"\'\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    this.value = val;
});

// ---- Init ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
addEquipmentBtn.addEventListener('click', addOrUpdateInventory);

loadEquipmentDictionary();
renderTable();