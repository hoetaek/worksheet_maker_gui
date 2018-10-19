from basic_gui import *
from PyQt5.QtWidgets import QHBoxLayout, QTreeWidgetItemIterator, QDoubleSpinBox
from PyQt5.QtGui import QIcon
from ppt_dobble_generator import *
from word_flicker_maker import ChooseSlide, FlickerWorker
from card_generator import *

class Communication(Communication):
    super(Communication)
    pic_num_changed = pyqtSignal(int)
    word_changed = pyqtSignal(list)
    convert_complete = pyqtSignal()
    flicker_complete = pyqtSignal()

# Spinbox that accepts numbers that are n-1 : a prime number
class SpinBox(QSpinBox):
    def __init__(self, parent=None):
        super(SpinBox, self).__init__(parent=parent)
        self.before_value = self.value()
        self.valueChanged.connect(self.onValueChanged)

    def onValueChanged(self, i):
        differ = i - self.before_value
        num = i - 1
        if not self.is_prime(num):
            while not self.is_prime(num):
                if differ > 0:
                    num += 1
                else:
                    num -= 1
            self.setValue(num + 1)
            self.before_value = num + 1
        else:
            self.setValue(num + 1)
            self.before_value = num + 1

    def is_prime(self, n):
        return all([(n % j) for j in range(2, int(n ** 0.5) + 1)]) or n == 4

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
        self.pic_num = SpinBox()
        self.pic_num.setMinimum(3)
        self.pic_num.setMaximum(8)
        self.pic_num.setValue(6)
        self.pic_num.valueChanged.connect(self.change_word_num)

        hbox = QHBoxLayout()
        hbox.addWidget(label_set_pic_num)
        hbox.addWidget(self.pic_num)
        hbox.addStretch(1)

        grid.addLayout(hbox, 1, 0, 1, 2)

        self.label_word_num = QLabel('총 {}개의 단어를 입력해주세요.'.format(31))
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
        self.word_num = 31
        self.pic_num = 6
        super(EnterWords, self).__init__(c)

    def init_UI(self):
        super(EnterWords, self).init_UI()

        hbox = QHBoxLayout()
        title = QLabel('2, 단어를 입력세요.')
        self.label_remaining = QLabel("필요한 단어 : {}개".format(31))
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
        self.keywords = [word.replace('_', ' ') + ' ' + self.line_suffix.text() for word in self.words]
        self.words = [word.replace('_', ' ') for word in self.words]
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
        self.pic_num = 6
        self.picture_on = False
        self.text_image = True

    def init_UI(self):
        # Title for widget
        title = QLabel("3. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()
        self.c.pic_num_changed.connect(self.get_pic_num)
        self.every_search_num.setMinimum(0)
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

    def get_word_image(self):
        word_image = []
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

        # word and image path is stored in list word_image
        return word_image

    @pyqtSlot()
    def start_makedobblePpt(self):
        word_image = self.get_word_image()

        # the index of the word_image we should retrieve in order to generate dobble
        dobble = GenerateDobbleIndex(self.pic_num)
        dobble_index = dobble.get_dobble_index()

        # list of word, image_path from word_image according to dobble_index
        card_list = [word_image[i] for i in dobble_index]

        self.path = self.get_save_dobble_dir()
        if self.path:
            # put the images into the ppt
            ppt_choose_card_width = PptCardMaker(card_list, self.pic_num)
            ppt_picture = ppt_choose_card_width.make_card_with_picture(self.path)
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
        self.c = Communication()
        self.vbox.addWidget(Settings(self.c))
        self.enterwords_widget = EnterWords(self.c)
        self.vbox.addWidget(self.enterwords_widget)
        self.download_widget = DownloadImage(self.c)
        self.vbox.addWidget(self.download_widget)
        self.vbox.setStretch(0, 1)
        self.vbox.setStretch(1, 1)
        self.vbox.setStretch(2, 7)
        self.addpluginmenu()
        
    def addpluginmenu(self):
        self.plugin_menu = self.mainMenu.addMenu("확장")

        self.make_flicker_Button = QAction('단어 깜빡이 만들기', self)
        self.make_flicker_Button.triggered.connect(self.make_flicker)
        self.plugin_menu.addAction(self.make_flicker_Button)

        self.make_card_Button = QAction('카드 만들기', self)
        self.make_card_Button.triggered.connect(self.make_card)
        self.plugin_menu.addAction(self.make_card_Button)
        self.plugin_menu.addAction(self.make_card_Button)

    def make_flicker(self):
        word_image = self.download_widget.get_word_image()
        self.download_widget.enable_buttons()
        if word_image:
            self.flicker_widget = ChooseSlide(self.c, word_image)

    def make_card(self):
        self.choose_card_width = QWidget()

        margin_label = QLabel("종이의 여백 길이")

        hbox_margin = QHBoxLayout()
        left_margin_label = QLabel("왼쪽: ")
        self.left_margin_spin = QDoubleSpinBox()
        self.left_margin_spin.setSuffix('cm')
        self.left_margin_spin.setDecimals(1)
        self.left_margin_spin.setSingleStep(0.1)
        self.left_margin_spin.setValue(0.5)
        self.left_margin_spin.setMinimum(0.1)
        self.left_margin_spin.setMaximum(10)
        right_margin_label = QLabel("오른쪽: ")
        self.right_margin_spin = QDoubleSpinBox()
        self.right_margin_spin.setSuffix('cm')
        self.right_margin_spin.setDecimals(1)
        self.right_margin_spin.setSingleStep(0.1)
        self.right_margin_spin.setValue(0.5)
        self.right_margin_spin.setMinimum(0.1)
        self.right_margin_spin.setMaximum(10)

        if os.path.exists('hwp_margin_settings.json'):
            with open('hwp_margin_settings.json') as f:
                data = json.load(f)
                self.left_margin_spin.setValue(data['left_margin'])
                self.right_margin_spin.setValue(data['right_margin'])

        hbox_margin.addWidget(left_margin_label)
        hbox_margin.addWidget(self.left_margin_spin)
        hbox_margin.addWidget(right_margin_label)
        hbox_margin.addWidget(self.right_margin_spin)

        hbox_card_width = QHBoxLayout()
        card_width_label = QLabel("1줄당 카드의 개수: ")
        self.card_width_spin = QSpinBox()
        self.card_width_spin.setValue(3)
        self.card_width_spin.setMinimum(1)
        hbox_card_width.addWidget(card_width_label)
        hbox_card_width.addWidget(self.card_width_spin)

        ok_button = QPushButton("확인")
        ok_button.clicked.connect(self.card_maker)

        vbox_display = QVBoxLayout()
        vbox_display.addWidget(margin_label)
        vbox_display.addLayout(hbox_margin)
        vbox_display.addLayout(hbox_card_width)
        vbox_display.addWidget(ok_button)

        self.choose_card_width.setLayout(vbox_display)
        self.choose_card_width.setWindowTitle("카드 만들기 설정창")
        self.choose_card_width.show()

    def set_margin_size(self):
        data = dict()
        data['left_margin'] = self.left_margin_spin.value()
        data['right_margin'] = self.right_margin_spin.value()
        with open('hwp_margin_settings.json', 'w') as f:
            json.dump(data, f)

    def card_maker(self):
        self.set_margin_size()
        q = QMessageBox(QMessageBox.Information, "카드 이미지 폴더 선택", '카드 이미지들이 저장되어 있는 폴더를 선택하세요.')
        q.setStandardButtons(QMessageBox.Ok)
        q.exec_()
        path = self.download_widget.get_save_dobble_dir()
        image_dir = str(QFileDialog.getExistingDirectory(self, "도블 카드 이미지가 담긴 폴더", path))
        if image_dir:
            width = self.card_width_spin.value()
            wordcardworksheet = WordCardWorksheet(image_dir, width, path).make_worksheet()
            if wordcardworksheet != 'error':
                q = QMessageBox(QMessageBox.Information, "카드 만들기 완료", '카드가 완성되었습니다. {}에 저장되어 있습니다.'.format(path))
                q.setStandardButtons(QMessageBox.Ok)
                q.exec_()
            else:
                q = QMessageBox(QMessageBox.Warning, "에러 발생", '에러가 발생하였습니다. 올바른 폴더를 선택해주세요.'.format(path))
                q.setStandardButtons(QMessageBox.Ok)
                q.exec_()
        self.choose_card_width.close()

if __name__ == '__main__':

    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())