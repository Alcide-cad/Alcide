"""CI smoke test: drive the built engine through PDF info, Poppler preview and import.

Usage: python smoke_pdf.py <alcide-engine.exe or engine.py> <work dir>
"""
import json, subprocess, sys
from pathlib import Path


def tiny_pdf(path):
    content = b'0 0 1 RG 2 w 10 10 m 190 90 l S BT /F1 12 Tf 20 60 Td (ALCIDE) Tj ET'
    objects = [
        b'<</Type/Catalog/Pages 2 0 R>>',
        b'<</Type/Pages/Kids[3 0 R]/Count 1>>',
        b'<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]/Contents 4 0 R'
        b'/Resources<</Font<</F1 5 0 R>>>>>>',
        b'<</Length %d>>stream\n' % len(content) + content + b'\nendstream',
        b'<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    ]
    data, offsets = b'%PDF-1.4\n', []
    for i, body in enumerate(objects, 1):
        offsets.append(len(data))
        data += b'%d 0 obj\n' % i + body + b'\nendobj\n'
    xref = len(data)
    data += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objects) + 1)
    data += b''.join(b'%010d 00000 n \n' % o for o in offsets)
    data += b'trailer\n<</Size %d/Root 1 0 R>>\nstartxref\n%d\n%%%%EOF\n' % (len(objects) + 1, xref)
    Path(path).write_bytes(data)


def main():
    engine, work = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    work.mkdir(parents=True, exist_ok=True)
    pdf, dxf = work / 'smoke.pdf', work / 'smoke-pdf.dxf'
    tiny_pdf(pdf)
    cmd = [sys.executable, str(engine)] if engine.suffix == '.py' else [str(engine)]
    requests = [
        dict(id=1, cmd='pdf-info', path=str(pdf)),
        dict(id=2, cmd='pdf-preview', path=str(pdf), page=0),
        dict(id=3, cmd='pdf-import', path=str(pdf), target=str(dxf), page=0),
    ]
    stdin = ''.join(json.dumps(r) + '\n' for r in requests)
    proc = subprocess.run(cmd, input=stdin, capture_output=True, text=True, encoding='utf-8', timeout=300, cwd=engine.parent)
    results = {}
    for line in proc.stdout.splitlines():
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        if msg.get('id') in (1, 2, 3):
            results[msg['id']] = msg
    print(proc.stderr[-3000:])
    for i in (1, 2, 3):
        msg = results.get(i)
        print(i, json.dumps(msg, ensure_ascii=False)[:300] if msg else None)
        if not msg or 'error' in msg:
            sys.exit('PDF smoke test failed for request %d' % i)
    if not str(results[2]['result']).startswith('data:image/png;base64,'):
        sys.exit('Poppler preview missing')
    if not dxf.is_file() or dxf.stat().st_size == 0:
        sys.exit('PDF import produced no DXF')
    print('PDF smoke test OK')


if __name__ == '__main__':
    main()
