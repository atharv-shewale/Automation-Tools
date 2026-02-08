// Main Application Logic

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data when switching to certain tabs
        if (tabName === 'editor') {
            loadConfiguration();
        } else if (tabName === 'history') {
            loadHistory();
        }
    });
});

// File Upload - Template
const templateUploadZone = document.getElementById('template-upload-zone');
const templateInput = document.getElementById('template-input');
const uploadTemplateBtn = document.getElementById('upload-template-btn');

templateUploadZone.addEventListener('click', () => templateInput.click());
templateUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    templateUploadZone.classList.add('dragover');
});
templateUploadZone.addEventListener('dragleave', () => {
    templateUploadZone.classList.remove('dragover');
});
templateUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    templateUploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        templateInput.files = files;
        previewTemplate(files[0]);
    }
});

templateInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        previewTemplate(e.target.files[0]);
    }
});

uploadTemplateBtn.addEventListener('click', uploadTemplate);

function previewTemplate(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.querySelector('#template-upload-zone .upload-placeholder').style.display = 'none';
        document.getElementById('template-preview').style.display = 'block';
        document.getElementById('template-img').src = e.target.result;
        document.getElementById('template-filename').textContent = file.name;

        const img = new Image();
        img.onload = () => {
            document.getElementById('template-dimensions').textContent = `${img.width} × ${img.height} px`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function uploadTemplate() {
    const file = templateInput.files[0];
    if (!file) {
        alert('Please select a template file first');
        return;
    }

    const formData = new FormData();
    formData.append('templateImage', file);

    try {
        const response = await fetch('/api/upload-template', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert('Template uploaded successfully!');
        } else {
            alert('Upload failed: ' + result.error);
        }
    } catch (error) {
        alert('Upload error: ' + error.message);
    }
}

// File Upload - CSV
const csvUploadZone = document.getElementById('csv-upload-zone');
const csvInput = document.getElementById('csv-input');
const uploadCsvBtn = document.getElementById('upload-csv-btn');

csvUploadZone.addEventListener('click', () => csvInput.click());
csvUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    csvUploadZone.classList.add('dragover');
});
csvUploadZone.addEventListener('dragleave', () => {
    csvUploadZone.classList.remove('dragover');
});
csvUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    csvUploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        csvInput.files = files;
        previewCSV(files[0]);
    }
});

csvInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        previewCSV(e.target.files[0]);
    }
});

uploadCsvBtn.addEventListener('click', uploadCSV);

function previewCSV(file) {
    document.querySelector('#csv-upload-zone .upload-placeholder').style.display = 'none';
    document.getElementById('csv-preview').style.display = 'block';
    document.getElementById('csv-filename').textContent = file.name;
    document.getElementById('csv-stats').textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
}

async function uploadCSV() {
    const file = csvInput.files[0];
    if (!file) {
        alert('Please select a CSV file first');
        return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById('csv-validation').style.display = 'block';
            document.getElementById('valid-rows-alert').textContent =
                `✓ ${result.validRows} valid participants found`;

            if (result.invalidRows > 0) {
                document.getElementById('invalid-rows-alert').style.display = 'block';
                document.getElementById('invalid-rows-alert').textContent =
                    `⚠ ${result.invalidRows} invalid rows found`;
            }
        } else {
            alert('Upload failed: ' + result.error);
        }
    } catch (error) {
        alert('Upload error: ' + error.message);
    }
}

// Configuration
document.getElementById('save-config-btn').addEventListener('click', saveConfiguration);

async function saveConfiguration() {
    const config = {
        eventName: document.getElementById('event-name').value,
        certificateIdPrefix: document.getElementById('cert-prefix').value,
        email: {
            fromName: document.getElementById('email-from-name').value,
            subject: document.getElementById('email-subject').value
        }
    };

    try {
        const response = await fetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const result = await response.json();
        if (result.success) {
            alert('Configuration saved successfully!');
        } else {
            alert('Save failed: ' + result.error);
        }
    } catch (error) {
        alert('Save error: ' + error.message);
    }
}

async function loadConfiguration() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        document.getElementById('event-name').value = config.eventName || '';
        document.getElementById('cert-prefix').value = config.certificateIdPrefix || '';
        document.getElementById('email-from-name').value = config.email.fromName || '';
        document.getElementById('email-subject').value = config.email.subject || '';

        // Load positions for editor
        if (config.positions) {
            loadPositionsToEditor(config.positions);
        }
    } catch (error) {
        console.error('Failed to load configuration:', error);
    }
}

// Load initial configuration
loadConfiguration();
