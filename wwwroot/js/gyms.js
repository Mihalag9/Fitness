const API_URL = 'https://localhost:7159/api/Gyms';
const EQUIPMENT_API_URL = 'https://localhost:7159/api/Equipment';

const tbody = document.getElementById('gyms-body');
const gymNameInput = document.getElementById('gymName');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');

const filterGymName = document.getElementById('filter-gymName');
const filterHasEquipment = document.getElementById('filter-hasEquipment');
const filterEquipmentName = document.getElementById('filter-equipmentName');
const filterBrand = document.getElementById('filter-brand');
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

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        gymName: filterGymName.value,
        hasEquipment: filterHasEquipment.value,
        equipmentName: filterEquipmentName.value,
        brand: filterBrand.value
    };
}

function restoreFiltersToDOM() {
    filterGymName.value = appliedFilters.gymName || '';
    filterHasEquipment.value = appliedFilters.hasEquipment || '';
    filterEquipmentName.value = appliedFilters.equipmentName || '';
    filterBrand.value = appliedFilters.brand || '';
}

function clearAllFilters() {
    appliedFilters = {};
    filterGymName.value = '';
    filterHasEquipment.value = '';
    filterEquipmentName.value = '';
    filterBrand.value = '';
}

let allEquipment = [];
let currentInventoryIds = new Set();

// ---- Helpers ----
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

// ---- Валидация формы ----
function validateGymForm() {
    const name = gymNameInput.value.trim();

    if (!name) {
        showToast('Название зала обязательно');
        return false;
    }
    if (name.length < 3) {
        showToast('Название зала должно содержать не менее 3 символов');
        return false;
    }
    if (name.length > 30) {
        showToast('Название зала не должно превышать 30 символов');
        return false;
    }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(name)) {
        showToast('Название зала не может состоять только из цифр');
        return false;
    }
    if (/^\d/.test(name)) {
        showToast('Название зала не может начинаться с цифры');
        return false;
    }
    if (!/^[A-ZА-ЯЁ]/.test(name)) {
        showToast('Название зала должно начинаться с заглавной буквы');
        return false;
    }
    if (/\s{2,}/.test(name)) {
        showToast('Пробелы не могут идти подряд');
        return false;
    }

    return true;
}

// ---- Statistics ----
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Ошибка загрузки статистики');
        const data = await response.json();
        totalSpan.textContent = data.totalGyms;
        totalEquipmentSpan.textContent = data.totalEquipmentUnits;
    } catch (err) {
        console.error('Ошибка статистики:', err);
    }
}


// ---- Equipment dictionary (filtered: only not in current gym) ----
function refreshEquipmentSelect() {
    equipmentSelect.innerHTML = '<option value="">— Выберите оборудование —</option>';
    allEquipment.forEach(eq => {
        // Пропускаем оборудование, которое уже есть в зале
        if (currentInventoryIds.has(eq.equipmentId)) return;

        const opt = document.createElement('option');
        opt.value = eq.equipmentId;
        opt.textContent = `${eq.equipmentName}${eq.brand ? ' (' + eq.brand + ')' : ''}`;
        equipmentSelect.appendChild(opt);
    });
}

async function loadEquipmentDictionary() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) throw new Error('Не удалось загрузить справочник оборудования');
        allEquipment = await response.json();
        refreshEquipmentSelect();
    } catch (err) {
        console.error('Ошибка загрузки оборудования:', err);
    }
}

// ---- Brands for filter ----
async function loadBrands() {
    try {
        const response = await fetch(`${EQUIPMENT_API_URL}/brands`);
        if (!response.ok) throw new Error('Не удалось загрузить бренды');
        const brands = await response.json();
        filterBrand.innerHTML = '<option value="">Все бренды</option>';
        brands.forEach(brand => {
            const opt = document.createElement('option');
            opt.value = brand;
            opt.textContent = brand;
            filterBrand.appendChild(opt);
        });
    } catch (err) {
        console.error('Ошибка загрузки брендов:', err);
    }
}

// ---- Inventory management ----
async function loadInventory(gymId) {
    try {
        const response = await fetch(`${API_URL}/${gymId}/inventory`);
        if (!response.ok) throw new Error('Ошибка загрузки инвентаря');
        const items = await response.json();

        // Обновляем Set ID оборудования в зале
        currentInventoryIds.clear();
        items.forEach(item => currentInventoryIds.add(item.equipmentId));

        // Перестраиваем выпадающий список без уже имеющегося оборудования
        refreshEquipmentSelect();

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
            editBtn.onclick = () => startEditInventory(item);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить из зала';
            deleteBtn.onclick = () => deleteInventoryItem(gymId, item.equipmentId);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    } catch (err) {
        showToast(`Ошибка инвентаря: ${err.message}`);
    }
}

