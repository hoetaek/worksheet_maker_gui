import wordsearch_maker, word_flicker_maker, word_worksheet_maker, dobble_maker
from PyQt5.QtWidgets import QMainWindow, QApplication, QWidget, QHBoxLayout, QVBoxLayout, QStackedWidget, QListView, QPushButton, QLabel, QTextEdit, QDesktopWidget
from PyQt5.QtGui import QStandardItem, QStandardItemModel, QFontMetrics, QPixmap
from PyQt5.QtCore import Qt, QModelIndex, pyqtSlot
import qdarkstyle
import sys

class WordSearchmwindow(wordsearch_maker.MainWindow):
    def init_UI(self):
        super(WordSearchmwindow, self).init_UI()
        self.exit_Button.triggered.connect(self.choose_program)

    def choose_program(self):
        self.close()
        global form
        form.show()

class WordFlickermwindow(word_flicker_maker.MainWindow):
    def init_UI(self):
        super(WordFlickermwindow, self).init_UI()
        self.exit_Button.triggered.connect(self.choose_program)

    def choose_program(self):
        self.close()
        global form
        form.show()

class WordWorksheetmwindow(word_worksheet_maker.MainWindow):
    def init_UI(self):
        super(WordWorksheetmwindow, self).init_UI()
        self.exit_Button.triggered.connect(self.choose_program)

    def choose_program(self):
        self.close()
        global form
        form.show()

class Dobblemwindow(dobble_maker.MainWindow):
    def init_UI(self):
        super(Dobblemwindow, self).init_UI()
        self.exit_Button.triggered.connect(self.choose_program)

    def choose_program(self):
        self.close()
        global form
        form.show()

class WordSearch(QWidget):
    def __init__(self):
        super(WordSearch, self).__init__()
        self.hbox = QHBoxLayout()
        text = QTextEdit()
        text.setText("1. 주어진 단어(한글/영어)를 무작위로 나열된 글자들 사이에 숨깁니다.\n2. 난이도를 설정한 후에 단어를 입력하면 워드시어치 활동지가 만들어집니다.")
        text.setReadOnly(True)
        self.hbox.addWidget(text)
        self.setLayout(self.hbox)

class WordFlicker(QWidget):
    def __init__(self):
        super(WordFlicker, self).__init__()
        self.hbox = QHBoxLayout()
        text = QTextEdit()
        text.setText("1. 주어진 단어를 PPT 슬라이드쇼에서 차례로 지나가도록 합니다. \n2. 단어 및 이미지 제시 순서를 정한 후 PPT를 저장하면 됩니다.\n3. 애니메이션 효과가 적용되어 1초마다 단어와 이미지들이 깜빡이며 지나갑니다.")
        text.setReadOnly(True)
        self.hbox.addWidget(text)

        self.setLayout(self.hbox)

class WordWorksheet(QWidget):
    def __init__(self):
        super(WordWorksheet, self).__init__()
        self.hbox = QHBoxLayout()
        text = QTextEdit()
        text.setText("1. 주어진 단어들과 이미지들을 나열하여 활동지로 제작됩니다.\n2. 단어에 맞는 이미지를 검색하여 선택한 후 가로에 몇 개의 단어들이 들어갈지 선택하면 됩니다.")
        text.setReadOnly(True)
        self.hbox.addWidget(text)

        self.setLayout(self.hbox)

class Dobble(QWidget):
    def __init__(self):
        super(Dobble, self).__init__()
        self.hbox = QHBoxLayout()
        text = QTextEdit()
        text.setText("1. 주어진 단어들과 이미지들을 바탕으로 도블 카드 세트가 제작됩니다.\n2. 도블은 카드 세트에서 무작위로 두 카드를 뽑았을 때 각 카드에서 겹치는 그림 하나를 외치면 카드를 획득하는 형식의 게임입니다.")
        text.setReadOnly(True)
        self.hbox.addWidget(text)

        self.setLayout(self.hbox)

