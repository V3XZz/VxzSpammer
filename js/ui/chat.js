const telegramChatContainer = document.getElementById('telegram-chat-container');
const chatMessageInput = document.getElementById('chat-message');
const sendChatMessageBtn = document.getElementById('send-chat-message');

function initChat() {
    sendChatMessageBtn.addEventListener('click', () => {
        const message = chatMessageInput.value;
        if (!message) return;
        
        addChatMessage('user', 'You', message);
        chatMessageInput.value = '';
        
        setTimeout(() => {
            addChatMessage('bot', 'VxzSpammer Bot', 'This is a simulated response. In a real implementation, I would respond to your message.');
        }, 1000);
    });
}

function addChatMessage(type, sender, content) {
    const now = new Date();
    const time = now.toTimeString().substring(0, 8);
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${type}`;
    messageEl.innerHTML = `
        <div class="sender">${sender}</div>
        <div class="content">${content}</div>
        <div class="time">${time}</div>
    `;
    
    telegramChatContainer.appendChild(messageEl);
    telegramChatContainer.scrollTop = telegramChatContainer.scrollHeight;
    
    state.telegramChat.push({
        type,
        sender,
        content,
        time
    });
}