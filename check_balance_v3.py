import re

def check_jsx_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple tag balancer
    tags = re.findall(r'<(/?)([a-zA-Z0-9\.]+)', content)
    stack = []
    void_tags = {'img', 'br', 'hr', 'input', 'link', 'meta'}
    
    for closing, tag in tags:
        if tag in void_tags:
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
        print("All tags balanced according to simple check.")

check_jsx_balance(r'e:\anti\okinawa\src\App.tsx')
