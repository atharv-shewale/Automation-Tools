// Position Editor with Canvas Drawing - Complete Fixed Version

let currentPositions = {};
let templateImage = null;
let canvas, ctx;
let scale = 1;
let isDragging = false;
let draggedElement = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let zoomLevel = 1;

// Text elements configuration
const elements = {
    name: { text: 'John Smith', type: 'name', enabled: true, font: 'Arial' },
    // event: { text: 'Annual Tech Summit 2026', type: 'event', enabled: true, font: 'Arial' }, // Temporarily disabled
    certid: { text: 'CERT-001', type: 'certid', enabled: true, font: 'Arial' },
    qr: { text: 'QR', type: 'qr', enabled: false }
};

// Initialize canvas
function initializeCanvas() {
    console.log('[Position Editor] Initializing canvas...');

    canvas = document.getElementById('editor-canvas');
    if (!canvas) {
        console.error('[Position Editor] Canvas element not found!');
        return;
    }

    ctx = canvas.getContext('2d');
    console.log('[Position Editor] Canvas context created');

    // Add mouse event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Setup toggle listeners
    setupToggleListeners();

    // Setup font change listeners
    setupFontListeners();

    // Setup input change listeners
    setupInputListeners();

    console.log('[Position Editor] Mouse event listeners attached');

    // Add zoom controls
    setupZoomControls();

    // Load template image
    loadTemplateImage();
}

function setupToggleListeners() {
    ['name', 'event', 'certid', 'qr'].forEach(type => {
        const toggle = document.getElementById(`${type}-enabled`);
        const controls = document.getElementById(`${type}-controls`);

        if (toggle && controls) {
            toggle.addEventListener('change', () => {
                if (elements[type]) {
                    elements[type].enabled = toggle.checked;
                    controls.style.display = toggle.checked ? 'block' : 'none';
                    console.log(`[Position Editor] ${type} ${toggle.checked ? 'enabled' : 'disabled'}`);
                    redrawCanvas();
                }
            });
        }
    });
}

function setupFontListeners() {
    ['name', 'event', 'certid'].forEach(type => {
        const fontSelect = document.getElementById(`${type}-font`);
        if (fontSelect) {
            fontSelect.addEventListener('change', () => {
                if (elements[type]) {
                    elements[type].font = fontSelect.value;
                    console.log(`[Position Editor] ${type} font changed to ${fontSelect.value}`);
                    redrawCanvas();
                }
            });
        }
    });
}

function setupInputListeners() {
    // Position and size inputs
    ['name', 'event', 'certid', 'qr'].forEach(type => {
        const xInput = document.getElementById(`${type}-x`);
        const yInput = document.getElementById(`${type}-y`);
        const sizeInput = document.getElementById(`${type}-size`);
        const colorInput = document.getElementById(`${type}-color`);

        if (xInput) xInput.addEventListener('input', redrawCanvas);
        if (yInput) yInput.addEventListener('input', redrawCanvas);
        if (sizeInput) {
            sizeInput.addEventListener('input', () => {
                const sizeValue = document.getElementById(`${type}-size-value`);
                if (sizeValue) sizeValue.textContent = sizeInput.value;
                redrawCanvas();
            });
        }
        if (colorInput) colorInput.addEventListener('input', redrawCanvas);
    });
}

