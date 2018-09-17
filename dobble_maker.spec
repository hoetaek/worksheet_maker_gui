# -*- mode: python -*-
import sys
from os import path
site_packages = next(p for p in sys.path if 'site-packages' in p)
block_cipher = None


a = Analysis(['dobble_maker.py'],
             pathex=['C:\\Users\\hoetaekpro\\PycharmProjects\\worksheet_maker_gui'],
             binaries=[],
             datas=[(path.join(site_packages,"comtypes","gen"), "comtypes/gen"), ('template_for_dobble_cards.pptx', '.'), ('arial.ttf', '.'), ('H2GTRE.TTF', '.')],
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
          name='dobble_maker',
          debug=False,
          strip=False,
          upx=True,
          console=False )
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='dobble_maker')
