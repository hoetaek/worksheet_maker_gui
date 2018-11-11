import sys
import os
import re
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QProgressBar, QLabel,
                             QTreeWidget, QTreeWidgetItem, QLineEdit,
                             QPlainTextEdit, QSpinBox, QGridLayout, QVBoxLayout, QAction,
                             QPushButton, QDesktopWidget, QMessageBox, QFileDialog, QAbstractItemView)
from PyQt5.QtGui import QPixmap
from PyQt5.QtCore import QObject, pyqtSignal, Qt, QEvent, QThreadPool, pyqtSlot, QRunnable
from shutil import copy
from send2trash import send2trash
import json
import download_images
import qdarkstyle

class Communication(QObject):
    # activate, enable, disable Set Keyword Button
    press_set_keyword_bt = pyqtSignal()
    disable_set_keyword_bt = pyqtSignal()
    enable_set_keyword_bt = pyqtSignal()
    # signal to pass word, keyword data to DownloadImage widget
    set_keyword = pyqtSignal(list)
    # siganl to notify that downloading images is complete and to proceed the following
    download_complete = pyqtSignal(list)

class EnterWords(QWidget):
    def __init__(self, c):
        super().__init__()
        self.words = []
        self.keywords = []
        self.c = c
        # basic layout for EnterWords widget
        self.grid = QGridLayout()
        self.init_UI()

    def init_UI(self):
        # Text box to input words
        self.input_words = QPlainTextEdit()
        # self.input_words.resize()
        self.input_words.setPlaceholderText("단어들을 3가지 이상 입력한 후 *검색 키워드 설정* 버튼을 누르세요."
                                            "\n띄어쓰기를 하고 싶은 경우 띄어쓰기 대신에 '_'를 입력하세요."
                                            "\n잘 모르겠으면 아랫줄 그대로 입력해보세요 :)"
                                            "\nex) 토끼, 거북이, 사자 \nor banana, peach, police_officer")
        self.grid.addWidget(self.input_words, 1, 0, 4, 1)

        # line edit box to set the suffix words
        self.line_suffix = QLineEdit()
        self.line_suffix.setPlaceholderText('예시: png')
        self.line_suffix.resize(self.line_suffix.sizeHint())
        # add line edit widget to layout
        self.grid.addWidget(self.line_suffix, 3, 1)

        # make button
        self.set_keyword_bt = QPushButton('검색 키워드\n설정')
        self.set_keyword_bt.setToolTip('단축키 : Ctrl + G')
        self.set_keyword_bt.setShortcut("Ctrl+G")
        # settings for Set Keyword Button
        self.set_keyword_bt.clicked.connect(self.set_keyword)
        self.c.press_set_keyword_bt.connect(self.set_keyword)
        self.c.disable_set_keyword_bt.connect(self.disable_set_keyword_bt)
        self.c.enable_set_keyword_bt.connect(self.enable_set_keyword_bt)
        # add button widget to layout
        self.grid.addWidget(self.set_keyword_bt, 4, 1)

        # adjust the size of the column layout
        self.grid.setColumnStretch(0, 13)
        self.grid.setColumnStretch(1, 2)
        self.setLayout(self.grid)
        self.show()

    def set_words(self):
        search_target = self.input_words.toPlainText()
        regex = r'[a-zA-Z가-힣]+_?[a-zA-Z가-힣]+'
        self.words = [word.lower() for word in re.findall(regex, search_target)]
        return self.words

    @pyqtSlot()
    def set_keyword(self):
        self.set_words()
        self.input_words.setPlainText(', '.join(self.words))
        self.keywords = [word.replace('_', ' ') + ' ' + self.line_suffix.text() for word in self.words]
        self.words = [word.replace('_', ' ') for word in self.words]
        self.c.set_keyword.emit([self.words, self.keywords])

    @pyqtSlot()
    def disable_set_keyword_bt(self):
        self.set_keyword_bt.setEnabled(False)

    @pyqtSlot()
    def enable_set_keyword_bt(self):
        self.set_keyword_bt.setEnabled(True)



