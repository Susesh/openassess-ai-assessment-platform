from pathlib import Path
p=Path(__file__).parent.parent / 'models' / 'user.py'
s=p.read_text()
old='hashed_password = Column(String, nullable=False)\n'
if old in s:
    new=old+"role = Column(String, default=\"student\", nullable=False)\n"
    s=s.replace(old,new,1)
    p.write_text(s)
    print('patched user model')
else:
    print('pattern not found')
