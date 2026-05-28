const API_URL = 'https://localhost:7159/api/Equipment';

const tbody = document.getElementById('equipment-body');
const equipmentNameInput = document.getElementById('equipmentName');
const brandInput = document.getElementById('brand');
const modelInput = document.getElementById('model');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');

const filterEquipmentName = document.getElementById('filter-equipmentName');
const filterBrand = document.getElementById('filter-brand');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

const totalSpan = document.getElementById('total-count');
const modelSpan = document.getElementById('model-count');

let currentEditId = null;

let appliedFilters = {};

function snapshotFilters() {
    appliedFilters = {
        equipmentName: filterEquipmentName.value,
        brand: filterBrand.value
    };
}

function restoreFiltersToDOM() {
    filterEquipmentName.value = appliedFilters.equipmentName || '';
    filterBrand.value = appliedFilters.brand || '';
}

function clearAllFilters() {
    appliedFilters = {};
    filterEquipmentName.value = '';
    filterBrand.value = '';
}

// ---- Helpers ----
function clearForm() {
    equipmentNameInput.value = '';
    brandInput.value = '';
    modelInput.value = '';
    editIdField.value = '';
    currentEditId = null;
    formTitle.textContent = 'Добавить оборудование';
    submitBtn.textContent = 'Добавить';
    cancelBtn.style.display = 'none';
}

// ---- Валидация формы ----
function validateForm() {
    const name = equipmentNameInput.value.trim();
    const brand = brandInput.value.trim();
    const model = modelInput.value.trim();

    // Название (обязательное)
    if (!name) {
        showToast('Название оборудования обязательно');
        return false;
    }
    if (name.length < 3) {
        showToast('Название должно содержать не менее 3 символов');
        return false;
    }
    if (name.length > 40) {
        showToast('Название не должно превышать 40 символов');
        return false;
    }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(name)) {
        showToast('Название не может состоять только из цифр');
        return false;
    }
    if (/^\d/.test(name)) {
        showToast('Название не может начинаться с цифры');
        return false;
    }
    if (/\s{2,}/.test(name)) {
        showToast('Пробелы не могут идти подряд');
        return false;
    }

    // Бренд (обязательный)
    if (!brand) {
        showToast('Бренд обязателен');
        return false;
    }
    if (brand.length < 3) {
        showToast('Бренд должен содержать не менее 3 символов');
        return false;
    }
    if (brand.length > 20) {
        showToast('Бренд не должен превышать 20 символов');
        return false;
    }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(brand)) {
        showToast('Бренд не может состоять только из цифр');
        return false;
    }
    if (/^\d/.test(brand)) {
        showToast('Бренд не может начинаться с цифры');
        return false;
    }
    if (/\s{2,}/.test(brand)) {
        showToast('Пробелы не могут идти подряд');
        return false;
    }

    // Модель (если заполнена)
    if (model) {
        if (model.length < 3) {
            showToast('Модель должна содержать не менее 3 символов');
            return false;
        }
        if (model.length > 20) {
            showToast('Модель не должна превышать 20 символов');
            return false;
        }
        if (!/[a-zA-Zа-яА-ЯёЁ]/.test(model)) {
            showToast('Модель не может состоять только из цифр');
            return false;
        }
        if (/^\d/.test(model)) {
            showToast('Модель не может начинаться с цифры');
            return false;
        }
        if (/\s{2,}/.test(model)) {
            showToast('Пробелы не могут идти подряд');
            return false;
        }
    }

    return true;
}

// ---- Справочник брендов ----
async function loadBrands() {
    try {
        const response = await fetch(`${API_URL}/brands`);
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

// ---- Таблица ----
async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (appliedFilters.equipmentName) params.append('equipmentName', appliedFilters.equipmentName.trim());
        if (appliedFilters.brand) params.append('brand', appliedFilters.brand);

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        tbody.innerHTML = '';
        result.items.forEach(item => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = item.equipmentId;
            row.insertCell(1).textContent = item.equipmentName;
            row.insertCell(2).textContent = item.brand;
            row.insertCell(3).textContent = item.model || '—';
            const actionsCell = row.insertCell(4);
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => fillFormForEdit(item);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => deleteEquipment(item.equipmentId);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
        
        const data = result.statistics;
        totalSpan.textContent = data.totalEquipment;
        modelSpan.textContent = data.withModel;
    } catch (err) {
        showToast(`Ошибка загрузки: ${err.message}`);
    }
}

// ---- Заполнение формы для редактирования ----
function fillFormForEdit(item) {
    equipmentNameInput.value = item.equipmentName;
    brandInput.value = item.brand;
    modelInput.value = item.model || '';
    editIdField.value = item.equipmentId;
    currentEditId = item.equipmentId;
    formTitle.textContent = 'Редактировать оборудование';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';
}

// ---- Добавление ----
async function createEquipment() {
    if (!validateForm()) return false;
    const newItem = {
        equipmentName: equipmentNameInput.value.trim(),
        brand: brandInput.value.trim(),
        model: modelInput.value.trim() || null
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errText}`);
        }
        clearForm();
        clearAllFilters();
        await renderTable();
        await loadBrands();
        showToast('Оборудование добавлено', 'success');
        return true;
    } catch (err) {
        showToast(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

// ---- Обновление ----
async function updateEquipment(id) {
    if (!validateForm()) return false;
    const updated = {
        equipmentId: id,
        equipmentName: equipmentNameInput.value.trim(),
        brand: brandInput.value.trim(),
        model: modelInput.value.trim() || null
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
        await loadBrands();
        showToast('Оборудование обновлено', 'success');
        return true;
    } catch (err) {
        showToast(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

// ---- Удаление ----
async function deleteEquipment(id) {
    if (!confirm('Удалить это оборудование? Оно будет удалено из всех залов.')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showToast('Оборудование не найдено (возможно, уже удалено)');
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        showToast('Оборудование удалено', 'success');
        if (id === currentEditId) clearForm();
        restoreFiltersToDOM();
        await renderTable();
        await loadBrands();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}
        if (id === currentEditId) clearForm();
        restoreFiltersToDOM();
        await renderTable();
        await loadBrands();
    } catch (err) {
        showToast(`Ошибка удаления: ${err.message}`);
    }
}

// ---- Обработчики кнопок ----
async function onSubmit() {
    if (currentEditId !== null) {
        await updateEquipment(currentEditId);
    } else {
        await createEquipment();
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

equipmentNameInput.addEventListener('keydown', function (e) { preventLeadingDigit(e, this); });
brandInput.addEventListener('keydown', function (e) { preventLeadingDigit(e, this); });
modelInput.addEventListener('keydown', function (e) { preventLeadingDigit(e, this); });

// ---- Автоформатирование при вводе (input) ----

equipmentNameInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\"\'\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    val = val.replace(/([a-zA-Zа-яА-ЯёЁ]+)/g, function (match) {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
    this.value = val;
});

brandInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\"\'\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    val = val.replace(/([a-zA-Zа-яА-ЯёЁ]+)/g, function (match) {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
    this.value = val;
});

modelInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\"\'\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    this.value = val;
});

// ---- Инициализация ----
submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

loadBrands();
renderTable();