// ---- Редактирование количества оборудования (inline) ----
function startEditInventory(item) {
    // Находим строку таблицы по equipmentId
    const rows = inventoryBody.querySelectorAll('tr');
    let targetRow = null;
    rows.forEach(row => {
        if (parseInt(row.cells[0].textContent) === item.equipmentId) {
            targetRow = row;
        }
    });
    if (!targetRow) return;

    // Заменяем ячейку с количеством на input
    const quantityCell = targetRow.cells[4];
    const currentQuantity = item.quantity;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = currentQuantity;
    input.style.width = '60px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾';
    saveBtn.title = 'Сохранить';
    saveBtn.onclick = () => saveInventoryQuantity(item.equipmentId, parseInt(input.value, 10));

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌';
    cancelBtn.title = 'Отмена';
    cancelBtn.onclick = () => loadInventory(currentEditId);

    quantityCell.innerHTML = '';
    quantityCell.appendChild(input);
    quantityCell.appendChild(saveBtn);
    quantityCell.appendChild(cancelBtn);
}

async function saveInventoryQuantity(equipmentId, newQuantity) {
    if (isNaN(newQuantity) || newQuantity < 1) {
        showToast('Количество должно быть не менее 1');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${currentEditId}/inventory`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ equipmentId, quantity: newQuantity })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await loadInventory(currentEditId);
        restoreFiltersToDOM();
        await renderTable();
        await updateStats();
        showToast('Количество обновлено', 'success');
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
    }
}

// ---- Добавление нового оборудования в зал ----
async function addInventoryItem() {
    if (!currentEditId) return;
    const equipmentId = parseInt(equipmentSelect.value, 10);
    const quantity = parseInt(equipmentQuantity.value, 10);

    if (!equipmentId) {
        showToast('Выберите оборудование');
        return;
    }
    if (isNaN(quantity) || quantity < 1) {
        showToast('Количество должно быть не менее 1');
        return;
    }
    // Дополнительная проверка: оборудование уже есть в зале
    if (currentInventoryIds.has(equipmentId)) {
        showToast('Это оборудование уже есть в зале. Используйте редактирование для изменения количества.');
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
        restoreFiltersToDOM();
        await renderTable();
        await updateStats();
        showToast('Оборудование добавлено в зал', 'success');
    } catch (err) {
        showToast(`Ошибка добавления: ${err.message}`);
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
        restoreFiltersToDOM();
        await renderTable();
        await updateStats();
        showToast('Оборудование удалено из зала', 'success');
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Main table ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.gymName) params.append('gymName', appliedFilters.gymName.trim());
        if (appliedFilters.hasEquipment) params.append('hasEquipment', appliedFilters.hasEquipment);
        if (appliedFilters.equipmentName) params.append('equipmentName', appliedFilters.equipmentName.trim());
        if (appliedFilters.brand) params.append('brand', appliedFilters.brand);

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        tbody.innerHTML = '';
        result.items.forEach(gym => {
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
        
        // Обновляем статистику
        const data = result.statistics;
        totalSpan.textContent = data.totalGyms;
        totalEquipmentSpan.textContent = data.totalEquipmentUnits;
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
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
    addEquipmentBtn.textContent = 'Добавить';
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
        clearAllFilters();
        await renderTable();
        showToast('Зал добавлен', 'success');
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
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
            showToast('Неверный запрос (несоответствие ID)');
            return false;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        clearForm();
        restoreFiltersToDOM();
        await renderTable();
        showToast('Зал обновлён', 'success');
        return true;
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

async function deleteGym(id) {
    if (!confirm('Удалить этот зал? Всё оборудование будет отвязано.')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showToast('Зал не найден (возможно, уже удалён)');
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        showToast('Зал удалён', 'success');
        if (id === currentEditId) clearForm();
        restoreFiltersToDOM();
        await renderTable();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
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

function onApplyFilters() {
    snapshotFilters();
    renderTable();
}

function onClearFilters() {
    clearAllFilters();
    renderTable();
}

// ---- Блокировка ввода первой цифры (keydown) ----
function preventLeadingDigit(e, input) {
    const isDigit = /^\d$/.test(e.key);
    const isNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'].includes(e.key);
    const isCtrlCmd = e.ctrlKey || e.metaKey;
    if (isCtrlCmd || isNav) return;
    if (input.value.length === 0 && isDigit) {
        e.preventDefault();
    }
}

gymNameInput.addEventListener('keydown', function (e) { preventLeadingDigit(e, this); });

// ---- Автоформатирование при вводе (input) ----
gymNameInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\"\'\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    val = val.replace(/([a-zA-Zа-яА-ЯёЁ]+)/g, function (match) {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
    this.value = val;
});

// ---- Инициализация ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);
addEquipmentBtn.addEventListener('click', addInventoryItem);

loadEquipmentDictionary();
loadBrands();
renderTable();