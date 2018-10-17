from basic_gui import *
from PyQt5.QtWidgets import (QRadioButton, QGroupBox, QCheckBox, QHBoxLayout, QTreeWidgetItemIterator, QAbstractItemView)
from PyQt5.QtGui import QIcon
from word_flicker_generator import PptWordFlickerMaker

class Communication(Communication):
    super(Communication)
    flicker_complete = pyqtSignal()

class EnterWords(EnterWords):
    def init_UI(self):
        # Title for widget
        title = QLabel("1. 피피티에 들어갈 단어들을 입력하세요.")
        self.grid.addWidget(title, 0, 0)
        super(EnterWords, self).init_UI()

class DownloadImage(DownloadImage):
    def init_UI(self):
        # Title for widget
        title = QLabel("2. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()
        self.choose_slide_bt = QPushButton("\n다음\n")
        self.choose_slide_bt.clicked.connect(self.choose_slide)
        self.vbox.addWidget(self.choose_slide_bt)

    def enable_buttons(self):
        super(DownloadImage, self).enable_buttons()
        self.choose_slide_bt.setEnabled(True)

    def disable_buttons(self):
        super(DownloadImage, self).disable_buttons()
        self.choose_slide_bt.setEnabled(False)

    @pyqtSlot()
    def choose_slide(self):
        word_image = []
        if self.tree.topLevelItemCount() == 0:
            self.start_download()
            return

        self.disable_buttons()

        if self.picture_on:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.HasChildren)
        else:
            iterator = QTreeWidgetItemIterator(self.tree, QTreeWidgetItemIterator.All)
            if iterator.value() is None:
                self.c.press_set_keyword_bt.emit()
                q = QMessageBox(self)
                q.information(self, 'information', '검색어 키워드가 존재하지 않아요. 그래서 검색어 키워드 버튼을 대신 눌렀습니다~.', QMessageBox.Ok)
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
                    q.information(self, 'information', '선택하신 이미지가 존재하지 않습니다. 다시 다운로드 눌러주세요.', QMessageBox.Ok)
                    return
            word_image.append([word, pic])
            iterator += 1

        self.slide_widget = ChooseSlide(self.c, word_image)
        self.enable_buttons()

class FlickerWorker(QRunnable):
    def __init__(self, fn, c, *args, **kwargs):
        super(FlickerWorker, self).__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signal = c

    @pyqtSlot()
    def run(self):
        self.fn(*self.args, **self.kwargs).make_word_flicker_slide()
        self.signal.flicker_complete.emit()

