import sys
from PyQt5.QtWidgets import QApplication, QPushButton,QMainWindow,QWidget
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import pyqtSlot

class App1(QWidget):

    def __init__(self):
        super().__init__()
        self.title = 'open window'
        self.left = 60
        self.top = 60
        self.width = 320
        self.height = 200
        self.initUI()

    def initUI(self):
        self.setWindowTitle(self.title)
        # self.setGeometry(self.left, self.top, self.width, self.height)

        self.show()


class App(QMainWindow):

    def __init__(self):
        super().__init__()
        self.title = 'PyQt5 button - pythonspot.com'
        self.left = 200
        self.top = 200
        self.width = 320
        self.height = 200
        self.initUI()

    def initUI(self):
        self.setWindowTitle(self.title)
        self.setGeometry(self.left, self.top, self.width, self.height)

        button = QPushButton('PyQt5 button', self)
        button.setToolTip('This is an example button')
        button.move(100, 70)
        button.clicked.connect(self.on_click)

        self.show()


    @pyqtSlot()
    def on_click(self):
        self.ex1 = QWidget()
        self.ex1.show()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = App()

    sys.exit(app.exec_())