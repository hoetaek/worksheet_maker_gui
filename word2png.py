import comtypes.client
import os
import subprocess

class ConvertDoc2Pdf:
    def __init__(self, input_file):
        self.input_file = input_file
    def init_word(self):
        docx = comtypes.client.CreateObject("Word.Application")
        return docx

    def word_to_pdf(self, doc, inputFileName, formatType = 17):
        deck = doc.Documents.Open(inputFileName)
        outputFileName = inputFileName[:-5] + '.pdf'
        deck.SaveAs(outputFileName, formatType) # formatType = 17 for word to pdf
        deck.Close()
        return outputFileName

    def pdf_to_png(self, file):
        PDFTOPPMPATH = r"poppler-0.67.0\bin\pdfimages.exe"
        PDFFILE = file

        subprocess.Popen('"%s" -png %s %s' % (PDFTOPPMPATH, PDFFILE, PDFFILE[:-4]))

    def convert(self):
        comtypes.CoInitialize()
        word_doc = self.init_word()
        pdf = self.word_to_pdf(word_doc, self.input_file)
        word_doc.Quit()
        comtypes.CoUninitialize()

        self.pdf_to_png(pdf)

if __name__ == '__main__':
    path = os.path.abspath('도블 카드 모음.docx')
    convert = ConvertDoc2Pdf(path)
    convert.convert()