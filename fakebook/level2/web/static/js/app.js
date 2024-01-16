async function list_posts() {
    let url = "/post.php?action=list_posts";
    let response = await fetch(url);
    return await response.json()
}

async function read_post(post_id) {
    let url = `/post.php?action=read&id=${post_id}`;
    let response = await fetch(url);
    return await response.json()
}

function main() {
    const RATE_LIMIT = 5;
    list_posts().then(function (posts) {
        let wall = document.getElementById("wall");
        let i = 0;
        let get_posts = setInterval(function() {
            if (i < posts.length) {
                const fetch_list = posts.slice(i, i + RATE_LIMIT);
                fetch_list.forEach(async function (post) {
                    let p = document.createElement("p");
                    if (post.public == "1") {
                        await read_post(post.post_id).then(function (post_data) {
                            p.innerText = "🌐 " + post_data["content"];
                        })
                    } else {
                        await read_post(post.post_id).then(function (post_data) {
                        p.innerText = "🔒 " + post_data["content"];
                        })
                    }
                    wall.appendChild(p);
                })
                i += RATE_LIMIT;
            }
            else {
                clearInterval(get_posts);
            }
        }, 200);
    });
}

main();