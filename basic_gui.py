import sys
import os
import re
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QProgressBar, QLabel,
                             QTreeWidget, QTreeWidgetItem, QTreeWidgetItemIterator, QLineEdit,
                             QPlainTextEdit, QSpinBox, QGridLayout, QHBoxLayout, QVBoxLayout,
                             QPushButton, QDesktopWidget, QMessageBox)
from PyQt5.QtGui import QPixmap
from PyQt5.QtCore import QObject, pyqtSignal, Qt, QEvent, QThreadPool, pyqtSlot, QRunnable
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
        regex = r'[a-zA-Z가-힣]+'
        self.words = [word.lower() if word.isalpha() else word for word in re.findall(regex, search_target)]

    def set_keyword(self):
        self.set_words()
        self.input_words.setPlainText(', '.join(self.words))
        self.keywords = [word + ' ' + self.line_suffix.text() for word in self.words]
        self.c.set_keyword.emit([self.words, self.keywords])

    def disable_set_keyword_bt(self):
        self.set_keyword_bt.setEnabled(False)

    def enable_set_keyword_bt(self):
        self.set_keyword_bt.setEnabled(True)



class DownloadImage(QWidget):
    def __init__(self, c):
        super().__init__()
        self.c = c
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

    def init_UI(self):
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
        header = QTreeWidgetItem(["단어", "키워드", '검색 개수', "이미지"])
        self.tree.setHeaderItem(header)
        self.tree.itemPressed.connect(self.changePic)


        # label, button widget to set the number of search_num, update from the image folder and download the images depending on the tree widget
        label_search = QLabel('전체 검색 개수')
        self.every_search_num = QSpinBox()
        self.every_search_num.setValue(3)
        self.every_search_num.valueChanged.connect(self.change_every_search)

        self.update_bt = QPushButton("사진 업데이트")
        self.update_bt.clicked.connect(self.update_pic)

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
        vbox.addWidget(self.update_bt)
        vbox.addWidget(self.download_bt)
        # add vbox to the layout
        grid.addLayout(vbox, 0, 1)

        # shows the progress of image download
        self.pr_bar = QProgressBar()
        # add progressbar to layout
        grid.addWidget(self.pr_bar, 1, 0, 1, 2)

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


    def start_download(self):
        # disable the buttons
        self.download_bt.setEnabled(False)
        self.update_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

        # if no keywords exist enable buttons and press Set Keyword Button
        if self.tree.topLevelItemCount() == 0:
            self.download_bt.setEnabled(True)
            self.update_bt.setEnabled(True)
            self.c.enable_set_keyword_bt.emit()

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

        # Execute
        self.threadpool.start(download_worker)

    # execute when download is finished
    def finish_download(self, word_imagePath):
        # word_imagePath is for new downloaded words and old_word_imagePath is for updating already downloaded words
        self.word_imagePath = word_imagePath[0]
        self.old_word_imagePath = word_imagePath[1]

        # for update_bt we need the path of google directory
        self.google_dir = word_imagePath[2]

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
        self.download_bt.setEnabled(True)
        self.update_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

        # to expand the pictures you need to change the search_num value (I don't know exactly why)
        self.every_search_num.setValue(4)
        self.every_search_num.setValue(3)

    def update_pic(self):
        # execute when 'Update Button' is pressed
        # iterator that goes over every item that has children(only the top level items when downloaded button is pressed)
        iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.HasChildren)
        if not iterator.value():
            # if there is (no top level items) or (Download Button is not pressed) press the Download Button
            self.start_download()
            return
        while iterator.value():
            item = iterator.value()
            # remove all children to initiate the top level items
            for i in reversed(range(item.childCount())):
                item.removeChild(item.child(i))

            # set the path of images of top level item word
            word_dir = os.path.join(self.google_dir, item.data(0, 0))
            if os.path.exists(word_dir):
                # get the image files if the word directory exists
                files = os.listdir(word_dir)
                # set the elements of files in the latest file order
                files.sort(key=lambda x: os.path.getmtime(word_dir + '\\' + x))
                files.reverse()
                if not files:
                    # if there are no images in directory push Download Button
                    self.start_download()
                    return

            else:
                # if there is no word directory push Download Button
                self.start_download()
                return

            # retrieve the paths of all images within the directory
            pic_path = [os.path.join(word_dir, file) for file in files]

            # set the main image
            init_pic = QPixmap(pic_path[0])
            item.setData(3, 1, init_pic.scaled(self.scale_num, self.scale_num))
            # set path variable so the image can be used
            item.path = pic_path[0]

            # set the children of top level item
            for path in pic_path:
                picture = QPixmap(path)
                pic_item = QTreeWidgetItem(item)
                # set path variable so the image can be used
                pic_item.path = path
                pic_item.setData(3, 1, picture.scaled(self.scale_num, self.scale_num))
            iterator += 1

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
        self.init_UI()

    def init_UI(self):
        # Moves the mainwidget to the center
        self.center()

        self.setCentralWidget(QWidget(self))

        self.vbox = QVBoxLayout()
        # signal to communicate between widgets
        c = Communication()
        # Settings widget needed
        self.vbox.addWidget(EnterWords(c))
        self.vbox.addWidget(DownloadImage(c))
        # Your customized widget needed
        self.centralWidget().setLayout(self.vbox)


        # Set the title
        self.setWindowTitle('Example generatorr')
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