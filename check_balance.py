import re

def check_jsx_balance(content, start_line, end_line):
    subset = content.split('\n')[start_line-1:end_line]
    stack = []
    
    # Simple state machine to ignore strings and comments
    in_string = None # '"', "'", "`"
    in_comment = None # '//', '/*'
    
    for i, line in enumerate(subset):
        actual_line_num = start_line + i
        j = 0
        while j < len(line):
            char = line[j]
            
            # String handling
            if in_string:
                if char == in_string and (j == 0 or line[j-1] != '\\'):
                    in_string = None
                j += 1
                continue
            
            # Comment handling
            if in_comment == '//':
                break # Rest of the line is a comment
            if in_comment == '/*':
                if line[j:j+2] == '*/':
                    in_comment = None
                    j += 2
                else:
                    j += 1
                continue
                
            # Check for comment start
            if line[j:j+2] == '//':
                break
            if line[j:j+2] == '/*':
                in_comment = '/*'
                j += 2
                continue
            
            # Check for string start
            if char in "\"'`":
                in_string = char
                j += 1
                continue
            
            # Brackets
            if char in '({[':
                stack.append((char, actual_line_num))
            elif char in ')}]':
                if not stack:
                    print(f"Extra closing {char} at line {actual_line_num}")
                else:
                    last_char, last_line = stack.pop()
                    expected = {'(': ')', '{': '}', '[': ']'}[last_char]
                    if char != expected:
                        print(f"Mismatch: {last_char} at {last_line} closed by {char} at {actual_line_num}")
            j += 1

    for char, line in stack:
        print(f"Unclosed {char} from line {line}")

content = open(r'e:\anti\okinawa\src\App.tsx', 'r', encoding='utf-8').read()
check_jsx_balance(content, 2635, 3698)
