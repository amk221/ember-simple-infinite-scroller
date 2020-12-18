import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { defer, reject } from 'rsvp';
import { later } from '@ember/runloop';
import generateThings from 'dummy/utils/generate-things';
import {
  render,
  settled,
  find,
  findAll,
  click,
  waitFor,
  waitUntil
} from '@ember/test-helpers';

module('infinite-scroller', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.loadMoreCount = 0;
    this.things = generateThings(1, 20);

    this.handleLoadMore = () => {
      this.loadMoreCount++;
      this.things.pushObjects(generateThings(21, 40));
    };

    this.scrollSync = (el, y) => {
      el.scrollTop = y;
    };

    this.scrollToBottomSync = (selector) => {
      const el = find(selector);
      this.scrollSync(el, el.scrollHeight);
    };

    this.scrollToPercentageSync = (selector, percentage) => {
      const el = find(selector);
      const y = ((el.scrollHeight - el.clientHeight) / 100) * percentage;
      this.scrollSync(el, y);
    };

    this.waitForMoreLoaded = () => {
      return waitUntil(() => findAll('.thing').length === 40);
    };
  });

  test('it renders', async function (assert) {
    assert.expect(1);

    await render(hbs`<InfiniteScroller />`);

    assert.dom('.infinite-scroller').exists('has an appropriate class name');
  });

  test('scrollable class', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <InfiniteScroller class="example-1">
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </InfiniteScroller>
    `);

    assert.dom('.infinite-scroller').hasClass('infinite-scroller--scrollable');

    await render(hbs`<InfiniteScroller class="example-1" />`);

    assert
      .dom('.infinite-scroller')
      .doesNotHaveClass('infinite-scroller--scrollable');
  });

  test('load more action', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <InfiniteScroller
        class="example-1"
        @onLoadMore={{this.handleLoadMore}}
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </InfiniteScroller>
    `);

    this.scrollToBottomSync('.infinite-scroller');

    later(() => {
      assert
        .dom('.thing')
        .exists(
          { count: 20 },
          'has not fired load more action due to debouncing of scroll event'
        );
    }, 100);

    await this.waitForMoreLoaded();

    assert.equal(
      this.loadMoreCount,
      1,
      'fires load more action at the element scroll boundary'
    );
  });

  test('load more action (whilst loading)', async function (assert) {
    assert.expect(1);

    this.handleSlowLoadMore = () => {
      this.handleLoadMore();
      return new Promise((resolve) => later(resolve, 1000));
    };

    await render(hbs`
      <InfiniteScroller
        class="example-1"
        @onLoadMore={{this.handleSlowLoadMore}}
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </InfiniteScroller>
    `);

    this.scrollToBottomSync('.infinite-scroller');

    await this.waitForMoreLoaded();

    this.scrollToBottomSync('.infinite-scroller');

    await settled();

    assert.equal(
      this.loadMoreCount,
      1,
      'does not fire load more action if already loading more'
    );
  });

  test('load more action (leeway)', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <InfiniteScroller
        class="example-1"
        @leeway="50%"
        @onLoadMore={{this.handleLoadMore}}
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </InfiniteScroller>
    `);

    this.scrollToPercentageSync('.infinite-scroller', 49);

    await settled();

    assert.equal(this.loadMoreCount, 0, 'not scrolled enough');

    this.scrollToPercentageSync('.infinite-scroller', 50);

    await this.waitForMoreLoaded();

    assert.equal(
      this.loadMoreCount,
      1,
      'fires load more action at the custom element scroll boundary'
    );
  });

  test('load more action (debounce)', async function (assert) {
    assert.expect(3);

    await render(hbs`
      <InfiniteScroller
        class="example-1"
        @debounce={{50}}
        @onLoadMore={{this.handleLoadMore}}
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </InfiniteScroller>
    `);

    this.scrollToBottomSync('.infinite-scroller');

    later(() => {
      assert.equal(this.loadMoreCount, 0, 'not fired yet');

      assert
        .dom('.thing')
        .exists(
          { count: 20 },
          'has not fired action due to custom debouncing of scroll event'
        );
    }, 50);

    await this.waitForMoreLoaded();

    assert.equal(
      this.loadMoreCount,
      1,
      'fires load more action after being debounced'
    );
  });

  test('custom element via argument', async function (assert) {
    assert.expect(1);

    this.setElement = (element) => this.set('customElement', element);

    await render(hbs`
      <div class="external-element" {{did-insert this.setElement}}>
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </div>

      <InfiniteScroller
        @element={{this.customElement}}
        @onLoadMore={{this.handleLoadMore}}
      />
    `);

    this.scrollToBottomSync('.external-element');

    await this.waitForMoreLoaded();

    assert.equal(
      this.loadMoreCount,
      1,
      'fires load more action at the custom element scroll boundary'
    );
  });

  test('custom element via registration', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <InfiniteScroller
        @onLoadMore={{this.handleLoadMore}}
        as |scroller|
      >
        <div class="internal-element" {{did-insert scroller.setElement}}>
          {{#each this.things as |thing|}}
            <div class="thing">{{thing.name}}</div>
          {{/each}}
        </div>
      </InfiniteScroller>
    `);

    this.scrollToBottomSync('.internal-element');

    await this.waitForMoreLoaded();

    assert.equal(
      this.loadMoreCount,
      1,
      'fires load more action at the custom element scroll boundary'
    );
  });

  test('load more action (document)', async function (assert) {
    assert.expect(1);

    this.document = document;

    await render(hbs`
      <InfiniteScroller
        class="example-2"
        @element={{this.document}}
        @onLoadMore={{this.handleLoadMore}}
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}
      </InfiniteScroller>
    `);

    this.scrollToBottomSync(document.documentElement);

    await this.waitForMoreLoaded();

    assert.equal(
      this.loadMoreCount,
      1,
      'fires load more action at the document element scroll boundary'
    );
  });

  test('loading class name', async function (assert) {
    assert.expect(3);

    const willLoad = defer();

    this.handleLoadMore = () => willLoad.promise;

    await render(hbs`
      <InfiniteScroller
        @onLoadMore={{this.handleLoadMore}} as |scroller|
      >
        <button type="button" {{on "click" scroller.loadMore}}>
          Load more
        </button>
      </InfiniteScroller>
    `);

    assert
      .dom('.infinite-scroller')
      .doesNotHaveClass(
        'infinite-scroller--loading',
        'precondition: is not loading'
      );

    await click('button');

    assert
      .dom('.infinite-scroller')
      .hasClass(
        'infinite-scroller--loading',
        'a loading class is added whilst the action is being performed'
      );

    willLoad.resolve();

    await settled();

    assert
      .dom('.infinite-scroller')
      .doesNotHaveClass(
        'infinite-scroller--loading',
        'loading class name is removed after the action resolves'
      );
  });

  test('yielded loading state', async function (assert) {
    assert.expect(3);

    const willLoad = defer();

    this.handleLoadMore = () => willLoad.promise;

    await render(hbs`
      <InfiniteScroller
        @onLoadMore={{this.handleLoadMore}} as |scroller|
      >
        <span>{{scroller.isLoading}}</span>

        <button type="button" {{on "click" scroller.loadMore}}>
          Load more
        </button>
      </InfiniteScroller>
    `);

    assert.dom('span').hasText('false', 'precondition: not loading');

    click('button'); // Intentionally no await

    await waitFor('.infinite-scroller');

    assert.dom('span').hasText('true', 'yields a hash with the loading state');

    willLoad.resolve();

    await settled();

    assert.dom('span').hasText('false', 'loading state is updated');
  });

  test('yielded error', async function (assert) {
    assert.expect(2);

    this.handleLoadMore = () => reject(new Error('Fail'));

    await render(hbs`
      <InfiniteScroller
        @onLoadMore={{this.handleLoadMore}} as |scroller|
      >
        {{#if scroller.error}}
          <p>{{scroller.error.message}}</p>
        {{/if}}

        <button type="button" {{on "click" scroller.loadMore}}>
          Load more
        </button>
      </InfiniteScroller>
    `);

    assert
      .dom('.infinite-scroller')
      .doesNotContainText('Fail', 'precondition: no error message');

    await click('button');

    assert
      .dom('.infinite-scroller')
      .containsText('Fail', 'yields a hash with the last rejection error');
  });

  test('yielded loadMore action', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <InfiniteScroller
        @onLoadMore={{this.handleLoadMore}} as |scroller|
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}

        <button type="button" {{on "click" scroller.loadMore}}>
          Load more
        </button>
      </InfiniteScroller>
    `);

    await click('button');

    assert
      .dom('.thing')
      .exists(
        { count: 40 },
        'yields an action that can trigger the load more action'
      );
  });

  test('destroying (does not blow up)', async function (assert) {
    assert.expect(0);

    this.showScroller = true;

    const willLoad = defer();

    this.handleLoadMore = () => {
      this.set('showScroller', false);
      return willLoad.promise;
    };

    await render(hbs`
      {{#if this.showScroller}}
        <InfiniteScroller
          @onLoadMore={{this.handleLoadMore}} as |scroller|
        >
          <button type="button" {{on "click" scroller.loadMore}}>
            Load more
          </button>
        </InfiniteScroller>
      {{/if}}
    `);

    await click('button');

    willLoad.resolve();
  });

  test('no promise (does not blow up)', async function (assert) {
    assert.expect(0);

    this.handleLoadMore = () => null;

    await render(hbs`
      <InfiniteScroller
        @onLoadMore={{this.handleLoadMore}} as |scroller|
      >
        <button type="button" {{on "click" scroller.loadMore}}>
          Load more
        </button>
      </InfiniteScroller>
    `);

    await click('button');
  });

  test('destroying during debounce (does not blow up)', async function (assert) {
    assert.expect(0);

    this.show = true;

    this.handleLoadMore = () => null;

    await render(hbs`
      {{#if this.show}}
        <InfiniteScroller
          class="example-1"
          @debounce={{50}}
          @onLoadMore={{this.handleLoadMore}}
        >
          {{#each this.things as |thing|}}
            <div class="thing">{{thing.name}}</div>
          {{/each}}
        </InfiniteScroller>
      {{/if}}
    `);

    this.scrollToBottomSync('.infinite-scroller');

    later(() => {
      this.set('show', false);
    }, 25);
  });

  test('is scrollable', async function (assert) {
    assert.expect(2);

    this.things = generateThings(1, 2);

    await render(hbs`
      <InfiniteScroller
        class="example-1"
        @onLoadMore={{this.handleLoadMore}} as |scroller|
      >
        {{#each this.things as |thing|}}
          <div class="thing">{{thing.name}}</div>
        {{/each}}

        {{#unless scroller.isScrollable}}
          <button
            type="button"
            class="load-more"
            {{on "click" scroller.loadMore}}
          >
            Load more
          </button>
        {{/unless}}
      </InfiniteScroller>
    `);

    assert
      .dom('.load-more')
      .exists(
        'load more button shows because infinite scroller component ' +
          'determined that there is no scroll movement available'
      );

    await click('.load-more');

    assert
      .dom('.load-more')
      .doesNotExist(
        'infinite scroller component re-computes whether or not there is scroll movement available'
      );
  });
});
