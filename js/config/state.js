const state = {
    currentPlatform: 'telegram',
    isConnected: false,
    isSpamming: false,
    stats: {
        total: 0,
        success: 0,
        failed: 0
    },
    sessionStart: null,
    intervalId: null,
    logFilters: {
        info: true,
        success: true,
        warning: true,
        error: true,
        debug: false
    },
    spamInterval: null,
    telegramChat: [],
   
    uaSpoofEnabled: true,
    uaRotationEnabled: true,
    customHeadersEnabled: true,
    customHeaders: {...defaultHeaders}
};