class DownloadImage(QWidget):
    def __init__(self, c):
        super().__init__()
        self.c = c
        # basic layout for download widget
        self.grid = QGridLayout()
        self.init_UI()
        self.threadpool = QThreadPool()
        # variables to add to tree widget
        self.words = []
        self.keywords = []
        self.search_num = 0
        # initialize download numbers
        self.picture_on = False
        # size of the images
        self.scale_num = MainWindow.y//10
        self.text_image = False
        # shows the progress of image download
        self.pr_bar = QProgressBar()

    def init_UI(self):
        # get the data from Enterwords
        self.c.set_keyword.connect(self.search_setting)

        # tree widget to show word, keyword, search_num and downloaded images
        self.tree = QTreeWidget()
        # edit is made more easier
        self.tree.setEditTriggers(QAbstractItemView.SelectedClicked | QAbstractItemView.DoubleClicked)
        # to make UX make add keyboard events
        self.tree.installEventFilter(self)
        # add tree widget to layout
        self.grid.addWidget(self.tree, 1, 0)
        # settings for tree widget
        header = QTreeWidgetItem(["단어", "검색 키워드", '검색 개수', "이미지", ''])
        self.tree.setHeaderItem(header)
        self.tree.itemPressed.connect(self.changePic)


        # label, button widget to set the number of search_num, update from the image folder and download the images depending on the tree widget
        label_search = QLabel('전체 검색 개수')
        self.every_search_num = QSpinBox()
        self.every_search_num.setMinimum(1)
        self.every_search_num.setValue(5)
        self.every_search_num.valueChanged.connect(self.change_every_search)

        self.download_bt = QPushButton("이미지\n다운로드")
        self.download_bt.setShortcut('Ctrl+F')
        self.download_bt.setToolTip('단축키 : Ctrl + F')
        self.download_bt.clicked.connect(self.start_download)

        # add label, update, download button widget to the vertical layout box(vbox)
        self.vbox = QVBoxLayout()
        self.vbox.addWidget(label_search)
        self.vbox.addWidget(self.every_search_num)
        self.vbox.addWidget(self.download_bt)
        # stretch is needed to make gui better
        self.vbox.addStretch(1)
        # add vbox to the layout
        self.grid.addLayout(self.vbox, 1, 1)

        # adjust the size of the column layout
        self.grid.setColumnStretch(0, 13)
        self.grid.setColumnStretch(1, 2)
        self.setLayout(self.grid)


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
                            send2trash(path)
        return super(DownloadImage, self).eventFilter(source, event)

    # When you press a tree item(mouse click) the main image changes
    @pyqtSlot(QTreeWidgetItem)
    def changePic(self, item):
        if item.parent():
            file = QPixmap(item.path)
            item.parent().setData(3, 1, file.scaled(self.scale_num, self.scale_num))
            # top item's path variable contains the image path
            item.parent().path = item.path

    # add items to top level of tree widget
    @pyqtSlot(list)
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
            # Tooltip for keyboard
            item.setToolTip(1, '더블 클릭하여 변경하세요.')
            item.setToolTip(3, '사진을 선택할 때 화살표, 엔터, 백스페이스 키보드를 누를 수 있습니다.')

            # 2 is the index column, 0 is the type of data, and the last parameter is the data
            item.setData(2, 0, self.every_search_num.value())
            # add the items to top level within tree widget
            self.tree.addTopLevelItem(item)
            item.setFlags(Qt.ItemIsSelectable |Qt.ItemIsEnabled | Qt.ItemIsEditable)

    # when you change the spin box you change all of the search_num
    @pyqtSlot(int)
    def change_every_search(self, value):
        for it_idx in range(self.tree.topLevelItemCount()):
            self.tree.topLevelItem(it_idx).setData(2, 0, value)

    def enable_buttons(self):
        self.download_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

    def disable_buttons(self):
        self.download_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

    @pyqtSlot()
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

        # the data to be passed to downloader
        words = []
        keywords = []
        search_num = []
        for it_idx in range(self.tree.topLevelItemCount()):
            words.append(self.tree.topLevelItem(it_idx).text(0))
            keywords.append(self.tree.topLevelItem(it_idx).text(1))
            search_num.append(self.tree.topLevelItem(it_idx).text(2))
        self.dir_path = self.get_save_dir()
        if self.dir_path:
            # add progressbar to layout
            self.grid.addWidget(self.pr_bar, 2, 0, 1, 2)
            self.pr_bar.show()
            # initiate progress bar
            self.pr_bar.setValue(0)

            download_worker = DownloadWorker(download_images.download_image, words, keywords, search_num, self.pr_bar, self.dir_path, text_image=self.text_image)
            download_worker.signal.download_complete.connect(self.finish_download)

            # Execute
            self.threadpool.start(download_worker)
            q = QMessageBox(self)
            q.information(self, 'information', '다운로드 및 이미지를 불러오는 중입니다. 조금만 기다려주세요~^^', QMessageBox.Ok)
        else:
            self.enable_buttons()

    def get_save_dir(self):
        save_path = os.path.join(os.getcwd(), 'dir_path.json')
        is_dir_path = os.path.exists(save_path)
        if is_dir_path:
            with open(save_path) as f:
                data = json.load(f)
            if 'default_dir' in data.keys():
                dir_path = data['default_dir']
                return dir_path
            else:
                q = QMessageBox(self)
                q.information(self, 'information', '다운로드 받은 이미지를 저장할 폴더를 선택하세요.', QMessageBox.Ok)
                fname = str(QFileDialog.getExistingDirectory(self, "이미지를 저장할 폴더"))
                if fname:
                    data['default_dir'] = fname
                    with open(save_path, 'w') as f:
                        json.dump(data, f)
                    dir_path = fname
                    return dir_path
                else:
                    return
        else:
            q = QMessageBox(self)
            q.information(self, 'information', '다운로드 받은 이미지를 저장할 폴더를 선택하세요.', QMessageBox.Ok)
            fname = str(QFileDialog.getExistingDirectory(self, "이미지를 저장할 폴더"))
            if fname:
                with open(save_path, 'w') as f:
                    json.dump({'default_dir' : fname}, f)
                dir_path = fname
                return dir_path
            else:
                return

    # execute when download is finished
    @pyqtSlot(list)
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

                # update new children
                for path in pic_path:
                    picture = QPixmap(path)
                    if not picture.isNull():
                        pic_item = QTreeWidgetItem(item)
                        # set path variable so the image can be used
                        pic_item.path = path
                        pic_item.setData(3, 1, picture.scaled(self.scale_num, self.scale_num))
                    else:
                        # if picture is not valid and it exists delete it
                        if os.path.exists(path):
                            send2trash(path)

                # because the children are updated the main image changes
                if item.childCount() > 0:
                    # set main image and add image button only if child exists
                    init_pic = QPixmap(item.child(0).path)
                    item.setData(3, 1, init_pic.scaled(self.scale_num, self.scale_num))
                    # set path variable so the image can be used
                    item.path = item.child(0).path

                    # make a button that can add additional pictures
                    add_image_bt = QPushButton("이미지 변경")
                    # open file dialog, pass the image dir path as parameter
                    add_image_bt.clicked.connect(
                        lambda _, item=item, path=os.path.dirname(item.path): self.add_image(item=item, dir_path=path))
                    # layout setting for the button
                    button_widget = QWidget()
                    vbox = QVBoxLayout()
                    vbox.addWidget(add_image_bt)
                    button_widget.setLayout(vbox)
                    # add button widget to tree widget
                    self.tree.setItemWidget(item, 4, button_widget)



            except KeyError:
                # if word doesn't exist in the given image path leave it be
                pass

        # hide progress bar
        self.pr_bar.close()

        # this variable is set to True to indicate that now it's not the first time you click the 'Download Button'
        self.picture_on = True

        # after downloding the pictures 'Download Button', 'Update Button' and 'Set Keyword Button' is set back to enabled
        self.enable_buttons()

    @pyqtSlot(QTreeWidgetItem, str)
    def add_image(self, item,  dir_path):
        fname = QFileDialog.getOpenFileName(self, 'Open file', dir_path, "Image files (*.jpg *.gif *.png *bmp)")
        img_path = fname[0]
        if img_path:
            if os.path.basename(img_path) not in os.listdir(dir_path):
                # copy image file to dir_path
                copy(img_path, dir_path)
                # add child to item
                pic_item = QTreeWidgetItem(item)
                # add picture data
                picture = QPixmap(img_path)
                pic_item.setData(3, 1, picture.scaled(self.scale_num, self.scale_num))
                # set path variable so the image can be used
                pic_item.path = img_path

            # change main image
            init_pic = QPixmap(img_path)
            item.setData(3, 1, init_pic.scaled(self.scale_num, self.scale_num))
            # set path variable so the image can be used
            item.path = img_path


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



