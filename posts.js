// ========================================
// Posts List JavaScript
// ========================================

let currentPage = 1;
let currentCategory = '';
let currentSearchTerm = '';
const postsPerPage = 10;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const postId = urlParams.get('id');
    
    if (postId) {
        // View single post
        viewPost(postId);
    } else {
        // Set active tab if specified
        if (tab) {
            const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
            if (tabBtn) {
                tabBtn.click();
            }
        }
        
        // Initialize tab buttons
        initCategoryTabs();
        
        // Load posts
        loadPosts();
    }
});

// Initialize category tabs
function initCategoryTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Reset page and load posts
            currentPage = 1;
            currentCategory = category;
            loadPosts();
        });
    });
}

// Load posts from API
async function loadPosts() {
    const tbody = document.getElementById('postsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">데이터를 불러오는 중...</td></tr>';
    
    try {
        let url = `tables/posts?page=${currentPage}&limit=${postsPerPage}&status=approved&sort=-created_at`;
        
        if (currentCategory) {
            url += `&category=${encodeURIComponent(currentCategory)}`;
        }
        
        if (currentSearchTerm) {
            url += `&search=${encodeURIComponent(currentSearchTerm)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to load posts');
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            displayPosts(data.data, data.total);
            displayPagination(data.total);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">등록된 게시글이 없습니다.</td></tr>';
            document.getElementById('pagination').innerHTML = '';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #f44336;">데이터를 불러올 수 없습니다.</td></tr>';
    }
}

// Display posts in table
function displayPosts(posts, total) {
    const tbody = document.getElementById('postsBody');
    if (!tbody) return;
    
    tbody.innerHTML = posts.map((post, index) => {
        const number = total - ((currentPage - 1) * postsPerPage) - index;
        const date = new Date(post.created_at).toLocaleDateString('ko-KR');
        
        return `
            <tr onclick="viewPost('${post.id}')" style="cursor: pointer;">
                <td style="text-align: center;">${number}</td>
                <td style="text-align: center;"><span style="color: #4CAF50; font-weight: 500;">${escapeHtml(post.category)}</span></td>
                <td>${escapeHtml(post.title)}</td>
                <td style="text-align: center;">${escapeHtml(post.author)}</td>
                <td style="text-align: center;">${post.views || 0}</td>
                <td style="text-align: center;">${date}</td>
            </tr>
        `;
    }).join('');
}

// Display pagination
function displayPagination(total) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(total / postsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
    
    // Previous button
    if (currentPage > 1) {
        html += `<button class="btn btn-outline" onclick="changePage(${currentPage - 1})">이전</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'btn-primary' : 'btn-outline';
        html += `<button class="btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<button class="btn btn-outline" onclick="changePage(${currentPage + 1})">다음</button>`;
    }
    
    html += '</div>';
    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Search posts
function searchPosts() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1;
        loadPosts();
    }
}

// View single post
async function viewPost(postId) {
    try {
        // Increment view count
        const viewResponse = await fetch(`tables/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ views: 1 }) // This will increment
        });
        
        // Get post data
        const response = await fetch(`tables/posts/${postId}`);
        
        if (!response.ok) {
            throw new Error('Post not found');
        }
        
        const post = await response.json();
        
        // Display post in modal or navigate to detail page
        displayPostDetail(post);
    } catch (error) {
        console.error('Error loading post:', error);
        alert('게시글을 불러올 수 없습니다.');
    }
}

// Display post detail
function displayPostDetail(post) {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const date = new Date(post.created_at).toLocaleString('ko-KR');
    
    container.innerHTML = `
        <div class="content-box">
            <div style="margin-bottom: 30px;">
                <span style="display: inline-block; padding: 5px 15px; background: #4CAF50; color: white; border-radius: 20px; font-size: 0.9rem; margin-bottom: 15px;">
                    ${escapeHtml(post.category)}
                </span>
                <h2 style="margin: 15px 0;">${escapeHtml(post.title)}</h2>
                <div style="color: #999; font-size: 0.9rem; padding: 15px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; display: flex; gap: 20px; flex-wrap: wrap;">
                    <span><i class="fas fa-user"></i> ${escapeHtml(post.author)}</span>
                    <span><i class="fas fa-clock"></i> ${date}</span>
                    <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
                </div>
            </div>
            
            <div style="min-height: 300px; line-height: 1.8; padding: 30px 0;">
                ${escapeHtml(post.content).replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 50px; text-align: center; padding-top: 30px; border-top: 2px solid #e0e0e0;">
                <a href="news.html" class="btn btn-outline">
                    <i class="fas fa-list"></i> 목록으로
                </a>
            </div>
        </div>
    `;
}

// Escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
