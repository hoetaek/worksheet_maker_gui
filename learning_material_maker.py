import dobble_maker, word_flicker_maker, word_worksheet_maker, wordsearch_maker
from PyQt5.QtWidgets import QAbstractButton, QMainWindow, QApplication
from PyQt5.QtGui import QPainter, QPixmap
from PyQt5.QtCore import Qt
import qdarkstyle
import sys

class PicButton(QAbstractButton):
    def __init__(self, pixmap, parent=None):
        super(PicButton, self).__init__(parent)
        self.pixmap = pixmap

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.drawPixmap(event.rect(), self.pixmap)

    def sizeHint(self):
        return self.pixmap.size()

class App(QMainWindow):
    def __init__(self):
        super().__init__()
        self.left = 0
        self.top = 0
        self.width = 800
        self.height = 800
        self.initUI()

    def initUI(self):
        self.setGeometry(self.left, self.top, self.width, self.height)
        self.setAutoFillBackground(True)
        p = self.palette()
        p.setColor(self.backgroundRole(), Qt.white)
        self.setPalette(p)
        btn = PicButton(QPixmap('hello.png'), self)
        btn.pressed.connect(self.println)
        btn.move(0, 0)
        btn.resize(80,80)
        self.show()

    def println(self):
        print('hello')

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = App()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())