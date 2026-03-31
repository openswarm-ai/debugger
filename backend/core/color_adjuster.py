
def rgb_to_ansi(rgb):
    return '\033[38;2;{};{};{}m'.format(*rgb)

def bold_and_italicize_text(text):
    return f"\033[1m\033[3m{text}\033[0m"

y = 1

def hex_to_rgb(hex_code):
    # Remove the '#' symbol if it exists
    hex_code = hex_code.lstrip('#')
    
    # Convert the hex code to RGB
    return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))