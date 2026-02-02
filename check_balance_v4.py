import re

def check_jsx_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all tags, including self-closing ones
    # Group 1: / if closing
    # Group 2: tag name
    # Group 3: / if self-closing at end
    tags = re.findall(r'<(/?)([a-zA-Z0-9\.]+)[^>]*?(/?)>', content)
    stack = []
    
    for closing, tag, self_closing in tags:
        if self_closing == '/':
            continue
        if closing == '/':
            if not stack:
                print(f"Extra closing tag: </{tag}>")
            else:
                top = stack.pop()
                if top != tag:
                    print(f"Mismatch: <{top}> closed by </{tag}>")
        else:
            stack.append(tag)
    
    if stack:
        print("Unclosed tags:", stack)
    else:
        print("All tags balanced according to check.")

check_jsx_balance(r'e:\anti\okinawa\src\App.tsx')
