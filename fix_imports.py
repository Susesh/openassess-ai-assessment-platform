import os
import re

# Directory to process
backend_dir = r'c:\Users\karth\Downloads\OpenAssess-main\OpenAssess-main\backend'

# Patterns to replace
replacements = [
    (r'^from database import', 'from backend.database import'),
    (r'^from models\.', 'from backend.models.'),
    (r'^from schemas\.', 'from backend.schemas.'),
    (r'^from utils\.', 'from backend.utils.'),
    (r'^from services\.', 'from backend.services.'),
    (r'^from ai\.', 'from backend.ai.'),
]

# Walk through all Python files
for root, dirs, files in os.walk(backend_dir):
    # Skip __pycache__ directories
    dirs[:] = [d for d in dirs if d != '__pycache__']
    
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Apply replacements line by line to avoid replacing inline comments
                lines = content.split('\n')
                modified_lines = []
                
                for line in lines:
                    modified_line = line
                    # Only replace at the start of the line
                    for pattern, replacement in replacements:
                        if re.match(pattern, line):
                            modified_line = re.sub(pattern, replacement, line)
                            break
                    modified_lines.append(modified_line)
                
                modified_content = '\n'.join(modified_lines)
                
                # Write back if modified
                if modified_content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(modified_content)
                    print(f'Fixed: {filepath}')
            except Exception as e:
                print(f'Error processing {filepath}: {e}')

print('Done!')
