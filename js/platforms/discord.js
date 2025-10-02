const connectDiscordBtn = document.getElementById('connect-discord');
const discordMode = document.getElementById('discord-mode');
const discordEmbedConfig = document.getElementById('discord-embed-config');

function initDiscord() {
    const botInfo = document.getElementById('bot-info');
    const statusIndicator = document.getElementById('status-indicator');
    
    discordMode.addEventListener('change', () => {
        if (discordMode.value === 'embed') {
            discordEmbedConfig.classList.remove('hidden');
        } else {
            discordEmbedConfig.classList.add('hidden');
        }
    });

    connectDiscordBtn.addEventListener('click', async () => {
        const webhookUrl = document.getElementById('webhook-url').value.trim();
        
        if (!webhookUrl) {
            addLog('Please enter a webhook URL', 'error', 'Discord');
            return;
        }
        
        if (!webhookUrl.includes('discord.com/api/webhooks/')) {
            addLog('Invalid Discord webhook URL format', 'error', 'Discord');
            statusIndicator.textContent = 'Status: Invalid URL';
            statusIndicator.className = 'request-status status-error';
            return;
        }
        
        addLog('Testing Discord webhook...', 'info', 'Discord');
        
        try {
            const response = await fetch(webhookUrl);
            
            if (response.ok) {
                const webhookData = await response.json();
                const name = webhookData.name || 'Unknown Webhook';
                const channelId = webhookData.channel_id || 'Unknown';
                
                state.isConnected = true;
                botInfo.innerHTML = `
                    <div>Connected to Discord: <strong>${name}</strong></div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">Channel ID: ${channelId}</div>
                `;
                
                statusIndicator.textContent = 'Status: Connected';
                statusIndicator.className = 'request-status status-active';
                
                addLog(`✅ Successfully connected to Discord: ${name}`, 'success', 'Discord');
                addLog(`Webhook ID: ${webhookData.id || 'Unknown'}`, 'debug', 'Discord');
                addLog(`Channel ID: ${channelId}`, 'debug', 'Discord');
                
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            addLog(`❌ Discord connection failed: ${error.message}`, 'error', 'Discord');
            statusIndicator.textContent = 'Status: Connection Failed';
            statusIndicator.className = 'request-status status-error';
            
            if (error.message.includes('Failed to fetch')) {
                addLog('Network error - check your internet connection', 'error', 'Discord');
            } else if (error.message.includes('404')) {
                addLog('Webhook not found - check if the URL is correct', 'error', 'Discord');
            } else if (error.message.includes('403')) {
                addLog('Webhook is invalid or has been deleted', 'error', 'Discord');
            }
        }
    });
}

async function sendDiscordMessage(webhookUrl, username, avatarUrl, message, imageUrl, tts, mode, index, count) {
    let payload = {};
    
    if (mode === 'embed') {
        const embedTitle = document.getElementById('embed-title').value.trim();
        const embedDescription = document.getElementById('embed-description').value.trim();
        const embedColor = document.getElementById('embed-color').value;
        const embedFooter = document.getElementById('embed-footer').value.trim();
        
        const embed = {};
        
        if (embedTitle) embed.title = embedTitle;
        if (embedDescription) embed.description = embedDescription;
        if (embedFooter) embed.footer = { text: embedFooter };
        
        const colorHex = embedColor.replace('#', '');
        embed.color = parseInt(colorHex, 16) || 0x0099FF;
        
        embed.timestamp = new Date().toISOString();
        
        if (imageUrl && imageUrl.trim()) {
            embed.image = { url: imageUrl };
        }
        
        payload.embeds = [embed];
        
        if (message && message.trim()) {
            payload.content = message.substring(0, 2000);
        }
        
    } else {
        payload = {
            content: message.substring(0, 2000),
            tts: tts || false
        };
        
        if (imageUrl && imageUrl.trim()) {
            payload.embeds = [{
                image: { url: imageUrl }
            }];
        }
    }
    
    if (username && username.trim()) {
        payload.username = username.substring(0, 80);
    }
    
    if (avatarUrl && avatarUrl.trim()) {
        payload.avatar_url = avatarUrl;
    }
    
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (response.ok) {
        state.stats.success++;
        
        let messageType = 'text';
        if (mode === 'embed') {
            if (imageUrl && message) {
                messageType = 'embed with image and text';
            } else if (imageUrl) {
                messageType = 'embed with image';
            } else if (message) {
                messageType = 'embed with text';
            } else {
                messageType = 'embed';
            }
        } else {
            if (imageUrl && message) {
                messageType = 'text with image';
            } else if (imageUrl) {
                messageType = 'image';
            }
        }
        
        addLog(`Sent ${messageType} message ${index+1}/${count} to Discord`, 'success', 'Discord');
        return true;
    } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
}

async function startDiscordSpam(message, imageUrl, count, delay, spamMode) {
    const webhookUrl = document.getElementById('webhook-url').value.trim();
    const username = document.getElementById('webhook-username').value.trim();
    const avatarUrl = document.getElementById('webhook-avatar').value.trim();
    const tts = document.getElementById('discord-tts').checked;
    const mode = document.getElementById('discord-mode').value;
    
    if (mode === 'embed') {
        const embedTitle = document.getElementById('embed-title').value.trim();
        const embedDescription = document.getElementById('embed-description').value.trim();
        
        if (!embedTitle && !embedDescription && !message.trim() && !imageUrl.trim()) {
            addLog('Embed mode requires at least a title, description, message content, or image URL', 'error', 'Discord');
            return;
        }
    } else {
        if (!message.trim() && !imageUrl.trim()) {
            addLog('Please enter a message, image URL, or both for text mode', 'error', 'Discord');
            return;
        }
    }
    
    const requests = [];
    
    for (let i = 0; i < count && state.isSpamming; i++) {
        try {
            if (spamMode === 'burst') {
                requests.push(sendDiscordMessage(webhookUrl, username, avatarUrl, message, imageUrl, tts, mode, i, count));
            } else {
                await sendDiscordMessage(webhookUrl, username, avatarUrl, message, imageUrl, tts, mode, i, count);
                
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
            
            let messageType = 'message';
            if (imageUrl && message) {
                messageType = 'text with image';
            } else if (imageUrl) {
                messageType = 'image';
            }
            
            addLog(`Failed to send ${messageType} ${i+1}/${count}: ${error.message}`, 'error', 'Discord');
        }
        
        state.stats.total++;
        updateStats();
    }
    
    if (spamMode === 'burst' && state.isSpamming) {
        try {
            const results = await Promise.allSettled(requests);
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    state.stats.success++;
                    
                    let messageType = 'text';
                    if (mode === 'embed') {
                        if (imageUrl && message) {
                            messageType = 'embed with image and text';
                        } else if (imageUrl) {
                            messageType = 'embed with image';
                        } else {
                            messageType = 'embed';
                        }
                    } else {
                        if (imageUrl && message) {
                            messageType = 'text with image';
                        } else if (imageUrl) {
                            messageType = 'image';
                        }
                    }
                    
                    addLog(`Sent ${messageType} message ${i+1}/${count} to Discord`, 'success', 'Discord');
                } else {
                    state.stats.failed++;
                    addLog(`Failed to send message ${i+1}/${count}: ${result.reason}`, 'error', 'Discord');
                }
                state.stats.total++;
                updateStats();
            });
        } catch (error) {
            addLog(`Burst mode error: ${error.message}`, 'error', 'Discord');
        }
    }
    
    if (state.isSpamming) {
        stopSpamming();
        
        let completionMessage = 'Finished sending messages to Discord';
        if (mode === 'embed') {
            if (imageUrl && message) {
                completionMessage = 'Finished sending embeds with images and text to Discord';
            } else if (imageUrl) {
                completionMessage = 'Finished sending embeds with images to Discord';
            } else {
                completionMessage = 'Finished sending embeds to Discord';
            }
        } else {
            if (imageUrl && message) {
                completionMessage = 'Finished sending text with images to Discord';
            } else if (imageUrl) {
                completionMessage = 'Finished sending images to Discord';
            }
        }
        
        addLog(completionMessage, 'info', 'Discord');
    }
}