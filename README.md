# @zestia/ember-simple-infinite-scroller

<p>
  <a href="http://travis-ci.org/zestia/ember-simple-infinite-scroller">
    <img src="https://travis-ci.org/zestia/ember-simple-infinite-scroller.svg?branch=master">
  </a>

  <a href="https://david-dm.org/zestia/ember-simple-infinite-scroller#badge-embed">
    <img src="https://david-dm.org/zestia/ember-simple-infinite-scroller.svg">
  </a>

  <a href="https://david-dm.org/zestia/ember-simple-infinite-scroller#dev-badge-embed">
    <img src="https://david-dm.org/zestia/ember-simple-infinite-scroller/dev-status.svg">
  </a>

  <a href="https://emberobserver.com/addons/@zestia/ember-simple-infinite-scroller">
    <img src="https://emberobserver.com/badges/-zestia-ember-simple-infinite-scroller.svg">
  </a>

  <img src="https://img.shields.io/badge/Ember-%3E%3D%203.16-brightgreen">
</p>

This Ember addon provides a simple component that fires an action whenever it is scrolled to the bottom.
Allowing you to load more data. It is not coupled to Ember-Data like some other infinite scrolling implementations.

## Installation

```
ember install @zestia/ember-simple-infinite-scroller
```

## Demo

https://zestia.github.io/ember-simple-infinite-scroller/

## Example

```handlebars
<InfiniteScroller @onLoadMore={{this.loadMore}} as |scroller|>
  {{#each things as |thing|}}
    ...
  {{/each}}
  {{if scroller.isLoading "Please wait..."}}
</InfiniteScroller>
```

## Notes

- Does not use jQuery ✔︎
- Ember Data Friendly ✔︎
- Supports use with FastBoot ✔︎

## Configuration

<table>
  <tr>
    <th>Argument</th>
    <th>Description</th>
    <th>Default</th>
  </tr>
  <tr>
    <td>onLoadMore</td>
    <td>Action to perform when the bottom is scrolled into view</td>
    <td><code>null</code></td>
  </tr>
  <tr>
    <td>element</td>
    <td>Monitors the scroll position of the given element</td>
    <td><code>null</code></td>
  </tr>
  <tr>
    <td>leeway</td>
    <td>Percentage distance away from the bottom</td>
    <td><code>"0%"</code></td>
  </tr>
  <tr>
    <td>scrollDebounce</td>
    <td>Milliseconds delay used to check if the bottom has been reached</td>
    <td><code>100</code> ms</td>
  </tr>
</table>

## Yielded API

The component will yield a hash that provides:

<table>
  <tr>
    <th>Property</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>setElement</td>
    <td>Sets the element for which to monitor the scroll position of</td>
  </tr>
  <tr>
    <td>isLoading</td>
    <td>True when the promise for more data has not resolved yet</td>
  </tr>
  <tr>
    <td>isScrollable</td>
    <td>True when scroll element is overflowing</td>
  </tr>
  <tr>
    <td>error</td>
    <td>The caught error from the last attempt to load more</td>
  </tr>
  <tr>
    <td>loadMore</td>
    <td>Action for manually loading more</td>
  </tr>
</table>

## Performance

Please read: https://github.com/TryGhost/Ghost/issues/7934

You may need to add this to `app/app.js`

```javascript
customEvents = {
  touchstart: null,
  touchmove: null,
  touchend: null,
  touchcancel: null
};
```

## Other scenarios

If your scrollable element is displaying 10 things, but they don't cause the element to overflow,
then the user won't ever be able to load more - because they won't be able to _scroll_ and therefore
the `onLoadMore` action will never fire.

To account for this, you can display a button for manually loading more...

```handlebars
<InfiniteScroller @onLoadMore={{this.loadMore}} as |scroller|>
  {{#each this.things as |thing|}}
    ...
  {{/each}}

  {{#if this.hasMoreThings}}
    {{#if scroller.isScrollable}}
      Loading more...
    {{else}}
      <button {{on "click" scroller.loadMore}}>Load more</button>
    {{/if}}
  {{/if}}
</InfiniteScroller>
```
