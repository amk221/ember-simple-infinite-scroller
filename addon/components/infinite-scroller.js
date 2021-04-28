import Component from '@glimmer/component';
import { resolve } from 'rsvp';
import { debounce, cancel, scheduleOnce } from '@ember/runloop';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
const { round } = Math;

export default class InfiniteScrollerComponent extends Component {
  scroller = null;
  debounceId = null;

  @tracked isLoading = false;
  @tracked isScrollable = false;

  constructor() {
    super(...arguments);

    this._scheduleCheckScrollable();
  }

  get api() {
    return {
      setElement: this.setElement,
      isScrollable: this.isScrollable,
      isLoading: this.isLoading,
      loadMore: this.loadMore
    };
  }

  get debounce() {
    return this.args.debounce ?? 100;
  }

  get percent() {
    return this.args.percent ?? 100;
  }

  get normalisedScrollerElement() {
    if (this.scroller instanceof Document) {
      return this.scroller.documentElement;
    } else {
      return this.scroller;
    }
  }

  setElement = modifier((element, [positionalElement]) => {
    this._registerScroller(positionalElement ?? element);
    return () => this._deregisterScroller();
  });

  @action
  handleScroll() {
    this.debounceId = debounce(this, '_checkShouldLoadMore', this.debounce);
  }

  @action
  loadMore() {
    this._loadMore();
  }

  _registerScroller(element) {
    this.scroller = element;

    this._startListening();
    this._scheduleCheckScrollable();
  }

  _deregisterScroller() {
    this._stopListening();
    cancel(this.debounceId);
    this.scroller = null;
  }

  _startListening() {
    this.scroller.addEventListener('scroll', this.handleScroll);
  }

  _stopListening() {
    this.scroller.removeEventListener('scroll', this.handleScroll);
  }

  _checkShouldLoadMore() {
    const scrollState = this._getScrollState();
    const shouldLoadMore = scrollState.reachedBottom && !this.isLoading;

    this._debug({ ...scrollState, shouldLoadMore });

    if (shouldLoadMore) {
      this._loadMore();
    }
  }

  _checkScrollable() {
    if (!this.scroller) {
      return;
    }

    const scrollState = this._getScrollState();

    this._debug({ ...scrollState });

    this.isScrollable = scrollState.isScrollable;
  }

  _scheduleCheckScrollable() {
    scheduleOnce('afterRender', this, '_checkScrollable');
  }

  _debug(state) {
    if (!this.debug) {
      return;
    }

    console.table([state]); // eslint-disable-line
  }

  _getScrollState() {
    const element = this.normalisedScrollerElement;
    const scrollHeight = element.scrollHeight;
    const scrollTop = element.scrollTop;
    const clientHeight = element.clientHeight;
    const isScrollable = scrollHeight > clientHeight;
    const bottom = scrollHeight - clientHeight;
    const percent = this.percent;
    const percentScrolled = round((scrollTop / bottom) * 100);
    const reachedBottom = percentScrolled >= percent;

    return {
      isScrollable,
      scrollHeight,
      clientHeight,
      scrollTop,
      bottom,
      percent,
      percentScrolled,
      reachedBottom
    };
  }

  _loadMore() {
    this.isLoading = true;

    resolve(this.args.onLoadMore?.()).finally(() => {
      this.isLoading = false;

      this._scheduleCheckScrollable();
    });
  }
}
