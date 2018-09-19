from pptx import Presentation
from PIL import ImageFont
import os

class PptWordFlickerMaker():
    def __init__(self, words_pics, num_slide):
        self.words_pics = words_pics
        self.num_slide = num_slide
        self.words = [word[0] for word in self.words_pics]
        self.pics = [pic[1] for pic in self.words_pics]

    def make_word_flicker_slide(self, path):
        prs = Presentation('template_for_word_flicker.pptx')
        for num in self.num_slide:
            card_layout = prs.slide_layouts[num]
            for word, pic in zip(self.words, self.pics):

                slide = prs.slides.add_slide(card_layout)
                for shape in slide.shapes:
                    if str(shape.placeholder_format.type) == 'BODY (2)':
                        shape.text = word
                        # font = ImageFont.truetype('times.ttf', 12)
                        # size = font.getsize('Hello world')
                        # print(size)
                        shape.left = (prs.slide_width - shape.width) // 2

                for shape in slide.shapes:
                    if str(shape.placeholder_format.type) == 'PICTURE (18)':
                        picture = shape.insert_picture(pic)
                        picture.crop_left = 0
                        picture.crop_right = 0
                        picture.crop_bottom = 0
                        picture.crop_top = 0


        file_path = os.path.join(path, '단어깜빡이.pptx')
        file_path = os.path.abspath(file_path)
        prs.save(file_path)
        return file_path

if __name__=='__main__':
    ppt = PptWordFlickerMaker([['hello', 'python_.png']], [0, 1, 2, 3])
    ppt.make_word_flicker_slide('.')