from basic_gui import *
from PyQt5.QtWidgets import (QRadioButton, QGroupBox, QCheckBox, QHBoxLayout, QTreeWidgetItemIterator)
from PyQt5.QtGui import QIcon
import wordsearch_generater

class Communication(Communication):
    super(Communication)
    # signal for puzzle settings
    puzzle_setting = pyqtSignal(list)
    # emits if entered words are korean
    korean = pyqtSignal(bool)
    # siganl to notify that making wordsearch puzzle is complete and to proceed the following
    puzzle_complete = pyqtSignal()
    recursionerrormsg = pyqtSignal()


class Settings(QWidget):
    def __init__(self, c):
        super().__init__()
        self.c = c
        self.puzzle_width = 15
        self.puzzle_height = 15
        self.shape = 0
        self.direction = 1
        self.diff_val = 1
        self.option = '겹치지 않도록'
        self.option_val = 0
        self.init_UI()

    def init_UI(self):
        title_label = QLabel("1. 퍼즐 옵션을 선택하세요.")

        # Group for size
        grp_size = QGroupBox("크기 조정")
        self.label_puzzle_width = QLabel('가로 길이: ')
        self.width_spin = QSpinBox()
        self.width_spin.setMinimum(5)
        self.width_spin.setToolTip('마우스 스크롤 가능합니다.')
        self.width_spin.setValue(15)

        self.label_puzzle_height = QLabel('세로 길이: ')
        self.height_spin = QSpinBox()
        self.height_spin.setMinimum(5)
        self.height_spin.setToolTip('마우스 스크롤 가능합니다.')
        self.height_spin.setValue(15)
        self.height_spin.valueChanged.connect(self.puzzle_height_change)

        # layout width
        hbox_width = QHBoxLayout()
        hbox_width_label = QHBoxLayout()
        hbox_width_label.setAlignment(Qt.AlignRight)
        hbox_width_label.addWidget(self.label_puzzle_width)
        hbox_width.addLayout(hbox_width_label)
        hbox_width_spin = QHBoxLayout()
        hbox_width_spin.setAlignment(Qt.AlignLeft)
        hbox_width_spin.addWidget(self.width_spin)
        hbox_width.addLayout(hbox_width_spin)
        self.width_spin.valueChanged.connect(self.puzzle_width_change)

        # layout height
        hbox_height = QHBoxLayout()
        hbox_height_label = QHBoxLayout()
        hbox_height_label.setAlignment(Qt.AlignRight)
        hbox_height_label.addWidget(self.label_puzzle_height)
        hbox_height_spin = QHBoxLayout()
        hbox_height_spin.setAlignment(Qt.AlignLeft)
        hbox_height_spin.addWidget(self.height_spin)
        hbox_height.addLayout(hbox_height_label)
        hbox_height.addLayout(hbox_height_spin)

        # layout for width, height
        vbox_size = QVBoxLayout()
        vbox_size.addLayout(hbox_width)
        vbox_size.addLayout(hbox_height)

        grp_size.setLayout(vbox_size)

        # Group for word shape
        grp_shape = QGroupBox("단어 모양")
        shape_1 = QRadioButton("가로세로")
        shape_1.setToolTip("<p style='white-space:pre'>단어를 <font color='yellow'>가로세로로</font> 설정합니다.")
        shape_1.setChecked(True)
        shape_2 = QRadioButton("가로세로 + 대각선")
        shape_2.setToolTip("<p style='white-space:pre'>단어를 <font color='yellow'>가로세로, 대각선으로</font> 설정합니다.")

        shape_1.clicked.connect(lambda: self.diff_checked(shape_1))
        shape_2.clicked.connect(lambda: self.diff_checked(shape_2))

        # layout shape
        grp_shape_layout = QVBoxLayout()
        grp_shape_layout.addWidget(shape_1)
        grp_shape_layout.addWidget(shape_2)

        grp_shape.setLayout(grp_shape_layout)

        # Group for word direction
        grp_direction = QGroupBox("단어 방향")
        direction_1 = QRadioButton("정방향")
        direction_1.setToolTip("<p style='white-space:pre'>글자 방향은 <font color='yellow'>정방향으로</font> 설정합니다.")
        direction_2 = QRadioButton("정방향 + 역방향")
        direction_2.setToolTip(
            "<p style='white-space:pre'>글자 방향은 <font color='yellow'>역방향으로</font> 설정합니다.")
        direction_1.clicked.connect(lambda: self.diff_checked(direction_1))
        direction_2.clicked.connect(lambda: self.diff_checked(direction_2))

        # layout direction
        grp_direction_layout = QVBoxLayout()
        grp_direction_layout.addWidget(direction_1)
        grp_direction_layout.addWidget(direction_2)

        grp_direction.setLayout(grp_direction_layout)


        grp_option = QGroupBox("옵션")
        option_1 = QRadioButton("글자 겹치지 않게")
        option_1.setToolTip("퍼즐이 쉬워집니다. <p style='white-space:pre'>채워지는 글자는 되도록 <font color='yellow'>겹치지 않도록</font> 설정합니다.")
        option_1.setChecked(True)
        option_2 = QRadioButton("글자 무작위로")
        option_2.setToolTip("퍼즐 난이도는 보통입니다. <p style='white-space:pre'>채워지는 글자는 되도록 <font color='yellow'>무작위로</font> 설정합니다.")
        option_3 = QRadioButton("글자 겹치게")
        option_3.setToolTip("<p style='white-space:pre'>퍼즐이 어려워집니다. <p style='white-space:pre'>채워지는 글자는 되도록 <font color='yellow'>겹치도록</font> 설정합니다.")
        option_1.clicked.connect(lambda: self.option_checked(option_1))
        option_2.clicked.connect(lambda: self.option_checked(option_2))
        option_3.clicked.connect(lambda: self.option_checked(option_3))
        # layout option
        grp_option_layout = QVBoxLayout()
        grp_option_layout.addWidget(option_1)
        grp_option_layout.addWidget(option_2)
        grp_option_layout.addWidget(option_3)

        grp_option.setLayout(grp_option_layout)

        # layout for diplay
        vbox_display = QVBoxLayout()

        hbox_setting = QHBoxLayout()
        hbox_setting.addWidget(grp_size)
        hbox_setting.addWidget(grp_shape)
        hbox_setting.addWidget(grp_direction)
        hbox_setting.addWidget(grp_option)

        vbox_display.addWidget(title_label)
        vbox_display.addLayout(hbox_setting)

        self.setLayout(vbox_display)
        self.show()

    def puzzle_width_change(self, value):
        self.puzzle_width = value
        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])

    def puzzle_height_change(self, value):
        self.puzzle_height = value
        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])

    def diff_checked(self, diff):
        text = diff.text()
        if text == '가로세로':
            self.shape = 0
        elif text == '가로세로 + 대각선':
            self.shape = 2
        elif text == '정방향':
            self.direction = 1
        elif text == '정방향 + 역방향':
            self.direction = 2

        self.diff_val = self.shape + self.direction
        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])

    def option_checked(self, option):
        text = option.text()
        if text == '글자 겹치지 않게':
            self.option_val = 0
        elif text == '글자 무작위로':
            self.option_val = 1
        elif text == '글자 겹치게':
            self.option_val = 2

        self.c.puzzle_setting.emit([self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val])