function setupZoomControls() {
    const container = document.querySelector('.editor-canvas-container');
    if (!container) return;

    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button id="zoom-out" class="zoom-btn">−</button>
        <span id="zoom-level">100%</span>
        <button id="zoom-in" class="zoom-btn">+</button>
        <button id="zoom-fit" class="zoom-btn">Fit</button>
        <button id="zoom-original" class="zoom-btn">100%</button>
    `;

    container.insertBefore(zoomControls, container.firstChild);

    // Add event listeners
    document.getElementById('zoom-in').addEventListener('click', () => setZoom(zoomLevel + 0.1));
    document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoomLevel - 0.1));
    document.getElementById('zoom-fit').addEventListener('click', fitToContainer);
    document.getElementById('zoom-original').addEventListener('click', () => setZoom(1));
}

function setZoom(newZoom) {
    zoomLevel = Math.max(0.1, Math.min(2, newZoom));
    document.getElementById('zoom-level').textContent = Math.round(zoomLevel * 100) + '%';

    if (templateImage) {
        canvas.width = templateImage.width * zoomLevel;
        canvas.height = templateImage.height * zoomLevel;
        scale = zoomLevel;
        redrawCanvas();
    }
}

function fitToContainer() {
    if (!templateImage) return;

    const container = document.querySelector('.canvas-wrapper');
    const maxWidth = container.clientWidth - 40;
    const maxHeight = container.clientHeight - 40;

    const scaleX = maxWidth / templateImage.width;
    const scaleY = maxHeight / templateImage.height;
    const fitScale = Math.min(scaleX, scaleY, 1);

    setZoom(fitScale);
}

async function loadTemplateImage() {
    console.log('[Position Editor] Loading template image...');

    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            console.log('[Position Editor] Template image loaded successfully');
            console.log(`[Position Editor] Image dimensions: ${img.width}x${img.height}`);
            templateImage = img;

            // Set canvas to original size by default
            canvas.width = img.width;
            canvas.height = img.height;
            scale = 1;
            zoomLevel = 1;

            console.log(`[Position Editor] Canvas size: ${canvas.width}x${canvas.height}`);

            // Set canvas style
            canvas.style.cursor = 'default';
            canvas.style.border = '2px solid #667eea';
            canvas.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';

            // Update zoom display
            const zoomLevelEl = document.getElementById('zoom-level');
            if (zoomLevelEl) zoomLevelEl.textContent = '100%';

            // Initial draw
            redrawCanvas();
        };

        img.onerror = (e) => {
            console.error('[Position Editor] Failed to load template image:', e);

            // Draw placeholder
            if (ctx) {
                canvas.width = 800;
                canvas.height = 600;
                ctx.fillStyle = '#2d3748';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚠️ Template not found', canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = '16px Arial';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Please upload a template in the Setup tab', canvas.width / 2, canvas.height / 2 + 20);
            }
        };

        img.src = '/templates/certificate.png?' + Date.now();
        console.log('[Position Editor] Image src set:', img.src);

    } catch (error) {
        console.error('[Position Editor] Error in loadTemplateImage:', error);
    }
}

// Redraw entire canvas
function redrawCanvas() {
    if (!templateImage || !ctx) {
        console.warn('[Position Editor] Cannot redraw - template or context missing');
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw template
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

    // Draw enabled text elements only
    if (elements.name?.enabled) {
        try { drawTextElement('name'); } catch (e) { console.error('Error drawing name:', e); }
    }
    if (elements.event?.enabled) {
        try { drawTextElement('event'); } catch (e) { console.error('Error drawing event:', e); }
    }
    if (elements.certid?.enabled) {
        try { drawTextElement('certid'); } catch (e) { console.error('Error drawing certid:', e); }
    }

    // Draw QR code placeholder if enabled
    if (elements.qr?.enabled) {
        try { drawQRElement(); } catch (e) { console.error('Error drawing QR:', e); }
    }
}

// Draw text element on canvas
function drawTextElement(type) {
    const xInput = document.getElementById(`${type}-x`);
    const yInput = document.getElementById(`${type}-y`);
    const sizeInput = document.getElementById(`${type}-size`);
    const colorInput = document.getElementById(`${type}-color`);
    const fontSelect = document.getElementById(`${type}-font`);

    if (!xInput || !yInput || !sizeInput || !colorInput) {
        console.warn(`[Position Editor] Missing input for ${type} - cannot draw`);
        return;
    }

    const x = parseInt(xInput.value) * scale;
    const y = parseInt(yInput.value) * scale;
    const fontSize = parseInt(sizeInput.value) * scale;
    const color = colorInput.value;
    const font = fontSelect ? fontSelect.value : 'Arial';
    const text = elements[type].text;

    ctx.save();
    ctx.font = `bold ${fontSize}px "${font}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Measure text
    const metrics = ctx.measureText(text);
    const padding = 15 * scale;
    const boxWidth = metrics.width + padding * 2;
    const boxHeight = fontSize + padding * 2;

    // Draw semi-transparent background with gradient
    const gradient = ctx.createLinearGradient(x - boxWidth / 2, y - boxHeight / 2, x + boxWidth / 2, y + boxHeight / 2);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(
        x - boxWidth / 2,
        y - boxHeight / 2,
        boxWidth,
        boxHeight
    );

    // Draw thick border
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(
        x - boxWidth / 2,
        y - boxHeight / 2,
        boxWidth,
        boxHeight
    );

    // Draw corner handles
    const handleSize = 8 * scale;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2 * scale;

    // Top-left handle
    ctx.fillRect(x - boxWidth / 2 - handleSize / 2, y - boxHeight / 2 - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - boxWidth / 2 - handleSize / 2, y - boxHeight / 2 - handleSize / 2, handleSize, handleSize);

    // Top-right handle
    ctx.fillRect(x + boxWidth / 2 - handleSize / 2, y - boxHeight / 2 - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x + boxWidth / 2 - handleSize / 2, y - boxHeight / 2 - handleSize / 2, handleSize, handleSize);

    // Bottom-left handle
    ctx.fillRect(x - boxWidth / 2 - handleSize / 2, y + boxHeight / 2 - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - boxWidth / 2 - handleSize / 2, y + boxHeight / 2 - handleSize / 2, handleSize, handleSize);

    // Bottom-right handle
    ctx.fillRect(x + boxWidth / 2 - handleSize / 2, y + boxHeight / 2 - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x + boxWidth / 2 - handleSize / 2, y + boxHeight / 2 - handleSize / 2, handleSize, handleSize);

    // Draw label
    ctx.fillStyle = '#667eea';
    ctx.font = `bold ${12 * scale}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(type.toUpperCase(), x - boxWidth / 2, y - boxHeight / 2 - 5 * scale);

    // Draw text with selected font
    ctx.font = `bold ${fontSize}px "${font}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);

    ctx.restore();
}

