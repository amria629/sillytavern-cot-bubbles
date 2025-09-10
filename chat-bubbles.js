document.addEventListener('DOMContentLoaded', () => {
    // === 所有元素获取、默认设置、辅助函数都保持不变 ===
    const chatContainer = document.getElementById('chat-container');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsToggle = document.getElementById('settings-toggle');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const dataContainer = document.getElementById('chat-data');
    const root = document.documentElement;
    const bgUploadInput = document.getElementById('bg-upload');
    const leftAvatarUploadInput = document.getElementById('left-avatar-upload');
    const rightAvatarUploadInput = document.getElementById('right-avatar-upload');
    const leftColor1Input = document.getElementById('left-color-1');
    const leftColor2Input = document.getElementById('left-color-2');
    const rightColor1Input = document.getElementById('right-color-1');
    const rightColor2Input = document.getElementById('right-color-2');
    const opacitySlider = document.getElementById('bubble-opacity');
    const opacityValueDisplay = document.getElementById('opacity-value');

    const defaultSettings = {
        bgUrl: 'https://cdn.discordapp.com/attachments/1412090688769757285/1415294257383739473/c79a77120952d57c.png?ex=68c2aefd&is=68c15d7d&hm=f81ef122a0b0b3917a573e205fffb6df2949633a19a441a13471d9281d168efb&',
        leftAvatar: 'https://cdn.discordapp.com/attachments/1412090688769757285/1415334842874331146/IMG_9680.jpg?ex=68c2d4ca&is=68c1834a&hm=1f8c247db8e68c6297ebb58efcb952a8d018505886c9901430acd8d7d9a456ae&',
        rightAvatar: 'https://cdn.discordapp.com/attachments/1412090688769757285/1415334843516190812/IMG_9681.jpg?ex=68c2d4ca&is=68c1834a&hm=a3b9a5f95334c157c11e9b957e5a641fe4ed06332b45de45f45a26db9fd351b0&',
        leftColor1: '#e9e9eb',
        leftColor2: '#f4f4f5',
        rightColor1: '#007aff',
        rightColor2: '#5856d6',
        bubbleOpacity: 0.8
    };
    let currentSettings = { ...defaultSettings };

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // addMessage 函数保持原样，它工作得很好
    const addMessage = (content, isRightBubble) => {
        if (!content || content.trim() === '') return;
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble';
        chatBubble.innerHTML = content;
        const avatar = document.createElement('img');
        avatar.className = 'avatar';

        // 检查是否是纯图片气泡的逻辑
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        if (tempDiv.children.length === 1 && tempDiv.children[0].tagName === 'IMG' && tempDiv.textContent.trim() === '') {
            chatBubble.classList.add('image-only-bubble');
        }
        
        if (isRightBubble) {
            messageContainer.classList.add('align-right');
            chatBubble.classList.add('bubble-right');
            avatar.src = currentSettings.rightAvatar;
            messageContainer.appendChild(chatBubble);
            messageContainer.appendChild(avatar);
        } else {
            messageContainer.classList.add('align-left');
            chatBubble.classList.add('bubble-left');
            avatar.src = currentSettings.leftAvatar;
            messageContainer.appendChild(avatar);
            messageContainer.appendChild(chatBubble);
        }
        chatContainer.appendChild(messageContainer);
    }
    
    // ==========================================================
    // === 【核心修改】重写 renderChat 函数，智能解析 CoT ===
    // ==========================================================
    const renderChat = () => {
        chatContainer.innerHTML = '';
        if (!dataContainer) return;
        
        let rawText = dataContainer.innerHTML; 

        // 1. 先把所有的 <emoji> 标签替换成图片
        // 使用 .replace() 而不是 .replaceAll() 以获得更好的浏览器兼容性
        const emojiRegex = /<emoji>(.+?)<\/emoji>/g;
        let processedText = rawText.replace(emojiRegex, 
            '<img src="https://gitgud.io/mom1/bqb/-/raw/master/$1" style="width: 64px; height: 64px; vertical-align: middle; margin: 2px;" alt="$1">'
        );
        
        // 2. 使用正则表达式按 `[...]` 逻辑块来切分文本
        // `([\s\S]*?)` 匹配方括号内的任何字符(包括换行符)，括号让分隔符本身也保留在结果数组中
        const parts = processedText.split(/(\[[\s\S]*?\])/);

        // 3. 遍历切分后的部分，生成气泡
        parts.forEach(part => {
            // 如果部分为空或只包含空格/换行，则跳过
            if (!part || part.trim() === '') return;

            if (part.startsWith('[') && part.endsWith(']')) {
                // 这是右气泡
                const content = part.slice(1, -1); // 去掉前后的[]
                addMessage(content, true);
            } else {
                // 这是左气泡
                addMessage(part, false);
            }
        });

        // 滚动到底部
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
    
    // --- 后面的所有代码（设置、保存、加载、拖动等）都保持你原来的样子，它们是完美的 ---

    const applySettings = () => {
        root.style.setProperty('--mobile-bg', `url('${currentSettings.bgUrl}')`);
        root.style.setProperty('--left-bubble-start', hexToRgba(currentSettings.leftColor1, currentSettings.bubbleOpacity));
        root.style.setProperty('--left-bubble-end', hexToRgba(currentSettings.leftColor2, currentSettings.bubbleOpacity));
        root.style.setProperty('--right-bubble-start', hexToRgba(currentSettings.rightColor1, currentSettings.bubbleOpacity));
        root.style.setProperty('--right-bubble-end', hexToRgba(currentSettings.rightColor2, currentSettings.bubbleOpacity));
        renderChat(); // 更改头像后需要重绘
        leftColor1Input.value = currentSettings.leftColor1;
        leftColor2Input.value = currentSettings.leftColor2;
        rightColor1Input.value = currentSettings.rightColor1;
        rightColor2Input.value = currentSettings.rightColor2;
        opacitySlider.value = currentSettings.bubbleOpacity;
        opacityValueDisplay.textContent = `${Math.round(currentSettings.bubbleOpacity * 100)}%`;
    };

    const saveSettings = () => {
        currentSettings.leftColor1 = leftColor1Input.value;
        currentSettings.leftColor2 = leftColor2Input.value;
        currentSettings.rightColor1 = rightColor1Input.value;
        currentSettings.rightColor2 = rightColor2Input.value;
        currentSettings.bubbleOpacity = parseFloat(opacitySlider.value);
        localStorage.setItem('chatBubbleSettings', JSON.stringify(currentSettings));
    };

    const loadSettings = () => {
        const saved = localStorage.getItem('chatBubbleSettings');
        if (saved) {
            const savedSettings = JSON.parse(saved);
            currentSettings = { ...defaultSettings, ...savedSettings };
        }
        applySettings();
    };

    settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('show'));
    saveSettingsBtn.addEventListener('click', () => {
        saveSettings();
        applySettings();
        settingsPanel.classList.remove('show');
    });
    resetSettingsBtn.addEventListener('click', () => {
        if (confirm('确定要恢复所有默认设置吗？')) {
            localStorage.removeItem('chatBubbleSettings');
            currentSettings = { ...defaultSettings };
            applySettings();
            document.getElementById('bg-upload').value = '';
            document.getElementById('left-avatar-upload').value = '';
            document.getElementById('right-avatar-upload').value = '';
            settingsPanel.classList.remove('show');
        }
    });

    const handleImageUpload = (inputElement, settingKey) => {
        inputElement.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                currentSettings[settingKey] = e.target.result;
                applySettings();
            };
            reader.readAsDataURL(file);
        });
    };
    handleImageUpload(bgUploadInput, 'bgUrl');
    handleImageUpload(leftAvatarUploadInput, 'leftAvatar');
    handleImageUpload(rightAvatarUploadInput, 'rightAvatar');
    
    const updateLivePreview = () => {
        const opacity = parseFloat(opacitySlider.value);
        root.style.setProperty('--left-bubble-start', hexToRgba(leftColor1Input.value, opacity));
        root.style.setProperty('--left-bubble-end', hexToRgba(leftColor2Input.value, opacity));
        root.style.setProperty('--right-bubble-start', hexToRgba(rightColor1Input.value, opacity));
        root.style.setProperty('--right-bubble-end', hexToRgba(rightColor2Input.value, opacity));
        opacityValueDisplay.textContent = `${Math.round(opacity * 100)}%`;
    };

    [leftColor1Input, leftColor2Input, rightColor1Input, rightColor2Input, opacitySlider].forEach(input => {
        input.addEventListener('input', updateLivePreview);
    });

    let isDragging = false, startY, startScrollTop;
    const getPageY = (e) => e.pageY || (e.touches && e.touches[0].pageY);
    const handleDragStart = (e) => { isDragging = true; chatContainer.classList.add('grabbing'); startY = getPageY(e); startScrollTop = chatContainer.scrollTop; };
    const handleDragEnd = () => { isDragging = false; chatContainer.classList.remove('grabbing'); };
    const handleDragMove = (e) => { if (!isDragging) return; e.preventDefault(); const y = getPageY(e); const walk = (y - startY); chatContainer.scrollTop = startScrollTop - walk; };
    chatContainer.addEventListener('mousedown', handleDragStart);
    chatContainer.addEventListener('mouseleave', handleDragEnd);
    chatContainer.addEventListener('mouseup', handleDragEnd);
    chatContainer.addEventListener('mousemove', handleDragMove);
    chatContainer.addEventListener('touchstart', handleDragStart, { passive: true });
    chatContainer.addEventListener('touchend', handleDragEnd);
    chatContainer.addEventListener('touchmove', handleDragMove);

    loadSettings();
    renderChat();
});

