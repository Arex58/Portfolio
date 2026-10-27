from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.request import urlopen
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import atexit
import re
import struct

root=Path(__file__).resolve().parents[1]
# Self-contained HTTP check, including the same subdirectory used on GitHub Pages.
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(root.parent)))
Thread(target=server.serve_forever,daemon=True).start()
atexit.register(lambda: (server.shutdown(), server.server_close()))
base=f'http://127.0.0.1:{server.server_port}/{root.name}/'
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
    assert not p.startswith('/'), 'Root-relative path breaks /Portfolio/: '+p
    with urlopen(base+p) as r:
        assert r.status==200,p
        r.read()
assert len(list((root/'assets/icons').glob('*.png')))==7
for icon in (root/'assets/icons').glob('*.png'):
    header = icon.read_bytes()[:26]
    assert header[:8] == b'\x89PNG\r\n\x1a\n', icon
    assert struct.unpack('>II', header[16:24]) == (64, 64), 'Expected compact pixel icon: '+icon.name
    assert header[25] == 6, 'Expected RGBA transparency: '+icon.name
for p in ['script.js','room.js','styles.css','cozy.css','workstation.css','assets/portfolio.css']:
    with urlopen(base+p) as r:
        assert r.status==200
        r.read()
for p in ['styles.css','cozy.css','workstation.css','assets/portfolio.css']:
    s=(root/p).read_text(encoding='utf-8');assert s.count('{')==s.count('}'),p
for p in ['index.html','script.js','room.js','cozy.css','workstation.css']:
    s=(root/p).read_text(encoding='utf-8');assert '\ufffd' not in s, 'Invalid encoding in '+p
print(f'PASS: {len(c.assets)} local assets return HTTP 200; {len(c.opens)} launch targets resolve; {len(c.images)} images have alt attributes; IDs unique; CSS braces balanced; UTF-8 intact.')
compiled=(root/'assets/portfolio.css').read_text(encoding='utf-8')
assert 'tailwindcss v4.' in compiled, 'Missing compiled Tailwind v4 stylesheet'
assert 'tailwindcss/preflight' not in (root/'css/tailwind.css').read_text(encoding='utf-8')
for groups in re.findall(r'''url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)''',compiled):
    url=next(value for value in groups if value)
    if not urlsplit(url).scheme:
        assert not url.startswith('/'), url
        with urlopen(base+'assets/'+url) as r: assert r.status==200,url
print('PASS: compiled Tailwind CSS and CSS asset URLs resolve under the project subdirectory; no Preflight import.')