// Draw QR code placeholder
function drawQRElement() {
    const xInput = document.getElementById('qr-x');
    const yInput = document.getElementById('qr-y');
    const sizeInput = document.getElementById('qr-size');

    if (!xInput || !yInput || !sizeInput) {
        console.warn('[Position Editor] Missing QR input');
        return;
    }

    const x = parseInt(xInput.value) * scale;
    const y = parseInt(yInput.value) * scale;
    const size = parseInt(sizeInput.value) * scale;

    ctx.save();

    // Draw semi-transparent background with gradient
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);

    // Draw thick border
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(x, y, size, size);

    // Draw corner handles
    const handleSize = 8 * scale;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2 * scale;

    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(x + size - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x + size - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(x - handleSize / 2, y + size - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize / 2, y + size - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(x + size - handleSize / 2, y + size - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x + size - handleSize / 2, y + size - handleSize / 2, handleSize, handleSize);

    // Draw label
    ctx.fillStyle = '#667eea';
    ctx.font = `bold ${12 * scale}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('QR CODE', x, y - 5 * scale);

    // Draw QR text
    ctx.fillStyle = '#667eea';
    ctx.font = `bold ${size / 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QR CODE', x + size / 2, y + size / 2);

    ctx.restore();
}

// Mouse event handlers
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    console.log(`[Position Editor] Mouse down at: ${mouseX}, ${mouseY}`);

    // Check which element was clicked
    draggedElement = getElementAtPosition(mouseX, mouseY);

    if (draggedElement) {
        console.log(`[Position Editor] Dragging element: ${draggedElement}`);
        isDragging = true;

        const xInput = document.getElementById(`${draggedElement}-x`);
        const yInput = document.getElementById(`${draggedElement}-y`);

        if (xInput && yInput) {
            const elementX = parseInt(xInput.value) * scale;
            const elementY = parseInt(yInput.value) * scale;
            dragOffsetX = mouseX - elementX;
            dragOffsetY = mouseY - elementY;
            canvas.style.cursor = 'grabbing';
        }
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && draggedElement) {
        // Update position
        const newX = Math.round((mouseX - dragOffsetX) / scale);
        const newY = Math.round((mouseY - dragOffsetY) / scale);

        const xInput = document.getElementById(`${draggedElement}-x`);
        const yInput = document.getElementById(`${draggedElement}-y`);

        if (xInput && yInput) {
            xInput.value = newX;
            yInput.value = newY;
            redrawCanvas();
        }
    } else {
        // Update cursor based on hover
        const hoveredElement = getElementAtPosition(mouseX, mouseY);
        canvas.style.cursor = hoveredElement ? 'grab' : 'default';
    }
}

function handleMouseUp() {
    if (isDragging) {
        console.log(`[Position Editor] Stopped dragging ${draggedElement}`);
    }
    isDragging = false;
    draggedElement = null;
    canvas.style.cursor = 'default';
}

// Get element at mouse position
function getElementAtPosition(mouseX, mouseY) {
    // Check text elements (only if enabled)
    for (const type of ['name', 'event', 'certid']) {
        if (!elements[type] || !elements[type].enabled) continue;

        const xInput = document.getElementById(`${type}-x`);
        const yInput = document.getElementById(`${type}-y`);
        const sizeInput = document.getElementById(`${type}-size`);
        const fontSelect = document.getElementById(`${type}-font`);

        if (!xInput || !yInput || !sizeInput) continue;

        const x = parseInt(xInput.value) * scale;
        const y = parseInt(yInput.value) * scale;
        const fontSize = parseInt(sizeInput.value) * scale;
        const font = fontSelect ? fontSelect.value : 'Arial';
        const text = elements[type].text;

        ctx.font = `bold ${fontSize}px "${font}"`;
        const metrics = ctx.measureText(text);
        const padding = 15 * scale;
        const boxWidth = metrics.width + padding * 2;
        const boxHeight = fontSize + padding * 2;

        if (mouseX >= x - boxWidth / 2 &&
            mouseX <= x + boxWidth / 2 &&
            mouseY >= y - boxHeight / 2 &&
            mouseY <= y + boxHeight / 2) {
            return type;
        }
    }

    // Check QR code (only if enabled)
    if (elements.qr.enabled) {
        const xInput = document.getElementById('qr-x');
        const yInput = document.getElementById('qr-y');
        const sizeInput = document.getElementById('qr-size');

        if (xInput && yInput && sizeInput) {
            const x = parseInt(xInput.value) * scale;
            const y = parseInt(yInput.value) * scale;
            const size = parseInt(sizeInput.value) * scale;

            if (mouseX >= x && mouseX <= x + size &&
                mouseY >= y && mouseY <= y + size) {
                return 'qr';
            }
        }
    }

    return null;
}

// Load positions from config (called by app.js)
function loadPositionsToEditor(positions) {
    console.log('[Position Editor] Loading positions:', positions);
    currentPositions = positions;

    // Update input fields
    const fields = [
        { type: 'name', pos: positions.name },
        { type: 'event', pos: positions.event },
        { type: 'certid', pos: positions.certId },
        { type: 'qr', pos: positions.qr }
    ];

    fields.forEach(({ type, pos }) => {
        const xInput = document.getElementById(`${type}-x`);
        const yInput = document.getElementById(`${type}-y`);
        const sizeInput = document.getElementById(`${type}-size`);
        const sizeValue = document.getElementById(`${type}-size-value`);
        const colorInput = document.getElementById(`${type}-color`);
        const fontSelect = document.getElementById(`${type}-font`);
        const enabledToggle = document.getElementById(`${type}-enabled`);
        const controls = document.getElementById(`${type}-controls`);

        if (xInput) xInput.value = pos.x;
        if (yInput) yInput.value = pos.y;

        if (type !== 'qr') {
            if (sizeInput) sizeInput.value = pos.fontSize;
            if (sizeValue) sizeValue.textContent = pos.fontSize;
            if (colorInput) colorInput.value = pos.color;
            if (fontSelect && pos.font) {
                fontSelect.value = pos.font;
                if (elements[type]) elements[type].font = pos.font;
            }
            if (enabledToggle) {
                enabledToggle.checked = pos.enabled !== false;
                if (elements[type]) elements[type].enabled = pos.enabled !== false;
            }
            if (controls) {
                controls.style.display = (pos.enabled !== false) ? 'block' : 'none';
            }
        } else {
            if (sizeInput) sizeInput.value = pos.size;
            if (sizeValue) sizeValue.textContent = pos.size;
            if (enabledToggle) {
                enabledToggle.checked = pos.enabled === true;
                elements.qr.enabled = pos.enabled === true;
            }
            if (controls) {
                controls.style.display = (pos.enabled === true) ? 'block' : 'none';
            }
        }
    });

    redrawCanvas();
}

// Save positions
const saveBtn = document.getElementById('save-positions-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        console.log('[Position Editor] Saving positions...');

        const positions = {};

        // Name
        if (document.getElementById('name-x')) {
            positions.name = {
                x: parseInt(document.getElementById('name-x').value),
                y: parseInt(document.getElementById('name-y').value),
                fontSize: parseInt(document.getElementById('name-size').value),
                color: document.getElementById('name-color').value,
                font: document.getElementById('name-font').value,
                enabled: document.getElementById('name-enabled').checked
            };
        }

        // Event
        if (document.getElementById('event-x')) {
            positions.event = {
                x: parseInt(document.getElementById('event-x').value),
                y: parseInt(document.getElementById('event-y').value),
                fontSize: parseInt(document.getElementById('event-size').value),
                color: document.getElementById('event-color').value,
                font: document.getElementById('event-font').value,
                enabled: document.getElementById('event-enabled').checked
            };
        }

        // Certificate ID
        if (document.getElementById('certid-x')) {
            positions.certId = {
                x: parseInt(document.getElementById('certid-x').value),
                y: parseInt(document.getElementById('certid-y').value),
                fontSize: parseInt(document.getElementById('certid-size').value),
                color: document.getElementById('certid-color').value,
                font: document.getElementById('certid-font').value,
                enabled: document.getElementById('certid-enabled').checked
            };
        }

        // QR Code
        if (document.getElementById('qr-x')) {
            positions.qr = {
                x: parseInt(document.getElementById('qr-x').value),
                y: parseInt(document.getElementById('qr-y').value),
                size: parseInt(document.getElementById('qr-size').value),
                enabled: document.getElementById('qr-enabled').checked
            };
        }

        console.log('[Position Editor] Positions to save:', positions);

        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        try {
            const response = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ positions })
            });

            const result = await response.json();
            console.log('[Position Editor] Save result:', result);

            if (result.success) {
                alert('✅ Positions saved successfully!\n\nYour custom configuration has been saved. Changes will now appear in Preview.');
            } else {
                alert('❌ Save failed: ' + result.error);
            }
        } catch (error) {
            console.error('[Position Editor] Save error:', error);
            alert('❌ Save error: ' + error.message);
        } finally {
            saveBtn.textContent = 'Save Positions';
        }
    });
}