class EnterWords(EnterWords):
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

class DownloadImage(DownloadImage):
    def __init__(self, c):
        super(DownloadImage, self).__init__(c)
        # initial puzzle settings
        self.width, self.height, self.diff, self.option = 15, 15, 1, 0
        # initialize download numbers
        self.picture_on = False
        # initialize language mode
        self.korean = False
        # initialize language mode
        self.chosung = False

    def init_UI(self):
        super(DownloadImage, self).init_UI()
        # get data of puzzle settings
        self.c.puzzle_setting.connect(self.puzzle_setting)
        # see if its korean or english/ default is english
        self.c.korean.connect(self.korean_on)


        self.chosung_checkBox = QCheckBox("초성", self)
        self.chosung_checkBox.setToolTip("단어가 초성으로 제시됩니다.")
        self.chosung_checkBox.close()
        self.chosung_checkBox.stateChanged.connect(self.chosung_on)

        self.make_puzzle_bt = QPushButton("Word Search\n퍼즐 만들기")
        self.make_puzzle_bt.clicked.connect(self.make_puzzle)
        self.make_puzzle_bt.setToolTip("단축키 : Ctrl + D")
        self.make_puzzle_bt.setShortcut('Ctrl+D')

        self.vbox.addWidget(self.chosung_checkBox)
        self.vbox.addWidget(self.make_puzzle_bt)

    # define puzzle settings
    def puzzle_setting(self, puzzle_setting):
        self.width, self.height, self.diff, self.option = puzzle_setting[0], puzzle_setting[1], puzzle_setting[2], puzzle_setting[3]

    def korean_on(self, bool):
        self.korean = bool
        if bool == True:
            self.chosung_checkBox.show()
            self.make_puzzle_bt.setText('낱말 퍼즐 만들기')
        else:
            self.chosung_checkBox.close()
            self.make_puzzle_bt.setText('Word Search\n퍼즐 만들기')
        self.make_puzzle_bt.setToolTip("단축키 : Ctrl + D")
        self.make_puzzle_bt.setShortcut('Ctrl+D')

    def chosung_on(self):
        if self.chosung_checkBox.isChecked() == True:
            self.chosung = True
        else:
            self.chosung = False

    def enable_buttons(self):
        self.download_bt.setEnabled(True)
        self.make_puzzle_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

    def disable_buttons(self):
        self.download_bt.setEnabled(False)
        self.make_puzzle_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

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