class MainWindow(QMainWindow):
    x, y = 0, 0
    def __init__(self):
        super().__init__()
        # catch Exception
        sys.excepthook = my_excepthook
        self.init_UI()

    def init_UI(self):
        # Moves the mainwidget to the center
        self.center()

        # # Set copyright
        # status = QStatusBar()
        # status.showMessage("Copyright 2018 라회택")
        # self.setStatusBar(status)

        self.setCentralWidget(QWidget(self))
        self.vbox = QVBoxLayout()
        """
        # signal to communicate between widgets
        self.c = Communication()
        # Settings widget needed
        self.vbox.addWidget(EnterWords(self.c))
        self.vbox.addWidget(DownloadImage(self.c))
        """
        # Your customized widget needed
        self.centralWidget().setLayout(self.vbox)

        # Set menu
        self.mainMenu = self.menuBar()
        font = self.mainMenu.font()
        font.setPointSize(10)
        self.mainMenu.setFont(font)

        self.fileMenu = self.mainMenu.addMenu('파일')

        open_Button = QAction('불러오기', self)
        open_Button.triggered.connect(self.open)
        self.fileMenu.addAction(open_Button)

        save_Button = QAction('저장하기', self)
        save_Button.triggered.connect(self.save)
        self.fileMenu.addAction(save_Button)

        reset_path_Button = QAction('저장 경로 초기화하기', self)
        reset_path_Button.triggered.connect(self.reset_path)
        self.fileMenu.addAction(reset_path_Button)

        exit_Button = QAction('나가기', self)
        exit_Button.setShortcut('Ctrl+Q')
        exit_Button.triggered.connect(self.close)
        self.fileMenu.addAction(exit_Button)

        # Set the title
        self.setWindowTitle('Example generator')
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

    def reset_path(self):
        if os.path.exists('dir_path.json'):
            os.unlink('dir_path.json')

    def open(self):
        default_dir = '.'
        if os.path.exists('dir_path.json'):
            with open('dir_path.json') as f:
                data = json.load(f)
                default_dir = data['default_dir']
        txt_path = QFileDialog.getOpenFileName(self, 'Open file', default_dir, "Txt files (*.txt)")[0]
        if txt_path:
            txt_flie = open(txt_path, 'r')
            txt = txt_flie.read()
            self.enterwords_widget.input_words.setPlainText(txt)
            txt_flie.close()

    def save(self):
        default_dir = '.'
        if os.path.exists('dir_path.json'):
            with open('dir_path.json') as f:
                data = json.load(f)
                default_dir = data['default_dir']
        txt_path = QFileDialog.getSaveFileName(self, 'Save File', default_dir, "Txt files (*.txt)")[0]
        if txt_path:
            txt_flie = open(txt_path, 'w')
            text = ', '.join(self.enterwords_widget.set_words())
            txt_flie.write(text)
            txt_flie.close()

import traceback
# Catch Exception
def my_excepthook(type, value, tback):
    # log the exception here
    # then call the default handler
    traceback_text = ''.join(traceback.format_tb(tback))
    send_error_to_form(traceback_text + str(type) + str(value))
    sys.__excepthook__(type, value, tback)
    exit(1)

import requests
def send_error_to_form(msg):
    url = "https://docs.google.com/forms/d/e/1FAIpQLSfz1_NEDEV9qpQHpojNGZJUxe5A1PBAtv7LK8BdFNZ3q6JqQA/formResponse"
    payload = {'entry.1147734626':msg}
    requests.post(url, data=payload)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())