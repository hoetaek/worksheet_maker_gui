from basic_gui import *
from PyQt5.QtWidgets import QHBoxLayout
from PyQt5.QtGui import QIcon

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

        self.c.pic_num_changed.connect(self.set_card_num)
        hbox.addWidget(title)
        hbox.addWidget(self.label_remaining)
        self.grid.addLayout(hbox, 0, 0)




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
            self.c.word_changed.emit([self.words, self.keywords, self.pic_num])

    def set_card_num(self, pic_num):
        word_num = pic_num**2 - pic_num + 1
        self.pic_num = pic_num
        self.word_num = word_num
        self.get_given()
        self.get_remaining()

    def get_remaining(self):
        self.set_words()
        self.label_remaining.setText("필요한 단어 : {}개".format(self.word_num - len(self.words)))



class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle('Word Puzzle generator')
        self.setWindowIcon(QIcon('wordsearch.ico'))
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