
const connectDiscordBtn = document.getElementById('connect-discord');
const discordMode = document.getElementById('discord-mode');
const discordEmbedConfig = document.getElementById('discord-embed-config');


function initDiscord() {
    discordMode.addEventListener('change', () => {
        if (discordMode.value === 'embed') {
            discordEmbedConfig.classList.remove('hidden');
        } else {
            discordEmbedConfig.classList.add('hidden');
        }
    });

    connectDiscordBtn.addEventListener('click', async () => {
        const webhookUrl = document.getElementById('webhook-url').value;
        
        if (!webhookUrl) {
            addLog('Please enter a webhook URL', 'error', 'Discord');
            return;
        }
        
        addLog('Connecting to Discord webhook...', 'info', 'Discord');
        
        try {
            const headers = getHeaders('discord');
            const response = await fetch(webhookUrl, {
                headers: headers
            });
            
            if (response.status === 200) {
                const data = await response.json();
                const name = data.name;
                const id = data.id;
                
                state.isConnected = true;
                botInfo.innerHTML = `
                    <div>Connected to Discord webhook: <strong>${name}</strong></div>
                `;
                
                addLog(`Successfully connected to Discord webhook: ${name}`, 'success', 'Discord');
                addLog(`Webhook ID: ${id}`, 'debug', 'Discord');
            } else {
                throw new Error('Invalid webhook URL');
            }
        } catch (error) {
            addLog(`Discord connection failed: ${error.message}`, 'error', 'Discord');
        }
    });
}


async function sendDiscordMessage(webhookUrl, username, avatarUrl, message, imageUrl, tts, mode, index, count) {
    const payload = {
        content: message.substring(0, 2000),
        tts: tts
    };
    
    if (username) payload.username = username;
    if (avatarUrl) payload.avatar_url = avatarUrl;
    
    if (mode === 'embed') {
        const embedTitle = document.getElementById('embed-title').value;
        const embedDescription = document.getElementById('embed-description').value;
        const embedColor = document.getElementById('embed-color').value;
        const embedFooter = document.getElementById('embed-footer').value;
        
        const colorHex = embedColor.replace('#', '');
        const colorInt = parseInt(colorHex, 16);
        
        payload.embeds = [
            {
                title: embedTitle || undefined,
                description: embedDescription || undefined,
                color: colorInt || 0x0099FF,
                footer: embedFooter ? { text: embedFooter } : undefined
            }
        ];
    } else if (imageUrl) {
        payload.embeds = [{
            image: { url: imageUrl }
        }];
    }
    
    const headers = getHeaders('discord');
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });
    
    if (response.status === 200 || response.status === 204) {
        state.stats.success++;
        addLog(`Sent message ${index+1}/${count} to Discord`, 'success', 'Discord');
    } else {
        throw new Error(`HTTP ${response.status}`);
    }
    
    state.stats.total++;
    updateStats();
}

// Start Discord spam
async function startDiscordSpam(message, imageUrl, count, delay, spamMode) {
    const webhookUrl = document.getElementById('webhook-url').value;
    const username = document.getElementById('webhook-username').value;
    const avatarUrl = document.getElementById('webhook-avatar').value;
    const tts = document.getElementById('discord-tts').checked;
    const mode = document.getElementById('discord-mode').value;
    
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
            addLog(`Failed to send message ${i+1}/${count}: ${error.message}`, 'error', 'Discord');
        }
    }
    
    if (spamMode === 'burst' && state.isSpamming) {
        try {
            const results = await Promise.allSettled(requests);
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    state.stats.success++;
                    addLog(`Sent message ${i+1}/${count} to Discord`, 'success', 'Discord');
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
        addLog('Finished sending messages to Discord', 'info', 'Discord');
    }
}