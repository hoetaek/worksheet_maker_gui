from basic_gui import *
from PyQt5.QtWidgets import QHBoxLayout, QTreeWidgetItemIterator
from PyQt5.QtGui import QIcon
from ppt_dobble_generator import *

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

        title = QLabel("1. 카드 한 장에 들어가는 그림의 개수를 정하세요.")
        grid.addWidget(title)

        label_set_pic_num = QLabel('그림 개수 :')
        self.pic_num = QSpinBox()
        self.pic_num.setMinimum(3)
        self.pic_num.setMaximum(9)
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
        hbox_label_remaining = QHBoxLayout()
        hbox_label_remaining.addWidget(self.label_remaining)
        hbox_label_remaining.setAlignment(Qt.AlignRight)

        self.c.pic_num_changed.connect(self.set_word_num)
        self.input_words.textChanged.connect(self.get_remaining)

        hbox.addWidget(title)
        hbox.addLayout(hbox_label_remaining)
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

    @pyqtSlot(int)
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
        self.text_image = True

    def init_UI(self):
        # Title for widget
        title = QLabel("3. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()
        # Download the images right away
        self.c.set_keyword.connect(self.start_download)
        self.c.pic_num_changed.connect(self.get_pic_num)
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

    @pyqtSlot(int)
    def get_pic_num(self, pic_num):
        self.pic_num = pic_num

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
                    q.information(self, 'information', '선택하신 이미지가 존재하지 않습니다. 사진을 다시 업데이트합니다..', QMessageBox.Ok)
                    return
            word_image.append([word, pic])
            iterator += 1

        # word and image path is stored in list word_image

        # the index of the word_image we should retrieve in order to generate dobble
        dobble = GenerateDobbleIndex(self.pic_num)
        dobble_index = dobble.get_dobble_index()

        # list of word, image_path from word_image according to dobble_index
        card_list = [word_image[i] for i in dobble_index]

        self.path = self.get_save_dobble_dir()
        if self.path:
            # put the images into the ppt
            ppt_card_maker = PptCardMaker(card_list, self.pic_num)
            ppt_picture = ppt_card_maker.make_card_with_picture(self.path)
            convert_worker = ConvertWorker(ConvertPptToPng, ppt_picture)
            convert_worker.signal.convert_complete.connect(self.finish_makedobblePpt)
            self.threadpool.start(convert_worker)
            q = QMessageBox(self)
            q.information(self, 'information', '도블 카드 피피티를 완성했습니다. 도블 카드를 사진으로 추출중입니다. 조금만 기다려주세요~^^', QMessageBox.Ok)
        else:
            self.enable_buttons()

    def get_save_dobble_dir(self):
        file_path = os.path.join(os.getcwd(), 'dir_path.json')
        is_dir_path = os.path.exists(file_path)
        if is_dir_path:
            with open(file_path) as f:
                data = json.load(f)
            if 'dobble_dir' in data.keys():
                dir_path = data['dobble_dir']
                return dir_path
            else:
                q = QMessageBox(self)
                q.information(self, 'information', '도블을 저장할 폴더를 선택하세요.', QMessageBox.Ok)
                fname = str(QFileDialog.getExistingDirectory(self, "도블을 저장할 폴더"))
                if fname:
                    data['dobble_dir'] = fname
                    with open(file_path, 'w') as f:
                        json.dump(data, f)
                    dir_path = fname
                    return dir_path
                else:
                    return
        else:
            q = QMessageBox(self)
            q.information(self, 'information', '도블을 저장할 폴더를 선택하세요.', QMessageBox.Ok)
            fname = str(QFileDialog.getExistingDirectory(self, "도블을 저장할 폴더"))
            if fname:
                with open(file_path, 'w') as f:
                    json.dump({'dobble_dir': fname}, f)
                dir_path = fname
                return dir_path
            else:
                return

    @pyqtSlot()
    def finish_makedobblePpt(self):
        self.enable_buttons()
        q = QMessageBox(self)
        q.information(self, 'information', '도블 카드를 완성했습니다. 파일은 {}에 저장했습니다. 이용해주셔서 감사합니다^ㅇ^'.format(self.path), QMessageBox.Ok)

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