import inspect
import os
from swarm_debug.core.log.log_config import log_config
from swarm_debug.core.Debugleton import Debugleton
from swarm_debug.core.utils.color_adjuster import rgb_to_ansi, bold_and_italicize_text, hex_to_rgb
from swarm_debug.core.utils.debug_arg_parser import (
    is_text, is_error, extract_debug_args, filter_kwargs, has_percent_format,
)

_SENTINEL = object()


def debug(*args, mode: str = 'debug', override_max_chars: bool = False,
          sep: str = _SENTINEL, end: str = '\n'):
    frame = inspect.currentframe().f_back
    code = frame.f_code
    line_no = frame.f_lineno
    calling_function_name = frame.f_code.co_name
    calling_file_name = os.path.basename(code.co_filename)
    if calling_function_name == "<module>":
        calling_function_name = calling_file_name
    file_path = os.path.abspath(code.co_filename)
    t_color, t_is_on, t_emoji = Debugleton().find_file_info(file_path)
    max_chars = 3000

    with open(code.co_filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    line = lines[line_no - 1]
    leading_spaces = len(line) - len(line.lstrip(' '))
    indent = leading_spaces // 4
    indent_str = ' |\t' * indent
    if indent > 0:
        indent_str = indent_str[:-3] + ' |-- '

    function_print_str = (calling_function_name if 'self' not in frame.f_locals
                          else f'{frame.f_locals["self"].__class__.__name__}.{calling_function_name}')

    arg_names = filter_kwargs(extract_debug_args(lines, line_no))

    def _truncate(value):
        v_len = len(str(value))
        if v_len > max_chars and not override_max_chars:
            s = str(value)
            return s[:int(max_chars/2)] + "...\n..." + s[v_len-int(max_chars/2):]
        return value

    def _emit(text, is_error_line=False):
        nonlocal t_color, t_emoji, t_is_on
        if is_error_line:
            t_color = "#FE3F3F"
            t_emoji = "❌"
            t_is_on = True
        color = hex_to_rgb(t_color)
        print_str = f"{t_emoji}{rgb_to_ansi(color)}{indent_str}[{function_print_str}] : {text}\033[0m"
        if t_is_on:
            log_config.debug_custom(print_str, mode)

    # %-style formatting: debug("msg %s", val1, val2)
    if (len(args) >= 2
            and isinstance(args[0], str)
            and has_percent_format(args[0])):
        try:
            formatted = args[0] % tuple(args[1:])
        except (TypeError, ValueError):
            formatted = args[0]
        formatted = _truncate(formatted)
        err = is_error(formatted, arg_names[0] if arg_names else '')
        _emit(bold_and_italicize_text(formatted), is_error_line=err)
        return

    # sep= was explicitly passed — join all args like print()
    if sep is not _SENTINEL:
        joined = sep.join(str(a) for a in args)
        joined = _truncate(joined)
        err = is_error(joined, '')
        _emit(bold_and_italicize_text(joined), is_error_line=err)
        return

    # Default: per-argument output (original behavior, now with robust parsing)
    for arg_name, arg_value in zip(arg_names, args):
        arg_is_error = is_error(arg_value, arg_name)
        arg_is_text = is_text(arg_value, arg_name)

        arg_value = _truncate(arg_value)

        if arg_is_text:
            _emit(bold_and_italicize_text(arg_value), is_error_line=arg_is_error)
        else:
            _emit(f"{arg_name} = {arg_value}", is_error_line=arg_is_error)
