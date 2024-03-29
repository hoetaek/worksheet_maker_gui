from basic_gui import *
from PyQt5.QtWidgets import (
    QRadioButton,
    QGroupBox,
    QCheckBox,
    QHBoxLayout,
    QTreeWidgetItemIterator,
)
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
    valueerrormsg = pyqtSignal()


class Settings(QWidget):
    def __init__(self, c):
        super().__init__()
        self.c = c
        self.puzzle_width = 15
        self.puzzle_height = 15
        self.shape = 0
        self.direction = 1
        self.diff_val = 1
        self.option = "겹치지 않도록"
        self.option_val = 0
        self.init_UI()

    def init_UI(self):
        title_label = QLabel("1. 퍼즐 옵션을 선택하세요.")

        # Group for size
        grp_size = QGroupBox("크기 조정")
        self.label_puzzle_width = QLabel("가로 길이: ")
        self.width_spin = QSpinBox()
        self.width_spin.setMinimum(5)
        self.width_spin.setToolTip("마우스 스크롤 가능합니다.")
        self.width_spin.setValue(15)

        self.label_puzzle_height = QLabel("세로 길이: ")
        self.height_spin = QSpinBox()
        self.height_spin.setMinimum(5)
        self.height_spin.setToolTip("마우스 스크롤 가능합니다.")
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
        shape_1.setToolTip(
            "<p style='white-space:pre'>단어를 <font color='yellow'>가로세로로</font> 설정합니다."
        )
        shape_1.setChecked(True)
        shape_2 = QRadioButton("가로세로 + 대각선")
        shape_2.setToolTip(
            "<p style='white-space:pre'>단어를 <font color='yellow'>가로세로, 대각선으로</font> 설정합니다."
        )

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
        direction_1.setChecked(True)
        direction_1.setToolTip(
            "<p style='white-space:pre'>글자 방향은 <font color='yellow'>정방향으로</font> 설정합니다."
        )
        direction_2 = QRadioButton("정방향 + 역방향")
        direction_2.setToolTip(
            "<p style='white-space:pre'>글자 방향은 <font color='yellow'>역방향으로</font> 설정합니다."
        )
        direction_1.clicked.connect(lambda: self.diff_checked(direction_1))
        direction_2.clicked.connect(lambda: self.diff_checked(direction_2))

        # layout direction
        grp_direction_layout = QVBoxLayout()
        grp_direction_layout.addWidget(direction_1)
        grp_direction_layout.addWidget(direction_2)

        grp_direction.setLayout(grp_direction_layout)

        grp_option = QGroupBox("옵션")
        option_1 = QRadioButton("글자 겹치지 않게")
        option_1.setToolTip(
            "퍼즐이 쉬워집니다. <p style='white-space:pre'>채워지는 글자는 되도록 <font color='yellow'>겹치지 않도록</font> 설정합니다."
        )
        option_1.setChecked(True)
        option_2 = QRadioButton("글자 무작위로")
        option_2.setToolTip(
            "퍼즐 난이도는 보통입니다. <p style='white-space:pre'>채워지는 글자는 되도록 <font color='yellow'>무작위로</font> 설정합니다."
        )
        option_3 = QRadioButton("글자 겹치게")
        option_3.setToolTip(
            "<p style='white-space:pre'>퍼즐이 어려워집니다. <p style='white-space:pre'>채워지는 글자는 되도록 <font color='yellow'>겹치도록</font> 설정합니다."
        )
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

    @pyqtSlot(int)
    def puzzle_width_change(self, value):
        self.puzzle_width = value
        self.c.puzzle_setting.emit(
            [self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val]
        )

    @pyqtSlot(int)
    def puzzle_height_change(self, value):
        self.puzzle_height = value
        self.c.puzzle_setting.emit(
            [self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val]
        )

    @pyqtSlot(QRadioButton)
    def diff_checked(self, diff):
        text = diff.text()
        if text == "가로세로":
            self.shape = 0
        elif text == "가로세로 + 대각선":
            self.shape = 2
        elif text == "정방향":
            self.direction = 1
        elif text == "정방향 + 역방향":
            self.direction = 2

        self.diff_val = self.shape + self.direction
        self.c.puzzle_setting.emit(
            [self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val]
        )

    @pyqtSlot(QRadioButton)
    def option_checked(self, option):
        text = option.text()
        if text == "글자 겹치지 않게":
            self.option_val = 0
        elif text == "글자 무작위로":
            self.option_val = 1
        elif text == "글자 겹치게":
            self.option_val = 2

        self.c.puzzle_setting.emit(
            [self.puzzle_width, self.puzzle_height, self.diff_val, self.option_val]
        )


