var user_id = new URL(location.href).searchParams.get('user_id');

async function list_posts() {
    var url = "/post.php?action=list_posts" + (user_id ? `&user_id=${user_id}` : "");
    var response = await fetch(url);
    return await response.json()
}

async function read_post(post_id) {
    var url = `/post.php?action=read&id=${post_id}`;
    var response = await fetch(url);
    return await response.json()
}

async function list_notifications() {
    var url = "/post.php?action=list_notifications";
    var response = await fetch(url);
    return await response.json()
}

async function push_noti(message) {
    var url = "/system_notification.php";
    const data = new URLSearchParams();
    data.append("content", message);
    var response = await fetch(url, {
        body: data,
        method: "POST"
    });
    console.log(await response);
}

function main() {
    if (user_id) {
        try {
            document.getElementById("div-create-post").style.display = "none";
            document.getElementById("div-form-create-post").style.display = "none";
            document.getElementById("div-online").style.display = "none";    
        } catch (e) {}
    }
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
                        if (location.href.includes("user_id")) {
                            p.innerHTML = "🔒 <i>You don't have permission to view this content</i>";
                        } else {
                            await read_post(post.post_id).then(function (post_data) {
                                p.innerText = "🔒 " + post_data["content"];
                            })    
                        }
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

    list_notifications().then(function (notifications) {
        var notifications_feed = document.getElementById("notifications_feed");
        notifications.forEach(function (notification) {
            var p = document.createElement("p");
            p.innerHTML = "🔔 " + notification["content"];
            notifications_feed.appendChild(p);
        })
    });
}

main();