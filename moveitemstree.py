from PyQt5.QtWidgets import QWidget
from PyQt5.QtWidgets import QTreeWidget
from PyQt5.QtCore import QVariant
from PyQt5.QtWidgets import QTreeWidgetItem
from PyQt5.QtWidgets import QPushButton
from PyQt5.QtWidgets import QBoxLayout
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt


class Form(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("QTreeWidget Column")
        self.HEADER = ['Name']

        # TreeWidget 1
        self.tw_1 = QTreeWidget(self)
        self.tw_1.setColumnCount(1)
        self.tw_1.setHeaderLabels(self.HEADER)

        # TreeWidget 1
        self.tw_2 = QTreeWidget(self)
        self.tw_2.setColumnCount(1)
        self.tw_2.setHeaderLabels(self.HEADER)

        # Buttons
        self.pb_move_left = QPushButton("<-")
        self.pb_move_right = QPushButton("->")

        layout = QBoxLayout(QBoxLayout.LeftToRight)
        layout.addWidget(self.tw_1)
        layout.addWidget(self.tw_2)

        main_layout = QBoxLayout(QBoxLayout.TopToBottom)
        main_layout.addLayout(layout)
        main_layout.addWidget(self.pb_move_right)
        main_layout.addWidget(self.pb_move_left)

        self.setLayout(main_layout)

        # 데이터 초기화
        data = ["Apple", "Banana", "Tomato", "Cherry"]
        parent = QTreeWidget.invisibleRootItem(self.tw_1)
        for d in data:
            item = self.make_tree_item(d)
            parent.addChild(item)

        # 시그널 설정
        self.pb_move_right.clicked.connect(self.move_item)
        self.pb_move_left.clicked.connect(self.move_item)

    @classmethod
    def make_tree_item(cls, name: str):
        item = QTreeWidgetItem()
        item.setText(0, name)
        return item

    # 아이템 이동
    # sender를 이용하여 어느 위젯이 보낸 신호인지 알 수 있습니다.
    def move_item(self):
        sender = self.sender()
        if self.pb_move_right == sender:
            source_tw = self.tw_1
            target_tw = self.tw_2
        else:
            source_tw = self.tw_2
            target_tw = self.tw_1

        # 현재 선택된 아이템을 꺼내어 반대편 쪽으로 전달
        item = source_tw.takeTopLevelItem(source_tw.indexOfTopLevelItem(source_tw.currentItem()))
        root = QTreeWidget.invisibleRootItem(target_tw)
        root.addChild(item)




if __name__ == "__main__":
    import sys
    app = QApplication(sys.argv)
    form = Form()
    form.show()
    exit(app.exec_())