// Center all enabled elements
function centerAllElements() {
    console.log('[Position Editor] Centering all elements...');

    if (!templateImage) return;

    const centerX = Math.round(templateImage.width / 2);
    const startY = Math.round(templateImage.height * 0.3);
    const verticalSpacing = Math.round(templateImage.height * 0.15);

    // Name
    const nameX = document.getElementById('name-x');
    const nameY = document.getElementById('name-y');
    if (nameX && nameY) {
        nameX.value = centerX;
        nameY.value = startY;
        nameX.dispatchEvent(new Event('input'));
        nameY.dispatchEvent(new Event('input'));
    }

    // Event
    const eventX = document.getElementById('event-x');
    const eventY = document.getElementById('event-y');
    if (eventX && eventY) {
        eventX.value = centerX;
        eventY.value = startY + verticalSpacing;
        eventX.dispatchEvent(new Event('input'));
        eventY.dispatchEvent(new Event('input'));
    }

    // Cert ID
    const certIdX = document.getElementById('certid-x');
    const certIdY = document.getElementById('certid-y');
    if (certIdX && certIdY) {
        // ID usually goes at bottom
        certIdX.value = centerX;
        certIdY.value = Math.round(templateImage.height * 0.85);
        certIdX.dispatchEvent(new Event('input'));
        certIdY.dispatchEvent(new Event('input'));
    }

    // QR Code
    const qrX = document.getElementById('qr-x');
    const qrY = document.getElementById('qr-y');
    const qrSize = document.getElementById('qr-size');
    if (qrX && qrY && qrSize) {
        const size = parseInt(qrSize.value) || 200;
        qrX.value = centerX - Math.round(size / 2);
        qrY.value = Math.round(templateImage.height * 0.7);
        qrX.dispatchEvent(new Event('input'));
        qrY.dispatchEvent(new Event('input'));
    }

    redrawCanvas();
}

// Auto-center button listener
const centerBtn = document.getElementById('center-elements-btn');
if (centerBtn) {
    centerBtn.addEventListener('click', centerAllElements);
}

// Initialize when page loads
console.log('[Position Editor] Script loaded, waiting for DOM...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Position Editor] DOM loaded, initializing...');
        initializeCanvas();
    });
} else {
    console.log('[Position Editor] DOM already loaded, initializing...');
    initializeCanvas();
}
