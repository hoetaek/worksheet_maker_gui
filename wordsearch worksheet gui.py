import sys
import os
import re
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QProgressBar, QLabel,
                             QTreeWidget, QTreeWidgetItem, QTreeWidgetItemIterator, QLineEdit,
                             QPlainTextEdit, QSpinBox, QGridLayout, QHBoxLayout, QVBoxLayout,
                             QPushButton, QDesktopWidget, QMessageBox, QGroupBox, QRadioButton,
                             QCheckBox, QFileDialog)
from PyQt5.QtGui import QPixmap, QIcon
from PyQt5.QtCore import QObject, pyqtSignal, Qt, QEvent, QThreadPool, pyqtSlot, QRunnable
import download_images
import wordsearch_generater
from shutil import copy
import qdarkstyle

try:
    import httplib
except:
    import http.client as httplib

class Communication(QObject):
    # signal for puzzle settings
    puzzle_setting = pyqtSignal(list)
    # activate, enable, disable Set Keyword Button
    press_set_keyword_bt = pyqtSignal()
    disable_set_keyword_bt = pyqtSignal()
    enable_set_keyword_bt = pyqtSignal()
    # emits if entered words are korean
    korean = pyqtSignal(bool)
    # signal to pass word, keyword data to DownloadImage widget
    set_keyword = pyqtSignal(list)
    # siganl to notify that downloading images is complete and to proceed the following
    download_complete = pyqtSignal(list)
    # siganl to notify that making wordsearch puzzle is complete and to proceed the following
    puzzle_complete = pyqtSignal()

    recursionerrormsg = pyqtSignal()

