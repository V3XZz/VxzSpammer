
const logConsole = document.getElementById('log-console');
const logFilterButtons = document.querySelectorAll('.log-filter-btn');


function initLogs() {
    logFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const level = button.dataset.level;
            
            if (level === 'all') {
                const allActive = button.classList.contains('active');
                logFilterButtons.forEach(btn => {
                    if (btn.dataset.level !== 'all') {
                        if (allActive) {
                            btn.classList.remove('active');
                            state.logFilters[btn.dataset.level] = false;
                        } else {
                            btn.classList.add('active');
                            state.logFilters[btn.dataset.level] = true;
                        }
                    }
                });
                button.classList.toggle('active');
            } else {
                button.classList.toggle('active');
                state.logFilters[level] = button.classList.contains('active');
            }
            
            applyLogFilters();
        });
    });

    document.getElementById('clear-logs').addEventListener('click', () => {
        logConsole.innerHTML = '';
        addLog('Logs cleared', 'info', 'System');
    });

    document.getElementById('export-logs').addEventListener('click', () => {
        const logText = Array.from(logConsole.querySelectorAll('.log-entry'))
            .map(entry => entry.textContent)
            .join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vxzspammer-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog('Logs exported', 'info', 'System');
    });
}


function addLog(message, level = 'info', source = 'System') {
    const now = new Date();
    const timestamp = `[${now.toTimeString().substr(0, 8)}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${level}`;
    logEntry.innerHTML = `
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-level">${level.toUpperCase()}</span>
        <span class="log-message">${message}</span>
        <span class="log-source">${source}</span>
    `;
    
    if (!state.logFilters[level] && level !== 'all') {
        logEntry.style.display = 'none';
    }
    
    logConsole.appendChild(logEntry);
    logConsole.scrollTop = logConsole.scrollHeight;
}


function applyLogFilters() {
    const logEntries = logConsole.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
        const level = entry.classList[1].replace('log-', '');
        if (state.logFilters[level] || level === 'all') {
            entry.style.display = 'flex';
        } else {
            entry.style.display = 'none';
        }
    });
}