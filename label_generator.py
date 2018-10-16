from docx import Document

class Picture2Table:
    def __init__(self, template, pics):
        self.template = Document(template)
        self.pics = pics

    def get_cell_size(self):
        self.tabel = self.template.tables[0]
        for i, row in enumerate(self.tabel.rows):
            self.height = len(self.tabel.rows)
            self.pic_height = row.height
            for j, cell in enumerate(row.cells):
                self.width = len(row.cells)
                self.pic_width = cell.width
                break
            break


    def put_pic_to_cell(self):
        self.tabel = self.template.tables[0]
        for i, row in enumerate(self.tabel.rows):
            for j, cell in enumerate(row.cells):
                for paragraph in cell.paragraphs:
                    run = paragraph.add_run()
                    run.add_picture(self.pics[], width=Mm(15), height=Mm(15))