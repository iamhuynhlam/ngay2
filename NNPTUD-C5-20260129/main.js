// Load posts from a GitHub raw db.json and render with search & sorting
const DATA_URL = '';
// Example: set DATA_URL to
// 'https://raw.githubusercontent.com/<USER>/<REPO>/main/db.json'

let posts = [];
let comments = [];
let filtered = [];
let nameAsc = true;
let viewsAsc = true;

async function Load() {
    try {
        const url = DATA_URL || 'db.json';
        const res = await fetch(url);
        const data = await res.json();
        posts = (data.posts || []).map(p => ({ ...p }));
        comments = (data.comments || []).map(c => ({ ...c }));
        filtered = posts.slice();
        attachControls();
        renderTable(filtered);
    } catch (error) {
        console.error('Load error', error);
    }
}

function renderTable(list) {
    const body = document.getElementById('table-body');
    body.innerHTML = '';
    for (const p of list) {
        const views = Number(p.views) || 0;
        const tr = document.createElement('tr');
        tr.className = p.isDeleted ? 'deleted' : '';
        tr.innerHTML = `
            <td>${p.id ?? ''}</td>
            <td>${p.title ?? ''}</td>
            <td>${views}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editPost('${p.id}')">Sửa</button>
                <button class="btn btn-sm btn-danger me-1" onclick="softDelete('${p.id}')">Xóa mềm</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="toggleComments('${p.id}', this)">Bình luận</button>
            </td>
        `;
        body.appendChild(tr);

        // comments placeholder row (hidden initially)
        const cTr = document.createElement('tr');
        cTr.className = 'comments-row';
        cTr.style.display = 'none';
        cTr.innerHTML = `<td colspan="4"><div id="comments-for-${p.id}"></div></td>`;
        body.appendChild(cTr);
    }
}

function attachControls() {
    const search = document.getElementById('search-input');
    if (search && !search.dataset.bound) {
        search.addEventListener('input', onSearchChanged);
        search.dataset.bound = '1';
    }
    const sName = document.getElementById('sort-name');
    const sViews = document.getElementById('sort-views');
    if (sName && !sName.dataset.bound) {
        sName.addEventListener('click', () => sortByName());
        sName.dataset.bound = '1';
    }
    if (sViews && !sViews.dataset.bound) {
        sViews.addEventListener('click', () => sortByViews());
        sViews.dataset.bound = '1';
    }

    // form
    const form = document.getElementById('post-form');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', (e) => { e.preventDefault(); savePost(); });
        form.dataset.bound = '1';
    }
}

function onSearchChanged(e) {
    const q = e.target.value.trim().toLowerCase();
    filtered = posts.filter(p => (p.title || '').toLowerCase().includes(q));
    renderTable(filtered);
}

function sortByName() {
    filtered.sort((a, b) => {
        const A = (a.title || '').toLowerCase();
        const B = (b.title || '').toLowerCase();
        if (A < B) return nameAsc ? -1 : 1;
        if (A > B) return nameAsc ? 1 : -1;
        return 0;
    });
    nameAsc = !nameAsc;
    document.getElementById('sort-name').innerText = `Tên ${nameAsc ? '↑' : '↓'}`;
    renderTable(filtered);
}

function sortByViews() {
    filtered.sort((a, b) => {
        const A = Number(a.views) || 0;
        const B = Number(b.views) || 0;
        return viewsAsc ? A - B : B - A;
    });
    viewsAsc = !viewsAsc;
    document.getElementById('sort-views').innerText = `Giá ${viewsAsc ? '↑' : '↓'}`;
    renderTable(filtered);
}

function softDelete(id) {
    const idx = posts.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
        posts[idx].isDeleted = true;
        // reflect in filtered
        const fidx = filtered.findIndex(p => String(p.id) === String(id));
        if (fidx !== -1) filtered[fidx].isDeleted = true;
        renderTable(filtered);
    }
}

