function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateDeviceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function updateStats() {
    document.getElementById('stat-total').textContent = state.stats.total;
    document.getElementById('stat-success').textContent = state.stats.success;
    document.getElementById('stat-failed').textContent = state.stats.failed;
    
    const successRate = state.stats.total > 0 
        ? Math.round((state.stats.success / state.stats.total) * 100) 
        : 0;
    document.getElementById('session-success-rate').textContent = `${successRate}%`;
}

function updateSessionTimer() {
    if (!state.sessionStart) return;
    
    const now = new Date();
    const diff = now - state.sessionStart;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    const formattedTime = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
    
    document.getElementById('session-runtime').textContent = formattedTime;
    
    if (diff > 0 && state.stats.total > 0) {
        const speed = (state.stats.total / (diff / 1000)).toFixed(2);
        document.getElementById('session-speed').textContent = `${speed} msg/s`;
    }
    
    if (state.isSpamming) {
        state.intervalId = setTimeout(updateSessionTimer, 1000);
    }
}

const toggleSpamBtn = document.getElementById('toggle-spam');
function stopSpamming() {
    state.isSpamming = false;
    toggleSpamBtn.innerHTML = '<i class="fas fa-play"></i> Start Spamming';
    toggleSpamBtn.classList.remove('active');
    statusIndicator.textContent = 'Status: Inactive';
    statusIndicator.className = 'request-status status-inactive';

    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}