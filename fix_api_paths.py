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
            
            # 1. Fix fallback URLs
            new_content = new_content.replace("'http://localhost:8001/api'", "'http://localhost:8001'")

            # 2. Add /api to App.jsx endpoints (reverting the previous change)
            if file == 'App.jsx':
                new_content = new_content.replace('/regulations/analyze', '/api/regulations/analyze')
                new_content = new_content.replace('/regulations/upload', '/api/regulations/upload')

            # 3. Fix endpoints that use ${BASE} to include /api/
            # find ${BASE}/something and replace with ${BASE}/api/something
            # exceptions: if it already has api/ (e.g. ${BASE}/api/)
            new_content = re.sub(r'\$\{BASE\}/(?!api/)', r'${BASE}/api/', new_content)
            
            # Also IntegrationPanel uses import.meta.env.../integration
            new_content = re.sub(r"\|\| 'http://localhost:8001'\}\}/integration", r"|| 'http://localhost:8001'}/api/integration", new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {file}')
