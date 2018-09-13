from basic_gui import *
from PyQt5.QtWidgets import QHBoxLayout, QTreeWidgetItemIterator
from PyQt5.QtGui import QIcon
from ppt_dobble_maker import *

class Communication(Communication):
    super(Communication)
    pic_num_changed = pyqtSignal(int)
    word_changed = pyqtSignal(list)
    convert_complete = pyqtSignal()

class Settings(QWidget):
    def __init__(self, c):
        super().__init__()
        self.init_UI()
        self.c = c

    def init_UI(self):
        grid = QGridLayout()

        label_set_pic_num = QLabel('카드당 들어갈 사진 개수 :')
        self.pic_num = QSpinBox()
        self.pic_num.setMinimum(3)
        self.pic_num.setMaximum(8)
        self.pic_num.setValue(3)
        self.pic_num.valueChanged.connect(self.change_word_num)

        hbox = QHBoxLayout()
        hbox.addWidget(label_set_pic_num)
        hbox.addWidget(self.pic_num)
        hbox.addStretch(1)

        grid.addLayout(hbox, 1, 0, 1, 2)

        self.label_word_num = QLabel('총 {}개의 단어를 입력해주세요.'.format(7))
        grid.addWidget(self.label_word_num, 2, 0)

        self.setLayout(grid)
        self.show()

    @pyqtSlot()
    def change_word_num(self):
        pic_num = self.pic_num.value()
        word_num = pic_num**2 - pic_num + 1
        self.label_word_num.setText('총 {}개의 단어가 필요합니다.'.format(word_num))
        self.c.pic_num_changed.emit(pic_num)


class EnterWords(EnterWords):
    def __init__(self, c):
        self.word_num = 7
        self.pic_num = 3
        super(EnterWords, self).__init__(c)

    def init_UI(self):
        super(EnterWords, self).init_UI()

        hbox = QHBoxLayout()
        title = QLabel('2, 단어를 입력세요.')
        self.label_remaining = QLabel("필요한 단어 : {}개".format(7))

        self.c.pic_num_changed.connect(self.set_word_num)
        self.input_words.textChanged.connect(self.get_remaining)

        hbox.addWidget(title)
        hbox.addWidget(self.label_remaining)
        self.grid.addLayout(hbox, 0, 0)

    @pyqtSlot()
    def set_keyword(self):
        self.set_words()
        self.input_words.setPlainText(', '.join(self.words))
        self.keywords = [word + ' ' + self.line_suffix.text() for word in self.words]
        if len(self.words) < self.word_num:
            q = QMessageBox(QMessageBox.Warning, "에러 메시지", '단어가 {}개 부족합니다.\n같은 단어도 반복 입력 가능합니다.'.format(self.word_num - len(self.words)))
            q.setStandardButtons(QMessageBox.Ok)
            q.exec_()
            return
        elif len(self.words) > self.word_num:
            q = QMessageBox(QMessageBox.Warning, "에러 메시지", '단어 {}개를 더 입력했습니다.'.format(len(self.words) - self.word_num))
            q.setStandardButtons(QMessageBox.Ok)
            q.exec_()
            return
        else:
            self.c.set_keyword.emit([self.words, self.keywords])

    @pyqtSlot()
    def set_word_num(self, pic_num):
        word_num = pic_num**2 - pic_num + 1
        self.pic_num = pic_num
        self.word_num = word_num
        self.get_remaining()

    @pyqtSlot()
    def get_remaining(self):
        self.set_words()
        self.label_remaining.setText("필요한 단어 : {}개".format(self.word_num - len(self.words)))

class DownloadImage(DownloadImage):
    def __init__(self, c):
        super(DownloadImage, self).__init__(c)
        self.pic_num = 3
        self.picture_on = False

    def init_UI(self):
        # Title for widget
        title = QLabel("3. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()
        self.makePpt_bt = QPushButton('도블 만들기')
        self.makePpt_bt.pressed.connect(self.start_makedobblePpt)
        self.makePpt_bt.setToolTip("단축키 : Ctrl + D")
        self.makePpt_bt.setShortcut('Ctrl+D')
        self.vbox.addWidget(self.makePpt_bt)

    def enable_buttons(self):
        self.download_bt.setEnabled(True)
        self.makePpt_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

    def disable_buttons(self):
        self.download_bt.setEnabled(False)
        self.makePpt_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

    @pyqtSlot()
    def start_makedobblePpt(self):
        word_image = []
        if self.tree.topLevelItemCount() == 0:
            self.start_download()
            return

        self.disable_buttons()
        # TODO picture_on will always be true since i'm not going to put words, but only pictures
        if self.picture_on:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.HasChildren)
        else:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.All)
            if iterator.value() == None:
                q = QMessageBox(self)
                q.information(self, 'information', '검색어 키워드가 존재하지 않아요. 그래서 검색어 키워드 버튼을 대신 눌렀습니다~.', QMessageBox.Ok)
                self.c.press_set_keyword_bt.emit()
                self.enable_buttons()
                return
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

        # word and image path is stored in list word_image

        # the index of the word_image we should retrieve in order to generate dobble
        dobble = GenerateDobbleIndex(self.pic_num)
        dobble_index = dobble.get_dobble_index()

        # list of word, image_path from word_image according to dobble_index
        card_list = [word_image[i] for i in dobble_index]
        # put the images into the ppt
        ppt_card_maker = PptCardMaker(card_list, self.pic_num)
        ppt_picture = []
        if self.picture_on:
            ppt_picture = ppt_card_maker.make_card_with_picture()
        ppt_word = ppt_card_maker.make_card_with_word()
        self.ppts = ppt_picture + ppt_word

        for ppt in self.ppts:
            convert_worker = ConvertWorker(ConvertPptToPng, ppt)
            convert_worker.signal.convert_complete.connect(self.finish_makedobblePpt)
            self.threadpool.start(convert_worker)

    @pyqtSlot()
    def finish_makedobblePpt(self):
        self.makePpt_bt.setEnabled(True)

class ConvertWorker(QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super(ConvertWorker, self).__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signal = Communication()

    @pyqtSlot()
    def run(self):
        self.fn(*self.args, **self.kwargs).convert()
        self.signal.convert_complete.emit()

class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle('Dobble card generator')
        c = Communication()
        self.vbox.addWidget(Settings(c))
        self.vbox.addWidget(EnterWords(c))
        self.vbox.addWidget(DownloadImage(c))
        self.vbox.setStretch(0, 1)
        self.vbox.setStretch(1, 1)
        self.vbox.setStretch(2, 7)


if __name__ == '__main__':

    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())