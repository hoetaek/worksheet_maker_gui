from basic_gui import *
from PyQt5.QtWidgets import (QRadioButton, QGroupBox, QCheckBox, QHBoxLayout, QTreeWidgetItemIterator)
from PyQt5.QtGui import QIcon


class DownloadImage(DownloadImage):
    def init_UI(self):
        # Title for widget
        title = QLabel("3. 이미지를 선택하세요.")
        self.grid.addWidget(title, 0, 0)
        super(DownloadImage, self).init_UI()

class PresentationOrder(QWidget):
    def __init__(self):
        super().__init__()
        self.init_UI()

    def init_UI(self):
        pass

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