class Settings(QWidget):
    def __init__(self, c):
        super().__init__()
        self.c = c
        self.puzzle_width = 15
        self.puzzle_height = 15
        self.diff = '가로세로'
        self.diff_val = 1
        self.option = '겹치지 않도록'
        self.option_val = 0
        self.init_UI()

    def init_UI(self):
        # TODO 구글 이미지 폴더 저장할 경로 구하기
        self.label_puzzle_width = QLabel('가로 길이: ')
        self.width_spin = QSpinBox()
        self.width_spin.setValue(15)

        self.label_puzzle_height = QLabel('세로 길이: ')
        self.height_spin = QSpinBox()
        self.height_spin.setValue(15)
        self.height_spin.valueChanged.connect(self.puzzle_height_change)

        # layout width
        hbox_width = QHBoxLayout()
        hbox_width.addWidget(self.label_puzzle_width)
        hbox_width.addWidget(self.width_spin)
        self.width_spin.valueChanged.connect(self.puzzle_width_change)

        # layout height
        hbox_height = QHBoxLayout()
        hbox_height.addWidget(self.label_puzzle_height)
        hbox_height.addWidget(self.height_spin)

        # layout for width, height
        vbox_size = QVBoxLayout()
        vbox_size.addLayout(hbox_width)
        vbox_size.addLayout(hbox_height)

        # layout for diplay
        hbox_size = QHBoxLayout()
        hbox_size.addLayout(vbox_size)
        hbox_size.addStretch(1)


        self.label_explain = QLabel("난이도 : 글자 방향은 <font color='yellow'>가로세로</font>, 채워지는 글자는 되도록  <font color='yellow'>겹치지 않도록</font> 설정합니다.")

        grp_difficulty = QGroupBox("난이도")
        diff_1 = QRadioButton("난이도 1")
        diff_1.setChecked(True)
        diff_2 = QRadioButton("난이도 2")
        diff_3 = QRadioButton("난이도 3")
        diff_4 = QRadioButton("난이도 4")
        diff_5 = QRadioButton("난이도 5")
        diff_1.clicked.connect(lambda: self.diff_checked(diff_1))
        diff_2.clicked.connect(lambda: self.diff_checked(diff_2))
        diff_3.clicked.connect(lambda: self.diff_checked(diff_3))
        diff_4.clicked.connect(lambda: self.diff_checked(diff_4))
        diff_5.clicked.connect(lambda: self.diff_checked(diff_5))
        # layout difficulty
        grp_difficulty_layout = QHBoxLayout()
        grp_difficulty_layout.addWidget(diff_1)
        grp_difficulty_layout.addWidget(diff_2)
        grp_difficulty_layout.addWidget(diff_3)
        grp_difficulty_layout.addWidget(diff_4)
        grp_difficulty_layout.addWidget(diff_5)

        grp_difficulty.setLayout(grp_difficulty_layout)

        grp_option = QGroupBox("옵션")
        option_1 = QRadioButton("글자 겹치지 않게")
        option_1.setChecked(True)
        option_2 = QRadioButton("글자 무작위로")
        option_3 = QRadioButton("글자 겹치게")
        option_1.clicked.connect(lambda: self.option_checked(option_1))
        option_2.clicked.connect(lambda: self.option_checked(option_2))
        option_3.clicked.connect(lambda: self.option_checked(option_3))
        # layout option
        grp_option_layout = QHBoxLayout()
        hbox1 = QHBoxLayout()
        hbox1.setAlignment(Qt.AlignHCenter)
        hbox1.addWidget(option_1)
        hbox2 = QHBoxLayout()
        hbox2.setAlignment(Qt.AlignHCenter)
        hbox2.addWidget(option_2)
        hbox3 = QHBoxLayout()
        hbox3.setAlignment(Qt.AlignHCenter)
        hbox3.addWidget(option_3)
        grp_option_layout.addLayout(hbox1)
        grp_option_layout.addLayout(hbox2)
        grp_option_layout.addLayout(hbox3)
        # grp_option_layout.addWidget(option_1)
        # grp_option_layout.addWidget(option_2)
        # grp_option_layout.addWidget(option_3)


        grp_option.setLayout(grp_option_layout)

        vbox = QVBoxLayout()
        vbox.addLayout(hbox_size)
        vbox.addWidget(self.label_explain)
        vbox.addWidget(grp_difficulty)
        vbox.addWidget(grp_option)
        self.setLayout(vbox)
        self.show()

    def puzzle_width_change(self, value):
        self.puzzle_width = value
        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])

    def puzzle_height_change(self, value):
        self.puzzle_height = value
        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])

    def diff_checked(self, diff):
        text = diff.text()
        if text == '난이도 1':
            self.diff = "가로세로"
            self.diff_val = 1
        elif text == '난이도 2':
            self.diff = "가로세로, 가로세로 거꾸로"
            self.diff_val = 2
        elif text == '난이도 3':
            self.diff = "가로세로 그리고 대각선"
            self.diff_val = 3
        elif text == '난이도 4':
            self.diff = "가로세로, 가로세로 거꾸로 그리고 대각선"
            self.diff_val = 4
        elif text == '난이도 5':
            self.diff = "가로세로, 가로세로 거꾸로 그리고 대각선, 대각선 거꾸로"
            self.diff_val = 5
        self.set_explain_label()

    def option_checked(self, option):
        text = option.text()
        if text == '글자 겹치지 않게':
            self.option = "겹치지 않도록"
            self.option_val = 0
        elif text == '글자 무작위로':
            self.option = "무작위로"
            self.option_val = 1
        elif text == '글자 겹치게':
            self.option = "겹치도록"
            self.option_val = 2

        self.set_explain_label()

    def set_explain_label(self):
        self.label_explain.setText("난이도 : 글자 방향은 <font color='yellow'>{}</font>, 채워지는 글자는 되도록 <font color='yellow'>{}</font> 설정합니다.".format(self.diff, self.option))
        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])


