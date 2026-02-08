// Static data version for js/posts.js
// Replace API calls with static data

const STATIC_POSTS = [
  {
    id: '1',
    title: '2025년 제13차 정기총회 개최 안내',
    content: '안녕하세요, 조합원 여러분!\n\n2025년 제13차 정기총회를 다음과 같이 개최하고자 하오니...',
    author: '사무국',
    category: '공지사항',
    status: 'approved',
    views: 125,
    created_at: '2025-02-01T10:30:00'
  },
  {
    id: '2',
    title: '봄 교육프로그램 운영 결과 보고',
    content: '2025년 1분기 봄 교육프로그램이 성황리에 마무리되었습니다...',
    author: '교육팀',
    category: '활동소식',
    status: 'approved',
    views: 87,
    created_at: '2025-01-25T14:20:00'
  },
  // ... more posts
];

// Replace loadPosts() function
function loadPosts() {
  const tbody = document.getElementById('postsBody');
  if (!tbody) return;
  
  const filteredPosts = STATIC_POSTS.filter(post => {
    if (currentCategory && post.category !== currentCategory) return false;
    if (currentSearchTerm && !post.title.includes(currentSearchTerm)) return false;
    return post.status === 'approved';
  });
  
  const total = filteredPosts.length;
  const start = (currentPage - 1) * postsPerPage;
  const pagePosts = filteredPosts.slice(start, start + postsPerPage);
  
  if (pagePosts.length > 0) {
    displayPosts(pagePosts, total);
    displayPagination(total);
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">등록된 게시글이 없습니다.</td></tr>';
  }
}

// Disable write functionality
// Remove write.html link or show "Coming soon" message