class EnterWords(EnterWords):
    def init_UI(self):
        # Title for widget
        title = QLabel("2, 단어를 입력세요.")
        self.grid.addWidget(title, 0, 0)
        super(EnterWords, self).init_UI()

    def set_words(self):
        search_target = self.input_words.toPlainText()
        regex = r"[a-zA-Z]+_?[a-zA-Z]+"
        self.words = list({word.lower() for word in re.findall(regex, search_target)})
        if not self.words:
            regex = r"[가-힣]+_?[가-힣]+"
            self.words = list(
                {word.lower() for word in re.findall(regex, search_target)}
            )
            self.c.korean.emit(True)
        else:
            self.c.korean.emit(False)
        return self.words


class DownloadImage(DownloadImage):
    def __init__(self, c):
        super(DownloadImage, self).__init__(c)
        # initial puzzle settings
        self.width, self.height, self.diff, self.option = 15, 15, 1, 0
        # initialize download numbers
        self.picture_on = False
        # initialize language mode
        self.korean = False
        # initialize chosung or scramble mode
        self.chosung_scramable = False
        # initialize uppercase mode
        self.uppercase = False

    def init_UI(self):
        # Title for widget
        title = QLabel("3. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)

        super(DownloadImage, self).init_UI()
        # get data of puzzle settings
        self.c.puzzle_setting.connect(self.puzzle_setting)
        # see if its korean or english/ default is english
        self.c.korean.connect(self.korean_on)

        self.uppercase_checkbox = QCheckBox("대문자", self)
        self.uppercase_checkbox.stateChanged.connect(self.uppercase_checkbox_on)

        self.chosung_scramable_checkBox = QCheckBox("scramble word", self)
        self.chosung_scramable_checkBox.setToolTip("단어의 철자가 뒤섞여서 제시됩니다.")
        self.chosung_scramable_checkBox.stateChanged.connect(self.chosung_scramable_on)

        self.make_puzzle_bt = QPushButton("Word Search\n퍼즐 만들기")
        self.make_puzzle_bt.clicked.connect(self.make_puzzle)
        self.make_puzzle_bt.setToolTip("단축키 : Ctrl + D")
        self.make_puzzle_bt.setShortcut("Ctrl+D")
        self.vbox.addWidget(self.uppercase_checkbox)

        self.make_puzzle_all_bt = QPushButton("한번에 만들기")
        self.make_puzzle_all_bt.clicked.connect(self.make_all_puzzle)

        self.vbox.addWidget(self.chosung_scramable_checkBox)
        self.vbox.addWidget(self.make_puzzle_bt)
        self.vbox.addWidget(self.make_puzzle_all_bt)

    # define puzzle settings
    @pyqtSlot(list)
    def puzzle_setting(self, puzzle_setting):
        self.width, self.height, self.diff, self.option = (
            puzzle_setting[0],
            puzzle_setting[1],
            puzzle_setting[2],
            puzzle_setting[3],
        )

    @pyqtSlot(bool)
    def korean_on(self, bool):
        self.korean = bool
        if bool is True:
            self.chosung_scramable_checkBox.setText("초성")
            self.chosung_scramable_checkBox.setToolTip("단어의 초성으로 제시됩니다.")
            self.make_puzzle_bt.setText("낱말 퍼즐\n 만들기")
            self.uppercase_checkbox.close()
        else:
            self.chosung_scramable_checkBox.setText("scramble word")
            self.chosung_scramable_checkBox.setToolTip("단어의 철자가 뒤섞여서 제시됩니다.")
            self.make_puzzle_bt.setText("Word Search\n퍼즐 만들기")
            self.uppercase_checkbox.show()
        self.make_puzzle_bt.setToolTip("단축키 : Ctrl + D")
        self.make_puzzle_bt.setShortcut("Ctrl+D")

    @pyqtSlot()
    def uppercase_checkbox_on(self):
        if self.uppercase_checkbox.isChecked() is True:
            self.uppercase = True
        else:
            self.uppercase = False

    @pyqtSlot()
    def chosung_scramable_on(self):
        if self.chosung_scramable_checkBox.isChecked() is True:
            self.chosung_scramable = True
        else:
            self.chosung_scramable = False

    def enable_buttons(self):
        self.download_bt.setEnabled(True)
        self.make_puzzle_bt.setEnabled(True)
        self.make_puzzle_all_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

    def disable_buttons(self):
        self.download_bt.setEnabled(False)
        self.make_puzzle_bt.setEnabled(False)
        self.make_puzzle_all_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

    @pyqtSlot()
    def make_puzzle(self):
        if self.tree.topLevelItemCount() == 0:
            self.start_download()
            return

        self.disable_buttons()

        word_image = self.get_word_img()

        self.path = self.get_save_hwp_dir()
        if self.path:
            puzzle_worker = PuzzleWorker(
                wordsearch_generater.MakeWordSearch,
                'puzzle',
                word_image,
                self.width,
                self.height,
                self.diff,
                self.option,
                self.picture_on,
                self.korean,
                self.chosung_scramable,
                self.uppercase,
                self.path,
            )
            puzzle_worker.signal.puzzle_complete.connect(self.puzzle_finish)
            puzzle_worker.signal.recursionerrormsg.connect(self.recurerrormsg)
            puzzle_worker.signal.valueerrormsg.connect(self.valerrormsg)
            self.threadpool.start(puzzle_worker)
        else:
            self.enable_buttons()

    @pyqtSlot()
    def make_all_puzzle(self):
        if self.tree.topLevelItemCount() == 0:
            self.start_download()
            return

        self.disable_buttons()

        word_image = self.get_word_img()

        self.path = self.get_save_hwp_dir()
        if self.path:
            for diff in range(1, 5):
                puzzle_worker = PuzzleWorker(
                    wordsearch_generater.MakeWordSearch,
                    f'난이도{diff} puzzle',
                    word_image,
                    self.width + diff,
                    self.height + diff,
                    diff,
                    self.option,
                    self.picture_on,
                    self.korean,
                    self.chosung_scramable,
                    self.uppercase,
                    self.path,
                )
                puzzle_worker.signal.puzzle_complete.connect(self.puzzle_finish)
                puzzle_worker.signal.recursionerrormsg.connect(self.recurerrormsg)
                puzzle_worker.signal.valueerrormsg.connect(self.valerrormsg)
                self.threadpool.start(puzzle_worker)
        else:
            self.enable_buttons()

    def get_word_img(self):
        word_image = []
        if self.picture_on:
            iterator = QTreeWidgetItemIterator(
                self.tree, QTreeWidgetItemIterator.HasChildren
            )
        else:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.All)
            if iterator.value() is None:
                self.c.press_set_keyword_bt.emit()
                q = QMessageBox(self)
                q.information(
                    self,
                    "information",
                    "검색어 키워드가 존재하지 않아요. 그래서 검색어 키워드 버튼을 대신 눌렀습니다~.",
                    QMessageBox.Ok,
                )
                self.enable_buttons()
                return
        while iterator.value():
            item = iterator.value()
            word = item.data(0, 0)
            pic = ""
            if self.picture_on:
                pic = item.path
                if not os.path.exists(pic):
                    self.c.press_set_keyword_bt.emit()
                    self.enable_buttons()
                    q = QMessageBox(self)
                    q.information(
                        self,
                        "information",
                        "선택하신 이미지가 존재하지 않습니다. 다시 다운로드 눌러주세요.",
                        QMessageBox.Ok,
                    )
                    return
            if word.strip().find(" ") != -1:
                if self.korean:
                    word = "가".join(word.split())
                else:
                    word = "a".join(word.split())
            word_image.append([word, pic])
            iterator += 1
        return word_image

    def get_save_hwp_dir(self):
        file_path = os.path.join(os.getcwd(), "dir_path.json")
        is_dir_path = os.path.exists(file_path)
        if is_dir_path:
            with open(file_path) as f:
                data = json.load(f)
            if "hwp_dir" in data.keys():
                dir_path = data["hwp_dir"]
                return dir_path
            else:
                q = QMessageBox(self)
                q.information(self, "information", "퍼즐을 저장할 폴더를 선택하세요.", QMessageBox.Ok)
                fname = str(QFileDialog.getExistingDirectory(self, "퍼즐을 저장할 폴더"))
                if fname:
                    data["hwp_dir"] = fname
                    with open(file_path, "w") as f:
                        json.dump(data, f)
                    dir_path = fname
                    return dir_path
                else:
                    return
        else:
            q = QMessageBox(self)
            q.information(self, "information", "퍼즐을 저장할 폴더를 선택하세요.", QMessageBox.Ok)
            fname = str(QFileDialog.getExistingDirectory(self, "퍼즐을 저장할 폴더"))
            if fname:
                with open(file_path, "w") as f:
                    json.dump({"hwp_dir": fname}, f)
                dir_path = fname
                return dir_path
            else:
                return

    @pyqtSlot()
    def puzzle_finish(self):
        q = QMessageBox(self)
        q.information(
            self, "information", "{}에 퍼즐 파일이 저장되었습니다.".format(self.path), QMessageBox.Ok
        )
        self.enable_buttons()

    @pyqtSlot()
    def recurerrormsg(self):
        q = QMessageBox(self)
        q.warning(self, "Warning", "단어의 개수에 비해서 퍼즐의 크기가 너무 작습니다.", QMessageBox.Ok)
        self.enable_buttons()

    @pyqtSlot()
    def valerrormsg(self):
        q = QMessageBox(self)
        q.warning(self, "Warning", "퍼즐의 크기에 비해 단어가 너무 길어요.", QMessageBox.Ok)
        self.enable_buttons()