class EnterWords(QWidget):
    def __init__(self, c):
        super().__init__()
        self.words = []
        self.keywords = []
        self.c = c
        self.init_UI()

    def init_UI(self):
        grid = QGridLayout()

        # Text box to input words
        self.input_words = QPlainTextEdit()
        self.input_words.setPlaceholderText("단어를 입력한 후 *검색 키워드 설정* 버튼을 누르세요.")
        #TODO if the text is all filled tooltip box appears saying press the button!
        grid.addWidget(self.input_words, 1, 0, 4, 1)

        # line edit box to set the suffix words
        self.line_suffix = QLineEdit()
        self.line_suffix.setPlaceholderText('예시: png')
        self.line_suffix.resize(self.line_suffix.sizeHint())
        # add line edit widget to layout
        grid.addWidget(self.line_suffix, 3, 1)

        # make button
        self.set_keyword_bt = QPushButton('검색 키워드 설정')
        # settings for Set Keyword Button
        self.set_keyword_bt.clicked.connect(self.set_keyword)
        self.c.press_set_keyword_bt.connect(self.set_keyword)
        self.c.disable_set_keyword_bt.connect(self.disable_set_keyword_bt)
        self.c.enable_set_keyword_bt.connect(self.enable_set_keyword_bt)
        # add button widget to layout
        grid.addWidget(self.set_keyword_bt, 4, 1)

        # adjust the size of the column layout
        grid.setColumnStretch(0, 13)
        grid.setColumnStretch(1, 2)
        self.setLayout(grid)
        self.show()

    def set_words(self):
        search_target = self.input_words.toPlainText()
        regex = r'[a-zA-Z]+'
        self.words = list({word.lower() if word.isalpha() else word for word in re.findall(regex, search_target)})
        if not self.words:
            regex = r'[가-힣]+'
            self.words = list({word.lower() if word.isalpha() else word for word in re.findall(regex, search_target)})
            self.c.korean.emit(True)
        else:
            self.c.korean.emit(False)

    def set_keyword(self):
        self.set_words()
        self.input_words.setPlainText(', '.join(self.words))
        self.keywords = [word + ' ' + self.line_suffix.text() for word in self.words]
        self.c.set_keyword.emit([self.words, self.keywords])

    def disable_set_keyword_bt(self):
        self.set_keyword_bt.setEnabled(False)

    def enable_set_keyword_bt(self):
        self.set_keyword_bt.setEnabled(True)

    def keyPressEvent(self, e):
        if e.key() == Qt.Key_Return:
            self.set_keyword()



