//HTTP request Get,post,put,delete
async function Load() {
    try {
        let res = await fetch('http://localhost:3000/posts')
        let data = await res.json();
        let body = document.getElementById("table-body");
        body.innerHTML = "";
        for (const post of data) {
            let titleDisplay = post.isDeleted ? `<s>${post.title}</s>` : post.title;
            body.innerHTML += `
            <tr>
                <td>${post.id}</td>
                <td>${titleDisplay}</td>
                <td>${post.views}</td>
                <td>
                  <input value="Edit" type="button" onclick="EditPost('${post.id}')" />
                  <input value="Delete" type="button" onclick="SoftDeletePost('${post.id}')" />
                </td>
            </tr>`
        }
    } catch (error) {

    }
}
async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;
    let res;
    if (!id) {
        // Create new post: compute maxId+1 and store id as string
        let all = await fetch('http://localhost:3000/posts');
        let a = await all.json();
        let max = 0;
        for (const p of a) {
            let n = parseInt(p.id);
            if (!isNaN(n) && n > max) max = n;
        }
        let newId = (max + 1).toString();
        res = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                title: title,
                views: views,
                isDeleted: false
            })
        });
    } else {
        // Update existing post
        let getID = await fetch('http://localhost:3000/posts/' + id);
        if (getID.ok) {
            let existing = await getID.json();
            res = await fetch('http://localhost:3000/posts/' + id, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id.toString(),
                    title: title,
                    views: views,
                    isDeleted: existing.isDeleted || false
                })
            })
        } else {
            // If id provided but not found, create with given id as string
            res = await fetch('http://localhost:3000/posts', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id.toString(), title: title, views: views, isDeleted: false })
            })
        }
    }
    if (res.ok) {
        console.log("them thanh cong");
        ClearPostInputs();
        Load();
    }
}
async function Delete(id) {
    // kept for compatibility but not used; prefer SoftDeletePost
    let res = await fetch('http://localhost:3000/posts/' + id, { method: 'delete' });
    if (res.ok) console.log("xoa thanh cong");
}
async function SoftDeletePost(id) {
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true })
    });
    if (res.ok) {
        console.log('soft deleted', id);
        Load();
    }
}
async function EditPost(id) {
    let res = await fetch('http://localhost:3000/posts/' + id);
    if (res.ok) {
        let p = await res.json();
        document.getElementById('id_txt').value = p.id;
        document.getElementById('title_txt').value = p.title;
        document.getElementById('views_txt').value = p.views;
    }
}
function ClearPostInputs() {
    document.getElementById('id_txt').value = '';
    document.getElementById('title_txt').value = '';
    document.getElementById('views_txt').value = '';
}

// Comments CRUD
async function LoadComments() {
    try {
        let res = await fetch('http://localhost:3000/comments');
        let data = await res.json();
        let body = document.getElementById('comments-body');
        body.innerHTML = '';
        for (const c of data) {
            body.innerHTML += `
            <tr>
              <td>${c.id}</td>
              <td>${c.text}</td>
              <td>${c.postId}</td>
              <td>
                <input type="button" value="Edit" onclick="EditComment('${c.id}')" />
                <input type="button" value="Delete" onclick="DeleteComment('${c.id}')" />
              </td>
            </tr>`
        }
    } catch (e) {
        console.error(e);
    }
}
async function SaveComment() {
    let id = document.getElementById('comment_id_txt').value.trim();
    let text = document.getElementById('comment_text_txt').value;
    let postId = document.getElementById('comment_postid_txt').value;
    if (!id) {
        let all = await fetch('http://localhost:3000/comments');
        let a = await all.json();
        let max = 0;
        for (const c of a) {
            let n = parseInt(c.id);
            if (!isNaN(n) && n > max) max = n;
        }
        let newId = (max + 1).toString();
        let res = await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: newId, text: text, postId: postId.toString() })
        });
        if (res.ok) {
            ClearCommentInputs();
            LoadComments();
        }
    } else {
        let get = await fetch('http://localhost:3000/comments/' + id);
        if (get.ok) {
            let res = await fetch('http://localhost:3000/comments/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id.toString(), text: text, postId: postId.toString() })
            });
            if (res.ok) {
                ClearCommentInputs();
                LoadComments();
            }
        } else {
            let res = await fetch('http://localhost:3000/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id.toString(), text: text, postId: postId.toString() })
            });
            if (res.ok) {
                ClearCommentInputs();
                LoadComments();
            }
        }
    }
}
async function EditComment(id) {
    let res = await fetch('http://localhost:3000/comments/' + id);
    if (res.ok) {
        let c = await res.json();
        document.getElementById('comment_id_txt').value = c.id;
        document.getElementById('comment_text_txt').value = c.text;
        document.getElementById('comment_postid_txt').value = c.postId;
    }
}
async function DeleteComment(id) {
    let res = await fetch('http://localhost:3000/comments/' + id, { method: 'DELETE' });
    if (res.ok) {
        LoadComments();
    }
}
function ClearCommentInputs() {
    document.getElementById('comment_id_txt').value = '';
    document.getElementById('comment_text_txt').value = '';
    document.getElementById('comment_postid_txt').value = '';
}
Load();
LoadComments();
