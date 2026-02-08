// Preview Functionality

document.getElementById('generate-preview-btn').addEventListener('click', generatePreview);
document.getElementById('download-preview-btn').addEventListener('click', downloadPreview);

let currentPreviewUrl = null;

async function generatePreview() {
    const name = document.getElementById('preview-name').value;
    // const event = document.getElementById('preview-event').value; // Temporarily disabled

    const btn = document.getElementById('generate-preview-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name /*, event */ })
        });

        const result = await response.json();

        if (result.success) {
            currentPreviewUrl = result.downloadUrl;
            document.getElementById('preview-result').style.display = 'block';
            document.getElementById('preview-iframe').src = result.downloadUrl;
        } else {
            alert('Preview generation failed: ' + result.error);
        }
    } catch (error) {
        alert('Preview error: ' + error.message);
    } finally {
        btn.textContent = 'Generate Preview';
        btn.disabled = false;
    }
}

function downloadPreview() {
    if (currentPreviewUrl) {
        window.open(currentPreviewUrl, '_blank');
    }
}
