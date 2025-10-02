
function initStats() {
    document.getElementById('reset-stats').addEventListener('click', () => {
        state.stats = { total: 0, success: 0, failed: 0 };
        updateStats();
        addLog('Statistics reset', 'info', 'System');
    });
}