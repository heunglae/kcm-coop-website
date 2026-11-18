// ========================================
// Main JavaScript for KCM Coop Website
// ========================================

// Navigation toggle for mobile
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navList = document.getElementById('navList');
    
    if (navToggle && navList) {
        navToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
        });
    }

    // Tab functionality
    initTabs();

    // Load news on homepage
    if (document.getElementById('noticeList') || document.getElementById('activityList')) {
        loadHomeNews();
    }
});

// Tab functionality
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById('tab-' + tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Load news for homepage
async function loadHomeNews() {
    try {
        const results = await Promise.allSettled([
            fetch('/.netlify/functions/board', { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error('공용 게시판 오류'); return (await r.json()).posts; }),
            fetch('/data/posts.json', { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error('기존 자료 오류'); return r.json(); })
        ]);
        if (results.every(r => r.status === 'rejected')) throw new Error('목록 로딩 실패');
        const all = results.flatMap(r => r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []);
        all.sort((a,b) => String(b.created_at || b.date || b.createdAt || '').localeCompare(String(a.created_at || a.date || a.createdAt || '')));
        const unique = [...new Map(all.map(p => [String(p.id), p])).values()];
        displayHomeNews('noticeList', unique.filter(p => p.category === '공지사항').slice(0,5));
        displayHomeNews('activityList', unique.filter(p => p.category === '활동소식').slice(0,5));
    } catch (error) {
        console.error('홈 소식 로딩 실패:', error);
        displayNoData('noticeList'); displayNoData('activityList');
    }
}

// Display news items on homepage
function displayHomeNews(listId, posts) {
    const list = document.getElementById(listId);
    if (!list) return;

    if (!posts || posts.length === 0) {
        list.innerHTML = '<li style="text-align: center; padding: 20px; color: #999;">등록된 게시글이 없습니다.</li>';
        return;
    }

    list.innerHTML = posts.map(post => {
        const date = new Date(post.created_at || post.date || post.createdAt).toLocaleDateString('ko-KR');
        return `
            <li>
                <a href="news.html?id=${post.id}">
                    <span class="news-title">${escapeHtml(post.title)}</span>
                    <span class="news-date">${date}</span>
                </a>
            </li>
        `;
    }).join('');
}

// Display no data message
function displayNoData(listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '<li style="text-align: center; padding: 20px; color: #999;">데이터를 불러올 수 없습니다.</li>';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text ?? "").replace(/[&<>"']/g, m => map[m]);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 300px; animation: slideIn 0.3s;';
    alertDiv.innerHTML = `
        <strong>${type === 'success' ? '성공' : type === 'warning' ? '경고' : type === 'error' ? '오류' : '알림'}</strong><br>
        ${message}
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
