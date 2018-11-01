from basic_gui import *
from PyQt5.QtWidgets import QHBoxLayout

class EnterWords(EnterWords):
    def init_UI(self):
        super(EnterWords, self).init_UI()

        hbox = QHBoxLayout()
        title = QLabel('1, 단어를 입력세요.')
        self.label_num = QLabel("입력한 단어 : {}개".format(0))
        hbox_label_num = QHBoxLayout()
        hbox_label_num.addWidget(self.label_num)
        hbox_label_num.setAlignment(Qt.AlignRight)

        self.input_words.textChanged.connect(self.get_word_num)

        hbox.addWidget(title)
        hbox.addLayout(hbox_label_num)
        self.grid.addLayout(hbox, 0, 0)

    def get_word_num(self):
        self.set_words()
        self.label_num.setText("입력한 단어 : {}개".format(len(self.words)))

class DownloadImage(DownloadImage):
    def init_UI(self):
        # Title for widget
        title = QLabel("2. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()

        self.choose_label_template_bt = QPushButton("\n다음\n")
        self.choose_label_template_bt.clicked.connect(self.choose_label_template)
        self.vbox.addWidget(self.choose_label_template_bt)

    def choose_label_template(self):
        pass


class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle('단어 활동지 만들기')
        c = Communication()
        self.enterwords_widget = EnterWords(c)
        self.vbox.addWidget(self.enterwords_widget)
        self.vbox.addWidget(DownloadImage(c))
        self.vbox.setStretch(0, 1)
        self.vbox.setStretch(1, 7)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())