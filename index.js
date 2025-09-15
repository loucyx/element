/** @import { ChildNodes, Options, Output, Tag } from "./types.ts"; */

const { isArray } = Array;
const { stringify } = JSON;
const { assign } = Object;
const { ownKeys } = Reflect;
const empty = {};

/**
 * @template {Tag} PassedTag
 * @param {PassedTag} tag - The tag name of the element to create or the element to use. If the name starts with `<`, it will be treated as a query selector and the first matching element will be used, if any.
 * @param {Options<PassedTag>?} [options] - The options object.
 * @param {ChildNodes} childNodes - The optional child nodes to append to the element.
 * @returns {Output<PassedTag>}
 */
export default (tag, options, ...childNodes) => {
  options ??= empty;
  let doc = options.document || document, custom = false, node;
  // if `tag` is a string, create a new element, or ...
  if (typeof tag === 'string') {
    // if tag starts with `<`, use querySelector instead
    if (tag.startsWith('<')) {
      node = doc.querySelector(tag.slice(1));
      // return null if no node is found
      if (!node) return null;
    }
    else {
      // create either an SVG or HTML element
      // for svg it's either `svg` itself or `svg:` followed by the tag name
      const isSVG = tag === 'svg';
      const isNS = isSVG || tag.startsWith('svg:');
      node = isNS ?
        doc.createElementNS(
          'http://www.w3.org/2000/svg',
          isSVG ? tag : tag.slice(4),
        ) :
        ((custom = !!options.is) ?
          doc.createElement(tag, { is: options.is }) :
          doc.createElement(tag))
      ;
    }
  }
  // otherwise, use the provided node
  else node = tag;

  // loop through options keys and symbols
  for (let key of ownKeys(options)) {
    if (custom && key === 'is') continue;
    let value = options[key];
    // if `key` is not a node known property ...
    if (!(key in node)) {
      // handle with ease intents: `aria`, `data`, `style`, `html`, `text`
      switch (key) {
        case 'aria': {
          for (let k of ownKeys(value)) {
            node.setAttribute(
              k === 'role' ? k : `aria-${k.toLowerCase()}`,
              value[k],
            );
          }
          continue;
        }
        case 'data': {
          assign(node.dataset, value);
          continue;
        }
        case 'style': {
          if (isSVG) node.setAttribute('style', value);
          else node.style.cssText = value;
          continue;
        }
        case 'class': {
          key = 'className';
          break;
        }
        case 'html': {
          key = 'innerHTML';
          break;
        }
        case 'text': {
          key = 'textContent';
          break;
        }
      }
    }
    // if `key` is a node known property ...
    if (key in node) {
      switch (key) {
        case 'classList': {
          node.classList.add(...value);
          break;
        }
        default: {
          // try to set the value directly
          try {
            node[key] = value;
          }
          // otherwise set the value as attribute (svg friendly)
          catch {
            node.setAttribute(key, value);
          }
        }
      }
      continue;
    }

    // uhtml / lit style attributes hints friendly
    switch (true) {
      case key.startsWith('?'):
        value = !!value;
      case key.startsWith('@'): {
        key = key.slice(1);
        // allow passing options within the listener
        if (isArray(value)) {
          node.addEventListener(key, ...value);
          continue;
        }
        break;
      }
    }
  
    // decide what to do by inferring the value type
    switch (typeof value) {
      // toggle boolean attributes
      case 'boolean': {
        node.toggleAttribute(key, value);
        continue;
      }
      // ignore `null` or `undefined`
      case 'undefined':
      case 'object': {
        if (!value) continue;
        // yet consider `handleEvent` as a function
        if (typeof value.handleEvent !== 'function') {
          // otherwise, stringify the value as JSON
          value = stringify(value);
          break;
        }
      }
      // listeners as functions or handleEvent based references
      case 'function': {
        node.addEventListener(key, value);
        continue;
      }
    }
    // last resort: set the value as attribute
    node.setAttribute(key, value);
  }

  if (childNodes.length) node.append(...childNodes);

  return node;
};
