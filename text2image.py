from PIL import Image, ImageDraw, ImageFont

def text2png(text, path):
    img_x = 1000
    img_y = 1000
    img = Image.new('RGB', (img_x, img_y), color=(255, 255, 255))

    font_size = 1000
    if text.isalpha():
        fnt = ImageFont.truetype('font\\arial.ttf', font_size)
        size = fnt.getbbox(text)
        x = size[2] - size[0]
        y = size[3] - size[1]
    else:
        fnt = ImageFont.truetype('font\\H2GTRE.ttf', font_size)
        size = fnt.getbbox(text)
        x = size[0]
        y = size[1]
    while x > img_x or y > img_y:
        font_size -= 1
        fnt = ImageFont.truetype('font\\arial.ttf', font_size)
        size = fnt.getbbox(text)
        x = size[2] - size[0]
        y = size[3] - size[1]
    d = ImageDraw.Draw(img)
    d.text(((img_x - x)//2, (img_y - y)//2), text, font=fnt, fill=(0, 0, 0))

    img.save(path)


if __name__=="__main__":
    text2png("wowwwwwwww", "word.png")