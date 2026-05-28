const API_URL = 'https://localhost:7159/api/Equipment';

const tbody = document.getElementById('equipment-body');
const errorDiv = document.getElementById('error-message');
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
function showError(text) {
    errorDiv.textContent = text;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

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
        showError('Название оборудования обязательно');
        return false;
    }
    if (name.length < 3) {
        showError('Название должно содержать не менее 3 символов');
        return false;
    }
    if (name.length > 40) {
        showError('Название не должно превышать 40 символов');
        return false;
    }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(name)) {
        showError('Название не может состоять только из цифр');
        return false;
    }
    if (/^\d/.test(name)) {
        showError('Название не может начинаться с цифры');
        return false;
    }
    if (/\s{2,}/.test(name)) {
        showError('Пробелы не могут идти подряд');
        return false;
    }

    // Бренд (обязательный)
    if (!brand) {
        showError('Бренд обязателен');
        return false;
    }
    if (brand.length < 3) {
        showError('Бренд должен содержать не менее 3 символов');
        return false;
    }
    if (brand.length > 20) {
        showError('Бренд не должен превышать 20 символов');
        return false;
    }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(brand)) {
        showError('Бренд не может состоять только из цифр');
        return false;
    }
    if (/^\d/.test(brand)) {
        showError('Бренд не может начинаться с цифры');
        return false;
    }
    if (/\s{2,}/.test(brand)) {
        showError('Пробелы не могут идти подряд');
        return false;
    }

    // Модель (если заполнена)
    if (model) {
        if (model.length < 3) {
            showError('Модель должна содержать не менее 3 символов');
            return false;
        }
        if (model.length > 20) {
            showError('Модель не должна превышать 20 символов');
            return false;
        }
        if (!/[a-zA-Zа-яА-ЯёЁ]/.test(model)) {
            showError('Модель не может состоять только из цифр');
            return false;
        }
        if (/^\d/.test(model)) {
            showError('Модель не может начинаться с цифры');
            return false;
        }
        if (/\s{2,}/.test(model)) {
            showError('Пробелы не могут идти подряд');
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
        showError(`Ошибка загрузки: ${err.message}`);
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
        return true;
    } catch (err) {
        showError(`Не удалось добавить: ${err.message}`);
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
            showError('Неверный запрос (несоответствие ID)');
            return false;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        clearForm();
        restoreFiltersToDOM();
        await renderTable();
        await loadBrands();
        return true;
    } catch (err) {
        showError(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

// ---- Удаление ----
async function deleteEquipment(id) {
    if (!confirm('Удалить это оборудование? Оно будет удалено из всех залов.')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.status === 404) {
            showError('Оборудование не найдено (возможно, уже удалено)');
        } else if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        if (id === currentEditId) clearForm();
        restoreFiltersToDOM();
        await renderTable();
        await loadBrands();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
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