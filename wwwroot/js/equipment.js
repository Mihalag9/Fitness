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
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

const totalSpan = document.getElementById('total-count');
const brandSpan = document.getElementById('brand-count');

let currentEditId = null;

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

function validateForm() {
    const name = equipmentNameInput.value.trim();
    if (!name) {
        showError('Название оборудования обязательно');
        return false;
    }
    if (name.length > 100) {
        showError('Название не должно превышать 100 символов');
        return false;
    }
    return true;
}

async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        const data = await response.json();
        totalSpan.textContent = data.totalEquipment;
        brandSpan.textContent = data.withBrand;
    } catch (err) {
        console.error('Ошибка статистики:', err);
    }
}

async function renderTable() {
    try {
        const params = new URLSearchParams();
        if (filterEquipmentName.value) params.append('equipmentName', filterEquipmentName.value.trim());

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const items = await response.json();

        tbody.innerHTML = '';
        items.forEach(item => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = item.equipmentId;
            row.insertCell(1).textContent = item.equipmentName;
            row.insertCell(2).textContent = item.brand || '—';
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
        await updateStats();
    } catch (err) {
        showError(`Ошибка загрузки: ${err.message}`);
    }
}

function fillFormForEdit(item) {
    equipmentNameInput.value = item.equipmentName;
    brandInput.value = item.brand || '';
    modelInput.value = item.model || '';
    editIdField.value = item.equipmentId;
    currentEditId = item.equipmentId;
    formTitle.textContent = 'Редактировать оборудование';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'inline-block';
}

async function createEquipment() {
    if (!validateForm()) return false;
    const newItem = {
        equipmentName: equipmentNameInput.value.trim(),
        brand: brandInput.value.trim() || null,
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
        await renderTable();
        return true;
    } catch (err) {
        showError(`Не удалось добавить: ${err.message}`);
        return false;
    }
}

async function updateEquipment(id) {
    if (!validateForm()) return false;
    const updated = {
        equipmentId: id,
        equipmentName: equipmentNameInput.value.trim(),
        brand: brandInput.value.trim() || null,
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
        await renderTable();
        return true;
    } catch (err) {
        showError(`Ошибка обновления: ${err.message}`);
        return false;
    }
}

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
        await renderTable();
    } catch (err) {
        showError(`Ошибка удаления: ${err.message}`);
    }
}

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

async function onApplyFilters() {
    await renderTable();
}

function onClearFilters() {
    filterEquipmentName.value = '';
    renderTable();
}

equipmentNameInput.addEventListener('input', function () {
    let val = this.value;
    val = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-\"\'\(\)]/g, '');
    val = val.replace(/\s{2,}/g, ' ');
    this.value = val;
});

submitBtn.addEventListener('click', onSubmit);
cancelBtn.addEventListener('click', onCancel);
applyFiltersBtn.addEventListener('click', onApplyFilters);
clearFiltersBtn.addEventListener('click', onClearFilters);

renderTable();