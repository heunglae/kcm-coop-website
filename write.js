// ========================================
// Write Post JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('writeForm');
    
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value;
    const author = document.getElementById('author').value.trim();
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    
    // Validation
    if (!category) {
        alert('카테고리를 선택해 주세요.');
        document.getElementById('category').focus();
        return;
    }
    
    if (!author) {
        alert('작성자 이름을 입력해 주세요.');
        document.getElementById('author').focus();
        return;
    }
    
    if (!title) {
        alert('제목을 입력해 주세요.');
        document.getElementById('title').focus();
        return;
    }
    
    if (!content) {
        alert('내용을 입력해 주세요.');
        document.getElementById('content').focus();
        return;
    }
    
    // Prepare post data
    const postData = {
        category: category,
        author: author,
        title: title,
        content: content,
        status: 'pending', // Will be approved by admin
        views: 0,
        created_at: new Date().toISOString()
    };
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 작성 중...';
    
    try {
        const response = await fetch('tables/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        
        const result = await response.json();
        
        // Show success message
        showSuccessModal();
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        console.error('Error creating post:', error);
        alert('게시글 작성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Show success modal
function showSuccessModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
            <div style="font-size: 3rem; color: #4CAF50; margin-bottom: 20px;">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 style="margin-bottom: 15px; color: #333;">작성 완료!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                게시글이 성공적으로 작성되었습니다.<br>
                관리자 승인 후 게시판에 공개됩니다.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="location.href='news.html'" class="btn btn-primary">
                    <i class="fas fa-list"></i> 목록으로
                </button>
                <button onclick="location.href='write.html'" class="btn btn-outline">
                    <i class="fas fa-pen"></i> 계속 작성
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Character counter (optional feature)
function addCharacterCounter() {
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    
    if (titleInput) {
        const titleCounter = document.createElement('div');
        titleCounter.style.cssText = 'text-align: right; color: #999; font-size: 0.85rem; margin-top: 5px;';
        titleInput.parentElement.appendChild(titleCounter);
        
        titleInput.addEventListener('input', function() {
            const length = this.value.length;
            const maxLength = 100;
            titleCounter.textContent = `${length} / ${maxLength}`;
            
            if (length > maxLength) {
                titleCounter.style.color = '#f44336';
            } else {
                titleCounter.style.color = '#999';
            }
        });
    }
    
    if (contentInput) {
        const contentCounter = document.createElement('div');
        contentCounter.style.cssText = 'text-align: right; color: #999; font-size: 0.85rem; margin-top: 5px;';
        contentInput.parentElement.appendChild(contentCounter);
        
        contentInput.addEventListener('input', function() {
            const length = this.value.length;
            const maxLength = 5000;
            contentCounter.textContent = `${length} / ${maxLength}`;
            
            if (length > maxLength) {
                contentCounter.style.color = '#f44336';
            } else {
                contentCounter.style.color = '#999';
            }
        });
    }
}

// Initialize character counter on load
document.addEventListener('DOMContentLoaded', addCharacterCounter);
