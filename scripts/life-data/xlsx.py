"""Minimal reader for the first worksheet of an .xlsx file (standard library only)."""
import re, zipfile
import xml.etree.ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def _col(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1

def rows(path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
                shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
        sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        for row in sheet.find('m:sheetData', NS).findall('m:row', NS):
            out = {}
            for c in row.findall('m:c', NS):
                v = c.find('m:v', NS)
                if c.get('t') == 'inlineStr':
                    text = ''.join(t.text or '' for t in c.iter('{%s}t' % NS['m']))
                elif v is None:
                    continue
                elif c.get('t') == 's':
                    text = shared[int(v.text)]
                else:
                    text = v.text
                out[_col(c.get('r'))] = text
            yield [out.get(i, '') for i in range(max(out) + 1)] if out else []
