# @zestia/ember-simple-infinite-scroller

<p>
  <!--
  <a href="https://github.com/zestia/ember-simple-infinite-scroller/actions/workflows/ci.yml">
    <img src="https://github.com/zestia/ember-simple-infinite-scroller/actions/workflows/ci.yml/badge.svg">
  </a>
  -->

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
- No included styles ✔︎

## Configuration

<table>
  <tr>
    <th>Argument</th>
    <th>Description</th>
    <th>Default</th>
  </tr>
  <tr>
    <td>onLoadMore</td>
    <td>Action to perform when the <code>@percent</code> scrolled is reached</td>
    <td><code>null</code></td>
  </tr>
  <tr>
    <td>element</td>
    <td>Monitors the scroll position of the given element</td>
    <td><code>null</code></td>
  </tr>
  <tr>
    <td>percent</td>
    <td>Distance scroll from the top for when to fire the load more action</td>
    <td><code>100</code></td>
  </tr>
  <tr>
    <td>debounce</td>
    <td>Milliseconds delay for when to check if more needs to be loaded</td>
    <td><code>100</code></td>
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
    <td>A modifier for setting the element for which to monitor the scroll position of</td>
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

## Scenario to be aware of

If your scrollable element is displaying 10 things, but they don't cause the element to overflow,
then the user won't ever be able to load more - because they won't be able to _scroll_ and therefore
the `onLoadMore` action will never fire.

To account for this, you can display a button for manually loading more...

```handlebars
<InfiniteScroller @onLoadMore={{this.loadMore}} as |scroller|>
  {{#each this.things as |thing|}}
    ...
  {{/each}}

  {{#unless scroller.isScrollable}}
    <button {{on "click" scroller.loadMore}}>Load more</button>
  {{/unless}}
</InfiniteScroller>
```
