import re

def check_jsx_tags(content, start_line, end_line):
    subset = content.split('\n')[start_line-1:end_line]
    stack = []
    
    # regex for tags
    # <Tag ... > or <Tag ... /> or </Tag>
    # Note: this is very simplified
    tag_pattern = re.compile(r'<(/?)([a-zA-Z0-9\.]+)([^>]*)>')
    
    for i, line in enumerate(subset):
        actual_line_num = start_line + i
        
        # Strip comments etc (very roughly)
        line = line.split('//')[0]
        
        matches = tag_pattern.finditer(line)
        for m in matches:
            is_closing = m.group(1) == '/'
            tag_name = m.group(2)
            props = m.group(3)
            is_self_closing = props.strip().endswith('/')
            
            # Skip fragments <> and </>
            if not tag_name: continue
            
            if is_self_closing:
                continue
            elif is_closing:
                if not stack:
                    print(f"Extra closing tag </{tag_name}> at line {actual_line_num}")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_name:
                        print(f"Mismatch: <{last_tag}> at {last_line} closed by </{tag_name}> at {actual_line_num}")
            else:
                stack.append((tag_name, actual_line_num))

    for tag, line in stack:
        print(f"Unclosed tag <{tag}> from line {line}")

content = open(r'e:\anti\okinawa\src\App.tsx', 'r', encoding='utf-8').read()
check_jsx_tags(content, 2635, 3698)