function editPost(id) {
    const p = posts.find(x => String(x.id) === String(id));
    if (!p) return;
    document.getElementById('post-id').value = p.id;
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-views').value = p.views;
}

function resetForm() {
    document.getElementById('post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-views').value = '';
}

function savePost() {
    const idField = document.getElementById('post-id');
    const title = document.getElementById('post-title').value.trim();
    const views = Number(document.getElementById('post-views').value) || 0;
    const idVal = idField.value.trim();
    if (idVal) {
        // update
        const p = posts.find(x => String(x.id) === String(idVal));
        if (p) {
            p.title = title;
            p.views = String(views);
            // update filtered copy
            const fp = filtered.find(x => String(x.id) === String(idVal));
            if (fp) {
                fp.title = title;
                fp.views = String(views);
            }
        }
    } else {
        // create: id auto = maxId + 1 (as string)
        const maxId = posts.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
        const newId = String(maxId + 1);
        const newPost = { id: newId, title: title, views: String(views) };
        posts.push(newPost);
        filtered.push(newPost);
    }
    resetForm();
    renderTable(filtered);
}

// --- Comments CRUD (in-memory) ---
function toggleComments(postId, btn) {
    // find the next sibling row after the post row
    const tr = btn.closest('tr');
    const commentsRow = tr.nextElementSibling;
    if (!commentsRow || !commentsRow.classList.contains('comments-row')) return;
    const container = commentsRow.querySelector(`#comments-for-${postId}`);
    if (commentsRow.style.display === 'none' || !commentsRow.style.display) {
        renderCommentsFor(postId, container);
        commentsRow.style.display = '';
        btn.innerText = 'Đóng bình luận';
    } else {
        commentsRow.style.display = 'none';
        btn.innerText = 'Bình luận';
    }
}

function renderCommentsFor(postId, container) {
    const list = comments.filter(c => String(c.postId) === String(postId));
    container.innerHTML = `
        <div>
            <h6>Bình luận (${list.length})</h6>
            <div id="comments-list-${postId}"></div>
            <div class="mt-2">
                <input id="new-comment-${postId}" class="form-control" placeholder="Nội dung bình luận" />
                <button class="btn btn-sm btn-primary mt-2" onclick="addComment('${postId}')">Thêm bình luận</button>
            </div>
        </div>
    `;
    const listContainer = container.querySelector(`#comments-list-${postId}`);
    for (const c of list) {
        const row = document.createElement('div');
        row.className = 'd-flex gap-2 align-items-start mb-2';
        row.innerHTML = `
            <div class="flex-grow-1">${c.text}</div>
            <div>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editCommentPrompt('${c.id}','${postId}')">Sửa</button>
                <button class="btn btn-sm btn-danger" onclick="deleteComment('${c.id}','${postId}')">Xóa</button>
            </div>
        `;
        listContainer.appendChild(row);
    }
}

function addComment(postId) {
    const inp = document.getElementById(`new-comment-${postId}`);
    const text = inp.value.trim();
    if (!text) return;
    const maxId = comments.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
    const newId = String(maxId + 1);
    const c = { id: newId, text: text, postId: String(postId) };
    comments.push(c);
    inp.value = '';
    const container = document.getElementById(`comments-for-${postId}`);
    renderCommentsFor(postId, container);
}

function editCommentPrompt(commentId, postId) {
    const c = comments.find(x => String(x.id) === String(commentId));
    if (!c) return;
    const newText = prompt('Sửa bình luận:', c.text);
    if (newText === null) return;
    c.text = newText.trim();
    const container = document.getElementById(`comments-for-${postId}`);
    renderCommentsFor(postId, container);
}

function deleteComment(commentId, postId) {
    comments = comments.filter(x => String(x.id) !== String(commentId));
    const container = document.getElementById(`comments-for-${postId}`);
    renderCommentsFor(postId, container);
}

// expose functions for inline onclick handlers
window.softDelete = softDelete;
window.editPost = editPost;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.editCommentPrompt = editCommentPrompt;
window.deleteComment = deleteComment;

Load();
