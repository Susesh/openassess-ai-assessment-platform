from pathlib import Path
p=Path(__file__).parent.parent / 'models' / 'user.py'
s=p.read_text()
s=s.replace('\nhashed_password = Column(String, nullable=False)\nrole =', '\nhashed_password = Column(String, nullable=False)\n    role =')
p.write_text(s)
print('fixed indent')
