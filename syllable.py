from bs4 import BeautifulSoup
import requests

def get_syllable_divided(word):
    req = requests.get('http://www.syllablecount.com/syllables/' + word)
    html = req.text
    soup = BeautifulSoup(html, 'html.parser')
    syllable_divided = soup.select('#ctl00_ContentPane_paragraphtext2 > b')
    return syllable_divided[0].text if syllable_divided else word