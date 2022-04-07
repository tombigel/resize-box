# A Basic Drag and Resize code for HTML components

## Usage

Execute this function

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

On HTML that looks like this:

```html
<div class="resizable-box">
    <div class="content">
        Container: BODY
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

All the handles are optional and are placed anf act by their `data-handle` name

`container` has to be an 'offset parent'
