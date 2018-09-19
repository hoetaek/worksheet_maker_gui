from pptx import Presentation
import os

class PptWordFlickerMaker():
    def __init__(self, words_pics, num_slide):
        self.words_pics = words_pics
        self.num_slide = num_slide
        self.words = [word[0] for word in self.words_pics]
        self.pics = [pic[1] for pic in self.words_pics]

    def make_word_flicker_slide(self, path):
        prs = Presentation('template_for_word_flicker.pptx')
        for i in range(self.num_slide):
            card_layout = prs.slide_layouts[0]
            slide = prs.slides.add_slide(card_layout)

            for j, shape in enumerate(slide.placeholders):
                pic = shape.insert_picture(self.pics[self.num*i + j])
                pic.crop_left = 0
                pic.crop_right = 0
                pic.crop_bottom = 0
                pic.crop_top = 0

        file_path = os.path.join(path, '단어깜빡이.pptx')
        file_path = os.path.abspath(file_path)
        prs.save(file_path)
        return file_path