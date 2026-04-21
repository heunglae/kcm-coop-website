document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('writeForm');
    const messageBox = document.getElementById('writeMessage');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const category = document.getElementById('category')?.value.trim() || '';
        const author = document.getElementById('author')?.value.trim() || '';
        const title = document.getElementById('title')?.value.trim() || '';
        const content = document.getElementById('content')?.value.trim() || '';

        if (!category || !author || !title || !content) {
            showMessage('모든 항목을 입력해 주세요.', 'error');
            return;
        }

        try {
            const newPost = {
                id: Date.now(),
                category,
                author,
                title,
                content,
                createdAt: new Date().toISOString()
            };

            const savedPosts = JSON.parse(localStorage.getItem('kcm_posts') || '[]');
            savedPosts.unshift(newPost);
            localStorage.setItem('kcm_posts', JSON.stringify(savedPosts));

            showMessage('게시글이 정상적으로 저장되었습니다. 잠시 후 게시판으로 이동합니다.', 'success');

            form.reset();

            setTimeout(() => {
                window.location.href = 'news.html';
            }, 1000);

        } catch (error) {
            console.error('게시글 저장 오류:', error);
            showMessage('게시글 저장 중 오류가 발생했습니다. 브라우저 설정 또는 저장공간을 확인해 주세요.', 'error');
        }
    });

    function showMessage(text, type) {
        if (!messageBox) {
            alert(text);
            return;
        }

        messageBox.style.display = 'block';
        messageBox.textContent = text;
        messageBox.style.padding = '15px';
        messageBox.style.borderRadius = '8px';
        messageBox.style.fontWeight = '500';

        if (type === 'success') {
            messageBox.style.backgroundColor = '#e8f5e9';
            messageBox.style.color = '#2e7d32';
            messageBox.style.border = '1px solid #a5d6a7';
        } else {
            messageBox.style.backgroundColor = '#ffebee';
            messageBox.style.color = '#c62828';
            messageBox.style.border = '1px solid #ef9a9a';
        }
    }
});
