import requests
from bs4 import BeautifulSoup
import re


def search_eng_meaning(word):
    req = requests.get("https://dic.daum.net/search.do?q=" + word)
    html = req.text
    soup = BeautifulSoup(html, "html.parser")

    meanings = soup.select("li > span.txt_search")
    try:
        text = meanings[0].text
        parenthesis = re.compile(r"(\s)?\(.*\)(\s)?")
        bracket = re.compile(r"(\s)?\[.*\](\s)?")
        text = re.sub(parenthesis, "", text)
        text = re.sub(bracket, "", text)
    except IndexError:
        text = ""

    return text
