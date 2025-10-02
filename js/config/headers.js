function getHeaders(platform) {
    const headers = {};
    
    
    if (state.uaSpoofEnabled) {
        headers['User-Agent'] = state.uaRotationEnabled ? getRandomUserAgent() : userAgents[0];
    }
    

    if (state.customHeadersEnabled) {
        Object.assign(headers, state.customHeaders);
    }
    
    
    if (platform === 'telegram') {
        headers['Content-Type'] = 'application/json';
    } else if (platform === 'discord') {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
}