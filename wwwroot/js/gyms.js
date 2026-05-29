const API_URL = 'https://localhost:7159/api/Gyms';
const EQUIPMENT_API_URL = 'https://localhost:7159/api/Equipment';

const tbody = document.getElementById('gyms-body');
const gymNameInput = document.getElementById('gymName');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');

// Модальное окно
const modal = document.getElementById('gym-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const addGymBtn = document.getElementById('add-gym-btn');

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
const equipmentInput = document.getElementById('equipment-input');
const equipmentDropdown = document.getElementById('equipment-dropdown');
const equipmentQuantity = document.getElementById('equipment-quantity');
const addEquipmentBtn = document.getElementById('add-equipment-btn');
const inventoryBody = document.getElementById('inventory-body');

let selectedEquipmentId = null;
let equipmentDropdownIndex = -1;

// Inventory pagination
const INVENTORY_PAGE_SIZE = 5;
let allInventoryItems = [];
let inventoryPage = 1;
const inventoryPagination = document.getElementById('inventory-pagination');
const invPrevBtn = document.getElementById('inv-prev-btn');
const invNextBtn = document.getElementById('inv-next-btn');
const invPageInfo = document.getElementById('inv-page-info');

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
    inventoryCard.classList.add('hidden');
    inventoryBody.innerHTML = '';
    equipmentInput.value = '';
    selectedEquipmentId = null;
    equipmentQuantity.value = '1';
    hideEquipmentDropdown();
}

function resetModal(isEdit) {
    clearForm();
    if (isEdit) {
        modalTitle.textContent = 'Редактировать зал';
        submitBtn.textContent = 'Сохранить';
    } else {
        modalTitle.textContent = 'Добавить зал';
        submitBtn.textContent = 'Добавить';
    }
}

function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
    resetModal(false);
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


// ---- Equipment dictionary ----
function getFilteredEquipment(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return allEquipment.filter(eq =>
        !currentInventoryIds.has(eq.equipmentId) &&
        (eq.equipmentName.toLowerCase().includes(q) ||
         (eq.brand && eq.brand.toLowerCase().includes(q)) ||
         (eq.model && eq.model.toLowerCase().includes(q)))
    );
}

function formatEquipmentItem(eq) {
    const parts = [eq.equipmentName];
    if (eq.brand) parts.push(eq.brand);
    if (eq.model) parts.push(eq.model);
    return parts.join(' — ');
}

function showEquipmentDropdown() {
    equipmentDropdown.classList.add('show');
}

function hideEquipmentDropdown() {
    equipmentDropdown.classList.remove('show');
    equipmentDropdownIndex = -1;
}

function renderEquipmentDropdown(filtered) {
    equipmentDropdown.innerHTML = '';
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item no-results';
        div.textContent = 'Ничего не найдено';
        equipmentDropdown.appendChild(div);
        return;
    }
    filtered.forEach((eq, i) => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (i === equipmentDropdownIndex) div.classList.add('active');
        div.textContent = formatEquipmentItem(eq);
        div.dataset.equipmentId = eq.equipmentId;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            selectEquipmentFromDropdown(eq);
        });
        equipmentDropdown.appendChild(div);
    });
}

function selectEquipmentFromDropdown(eq) {
    equipmentInput.value = formatEquipmentItem(eq);
    selectedEquipmentId = eq.equipmentId;
    hideEquipmentDropdown();
}

function onEquipmentInput() {
    const query = equipmentInput.value.trim();
    if (!query) {
        hideEquipmentDropdown();
        selectedEquipmentId = null;
        return;
    }
    selectedEquipmentId = null;
    equipmentDropdownIndex = -1;
    const filtered = getFilteredEquipment(query);
    renderEquipmentDropdown(filtered);
    if (filtered.length > 0) showEquipmentDropdown();
    else hideEquipmentDropdown();
}

