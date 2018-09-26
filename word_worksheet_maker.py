from basic_gui import *
from PyQt5.QtWidgets import QHBoxLayout, QTreeWidgetItemIterator
from word_worksheet_generator import WordCardWorksheet

class Communication(Communication):
    super(Communication)
    WS_complete = pyqtSignal()

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

    @pyqtSlot()
    def get_word_num(self):
        self.set_words()
        self.label_num.setText("입력한 단어 : {}개".format(len(self.words)))

class DownloadImage(DownloadImage):
    def init_UI(self):
        # Title for widget
        title = QLabel("2. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()

        self.label_width = QLabel("칸의 개수")
        self.width_spin = QSpinBox()
        self.width_spin.setValue(5)
        self.width_spin.setMinimum(1)

        self.make_WS_bt = QPushButton('단어 활동지\n만들기')
        self.make_WS_bt.pressed.connect(self.start_makedWS)
        self.make_WS_bt.setToolTip("단축키 : Ctrl + D")
        self.make_WS_bt.setShortcut('Ctrl+D')
        self.vbox.addWidget(self.label_width)
        self.vbox.addWidget(self.width_spin)
        self.vbox.addWidget(self.make_WS_bt)

    def start_makedWS(self):
        word_image = []
        self.disable_buttons()
        if self.tree.topLevelItemCount() == 0:
            self.start_download()
            return

        self.disable_buttons()
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
            else:
                self.start_download()
                q = QMessageBox(self)
                q.information(self, 'information', '사진이 존재하지 않습니다. 이미지 다운로드를 눌렀습니다.', QMessageBox.Ok)
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
                    q.information(self, 'information', '선택하신 이미지가 존재하지 않습니다. 사진을 다시 업데이트합니다..', QMessageBox.Ok)
                    return
            word_image.append([word, pic])
            iterator += 1

        self.path = self.get_save_word_wordsheet_dir()
        if self.path:
            worksheet_worker = WorksheetWorker(WordCardWorksheet, word_image, self.width_spin.value(), self.path)
            worksheet_worker.signal.WS_complete.connect(self.finish_makedobblePpt)
            self.threadpool.start(worksheet_worker)

        else:
            self.enable_buttons()

    @pyqtSlot()
    def finish_makedobblePpt(self):
        self.enable_buttons()
        q = QMessageBox(self)
        q.information(self, 'information', '단어 활동지를 완성했습니다. 파일은 {}에 저장했습니다. 이용해주셔서 감사합니다^ㅇ^'.format(self.path),
                      QMessageBox.Ok)

    def get_save_word_wordsheet_dir(self):
        file_path = os.path.join(os.getcwd(), 'dir_path.json')
        is_dir_path = os.path.exists(file_path)
        if is_dir_path:
            with open(file_path) as f:
                data = json.load(f)
            if 'WS_dir' in data.keys():
                dir_path = data['WS_dir']
                return dir_path
            else:
                q = QMessageBox(self)
                q.information(self, 'information', '단어 활동지를 저장할 폴더를 선택하세요.', QMessageBox.Ok)
                fname = str(QFileDialog.getExistingDirectory(self, "단어 활동지를 저장할 폴더"))
                if fname:
                    data['WS_dir'] = fname
                    with open(file_path, 'w') as f:
                        json.dump(data, f)
                    dir_path = fname
                    return dir_path
                else:
                    return
        else:
            q = QMessageBox(self)
            q.information(self, 'information', '단어 활동지를 저장할 폴더를 선택하세요.', QMessageBox.Ok)
            fname = str(QFileDialog.getExistingDirectory(self, "단어 활동지를 저장할 폴더"))
            if fname:
                with open(file_path, 'w') as f:
                    json.dump({'WS_dir': fname}, f)
                dir_path = fname
                return dir_path
            else:
                return

    def enable_buttons(self):
        self.download_bt.setEnabled(True)
        self.make_WS_bt.setEnabled(True)
        self.c.enable_set_keyword_bt.emit()

    def disable_buttons(self):
        self.download_bt.setEnabled(False)
        self.make_WS_bt.setEnabled(False)
        self.c.disable_set_keyword_bt.emit()

class WorksheetWorker(QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super(WorksheetWorker, self).__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signal = Communication()

    @pyqtSlot()
    def run(self):
        self.fn(*self.args, **self.kwargs).make_worksheet()
        self.signal.WS_complete.emit()

class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle('단어 활동지 만들기')
        c = Communication()
        self.vbox.addWidget(EnterWords(c))
        self.vbox.addWidget(DownloadImage(c))
        self.vbox.setStretch(0, 1)
        self.vbox.setStretch(1, 7)
        self.addsettingmenu()

    def addsettingmenu(self):
        self.settings_menu = self.mainMenu.addMenu("설정")
        self.set_grad_class_Button = QAction('학년 반 설정하기', self)
        self.set_grad_class_Button.triggered.connect(self.grade_class_dialog)
        self.settings_menu.addAction(self.set_grad_class_Button)

        self.reset_grade_class_Button = QAction('학년 반 초기화하기', self)
        self.reset_grade_class_Button.triggered.connect(self.reset_grade_class)
        self.settings_menu.addAction(self.reset_grade_class_Button)

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

        if os.path.exists('hwp_settings.json'):
            with open('hwp_settings.json') as f:
                data = json.load(f)
                self.grade_spin.setValue(data['grade'])
                self.class_spin.setValue(data['class'])

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
        data['grade'] = self.grade
        data['class'] = self.class_
        with open('hwp_settings.json', 'w') as f:
            json.dump(data, f)
        self.grade_class_input.close()

    def reset_grade_class(self):
        if os.path.exists('hwp_settings.json'):
            os.unlink('hwp_settings.json')

if __name__ == '__main__':

    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())