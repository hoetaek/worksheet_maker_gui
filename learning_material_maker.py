import wordsearch_maker, word_flicker_maker, word_worksheet_maker, dobble_maker
from PyQt5.QtWidgets import QMainWindow, QApplication, QWidget, QHBoxLayout, QVBoxLayout, QStackedWidget, QListView, QPushButton, QLabel
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
        label = QLabel()
        pic = QPixmap("learn_material_maker_example/wordsearch_example.jpg")
        pic.scaledToWidth(20)
        label.setPixmap(pic)
        self.hbox.addWidget(label)

        self.setLayout(self.hbox)

class WordFlicker(QWidget):
    def __init__(self):
        super(WordFlicker, self).__init__()
        self.hbox = QHBoxLayout()

        self.setLayout(self.hbox)

class WordWorksheet(QWidget):
    def __init__(self):
        super(WordWorksheet, self).__init__()
        self.hbox = QHBoxLayout()

        self.setLayout(self.hbox)

class Dobble(QWidget):
    def __init__(self):
        super(Dobble, self).__init__()
        self.hbox = QHBoxLayout()

        self.setLayout(self.hbox)

class Form(QMainWindow):
    def __init__(self):
        QWidget.__init__(self, flags=Qt.Widget)
        self.stk_w = QStackedWidget(self)
        self.program_index = 0
        self.init_widget()

    def init_widget(self):
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
        stk_widget_layout.setStretch(1, 2)

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

    @pyqtSlot(QModelIndex)
    def slot_clicked_item(self, QModelIndex):
        self.stk_w.setCurrentIndex(QModelIndex.row())
        self.program_index = QModelIndex.row()

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
