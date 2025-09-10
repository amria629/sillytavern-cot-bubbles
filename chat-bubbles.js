document.addEventListener('DOMContentLoaded', () => {
    // === 元素获取 (保持不变) ===
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

    // === 默认设置 (保持不变) ===
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

    // === 辅助函数 (保持不变) ===
    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // === 【优化点 1】: 分离样式应用和头像更新，避免完全重绘聊天 ===
    const applyVisualStyles = () => {
        root.style.setProperty('--mobile-bg', `url('${currentSettings.bgUrl}')`);
        root.style.setProperty('--left-bubble-start', hexToRgba(currentSettings.leftColor1, currentSettings.bubbleOpacity));
        root.style.setProperty('--left-bubble-end', hexToRgba(currentSettings.leftColor2, currentSettings.bubbleOpacity));
        root.style.setProperty('--right-bubble-start', hexToRgba(currentSettings.rightColor1, currentSettings.bubbleOpacity));
        root.style.setProperty('--right-bubble-end', hexToRgba(currentSettings.rightColor2, currentSettings.bubbleOpacity));
    };

    // 【新增】一个只更新头像的函数
    const updateAvatars = () => {
        const leftAvatars = document.querySelectorAll('.avatar-left');
        const rightAvatars = document.querySelectorAll('.avatar-right');
        leftAvatars.forEach(img => img.src = currentSettings.leftAvatar);
        rightAvatars.forEach(img => img.src = currentSettings.rightAvatar);
    };

    const applySettings = (fullRender = false) => {
        applyVisualStyles(); // 总是应用视觉样式
        if (fullRender) {
            renderChat(); // 只有在需要时才完全重绘
        } else {
            updateAvatars(); // 否则只更新头像
        }

        // 更新设置面板里的控件值
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
        
        // 【优化点 2】: 存储前检查大小，避免 localStorage 崩溃
        try {
            localStorage.setItem('chatBubbleSettings', JSON.stringify(currentSettings));
        } catch (e) {
            // 如果存储失败 (很可能是图片太大)
            console.error("Error saving settings to localStorage:", e);
            alert("保存设置失败！可能是因为您上传的图片文件过大，超过了浏览器5MB的存储限制。请尝试使用更小的图片。");
            // 恢复到上次成功的设置，防止用户界面与存储不一致
            loadSettings();
        }
    };

    const loadSettings = () => {
        const saved = localStorage.getItem('chatBubbleSettings');
        if (saved) {
            const savedSettings = JSON.parse(saved);
            currentSettings = { ...defaultSettings, ...savedSettings };
        }
        // applySettings(true) 会导致在加载时就重绘，如果 renderChat 在后面调用，这里可以只 apply visual
        applyVisualStyles();
        updateAvatars();
        applySettings(); // 更新面板控件
    };
    
    // addMessage 和 renderChat 函数基本不变，只是给头像加了特定class
    const addMessage = (content, isRightBubble) => {
        if (!content) return;
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble';
        chatBubble.innerHTML = content;
        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        if (chatBubble.children.length === 1 && chatBubble.children[0].tagName === 'IMG') {
            chatBubble.classList.add('image-only-bubble');
        }
        if (isRightBubble) {
            messageContainer.classList.add('align-right');
            chatBubble.classList.add('bubble-right');
            avatar.src = currentSettings.rightAvatar;
            avatar.classList.add('avatar-right'); // 【修改】添加特定class
            messageContainer.appendChild(chatBubble);
            messageContainer.appendChild(avatar);
        } else {
            messageContainer.classList.add('align-left');
            chatBubble.classList.add('bubble-left');
            avatar.src = currentSettings.leftAvatar;
            avatar.classList.add('avatar-left'); // 【修改】添加特定class
            messageContainer.appendChild(avatar);
            messageContainer.appendChild(chatBubble);
        }
        chatContainer.appendChild(messageContainer);
    }
    const renderChat = () => {
        chatContainer.innerHTML = '';
        if (!dataContainer) return;
        const rawText = dataContainer.innerHTML; 
        const lines = rawText.trim().split('\n');
        
        // 【优化点 3】: 使用文档片段 (DocumentFragment) 批量插入，减少重绘
        const fragment = document.createDocumentFragment();
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return;
            let content = '';
            let isRightBubble = false;
            if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                isRightBubble = true;
                content = trimmedLine.slice(1, -1).trim();
            } else {
                isRightBubble = false;
                content = trimmedLine;
            }
            // addMessage 现在需要修改为添加到 fragment
            // 为了简单，我们直接在这里构建，而不是调用 addMessage
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            const chatBubble = document.createElement('div');
            chatBubble.className = 'chat-bubble';
            chatBubble.innerHTML = content;
            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            if (chatBubble.children.length === 1 && chatBubble.children[0].tagName === 'IMG') {
                chatBubble.classList.add('image-only-bubble');
            }
            if (isRightBubble) {
                messageContainer.classList.add('align-right');
                chatBubble.classList.add('bubble-right');
                avatar.src = currentSettings.rightAvatar;
                avatar.classList.add('avatar-right');
                messageContainer.appendChild(chatBubble);
                messageContainer.appendChild(avatar);
            } else {
                messageContainer.classList.add('align-left');
                chatBubble.classList.add('bubble-left');
                avatar.src = currentSettings.leftAvatar;
                avatar.classList.add('avatar-left');
                messageContainer.appendChild(avatar);
                messageContainer.appendChild(chatBubble);
            }
            fragment.appendChild(messageContainer);
        });
        chatContainer.appendChild(fragment); // 一次性插入所有消息
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // === 事件监听 ===
    settingsToggle.addEventListener('click', () => {
        settingsPanel.classList.toggle('show');
    });

    saveSettingsBtn.addEventListener('click', () => {
        saveSettings();
        // 保存后，只需要应用样式，不需要重绘整个聊天
        applySettings(false);
        settingsPanel.classList.remove('show');
    });

    resetSettingsBtn.addEventListener('click', () => {
        if (confirm('确定要恢复所有默认设置吗？你上传的图片和选择的颜色都会被重置。')) {
            localStorage.removeItem('chatBubbleSettings');
            currentSettings = { ...defaultSettings };
            // 恢复默认后，需要完全重绘以确保头像正确
            applySettings(true); 
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
             if (file.size > 3 * 1024 * 1024) { // 3MB 警告
                alert("警告：图片文件较大(" + (file.size / 1024 / 1024).toFixed(2) + "MB)，可能会导致页面卡顿或保存失败。建议使用压缩后的图片。");
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                currentSettings[settingKey] = e.target.result;
                // 应用设置，但不需要重绘聊天内容，只需更新头像/背景
                applySettings(false); 
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

    // 拖动逻辑 (保持不变)
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

    // === 初始化 ===
    loadSettings();
    renderChat(); // 初始加载时，渲染一次聊天内容
});