class DownloadImage(QWidget):
    def __init__(self, c):
        super().__init__()
        self.c = c
        self.init_UI()
        self.threadpool = QThreadPool()
        # initial puzzle settings
        self.width, self.height, self.diff, self.option = 15, 15, 1, 0
        # variables to add to tree widget
        self.words = []
        self.keywords = []
        self.search_num = 0
        # initialize download numbers
        self.picture_on = False
        # initialize language mode
        self.korean = False
        # initialize language mode
        self.chosung = False
        # size of the images
        self.scale_num = MainWindow.y//10

    def init_UI(self):
        # get data of puzzle settings
        self.c.puzzle_setting.connect(self.puzzle_setting)
        # see if its korean or english/ default is english
        self.c.korean.connect(self.korean_on)
        # get the data from Enterwords
        self.c.set_keyword.connect(self.search_setting)
        # basic layout for download widget
        grid = QGridLayout()

        # tree widget to show word, keyword, search_num and downloaded images
        self.tree = QTreeWidget()
        # to make UX make add keyboard events
        self.tree.installEventFilter(self)
        # add tree widget to layout
        grid.addWidget(self.tree, 0, 0)
        # settings for tree widget
        header = QTreeWidgetItem(["단어", "키워드", '검색 개수', "이미지", ''])
        self.tree.setHeaderItem(header)
        self.tree.itemPressed.connect(self.changePic)


        # label, button widget to set the number of search_num, update from the image folder and download the images depending on the tree widget
        label_search = QLabel('전체 검색 개수')
        self.every_search_num = QSpinBox()
        self.every_search_num.setValue(3)
        self.every_search_num.valueChanged.connect(self.change_every_search)

        self.download_bt = QPushButton("이미지 다운로드")
        self.download_bt.clicked.connect(self.start_download)
        # TODO shortcut for button
        # TODO status_bar for shortcut explaination

        # add label, update, download button widget to the vertical layout box(vbox)
        vbox = QVBoxLayout()
        vbox.addWidget(label_search)
        vbox.addWidget(self.every_search_num)
        # stretch is needed to make gui better
        vbox.addStretch(1)
        vbox.addWidget(self.download_bt)
        # add vbox to the layout
        grid.addLayout(vbox, 0, 1)

        # shows the progress of image download
        self.pr_bar = QProgressBar()
        # add progressbar to layout
        grid.addWidget(self.pr_bar, 1, 0, 1, 2)

        self.chosung_checkBox = QCheckBox("초성", self)
        self.chosung_checkBox.close()
        self.chosung_checkBox.stateChanged.connect(self.chosung_on)

        self.make_puzzle_bt = QPushButton("Word Search 퍼즐 만들기")
        self.make_puzzle_bt.clicked.connect(self.make_puzzle)

        hbox_puzzle_bt = QHBoxLayout()
        hbox_puzzle_bt.addStretch(1)
        hbox_puzzle_bt.addWidget(self.chosung_checkBox)
        hbox_puzzle_bt.addWidget(self.make_puzzle_bt)
        grid.addLayout(hbox_puzzle_bt, 2, 0, 1, 2)

        # adjust the size of the column layout
        grid.setColumnStretch(0, 13)
        grid.setColumnStretch(1, 2)
        self.setLayout(grid)

    # self.eventFilter, self.changePic is for the basic behavior of Tree widget
    # it uses the keypress event to make UX better
    def eventFilter(self, source, event):
        if event.type() == QEvent.KeyPress:
            if event.key() == Qt.Key_Return:
                item = self.tree.selectedItems()[0]
                if item.parent():
                    file = item.data(3, 1)
                    item.parent().setData(3, 1, file.scaled(self.scale_num, self.scale_num))
                    item.parent().path = item.path
                    item.parent().setExpanded(False)
                    self.tree.setCurrentItem(item.parent())
                elif item.childCount() > 0:
                    if item.isExpanded() == True:
                        item.setExpanded(False)
                    else:
                        item.setExpanded(True)

            if event.key() == Qt.Key_Delete or event.key() == Qt.Key_Backspace:
                item = self.tree.selectedItems()[0]
                if item.parent():
                    if item.parent().childCount() > 1:
                        path = item.path
                        item.parent().removeChild(item)
                        del item
                        if os.path.exists(path):
                            os.unlink(path)
        return super(DownloadImage, self).eventFilter(source, event)

    # When you press a tree item(mouse click) the main image changes
    def changePic(self, item):
        if item.parent():
            file = QPixmap(item.path)
            item.parent().setData(3, 1, file.scaled(self.scale_num, self.scale_num))
            # top item's path variable contains the image path
            item.parent().path = item.path

    # define puzzle settings
    def puzzle_setting(self, puzzle_setting):
        self.width, self.height, self.diff, self.option = puzzle_setting[0], puzzle_setting[1], puzzle_setting[2], puzzle_setting[3]

    def korean_on(self, bool):
        self.korean = bool
        if bool == True:
            self.chosung_checkBox.show()
            self.make_puzzle_bt.setText('낱말 찾기 퍼즐 만들기')
        else:
            self.chosung_checkBox.close()
            self.make_puzzle_bt.setText('Word Search 퍼즐 만들기')


    def chosung_on(self):
        if self.chosung_checkBox.isChecked() == True:
            self.chosung = True
        else:
            self.chosung = False

    # add items to top level of tree widget
    def search_setting(self, search_list):
        # clears all the items from tree widget to add new items
        self.tree.clear()
        # initialize download numbers
        self.picture_on = False

        # get the data from enterword widget
        self.search_list = search_list
        for word, keyword in zip(search_list[0], search_list[1]):
            # make item
            item = QTreeWidgetItem([word, keyword])
            # 2 is the index column, 0 is the type of data, and the last parameter is the data
            item.setData(2, 0, self.every_search_num.value())
            # add the items to top level within tree widget
            self.tree.addTopLevelItem(item)
            item.setFlags(Qt.ItemIsSelectable |Qt.ItemIsEnabled | Qt.ItemIsEditable)

    # when you change the spin box you change all of the search_num
    def change_every_search(self, value):
        for it_idx in range(self.tree.topLevelItemCount()):
            self.tree.topLevelItem(it_idx).setData(2, 0, value)

    def enable_buttons(self):
        self.download_bt.setEnabled(True)
        self.make_puzzle_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

    def disable_buttons(self):
        self.download_bt.setEnabled(False)
        self.make_puzzle_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

    def have_internet(self):
        conn = httplib.HTTPConnection("www.naver.com", timeout=5)
        try:
            conn.request("HEAD", "/")
            conn.close()
            return True
        except:
            conn.close()
            return False

    def start_download(self):
        # disable the buttons
        self.disable_buttons()

        # if no keywords exist enable buttons and press Set Keyword Button
        if self.tree.topLevelItemCount() == 0:
            self.enable_buttons()

            self.c.press_set_keyword_bt.emit()

            q = QMessageBox(self)
            q.information(self, 'information', '검색어 키워드가 존재하지 않아요. 그래서 검색어 키워드 버튼을 대신 눌렀습니다~.', QMessageBox.Ok)
            return

        # initiate progress bar
        self.pr_bar.setValue(0)

        # the data to be passed to downloader
        words = []
        keywords = []
        search_num = []
        for it_idx in range(self.tree.topLevelItemCount()):
            words.append(self.tree.topLevelItem(it_idx).text(0))
            keywords.append(self.tree.topLevelItem(it_idx).text(1))
            search_num.append(self.tree.topLevelItem(it_idx).text(2))

        download_worker = DownloadWorker(download_images.download_image, words, keywords, search_num, self.pr_bar)
        download_worker.signal.download_complete.connect(self.finish_download)

        if self.have_internet():
            # Execute
            self.threadpool.start(download_worker)
        else:
            q = QMessageBox(self)
            q.information(self, 'information', '인터넷 연결이 끊겼습니다.', QMessageBox.Ok)
            self.enable_buttons()


    # execute when download is finished
    def finish_download(self, word_imagePath):
        # word_imagePath is for new downloaded words and old_word_imagePath is for updating already downloaded words
        self.word_imagePath = word_imagePath[0]
        self.old_word_imagePath = word_imagePath[1]

        # combine word_imagePath and old_word_imagePath to update the images only on first download
        if self.picture_on == False:
            self.word_imagePath.update(self.old_word_imagePath)

        # go through top level items
        for it_idx in range(self.tree.topLevelItemCount()):
            item = self.tree.topLevelItem(it_idx)
            try:
                pic_path = self.word_imagePath[self.tree.topLevelItem(it_idx).text(0)]
                # if the word exists in the given image path clear the children to update new children
                for i in reversed(range(item.childCount())):
                    item.removeChild(item.child(i))

                # because the children are updated the main image changes
                init_pic = QPixmap(pic_path[0])
                item.setData(3, 1, init_pic.scaled(self.scale_num, self.scale_num))
                # set path variable so the image can be used
                item.path = pic_path[0]

                # make a button that can add additional pictures
                add_image_bt = QPushButton("이미지 추가")
                # open file dialog, pass the image dir path as parameter
                add_image_bt.clicked.connect(lambda _, item = item, path =os.path.dirname(pic_path[0]) : self.add_image(item=item, dir_path=path))
                # layout setting for the button
                button_widget = QWidget()
                vbox = QVBoxLayout()
                vbox.addWidget(add_image_bt)
                button_widget.setLayout(vbox)
                # add button widget to tree widget
                self.tree.setItemWidget(item, 4, button_widget)

                # update new children
                for path in pic_path:
                    picture = QPixmap(path)
                    pic_item = QTreeWidgetItem(item)
                    # set path variable so the image can be used
                    pic_item.path = path
                    pic_item.setData(3, 1, picture.scaled(self.scale_num, self.scale_num))
            except KeyError:
                # if word doesn't exist in the given image path leave it be
                pass

        # this variable is set to True to indicate that now it's not the first time you click the 'Download Button'
        self.picture_on = True

        # after downloding the pictures 'Download Button', 'Update Button' and 'Set Keyword Button' is set back to enabled
        self.enable_buttons()

        # to expand the pictures you need to change the search_num value (I don't know exactly why)
        self.every_search_num.setValue(4)
        self.every_search_num.setValue(3)

    def add_image(self, item,  dir_path):

        fname = QFileDialog.getOpenFileName(self, 'Open file', 'c:\\', "Image files (*.jpg *.gif *.png)")
        path = fname[0]
        if path:
            # copy image file to dir_path
            copy(path, dir_path)
            img_path = os.path.join(dir_path, os.path.basename(path))
            # change main image
            init_pic = QPixmap(img_path)
            item.setData(3, 1, init_pic.scaled(self.scale_num, self.scale_num))
            # set path variable so the image can be used
            item.path = img_path

            # add child to item
            pic_item = QTreeWidgetItem(item)
            # add picture data
            picture = QPixmap(img_path)
            pic_item.setData(3, 1, picture.scaled(self.scale_num, self.scale_num))
            # set path variable so the image can be used
            pic_item.path = img_path


    def make_puzzle(self):
        word_image = []
        if self.tree.topLevelItemCount() == 0:
            self.start_download()
            return

        self.disable_buttons()

        if self.picture_on:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.HasChildren)
        else:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.All)
        while iterator.value():
            item = iterator.value()
            word = item.data(0, 0)
            pic = ''
            if self.picture_on:
                pic = item.path
                if not os.path.exists(pic):
                    self.c.press_set_keyword_bt.emit()
                    self.enable_buttons()
                    q = QMessageBox(self)
                    q.information(self, 'information', '선택하신 이미지가 존재하지 않습니다. 다시 다운로드 눌러주세요.', QMessageBox.Ok)
                    return
            word_image.append([word, pic])
            iterator += 1
        puzzle_worker = PuzzleWorker(wordsearch_generater.MakeWordSearch, word_image, self.width, self.height, self.diff,
                                                         self.option, self.picture_on, self.korean, self.chosung)
        puzzle_worker.signal.puzzle_complete.connect(self.puzzle_finish)
        puzzle_worker.signal.recursionerrormsg.connect(self.errormsg)
        self.threadpool.start(puzzle_worker)

    def puzzle_finish(self):
        q = QMessageBox(self)
        q.information(self, 'information', '바탕화면에 퍼즐 파일이 저장되었습니다.', QMessageBox.Ok)
        # TODO button, whether to open the file or not --> i should get the file's path and create a thread to open it
        self.enable_buttons()

    def errormsg(self):
        q = QMessageBox(self)
        q.information(self, 'information', '단어의 개수에 비해서 퍼즐의 크기가 너무 작습니다.', QMessageBox.Ok)
        self.enable_buttons()