# thread to download pictures while not stopping the Gui
class PuzzleWorker(QRunnable):
    def __init__(self, fn, filename, *args, **kwargs):
        super(PuzzleWorker, self).__init__()
        self.fn = fn
        self.filename = filename
        self.args = args
        self.kwargs = kwargs
        self.signal = Communication()

    @pyqtSlot()
    def run(self):
        try:
            self.filename
            self.fn(*self.args, **self.kwargs).make_puzzle(self.filename)
            self.signal.puzzle_complete.emit()
        except RecursionError:
            self.signal.recursionerrormsg.emit()
        except ValueError:
            self.signal.valueerrormsg.emit()


class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle("Word Puzzle generator")
        self.setWindowIcon(QIcon("wordsearch.ico"))
        c = Communication()
        self.vbox.addWidget(Settings(c))
        self.enterwords_widget = EnterWords(c)
        self.vbox.addWidget(self.enterwords_widget)
        self.vbox.addWidget(DownloadImage(c))
        self.vbox.setStretch(0, 1)
        self.vbox.setStretch(1, 1)
        self.vbox.setStretch(2, 7)
        self.addsettingmenu()
        self.addhelpmenu()

    def addsettingmenu(self):
        self.settings_menu = self.mainMenu.addMenu("설정")
        self.set_grad_class_Button = QAction("학년 반 설정하기", self)
        self.set_grad_class_Button.triggered.connect(self.grade_class_dialog)
        self.settings_menu.addAction(self.set_grad_class_Button)

        self.reset_grade_class_Button = QAction("학년 반 초기화하기", self)
        self.reset_grade_class_Button.triggered.connect(self.reset_grade_class)
        self.settings_menu.addAction(self.reset_grade_class_Button)

    def addhelpmenu(self):
        self.help_menu = self.mainMenu.addMenu("도움말")

        self.puzzle_option_menu = self.help_menu.addMenu("퍼즐 옵션")
        self.shape_help = QAction("단어 모양은 무슨 뜻인가요?")
        # self.shape_help.triggered.connect(self.)
        self.puzzle_option_menu.addAction(self.shape_help)

        self.direction_help = QAction("단어 방향은 무슨 뜻인가요?")
        # self.direction_help.triggered.connect(self.)
        self.puzzle_option_menu.addAction(self.direction_help)

        self.option_help = QAction("옵션에서 글자를 겹치게 한다는 것은 무슨 뜻인가요?")
        # self.option_help.triggered.connect(self.)
        self.puzzle_option_menu.addAction(self.option_help)

        self.enter_words_menu = self.help_menu.addMenu("단어 입력")
        self.enterword_help = QAction("단어는 어떻게 입력하나요?")
        # self.enterword_help.triggered.connect(self.)
        self.enter_words_menu.addAction(self.enterword_help)

        self.prefix_help = QAction("실제 사진이 아니라 케릭터 사진을 원하면 어떻게 하나요?")
        # self.prefix_help.triggered.connect(self.)
        self.enter_words_menu.addAction(self.prefix_help)

        self.download_images_menu = self.help_menu.addMenu("이미지")
        self.keyword_help = QAction("원하는 이미지가 안 나올 때는 어떻게 하나요?")
        # self.keyword_help.triggered.connect(self.grade_class_dialog)
        self.download_images_menu.addAction(self.keyword_help)

        self.searchnum_help = QAction("이미지 검색 개수를 어떻게 바꾸나요?")
        # self.searchnum_help.triggered.connect(self.grade_class_dialog)
        self.download_images_menu.addAction(self.searchnum_help)

        self.changepic_help = QAction("원하는 이미지로 어떻게 변경하나요?")
        # self.changepic_help.triggered.connect(self.)
        self.download_images_menu.addAction(self.changepic_help)

        self.scramble_help = QAction("scramble word를 체크하면 어떻게 되나요?")
        # self.scramble_help.triggered.connect(self.)
        self.help_menu.addAction(self.scramble_help)

    def grade_class_dialog(self):
        self.grade_class_input = QWidget()
        hbox_grade = QHBoxLayout()
        grade_label = QLabel("학년")
        self.grade_spin = QSpinBox()
        self.grade_spin.setMinimum(1)
        self.grade_spin.setMaximum(6)
        hbox_grade.addWidget(grade_label)
        hbox_grade.addWidget(self.grade_spin)
        hbox_class = QHBoxLayout()
        class_label = QLabel("반")
        self.class_spin = QSpinBox()
        self.class_spin.setMinimum(1)
        hbox_class.addWidget(class_label)
        hbox_class.addWidget(self.class_spin)

        if os.path.exists("hwp_settings.json"):
            with open("hwp_settings.json") as f:
                data = json.load(f)
                self.grade_spin.setValue(data["grade"])
                self.class_spin.setValue(data["class"])

        ok_button = QPushButton("확인")
        ok_button.clicked.connect(self.set_grade_class)

        vbox_display = QVBoxLayout()
        vbox_display.addLayout(hbox_grade)
        vbox_display.addLayout(hbox_class)
        vbox_display.addWidget(ok_button)

        self.grade_class_input.setLayout(vbox_display)
        self.grade_class_input.show()

    def set_grade_class(self):
        self.grade = self.grade_spin.value()
        self.class_ = self.class_spin.value()
        data = dict()
        data["grade"] = self.grade
        data["class"] = self.class_
        with open("hwp_settings.json", "w") as f:
            json.dump(data, f)
        self.grade_class_input.close()

    def reset_grade_class(self):
        if os.path.exists("hwp_settings.json"):
            os.unlink("hwp_settings.json")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())
