# -*- mode: python -*-

block_cipher = None


a = Analysis(['word_flicker_maker.py'],
             pathex=['C:\\Users\\hoetaekpro\\PycharmProjects\\worksheet_maker_gui'],
             binaries=[],
             datas=[('flicker_example', 'flicker_example'), ('template_for_word_flicker.pptx', '.')],
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
          name='word_flicker_maker',
          debug=False,
          strip=False,
          upx=True,
          console=False , icon='word_flicker_icon.ico')
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='word_flicker_maker')