class ChooseSlide(QWidget):
    def __init__(self, c, word_image):
        super().__init__()
        self.c = c
        self.threadpool = QThreadPool()
        self.word_image = word_image
        self.Init_UI()

    def Init_UI(self):
        # TreeWidget 1
        self.tree_master_slide = QTreeWidget(self)
        self.tree_master_slide.setColumnCount(1)
        self.tree_master_slide.setHeaderLabels(['슬라이드를 고르세요.'])
        self.tree_master_slide.header().setDefaultAlignment(Qt.AlignHCenter)

        # TreeWidget 1
        self.tree_slide_order = QTreeWidget(self)
        self.tree_slide_order.setColumnCount(1)
        self.tree_slide_order.setHeaderLabels(['슬라이드 순서'])
        self.tree_slide_order.header().setDefaultAlignment(Qt.AlignHCenter)

        # Buttons
        self.pb_move_left = QPushButton("<-")
        self.pb_move_right = QPushButton("->")

        bt_layout = QVBoxLayout()
        bt_layout.addStretch(1)
        bt_layout.addWidget(self.pb_move_left)
        bt_layout.addWidget(self.pb_move_right)
        bt_layout.addStretch(1)

        tree_layout = QHBoxLayout()
        tree_layout.addWidget(self.tree_master_slide)
        tree_layout.addLayout(bt_layout)
        tree_layout.addWidget(self.tree_slide_order)

        make_flicker_bt = QPushButton("단어 깜빡이\n만들기")
        make_flicker_bt.clicked.connect(self.make_flicker)
        hbox = QHBoxLayout()
        hbox.addStretch(1)
        hbox.addWidget(make_flicker_bt)

        main_layout = QVBoxLayout()
        main_layout.addLayout(tree_layout)
        main_layout.addLayout(hbox)

        self.setLayout(main_layout)
        self.resize(MainWindow.y//90*48, MainWindow.y//3*2)
        self.setWindowTitle("슬라이드 선택 창")
        self.show()
        # 데이터 초기화
        data = [os.path.join('flicker_example', file) for file in os.listdir('flicker_example')]
        parent = QTreeWidget.invisibleRootItem(self.tree_master_slide)
        for i, d in enumerate(data):
            item = self.make_tree_item(d)
            item.num = i
            parent.addChild(item)

        # move items according to setting
        self.flicker_settings_path = 'flicker_settings.json'
        if os.path.exists(self.flicker_settings_path):
            with open(self.flicker_settings_path) as f:
                self.flicker_settings = json.load(f)
            for i, n in enumerate(self.flicker_settings['slide_num']):
                item = self.tree_master_slide.takeTopLevelItem(n-i)
                root = QTreeWidget.invisibleRootItem(self.tree_slide_order)
                root.addChild(item)

        # 시그널 설정
        self.pb_move_right.clicked.connect(self.move_item)
        self.pb_move_left.clicked.connect(self.move_item)

    @classmethod
    def make_tree_item(cls, picture):
        picture = QPixmap(picture)
        item = QTreeWidgetItem()
        # 슬라이드 비율 유지
        item.setData(0, 1, picture.scaled(MainWindow.y//90*16, MainWindow.y//10))
        return item

    # 아이템 이동
    # sender를 이용하여 어느 위젯이 보낸 신호인지 알 수 있습니다.
    @pyqtSlot()
    def move_item(self):
        sender = self.sender()
        if self.pb_move_right == sender:
            source_tw = self.tree_master_slide
            target_tw = self.tree_slide_order
        else:
            source_tw = self.tree_slide_order
            target_tw = self.tree_master_slide

        # 현재 선택된 아이템을 꺼내어 반대편 쪽으로 전달
        item = source_tw.takeTopLevelItem(source_tw.indexOfTopLevelItem(source_tw.currentItem()))
        root = QTreeWidget.invisibleRootItem(target_tw)
        root.addChild(item)

    @pyqtSlot()
    def make_flicker(self):
        slide_num = [self.tree_slide_order.topLevelItem(i).num for i in range(self.tree_slide_order.topLevelItemCount())]
        if slide_num:
            self.path = self.get_save_flicker_dir()
            if self.path:
                flicker_setting = dict()
                flicker_setting['slide_num'] = slide_num
                with open(self.flicker_settings_path, 'w') as f:
                    json.dump(flicker_setting, f)
                flicker_worker = FlickerWorker(PptWordFlickerMaker, self.c, self.word_image, slide_num, self.path)
                flicker_worker.signal.flicker_complete.connect(self.flicker_finish)
                self.threadpool.start(flicker_worker)
        else:
            q = QMessageBox(self)
            q.warning(self, 'Warning', '슬라이드를 선택해주세요.', QMessageBox.Ok)

    def get_save_flicker_dir(self):
        file_path = os.path.join(os.getcwd(), 'dir_path.json')
        is_dir_path = os.path.exists(file_path)
        if is_dir_path:
            with open(file_path) as f:
                data = json.load(f)
            if 'flicker_dir' in data.keys():
                dir_path = data['flicker_dir']
                return dir_path
            else:
                q = QMessageBox(self)
                q.information(self, 'information', '단어 깜빡이를 저장할 폴더를 선택하세요.', QMessageBox.Ok)
                fname = str(QFileDialog.getExistingDirectory(self, "단어 깜빡이를 저장할 폴더"))
                if fname:
                    data['flicker_dir'] = fname
                    with open(file_path, 'w') as f:
                        json.dump(data, f)
                    dir_path = fname
                    return dir_path
                else:
                    return
        else:
            q = QMessageBox(self)
            q.information(self, 'information', '단어 깜빡이를 저장할 폴더를 선택하세요.', QMessageBox.Ok)
            fname = str(QFileDialog.getExistingDirectory(self, "단어 깜빡이를 저장할 폴더"))
            if fname:
                with open(file_path, 'w') as f:
                    json.dump({'flicker_dir': fname}, f)
                dir_path = fname
                return dir_path
            else:
                return

    @pyqtSlot()
    def flicker_finish(self):
        q = QMessageBox(self)
        q.information(self, 'information', '단어 깜빡이가 {}에 저장되었습니다'.format(self.path), QMessageBox.Ok)
        self.close()

class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle('Word flicker generator')
        # Set icon for application
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