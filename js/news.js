document.addEventListener('DOMContentLoaded', function () {
    const postList = document.getElementById('postList');
    if (!postList) return;

    const posts = JSON.parse(localStorage.getItem('kcm_posts') || '[]');

    if (posts.length === 0) {
        postList.innerHTML = `
            <div class="alert alert-info">
                아직 등록된 게시글이 없습니다.
            </div>
        `;
        return;
    }

    postList.innerHTML = posts.map(post => `
        <div class="post-card" style="border:1px solid #ddd; border-radius:10px; padding:20px; margin-bottom:20px; background:#fff;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
                <span style="background:#2e7d32; color:#fff; padding:4px 10px; border-radius:20px; font-size:14px;">
                    ${escapeHtml(post.category)}
                </span>
                <span style="color:#666; font-size:14px;">작성자: ${escapeHtml(post.author)}</span>
                <span style="color:#666; font-size:14px;">작성일: ${formatDate(post.createdAt)}</span>
            </div>
            <h3 style="margin-bottom:10px;">${escapeHtml(post.title)}</h3>
            <p style="white-space:pre-line; line-height:1.7; color:#333;">
                ${escapeHtml(post.content)}
            </p>
        </div>
    `).join('');

    function formatDate(dateString) {
        const date = new Date(dateString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd}`;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
