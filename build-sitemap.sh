#!/bin/bash
cd "$(dirname "$0")"
python3 << 'PYEOF'
import glob, datetime
EXCLUDE = {'reset-password.html','verify-email.html'}
PRIORITY = {
    'index.html':('1.0','weekly'), 'blog.html':('0.9','weekly'),
    'canadian-grocery-database-coverage.html':('0.8','monthly'),
    'yuka-alternative-canada.html':('0.8','monthly'),
    'allergen-scanner-app.html':('0.8','monthly'),
    'resources.html':('0.7','monthly'), 'about.html':('0.6','monthly'),
    'support.html':('0.6','monthly'), 'delete-account.html':('0.4','yearly'),
    'privacy.html':('0.4','yearly'), 'terms.html':('0.4','yearly'),
}
today = datetime.date.today().isoformat()
files = sorted((f for f in glob.glob('*.html')
                if not f.startswith('google') and f not in EXCLUDE),
               key=lambda f: (f!='index.html', f))
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for f in files:
    pri,freq = PRIORITY.get(f,('0.5','monthly'))
    loc = 'https://www.wellvalet.com/' + ('' if f=='index.html' else f)
    out += ['  <url>',f'    <loc>{loc}</loc>',f'    <lastmod>{today}</lastmod>',
            f'    <changefreq>{freq}</changefreq>',f'    <priority>{pri}</priority>','  </url>']
out.append('</urlset>')
open('sitemap.xml','w').write('\n'.join(out)+'\n')
print(f'sitemap.xml regenerated — {len(files)} URLs')
PYEOF