# thread to download pictures while not stopping the Gui
class DownloadWorker(QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super(DownloadWorker, self).__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signal = Communication()

    @pyqtSlot()
    def run(self):
        result = self.fn(*self.args, **self.kwargs).download()
        self.signal.download_complete.emit(result)


# thread to download pictures while not stopping the Gui
class PuzzleWorker(QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super(PuzzleWorker, self).__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signal = Communication()

    @pyqtSlot()
    def run(self):
        try:
            self.fn(*self.args, **self.kwargs).make_puzzle()
            self.signal.puzzle_complete.emit()
        except RecursionError:
            self.signal.recursionerrormsg.emit()




class MainWindow(QMainWindow):
    x, y = 0, 0
    def __init__(self):
        super().__init__()
        self.init_UI()

    def init_UI(self):
        # Moves the mainwidget to the center
        self.center()

        self.setCentralWidget(QWidget(self))

        self.vbox = QVBoxLayout()
        # signal to communicate between widgets
        c = Communication()
        self.vbox.addWidget(Settings(c))
        self.vbox.addWidget(EnterWords(c))
        self.vbox.addWidget(DownloadImage(c))
        # Your customized widget needed
        self.centralWidget().setLayout(self.vbox)


        # Set the title
        self.setWindowTitle('Word Search Generator')
        self.setWindowIcon(QIcon('wordsearch.ico'))
        self.show()

    def center(self):
        qr = self.frameGeometry()
        # The coordination of this screen's center
        cp = QDesktopWidget().availableGeometry().center()
        # Save the width and height of available screen size to class variable x and y
        MainWindow.x, MainWindow.y = QDesktopWidget().availableGeometry().getCoords()[2:]
        # Move the window to the center
        qr.moveCenter(cp)
        # Set the window size according to the size of screen
        self.resize(MainWindow.x/8*4, MainWindow.y//5*4)


if __name__ == '__main__':
    import sys
    from PyQt5.QtWidgets import QApplication
    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())