function onEquipmentKeydown(e) {
    const items = equipmentDropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length === 0) return;
        equipmentDropdownIndex = Math.min(equipmentDropdownIndex + 1, items.length - 1);
        renderEquipmentDropdown(getFilteredEquipment(equipmentInput.value.trim()));
        items[equipmentDropdownIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length === 0) return;
        equipmentDropdownIndex = Math.max(equipmentDropdownIndex - 1, 0);
        renderEquipmentDropdown(getFilteredEquipment(equipmentInput.value.trim()));
        items[equipmentDropdownIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (equipmentDropdownIndex >= 0 && equipmentDropdownIndex < items.length) {
            e.preventDefault();
            const eqId = parseInt(items[equipmentDropdownIndex].dataset.equipmentId, 10);
            const eq = allEquipment.find(e => e.equipmentId === eqId);
            if (eq) selectEquipmentFromDropdown(eq);
        }
    } else if (e.key === 'Escape') {
        hideEquipmentDropdown();
    }
}

function findEquipmentByName(name) {
    const trimmed = name.trim().toLowerCase();
    return allEquipment.find(eq => formatEquipmentItem(eq).toLowerCase() === trimmed);
}

async function loadEquipmentDictionary() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) throw new Error('Не удалось загрузить справочник оборудования');
        allEquipment = await response.json();
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
function renderInventoryPage() {
    inventoryBody.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(allInventoryItems.length / INVENTORY_PAGE_SIZE));
    if (inventoryPage > totalPages) inventoryPage = totalPages;

    const start = (inventoryPage - 1) * INVENTORY_PAGE_SIZE;
    const pageItems = allInventoryItems.slice(start, start + INVENTORY_PAGE_SIZE);

    pageItems.forEach(item => {
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
        deleteBtn.onclick = () => deleteInventoryItem(currentEditId, item.equipmentId);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });

    invPrevBtn.disabled = inventoryPage <= 1;
    invNextBtn.disabled = inventoryPage >= totalPages;
    invPageInfo.textContent = `${inventoryPage} / ${totalPages}`;

    if (allInventoryItems.length > 0) {
        inventoryPagination.classList.remove('hidden');
    } else {
        inventoryPagination.classList.add('hidden');
    }
}

async function loadInventory(gymId) {
    try {
        const response = await fetch(`${API_URL}/${gymId}/inventory`);
        if (!response.ok) throw new Error('Ошибка загрузки инвентаря');
        const items = await response.json();

        currentInventoryIds.clear();
        items.forEach(item => currentInventoryIds.add(item.equipmentId));

        allInventoryItems = items;
        inventoryPage = 1;
        renderInventoryPage();
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
    const equipmentId = selectedEquipmentId;
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
        equipmentInput.value = '';
        selectedEquipmentId = null;
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
            editBtn.onclick = () => openEditModal(gym);

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

// ---- Открыть модалку для создания ----
function openCreateModal() {
    resetModal(false);
    openModal();
}

// ---- Открыть модалку для редактирования ----
function openEditModal(gym) {
    resetModal(true);
    gymNameInput.value = gym.gymName;
    editIdField.value = gym.gymId;
    currentEditId = gym.gymId;

    inventoryCard.classList.remove('hidden');
    inventoryGymName.textContent = gym.gymName;
    addEquipmentBtn.textContent = 'Добавить';
    openModal();
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
        const created = await response.json();
        editIdField.value = created.gymId;
        currentEditId = created.gymId;
        modalTitle.textContent = 'Редактировать зал';
        submitBtn.textContent = 'Сохранить';
        inventoryCard.classList.remove('hidden');
        inventoryGymName.textContent = gymNameInput.value.trim();
        addEquipmentBtn.textContent = 'Добавить';
        loadInventory(created.gymId);
        clearAllFilters();
        await renderTable();
        showToast('Зал добавлен. Теперь можно добавить оборудование.', 'success');
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
        closeModal();
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
        if (id === currentEditId) closeModal();
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
    closeModal();
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
addGymBtn.addEventListener('click', openCreateModal);

equipmentInput.addEventListener('input', onEquipmentInput);
equipmentInput.addEventListener('keydown', onEquipmentKeydown);
equipmentInput.addEventListener('blur', () => setTimeout(hideEquipmentDropdown, 200));

invPrevBtn.addEventListener('click', () => {
    if (inventoryPage > 1) { inventoryPage--; renderInventoryPage(); }
});
invNextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(allInventoryItems.length / INVENTORY_PAGE_SIZE);
    if (inventoryPage < totalPages) { inventoryPage++; renderInventoryPage(); }
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

loadEquipmentDictionary();
loadBrands();
renderTable();