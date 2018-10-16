from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

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
        return self.pic_width, self.pic_height, self.width, self.height


    def put_pic_to_cell(self):
        self.tabel = self.template.tables[0]
        for i, row in enumerate(self.tabel.rows):
            for j, cell in enumerate(row.cells):
                for paragraph in cell.paragraphs:
                    #####가운데 정렬!!
                    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    index = i * self.width + j
                    if index < len(self.pics):
                        run = paragraph.add_run()
                        run.add_picture(self.pics[index], width=self.pic_width // 100 * 98, height=self.pic_height // 100 * 90)
                    #####상하 방향에서 가운데 정렬
                    tc = cell._tc
                    tcPr = tc.get_or_add_tcPr()
                    tcVAlign = OxmlElement('w:vAlign')
                    tcVAlign.set(qn('w:val'), "center")
                    tcPr.append(tcVAlign)
        self.template.save('pic_label.hwp')

if __name__=='__main__':
    import os
    pics = [os.path.join('flicker_example', f) for f in os.listdir('flicker_example')]
    pic2table = Picture2Table('template_24.docx', pics)
    pic2table.get_cell_size()
    pic2table.put_pic_to_cell()
