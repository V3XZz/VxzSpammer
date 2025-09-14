
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const platformOptions = document.querySelectorAll('.platform-option');
const platformConfigs = document.querySelectorAll('.platform-config');
const imageUrlContainer = document.getElementById('image-url-container');
const spamConfigContainer = document.getElementById('spam-config-container');
const docsLink = document.querySelector('.docs-link');


function initTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    platformOptions.forEach(option => {
        option.addEventListener('click', () => {
            const platform = option.dataset.platform;
            
            platformOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            platformConfigs.forEach(config => config.classList.add('hidden'));
            document.getElementById(`${platform}-config`).classList.remove('hidden');
            
            if (platform === 'ngl' || platform === 'docs') {
                imageUrlContainer.style.display = 'none';
            } else {
                imageUrlContainer.style.display = 'block';
            }
            
            if (platform === 'docs') {
                spamConfigContainer.classList.add('hidden');
            } else {
                spamConfigContainer.classList.remove('hidden');
            }
            
            state.currentPlatform = platform;
            addLog(`Switched to ${platform} mode`, 'info', 'System');
            
            if (platform === 'docs') {
                document.querySelectorAll('.monitor-tabs .tab, .tab-content').forEach(el => {
                    el.classList.remove('active');
                });
                document.querySelector('.tab[data-tab="logs"]').classList.add('active');
                document.getElementById('logs-tab').classList.add('active');
            }
        });
    });

    docsLink.addEventListener('click', (e) => {
        e.preventDefault();
        platformOptions.forEach(opt => opt.classList.remove('active'));
        document.querySelector('.platform-option[data-platform="docs"]').classList.add('active');
        platformConfigs.forEach(config => config.classList.add('hidden'));
        document.getElementById('docs-config').classList.remove('hidden');
        imageUrlContainer.style.display = 'none';
        spamConfigContainer.classList.add('hidden');
        state.currentPlatform = 'docs';
        addLog('Opened documentation', 'info', 'System');
        
        document.querySelectorAll('.monitor-tabs .tab, .tab-content').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector('.tab[data-tab="logs"]').classList.add('active');
        document.getElementById('logs-tab').classList.add('active');
    });
}