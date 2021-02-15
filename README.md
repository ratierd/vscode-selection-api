# Selection API

This is a fork of [vscode-quick-select](https://github.com/dbankier/vscode-quick-select).

All keybindings and user exposed commands have been removed only to keep a single command to use in [ModalEdit](https://github.com/johtela/vscode-modaledit) configuration like this :

```json
{
  "(,)": [
    "modaledit.cancelSelection",
    {
      "command": "selection-api.selectMatching",
      "args": "{ start_char: '(', end_char: ')', outer: __rkeys[1] == 'a' }"
    }
  ],
  "{,}": [
    "modaledit.cancelSelection",
    {
      "command": "selection-api.selectMatching",
      "args": "{ start_char: '{', end_char: '}', outer: __rkeys[1] == 'a' }"
    }
  ],
  "[,]": [
    "modaledit.cancelSelection",
    {
      "command": "selection-api.selectMatching",
      "args": "{ start_char: '[', end_char: ']', outer: __rkeys[1] == 'a' }"
    }
  ]
}
```

It allows to move away from modaledit.selectBetween where we want to take nested structures into account.
