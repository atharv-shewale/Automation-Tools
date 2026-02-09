// Dashboard & Processing

let eventSource = null;

document.getElementById('start-processing-btn').addEventListener('click', startProcessing);
document.getElementById('refresh-history-btn').addEventListener('click', loadHistory);

async function startProcessing() {
    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mode: 'production' }) // Can be 'dry-run' or 'test' based on UI selection
        });

        const data = await response.json();

        if (data.success) {
            connectToSSE();
            document.getElementById('start-processing-btn').disabled = true;
            document.getElementById('start-processing-btn').textContent = 'Processing...';
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Failed to start processing: ' + error.message);
    }
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

        // Re-enable button
        document.getElementById('start-processing-btn').disabled = false;
        document.getElementById('start-processing-btn').textContent = 'Start Processing';

        // Refresh history
        loadHistory();
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
