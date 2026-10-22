from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.request import urlopen
import re
import zipfile

root=Path(__file__).resolve().parents[1]
class Check(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.opens=[]; self.assets=set(); self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if 'data-open' in a:self.opens.append(a['data-open'])
        if tag=='img':self.images.append(a); assert 'alt' in a,a
        for key in ['src','href']:
            v=a.get(key,'');u=urlsplit(v)
            if v and not u.scheme and not u.netloc and u.path:self.assets.add(unquote(u.path))
c=Check();c.feed((root/'index.html').read_text(encoding='utf-8'))
assert len(c.ids)==len(set(c.ids)), 'Duplicate IDs'
for name in c.opens:assert 'tpl-'+name in c.ids, 'Missing template '+name
for p in c.assets:
    assert (root/p).is_file(), 'Missing asset '+p
    with urlopen('http://127.0.0.1:8000/'+p) as r:
        assert r.status==200,p
        r.read()
assert len(list((root/'assets/icons').glob('*.png')))==7
archive=Path.home()/'Downloads/game_portfolio_icons_7.zip'
if archive.exists():
    with zipfile.ZipFile(archive) as z:
        for name in z.namelist():
            if name.endswith('.png'):assert z.read(name)==(root/'assets/icons'/name).read_bytes(), 'Modified supplied icon '+name
for p in ['script.js','styles.css','cozy.css']:
    with urlopen('http://127.0.0.1:8000/'+p) as r:
        assert r.status==200
        r.read()
for p in ['styles.css','cozy.css']:
    s=(root/p).read_text(encoding='utf-8');assert s.count('{')==s.count('}'),p
for p in ['index.html','script.js','cozy.css']:
    s=(root/p).read_text(encoding='utf-8');assert '\ufffd' not in s, 'Invalid encoding in '+p
print(f'PASS: {len(c.assets)} local assets return HTTP 200; {len(c.opens)} launch targets resolve; {len(c.images)} images have alt attributes; IDs unique; CSS braces balanced; UTF-8 intact.')
