import shelve
import os
from google_images_download import google_images_download
import time
import threading


class download_image():
    def __init__(self, words, keywords, search_num, pr_bar):
        try:
            self.desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'desktop')
            os.listdir(self.desktop)
        except FileNotFoundError:
            self.desktop = '.'
        self.input_words = words
        self.input_keywords = keywords
        self.input_search_num = search_num
        self.images = dict()
        self.old_images = dict()
        self.dir_path = ''
        self.pr_bar = pr_bar


    def thread_download_image(self, word, keyword, image_num):
        self.response.download({"keywords": keyword, 'limit': image_num, "output_directory": os.path.join(self.desktop, '구글이미지'),
                       'image_directory': word})
        return

    def settings(self):
        self.words = []
        self.keywords = []
        self.search_num = []

        if '구글이미지' in os.listdir(self.desktop):
            pass
        else:
            os.mkdir(self.desktop + '\\구글이미지')
        google_dir = self.desktop + '\\구글이미지'

        self.dir_path = google_dir
        self.keyword_list = shelve.open(google_dir + "\\keyword_list", writeback=True)
        for keyword, word, image_num in zip(self.input_keywords, self.input_words, self.input_search_num):
            image_num = str(image_num)
            try:
                searched = self.keyword_list[word]
            except KeyError:
                self.keyword_list[word] = []
                searched = []
            if (keyword not in searched) or (image_num not in searched) or (not os.path.exists(google_dir + '\\' + word)) or (not os.listdir(google_dir + '\\' + word)):
                self.words.append(word)
                self.keywords.append(keyword)
                self.search_num.append(image_num)

    def download(self):
        self.settings()
        self.response = google_images_download.googleimagesdownload()
        threads = []
        try_num = 0
        if len(self.keywords) > 0:
            self.pr_bar.setMaximum(len(self.keywords))
        else:
            self.pr_bar.setMaximum(100)
            time.sleep(0.03)
            self.pr_bar.setValue(100)
        for keyword, word, image_num in zip(self.keywords, self.words, self.search_num):
            try_num += 1
            self.keyword_list[word].extend([keyword, image_num])
            print('구글에서 이미지를 다운로드 중입니다.')
            print('잠시만 기다려주세요...')
            p = threading.Thread(target=self.thread_download_image, args=(word, keyword, image_num))
            threads.append(p)
            p.start()
            if try_num % 4 == 0:
                time.sleep(4)
        progress = 1
        for thread in threads:
            thread.join()
            self.pr_bar.setValue(progress)
            progress += 1
        self.keyword_list.sync()
        self.keyword_list.close()

        for word in self.input_words:
            google_dir = self.desktop + '\구글이미지\\' + word
            google_files = os.listdir(google_dir)
            google_files.sort(key=lambda x: os.path.getmtime(google_dir + '\\' + x))
            google_files.reverse()
            if word in self.words:
                self.images[word] = [os.path.join(google_dir, google_file) for google_file in google_files]
            else:
                self.old_images[word] = [os.path.join(google_dir, google_file) for google_file in google_files]

        return [self.images, self.old_images, self.dir_path]

if __name__=='__main__':
    words = ['hello', 'world', ' stories', 'more than', 'ht']
    keywords = ['hello world', 'easy', 'stories as old as history', 'haha', 'bs']
    num = [3, 3, 3, 3, 3]
    downloader = download_image(words, keywords, num)
    word_list = downloader.download()

