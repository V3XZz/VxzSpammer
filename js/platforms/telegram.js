const connectTelegramBtn = document.getElementById('connect-telegram');

function initTelegram() {
    const botInfo = document.getElementById('bot-info');
    const statusIndicator = document.getElementById('status-indicator');
    
    connectTelegramBtn.addEventListener('click', async () => {
        const token = document.getElementById('bot-token').value;
        const userId = document.getElementById('user-id').value;
        
        if (!token || !userId) {
            addLog('Please enter both bot token and user ID', 'error', 'Telegram');
            return;
        }
        
        addLog('Connecting to Telegram...', 'info', 'Telegram');
        
        try {
            const headers = getHeaders('telegram');
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
                headers: headers
            });
            const data = await response.json();
            
            if (data.ok) {
                const botName = data.result.first_name;
                const botUsername = data.result.username;
                
                state.isConnected = true;
                botInfo.innerHTML = `
                    <div>Connected to Telegram: <strong>${botName}</strong> (@${botUsername})</div>
                `;
                
                statusIndicator.textContent = 'Status: Connected';
                statusIndicator.className = 'request-status status-active';
                
                addLog(`Successfully connected to Telegram bot: ${botName} (@${botUsername})`, 'success', 'Telegram');
                addLog(`Bot ID: ${data.result.id}`, 'debug', 'Telegram');
                
                addChatMessage('bot', 'VxzSpammer Bot', 'Connected successfully! Ready to send messages.');
            } else {
                throw new Error(data.description || 'Failed to connect to Telegram');
            }
        } catch (error) {
            addLog(`Telegram connection failed: ${error.message}`, 'error', 'Telegram');
            statusIndicator.textContent = 'Status: Connection Failed';
            statusIndicator.className = 'request-status status-error';
        }
    });
}

async function sendTelegramMessage(token, userId, message, imageUrl, parseMode, index, count) {
    let response;
    const headers = getHeaders('telegram');
    
    if (imageUrl && message) {
        const formData = new FormData();
        formData.append('chat_id', userId);
        formData.append('photo', imageUrl);
        formData.append('caption', message);
        
        if (parseMode !== 'None') {
            formData.append('parse_mode', parseMode);
        }
        
        const formDataHeaders = {...headers};
        delete formDataHeaders['Content-Type'];
        
        response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: formDataHeaders,
            body: formData
        });
    }
    else if (imageUrl) {
        const formData = new FormData();
        formData.append('chat_id', userId);
        formData.append('photo', imageUrl);
        
        const formDataHeaders = {...headers};
        delete formDataHeaders['Content-Type'];
        
        response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: formDataHeaders,
            body: formData
        });
    }
    else {
        const payload = {
            chat_id: userId,
            text: message
        };
        
        if (parseMode !== 'None') {
            payload.parse_mode = parseMode;
        }
        
        response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
    }
    
    const data = await response.json();
    
    if (data.ok) {
        state.stats.success++;
        
        let messageType = 'text';
        if (imageUrl && message) {
            messageType = 'image with caption';
        } else if (imageUrl) {
            messageType = 'image';
        }
        
        addLog(`Sent ${messageType} message ${index+1}/${count} to Telegram`, 'success', 'Telegram');
        addLog(`Message ID: ${data.result.message_id}`, 'debug', 'Telegram');
    } else {
        throw new Error(data.description || 'Unknown error');
    }
    
    state.stats.total++;
    updateStats();
}

async function startTelegramSpam(message, imageUrl, count, delay, spamMode) {
    const token = document.getElementById('bot-token').value;
    const userId = document.getElementById('user-id').value;
    const parseMode = document.getElementById('telegram-parse-mode').value;
    
    const requests = [];
    
    for (let i = 0; i < count && state.isSpamming; i++) {
        try {
            if (spamMode === 'burst') {
                requests.push(sendTelegramMessage(token, userId, message, imageUrl, parseMode, i, count));
            } else {
                await sendTelegramMessage(token, userId, message, imageUrl, parseMode, i, count);
                
                let chatMessage = `Sent message ${i+1}/${count} to Telegram`;
                if (imageUrl && message) {
                    chatMessage = `Sent image with text ${i+1}/${count} to Telegram`;
                } else if (imageUrl) {
                    chatMessage = `Sent image ${i+1}/${count} to Telegram`;
                }
                
                addChatMessage('bot', 'VxzSpammer Bot', chatMessage);
                
                if (i < count - 1 && state.isSpamming) {
                    const actualDelay = spamMode === 'random' ? 
                        delay * (0.5 + Math.random()) : delay;
                    await new Promise(resolve => setTimeout(resolve, actualDelay));
                }
            }
        } catch (error) {
            state.stats.failed++;
            state.stats.total++;
            updateStats();
            addLog(`Failed to send message ${i+1}/${count}: ${error.message}`, 'error', 'Telegram');
        }
    }
    
    if (spamMode === 'burst' && state.isSpamming) {
        try {
            const results = await Promise.allSettled(requests);
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    state.stats.success++;
                    
                    let messageType = 'text';
                    if (imageUrl && message) {
                        messageType = 'image with text';
                    } else if (imageUrl) {
                        messageType = 'image';
                    }
                    
                    addLog(`Sent ${messageType} message ${i+1}/${count} to Telegram`, 'success', 'Telegram');
                    
                    let chatMessage = `Sent message ${i+1}/${count} to Telegram`;
                    if (imageUrl && message) {
                        chatMessage = `Sent image with text ${i+1}/${count} to Telegram`;
                    } else if (imageUrl) {
                        chatMessage = `Sent image ${i+1}/${count} to Telegram`;
                    }
                    
                    addChatMessage('bot', 'VxzSpammer Bot', chatMessage);
                } else {
                    state.stats.failed++;
                    addLog(`Failed to send message ${i+1}/${count}: ${result.reason}`, 'error', 'Telegram');
                }
                state.stats.total++;
                updateStats();
            });
        } catch (error) {
            addLog(`Burst mode error: ${error.message}`, 'error', 'Telegram');
        }
    }
    
    if (state.isSpamming) {
        stopSpamming();
        
        let completionMessage = 'Finished sending messages to Telegram';
        if (imageUrl && message) {
            completionMessage = 'Finished sending images with text to Telegram';
        } else if (imageUrl) {
            completionMessage = 'Finished sending images to Telegram';
        }
        
        addLog(completionMessage, 'info', 'Telegram');
        addChatMessage('bot', 'VxzSpammer Bot', completionMessage);
    }
}