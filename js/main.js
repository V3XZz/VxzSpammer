document.addEventListener('DOMContentLoaded', function() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" } },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        }
    });

    const now = new Date();
    document.querySelector('.log-timestamp').textContent = `[${now.toTimeString().substr(0, 8)}.${now.getMilliseconds().toString().padStart(3, '0')}]`;

    initTabs();
    initLogs();
    initStats();
    
    
    initTelegram();
    initDiscord();
    
    const messageContent = document.getElementById('message-content');
    const charCount = document.getElementById('char-count');
    
    messageContent.addEventListener('input', () => {
        const length = messageContent.value.length;
        const maxLength = messageContent.getAttribute('maxlength');
        charCount.textContent = `${length}/${maxLength} characters`;
        
        if (length > maxLength * 0.9) {
            charCount.className = 'char-count error';
        } else if (length > maxLength * 0.75) {
            charCount.className = 'char-count warning';
        } else {
            charCount.className = 'char-count';
        }
    });

    document.getElementById('clear-all').addEventListener('click', () => {
        document.getElementById('message-content').value = '';
        document.getElementById('char-count').textContent = '0/2000 characters';
        document.getElementById('char-count').className = 'char-count';
        document.getElementById('image-url').value = '';
        document.getElementById('message-count').value = '10';
        document.getElementById('message-delay').value = '1.0';
        addLog('All fields cleared', 'info', 'System');
    });

    const toggleSpamBtn = document.getElementById('toggle-spam');
    const botInfo = document.getElementById('bot-info');
    const statusIndicator = document.getElementById('status-indicator');
    
    toggleSpamBtn.addEventListener('click', () => {
        if (!state.isConnected) {
            addLog('Please connect to a platform first', 'error', 'System');
            return;
        }
        
        if (state.isSpamming) {
            stopSpamming();
            toggleSpamBtn.innerHTML = '<i class="fas fa-play"></i> Start Spamming';
            toggleSpamBtn.classList.remove('active');
            statusIndicator.textContent = 'Status: Inactive';
            statusIndicator.className = 'request-status status-inactive';
            addLog('Spamming stopped', 'warning', 'System');
        } else {
            const message = document.getElementById('message-content').value;
            const imageUrl = document.getElementById('image-url').value;
            const count = parseInt(document.getElementById('message-count').value);
            const delay = parseFloat(document.getElementById('message-delay').value) * 1;
            const spamMode = document.getElementById('spam-mode').value;
            
            if (!message && !imageUrl) {
                addLog('Please enter a message or image URL', 'error', 'System');
                return;
            }
            
            if (count < 1 || count > 1000) {
                addLog('Message count must be between 1 and 1000', 'error', 'System');
                return;
            }
            
            state.isSpamming = true;
            toggleSpamBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Spamming';
            toggleSpamBtn.classList.add('active');
            statusIndicator.textContent = 'Status: Active';
            statusIndicator.className = 'request-status status-active';
            
            state.sessionStart = new Date();
            updateSessionTimer();
            
            addLog(`Starting to send ${count} messages with ${delay/1000}s delay using ${spamMode} mode`, 'info', 'System');
            addLog(`Platform: ${state.currentPlatform}`, 'debug', 'System');
            addLog(`Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`, 'debug', 'System');
            
            if (state.currentPlatform === 'telegram') {
                startTelegramSpam(message, imageUrl, count, delay, spamMode);
            } else if (state.currentPlatform === 'discord') {
                startDiscordSpam(message, imageUrl, count, delay, spamMode);
            }
        }
    });
});