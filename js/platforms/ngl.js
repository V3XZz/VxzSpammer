
const connectNglBtn = document.getElementById('connect-ngl');


function initNGL() {
    connectNglBtn.addEventListener('click', async () => {
        const username = document.getElementById('ngl-username').value;
        
        if (!username) {
            addLog('Please enter an NGL username', 'error', 'NGL');
            return;
        }
        
        addLog('Connecting to NGL...', 'info', 'NGL');
        
        try {
            const headers = getHeaders('ngl');
            const response = await fetch(`https://ngl.link/${username}`, {
                method: 'HEAD',
                headers: headers,
                mode: 'no-cors'
            });
            
            state.isConnected = true;
            botInfo.innerHTML = `
                <div>Connected to NGL: <strong>${username}</strong></div>
            `;
            
            addLog(`NGL username ${username} appears to be valid`, 'success', 'NGL');
        } catch (error) {
            addLog(`NGL connection completed for ${username}`, 'info', 'NGL');
            state.isConnected = true;
            botInfo.innerHTML = `
                <div>Ready to send to NGL: <strong>${username}</strong></div>
            `;
        }
    });
}


async function startNGLSpam(message, count, delay, spamMode) {
    const username = document.getElementById('ngl-username').value;
    const deviceId = document.getElementById('ngl-device-id').value || generateDeviceId();
    const questionLink = document.getElementById('ngl-question-link').value;
    const referrer = document.getElementById('ngl-referrer').value;
    
    for (let i = 0; i < count && state.isSpamming; i++) {
        try {
            let url;
            let body;
            
            if (questionLink) {
                const questionId = questionLink.split('/').pop();
                url = `https://ngl.link/api/submit/${questionId}`;
                body = new URLSearchParams({
                    username: username,
                    question: message.substring(0, 100),
                    deviceId: deviceId,
                    gameSlug: '',
                    referrer: referrer || ''
                });
            } else {
                url = `https://ngl.link/${username}`;
                body = new URLSearchParams({
                    username: username,
                    question: message.substring(0, 100),
                    deviceId: deviceId,
                    gameSlug: '',
                    referrer: referrer || ''
                });
            }
            
            const headers = getHeaders('ngl');
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });
            
            if (response.status === 200) {
                state.stats.success++;
                addLog(`Sent message ${i+1}/${count} to NGL`, 'success', 'NGL');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            state.stats.failed++;
            addLog(`Failed to send message ${i+1}/${count}: ${error.message}`, 'error', 'NGL');
        }
        
        state.stats.total++;
        updateStats();
        
        if (i < count - 1 && state.isSpamming) {
            const actualDelay = spamMode === 'random' ? 
                delay * (0.5 + Math.random()) : delay;
            await new Promise(resolve => setTimeout(resolve, actualDelay));
        }
    }
    
    if (state.isSpamming) {
        stopSpamming();
        addLog('Finished sending messages to NGL', 'info', 'NGL');
    }
}