# @webreflection/element

A minimalistic DOM element creation library.

## Usage and Description

The *default* export is a function that accepts a `tag` and an optional `options` or `setup` literal.

### The `tag`

  * if it's an *Element* aleady it uses options to enrich the element as described
  * if it's a `string` and it does not start with `<`, it creates a new *Element* with such name
    * if it starts with `svg` or the `tag` value is `svg` itself, it creates an *SVGElement*
    * in every other case it creates an *HTMLElement* or, of course, a *CustomElement* with such name or, if `options.is` exists, a custom element builtin extend
  * if it's a `string` and it starts with `<` it uses the element found after `document.querySelector`. If no element is found, it requrns `null` out of the box. 

### The `options`

Each option `key` / `value` pair is handled to enrich the created or retrieved element in a library friendly way.


#### The `key`

  * if the `key` is **childNodes** or **children** (as DX friendly alias), all values are just appended via `element.append(...value)`
  * if `key in element` is `false`:
    * **aria** and **data** are used to attach `aria-` prefixed attributes (with the `role` exception) or the element `dataset`
    * **class**, **html** and **text** are transformed into `className`, `innerHTML` and `textContent` to direclty set these properties with less, yet semantic, typing
    * **@type** is threated as *listener* intent. If its value is an *array*, it is possible to add the third parameter to `element.addEventListener(key.slice(1), ...value)`, otherwise the listener will be added without options
    * **?name** is threaded as boolean attribute intent and, like it is for *@type*, the key will see the first char removed
  * if `key in element` is `true`:
    * **classList** adds all classes via `element.classList.add(...value)`
    * **style** content is directly set via `element.style.cssText = value` or via `element.setAttribute('style', value)` in case of *SVG* element
    * everything else, including **on...** handlers, is attached directly via `element[key] = value`


#### The `value`

If `key in element` is `false`, the behavior is inferred by the value:

  * a `boolean` value that is know known in the *element* will be handled via `element.toggleAttribute(key, value)`
  * a `function` or an `object` with a `handleEvent` are handled via `element.addEventListener(key, value)`
  * an `object` without `handleEvent` will be serialized as *JSON* to safely land as `element.setAttribute(key, JSON.stringify(value))`
  * `null` and `undefined` are simply ignored
  * everything else is simply added as `element.setAttribute(key, value)`

Please read the [example](#example) to have more complete example of how all these features play together.

- - -

## Example

**[Live Demo](https://webreflection.github.io/element/)**

```js
import element from 'https://esm.run/@webreflection/element';

// element(document.body, ...) or use the selector switch:
element('< body', {
  // override body.style.cssText = ...
  style: 'text-align: center',
  // classList.add('some', 'container')
  classList: ['some', 'container'],
  // a custom listener as object.handleEvent pattern
  ['custom:event']: {
    count: 0,
    handleEvent({ type, currentTarget }) {
      console.log(++this.count, type, currentTarget);
    },
  },
  // listener with an extra { once: true } option
  ['@click']: [
    ({ type, currentTarget }) => {
      console.log(type, currentTarget);
      currentTarget.dispatchEvent(new Event('custom:event'))
    },
    { once: true },
  ],
  childNodes: [
    element('h1', {
      // clallName
      class: 'name',
      // textContent
      text: '@webreflection/element',
      style: 'color: purple',
      // role="heading" aria-level="1"
      aria: {
        role: 'heading',
        level: 1,
      },
      // dataset.test = 'ok'
      data: {
        test: 'ok',
      },
      // serialized as `json` attribute
      json: {a: 1, b: 2},
      // direct listener
      onclick: ({ type, currentTarget }) => {
        console.log(type, currentTarget);
      },
    }),
    element('svg', {
      width: 100,
      height: 100,
      // alias for childNodes
      children: [
        element('svg:circle', {
          cx: 50,
          cy: 50,
          r: 50,
          fill: 'violet',
        }),
      ]
    }),
    element('p', {
      // innerHTML
      html: 'made with ❤️ for the <strong>Web</strong>',
    })
  ]
});
```
