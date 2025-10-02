const connectTelegramBtn = document.getElementById('connect-telegram');

function initTelegram() {
    const botInfo = document.getElementById('bot-info');
    const statusIndicator = document.getElementById('status-indicator');
    
    connectTelegramBtn.addEventListener('click', async () => {
        const token = document.getElementById('bot-token').value.trim();
        const userId = document.getElementById('user-id').value.trim();
        
        if (!token || !userId) {
            addLog('Please enter both bot token and user ID', 'error', 'Telegram');
            return;
        }
        
        if (!token.includes(':') || token.length < 20) {
            addLog('Invalid bot token format', 'error', 'Telegram');
            return;
        }
        
        addLog('Connecting to Telegram...', 'info', 'Telegram');
        
        try {
            const headers = getHeaders('telegram');
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.ok) {
                const botName = data.result.first_name;
                const botUsername = data.result.username;
                
                state.isConnected = true;
                botInfo.innerHTML = `
                    <div>Connected to Telegram: <strong>${botName}</strong> (@${botUsername})</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">Bot ID: ${data.result.id}</div>
                `;
                
                statusIndicator.textContent = 'Status: Connected';
                statusIndicator.className = 'request-status status-active';
                
                addLog(`Successfully connected to Telegram bot: ${botName} (@${botUsername})`, 'success', 'Telegram');
                addLog(`Bot ID: ${data.result.id}`, 'debug', 'Telegram');
                
            } else {
                throw new Error(data.description || 'Failed to connect to Telegram');
            }
        } catch (error) {
            addLog(`Telegram connection failed: ${error.message}`, 'error', 'Telegram');
            statusIndicator.textContent = 'Status: Connection Failed';
            statusIndicator.className = 'request-status status-error';
            
            if (error.message.includes('401')) {
                addLog('Invalid bot token - check your token and try again', 'error', 'Telegram');
            } else if (error.message.includes('Failed to fetch')) {
                addLog('Network error - check your internet connection', 'error', 'Telegram');
            }
        }
    });
}

async function sendTelegramMessage(token, userId, message, imageUrl, parseMode, index, count) {
    let response;
    
    try {
        if (imageUrl && imageUrl.trim()) {
            let finalImageUrl = imageUrl;
            
            if (imageUrl.includes('imgur.com')) {
                if (imageUrl.includes('/a/') || !imageUrl.includes('.jpg') && !imageUrl.includes('.png') && !imageUrl.includes('.jpeg')) {
                    finalImageUrl = imageUrl + '.jpg';
                }
            }
            
            const imageResponse = await fetch(finalImageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*,*/*'
                },
                mode: 'cors'
            });
            
            if (!imageResponse.ok) {
                throw new Error(`Failed to download image: HTTP ${imageResponse.status}`);
            }
            
            const contentType = imageResponse.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                throw new Error('URL does not point to a valid image');
            }
            
            const blob = await imageResponse.blob();
            
            if (blob.size === 0) {
                throw new Error('Downloaded image is empty');
            }
            
            const formData = new FormData();
            formData.append('chat_id', userId);
            formData.append('photo', blob, 'image.jpg');
            
            if (message && message.trim()) {
                formData.append('caption', message.substring(0, 1024));
                if (parseMode !== 'None') {
                    formData.append('parse_mode', parseMode);
                }
            }
            
            response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            
        } else if (imageUrl && imageUrl.trim()) {
            throw new Error('Invalid image URL format');
            
        } else {
            const payload = {
                chat_id: userId,
                text: message
            };
            
            if (parseMode !== 'None') {
                payload.parse_mode = parseMode;
            }
            
            const headers = getHeaders('telegram');
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
                messageType = 'image with text';
            } else if (imageUrl) {
                messageType = 'image';
            }
            
            addLog(`Sent ${messageType} message ${index+1}/${count} to Telegram`, 'success', 'Telegram');
            
            return true;
        } else {
            throw new Error(data.description || `Telegram API error`);
        }
        
    } catch (error) {
        if (imageUrl && message && message.trim()) {
            addLog(`Image failed, sending text only: ${error.message}`, 'warning', 'Telegram');
            
            try {
                const payload = {
                    chat_id: userId,
                    text: message
                };
                
                if (parseMode !== 'None') {
                    payload.parse_mode = parseMode;
                }
                
                const headers = getHeaders('telegram');
                const textResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                });
                
                const textData = await textResponse.json();
                
                if (textData.ok) {
                    state.stats.success++;
                    addLog(`Sent text-only message ${index+1}/${count} to Telegram`, 'success', 'Telegram');
                    return true;
                } else {
                    throw new Error(textData.description || 'Fallback text message also failed');
                }
            } catch (fallbackError) {
                throw new Error(`Both image and fallback failed: ${fallbackError.message}`);
            }
        }
        
        throw error;
    } finally {
        state.stats.total++;
        updateStats();
    }
}

async function startTelegramSpam(message, imageUrl, count, delay, spamMode) {
    const token = document.getElementById('bot-token').value.trim();
    const userId = document.getElementById('user-id').value.trim();
    const parseMode = document.getElementById('telegram-parse-mode').value;
    
    if (!state.isConnected) {
        addLog('Please connect to Telegram first', 'error', 'Telegram');
        return;
    }
    
    if (!message.trim() && !imageUrl.trim()) {
        addLog('Please enter a message, image URL, or both', 'error', 'Telegram');
        return;
    }
    
    if (!token || !userId) {
        addLog('Bot token or User ID is missing', 'error', 'Telegram');
        return;
    }
    
    if (count < 1 || count > 1000) {
        addLog('Message count must be between 1 and 1000', 'error', 'Telegram');
        return;
    }
    
    if (delay < 0.1) {
        addLog('Delay must be at least 0.1 seconds', 'error', 'Telegram');
        return;
    }
    
    const requests = [];
    const delayMs = delay * 1000;
    
    addLog(`Starting Telegram spam: ${count} messages, ${delay}s delay, ${spamMode} mode`, 'info', 'Telegram');
    
    for (let i = 0; i < count && state.isSpamming; i++) {
        try {
            if (spamMode === 'burst') {
                requests.push(sendTelegramMessage(token, userId, message, imageUrl, parseMode, i, count));
            } else {
                await sendTelegramMessage(token, userId, message, imageUrl, parseMode, i, count);
                
                if (i < count - 1 && state.isSpamming) {
                    const actualDelay = spamMode === 'random' 
                        ? delayMs * (0.5 + Math.random())
                        : delayMs;
                    
                    await new Promise(resolve => setTimeout(resolve, actualDelay));
                }
            }
        } catch (error) {
            state.stats.failed++;
            updateStats();
            
            let messageType = 'message';
            if (imageUrl && message) {
                messageType = 'image with text';
            } else if (imageUrl) {
                messageType = 'image';
            }
            
            addLog(`Failed to send ${messageType} ${i+1}/${count}: ${error.message}`, 'error', 'Telegram');
        }
    }
    
    if (spamMode === 'burst' && state.isSpamming && requests.length > 0) {
        try {
            addLog(`Processing ${requests.length} burst messages...`, 'info', 'Telegram');
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
                } else {
                    state.stats.failed++;
                    addLog(`Failed to send message ${i+1}/${count}: ${result.reason}`, 'error', 'Telegram');
                }
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
        
        const successRate = state.stats.total > 0 
            ? Math.round((state.stats.success / state.stats.total) * 100) 
            : 0;
        addLog(`Success rate: ${successRate}% (${state.stats.success}/${state.stats.total})`, 'info', 'Telegram');
    }
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}