# A Basic Drag and Resize code for HTML components

## Usage

Import the code

```typescript
import { setResizableBoxEvents } from 'https://tombigel.github.io/resize-box/index.js';
```

Init the code with some options

```typescript
setResizableBoxEvents(
    box: HTMLElement,
    {
        container = document.body: HTMLElement,
        form: HTMLFormElement,
        minWidth = 10: number,
        minHeight = 10: number,
        maxWidth = container.offsetWidth: number,
        maxHeight = container.offsetHeight: number,
    } 
): void;
```

HTML Structure:

```html
<div class="resizable-box">
    <div class="content">
    </div>
    <div class="resizable-box-handle" data-handle="top left"></div>
    <div class="resizable-box-handle" data-handle="top right"></div>
    <div class="resizable-box-handle" data-handle="bottom left"></div>
    <div class="resizable-box-handle" data-handle="bottom right"></div>
    <div class="resizable-box-handle" data-handle="top"></div>
    <div class="resizable-box-handle" data-handle="right"></div>
    <div class="resizable-box-handle" data-handle="bottom"></div>
    <div class="resizable-box-handle" data-handle="left"></div>
</div>
```

CSS:

```html
<link rel="stylesheet" href="https://tombigel.github.io/resize-box/index.css">
```

or

```css
@import url(https://tombigel.github.io/resize-box/index.css);
```

All the handles are optional and are placed anf act by their `data-handle` name

`container` has to be an 'offset parent'
