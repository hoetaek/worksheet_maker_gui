from basic_gui import *
from PyQt5.QtWidgets import (QRadioButton, QGroupBox, QCheckBox, QHBoxLayout, QTreeWidgetItemIterator, QAbstractItemView, QSizePolicy)
from PyQt5.QtGui import QIcon
from word_flicker_generator import PptWordFlickerMaker

class Communication(Communication):
    super(Communication)
    flicker_complete = pyqtSignal()

class DownloadImage(DownloadImage):
    def init_UI(self):
        # Title for widget
        title = QLabel("3. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()
        self.make_flicker_bt = QPushButton("\n다음\n")
        self.make_flicker_bt.clicked.connect(self.choose_slide)
        self.vbox.addWidget(self.make_flicker_bt)

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


class FlickerWorker(QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super(FlickerWorker, self).__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signal = Communication()

    @pyqtSlot()
    def run(self):
        self.fn(*self.args, **self.kwargs).make_word_flicker_slide('.')
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
        self.tree_master_slide.setDragDropMode(QAbstractItemView.DragDrop)
        self.tree_master_slide.setColumnCount(1)
        self.tree_master_slide.setHeaderLabels(['슬라이드를 고르세요.'])

        # TreeWidget 1
        self.tree_slide_order = QTreeWidget(self)
        self.tree_slide_order.setColumnCount(1)
        self.tree_slide_order.setHeaderLabels(['슬라이드 순서'])

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
        button_layout = QHBoxLayout()
        button_layout.addStretch(1)
        button_layout.addWidget(make_flicker_bt)

        main_layout = QVBoxLayout()
        main_layout.addLayout(tree_layout)
        main_layout.addLayout(button_layout)
        main_layout.setStretch(0, 500)
        main_layout.setStretch(1, 1)

        self.setLayout(main_layout)

        # 데이터 초기화
        data = [os.path.join('flicker_example', file) for file in os.listdir('flicker_example')]

        parent = QTreeWidget.invisibleRootItem(self.tree_master_slide)
        for i, d in enumerate(data):
            item = self.make_tree_item(d)
            item.num = i
            parent.addChild(item)

        # size = self.tree_master_slide.topLevelItem(0).sizeHint(1)
        # print(size)
        # self.tree_master_slide.resize()
        # 시그널 설정
        self.pb_move_right.clicked.connect(self.move_item)
        self.pb_move_left.clicked.connect(self.move_item)
        self.show()

    def make_tree_item(self, picture):
        picture = QPixmap(picture)
        item = QTreeWidgetItem()
        # TODO 슬라이드 비율 유지
        item.setData(0, 1, picture.scaled(MainWindow.y//10, MainWindow.y//10))
        return item

    # 아이템 이동
    # sender를 이용하여 어느 위젯이 보낸 신호인지 알 수 있습니다.
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

    def make_flicker(self):
        slide_num = [self.tree_slide_order.topLevelItem(i).num for i in range(self.tree_slide_order.topLevelItemCount())]
        flicker_worker = FlickerWorker(PptWordFlickerMaker, self.word_image, slide_num)
        flicker_worker.signal.flicker_complete.connect(self.flicker_finish)
        self.threadpool.start(flicker_worker)

    def flicker_finish(self):
        print('ppt complete')
        self.close()

class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()

    def init_UI(self):
        super(MainWindow, self).init_UI()
        self.setWindowTitle('Word flicker generator')
        # Set icon for application
        c = Communication()
        self.vbox.addWidget(EnterWords(c))
        self.vbox.addWidget(DownloadImage(c))
        self.vbox.setStretch(0, 1)
        self.vbox.setStretch(1, 7)


if __name__ == '__main__':

    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())