
function toggleUaSpoofing(enabled) {
    state.uaSpoofEnabled = enabled;
    addLog(`User-Agent spoofing ${enabled ? 'enabled' : 'disabled'}`, 'info', 'System');
}


function toggleUaRotation(enabled) {
    state.uaRotationEnabled = enabled;
    addLog(`User-Agent rotation ${enabled ? 'enabled' : 'disabled'}`, 'info', 'System');
}


function toggleCustomHeaders(enabled) {
    state.customHeadersEnabled = enabled;
    addLog(`Custom headers ${enabled ? 'enabled' : 'disabled'}`, 'info', 'System');
}


function addCustomHeader(key, value) {
    state.customHeaders[key] = value;
    addLog(`Added custom header: ${key}`, 'debug', 'System');
}


function removeCustomHeader(key) {
    delete state.customHeaders[key];
    addLog(`Removed custom header: ${key}`, 'debug', 'System');
}