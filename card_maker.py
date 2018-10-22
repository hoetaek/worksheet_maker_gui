from PyQt5.QtWidgets import QApplication, QHBoxLayout, QVBoxLayout, QDoubleSpinBox, QWidget, QPushButton, QLabel, QSpinBox, QMessageBox, QFileDialog
from card_generator import *
import qdarkstyle
import sys

class MakeCard(QWidget):
    def __init__(self):
        super().__init__()
        self.init_UI()

    def init_UI(self):
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

        self.setLayout(vbox_display)
        self.setWindowTitle("카드 만들기 설정창")
        self.show()


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
        path = self.save_dir()
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
            self.close()

    def save_dir(self):
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


import traceback
# Catch Exception
def my_excepthook(type, value, tback):
    # log the exception here
    # then call the default handler
    traceback_text = ''.join(traceback.format_tb(tback))
    # send_error_to_form(traceback_text + str(type) + str(value))
    sys.__excepthook__(type, value, tback)
    exit(1)

if __name__ == '__main__':
    sys.excepthook = my_excepthook
    app = QApplication(sys.argv)
    ex = MakeCard()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())