class Form(QMainWindow):
    x, y = 0, 0
    def __init__(self):
        QWidget.__init__(self, flags=Qt.Widget)
        self.stk_w = QStackedWidget(self)
        self.program_index = 0
        self.init_widget()

    def init_widget(self):
        self.center()

        self.setCentralWidget(QWidget(self))
        self.setWindowTitle("학습 자료 제작 프로그램")

        widget_laytout = QVBoxLayout()
        stk_widget_layout = QHBoxLayout()

        fruits = ["워드 시어치(단어 찾기)", "단어 깜빡이", "단어 학습지", "도블 카드"]
        view = QListView(self)
        model = QStandardItemModel()
        for f in fruits:
            model.appendRow(QStandardItem(f))
        view.setModel(model)
        view.setMinimumWidth(view.sizeHintForColumn(0))

        vbox = QVBoxLayout()
        program_label = QLabel("프로그램 선택")
        vbox.addWidget(program_label)
        vbox.addWidget(view)
        stk_widget_layout.addLayout(vbox)

        vbox_explain = QVBoxLayout()
        explain_label = QLabel("설명")
        vbox_explain.addWidget(explain_label)
        self.stk_w.addWidget(WordSearch())
        self.stk_w.addWidget(WordFlicker())
        self.stk_w.addWidget(WordWorksheet())
        self.stk_w.addWidget(Dobble())
        vbox_explain.addWidget(self.stk_w)
        stk_widget_layout.addLayout(vbox_explain)

        stk_widget_layout.setStretch(0, 1)
        stk_widget_layout.setStretch(1, 4)

        tail_layout = QHBoxLayout()
        open_program_bt = QPushButton("확인")
        fm = QFontMetrics(open_program_bt.font())
        open_program_bt.setFixedWidth(fm.width(open_program_bt.text() *  3))
        open_program_bt.clicked.connect(self.open_program)

        tail_layout.addStretch()
        tail_layout.addWidget(open_program_bt)
        widget_laytout.addLayout(stk_widget_layout)
        widget_laytout.addLayout(tail_layout)
        self.centralWidget().setLayout(widget_laytout)

        # 시그널 슬롯 연결
        view.clicked.connect(self.slot_clicked_item)
        view.doubleClicked.connect(self.exe_program)

    def center(self):
        qr = self.frameGeometry()
        # The coordination of this screen's center
        cp = QDesktopWidget().availableGeometry().center()
        # Save the width and height of available screen size to class variable x and y
        Form.x, Form.y = QDesktopWidget().availableGeometry().getCoords()[2:]
        # Move the window to the center
        qr.moveCenter(cp)
        # Set the window size according to the size of screen
        self.resize(Form.x/8*4, Form.y//5)

    @pyqtSlot(QModelIndex)
    def slot_clicked_item(self, QModelIndex):
        self.stk_w.setCurrentIndex(QModelIndex.row())
        self.program_index = QModelIndex.row()

    @pyqtSlot(QModelIndex)
    def exe_program(self, QModelIndex):
        self.program_index = QModelIndex.row()
        self.open_program()

    def open_program(self):
        self.close()
        if self.program_index == 0:
            self.ex = WordSearchmwindow()
        elif self.program_index == 1:
            self.ex = WordFlickermwindow()
        elif self.program_index == 2:
            self.ex = WordWorksheetmwindow()
        elif self.program_index == 3:
            self.ex = Dobblemwindow()

import traceback
# Catch Exception
def my_excepthook(type, value, tback):
    # log the exception here
    # then call the default handler
    traceback_text = ''.join(traceback.format_tb(tback))
    # send_error_to_form(traceback_text + str(type) + str(value))
    sys.__excepthook__(type, value, tback)
    exit(1)

import requests
def send_error_to_form(msg):
    url = "https://docs.google.com/forms/d/e/1FAIpQLSfz1_NEDEV9qpQHpojNGZJUxe5A1PBAtv7LK8BdFNZ3q6JqQA/formResponse"
    payload = {'entry.1147734626':msg}
    requests.post(url, data=payload)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    form = Form()
    form.show()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    exit(app.exec_())
