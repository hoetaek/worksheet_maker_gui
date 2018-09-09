from basic_gui import *
from PyQt5.QtGui import QIcon


class MainWindow(MainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()
        self.robot()
    def robot(self):
        w = QWidget()
        w.show()

class example(QWidget):
    def __init__(self):
        super(example, self).__init__()
        self.init_UI()
    def init_UI(self):
        vbox = QVBoxLayout()
        lab = QLabel("hello")
        vbox.addWidget(lab)

        self.setLayout(vo)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = MainWindow()
    app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    sys.exit(app.exec_())