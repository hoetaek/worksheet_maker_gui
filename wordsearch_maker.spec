# -*- mode: python -*-
import sys
from os import path
site_packages = next(p for p in sys.path if 'site-packages' in p)
block_cipher = None


a = Analysis(['wordsearch_maker.py'],
             pathex=['C:\\Users\\hoetaekpro\\PycharmProjects\\worksheet_maker_gui',
              'C:\\Users\\hoetaekpro\\PycharmProjects\\worksheet_maker_gui\\venv\\lib\\site-packages'],
             binaries=[],
             datas=[(path.join(site_packages,"docx","templates"), "docx/templates"), ('wordsearch.ico', '.'),
              ('random_words.txt', '.')],
             hiddenimports=['PyQt5', 'PyQt5.sip'],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          exclude_binaries=True,
          name='wordsearch_maker',
          debug=False,
          strip=False,
          upx=True,
          console=False , icon='wordsearch.ico')
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='wordsearch_maker')
