import os
import re

src_dir = r'C:\wk_pgm\wregflow\frontend\src'

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            
            robust_base = '''const BASE = (() => {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  if (url.endsWith('/api')) url = url.slice(0, -4);
  if (url.endsWith('/api/')) url = url.slice(0, -5);
  return url;
})();'''

            new_content = re.sub(r'const BASE = import\.meta\.env\.VITE_API_BASE_URL \|\| [^\n]+', robust_base, new_content)

            robust_inline = r'`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:8001").replace(/\/api\/?$/, "")}/api/integration/create`'
            new_content = re.sub(r'`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| [^}]+}/api/integration/create`', robust_inline, new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {file}')
