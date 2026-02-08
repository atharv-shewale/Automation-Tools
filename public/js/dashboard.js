// Dashboard & Processing

let eventSource = null;

document.getElementById('start-processing-btn').addEventListener('click', startProcessing);
document.getElementById('refresh-history-btn').addEventListener('click', loadHistory);

async function startProcessing() {
    // This would trigger the backend processing
    // For now, we'll show a message
    alert('Processing functionality will be integrated with the backend CLI process. Use the CLI commands for now:\n\nnpm start - Production\nnpm run test - Test mode\nnpm run dry-run - Dry run');

    // In a full implementation, this would:
    // 1. Start the processing via API
    // 2. Connect to SSE for real-time updates
    // 3. Update the dashboard with progress
}

function connectToSSE() {
    if (eventSource) {
        eventSource.close();
    }

    eventSource = new EventSource('/api/status');

    eventSource.onmessage = (event) => {
        const status = JSON.parse(event.data);
        updateDashboard(status);
    };

    eventSource.onerror = () => {
        console.error('SSE connection error');
        eventSource.close();
    };
}

function updateDashboard(status) {
    // Update progress bar
    const progress = status.total > 0 ? (status.progress / status.total) * 100 : 0;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${status.progress} / ${status.total}`;

    // Update stats
    document.getElementById('stat-total').textContent = status.total;
    document.getElementById('stat-success').textContent = status.success;
    document.getElementById('stat-failed').textContent = status.failed;

    // Update status badge
    const badge = document.getElementById('status-badge');
    if (status.isProcessing) {
        badge.textContent = 'Processing';
        badge.className = 'status-badge processing';
    } else if (status.progress === status.total && status.total > 0) {
        badge.textContent = 'Complete';
        badge.className = 'status-badge complete';
    } else {
        badge.textContent = 'Idle';
        badge.className = 'status-badge idle';
    }

    // Update logs
    if (status.logs && status.logs.length > 0) {
        const logContainer = document.getElementById('log-container');
        logContainer.innerHTML = '';

        status.logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.type}`;
            logEntry.textContent = log.message;
            logContainer.appendChild(logEntry);
        });

        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

async function loadHistory() {
    try {
        const response = await fetch('/api/logs');
        const data = await response.json();

        const tbody = document.getElementById('history-tbody');
        tbody.innerHTML = '';

        if (data.logs && data.logs.length > 0) {
            data.logs.forEach(log => {
                const row = document.createElement('tr');

                const timestamp = new Date(log.Timestamp).toLocaleString();
                const statusClass = log.Status === 'SUCCESS' ? 'success' : 'error';

                row.innerHTML = `
                    <td>${timestamp}</td>
                    <td>${log.Name}</td>
                    <td>${log.Email}</td>
                    <td>${log.CertificateID}</td>
                    <td><span style="color: var(--${statusClass})">${log.Status}</span></td>
                `;

                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No delivery history yet</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Load history on page load
loadHistory();
