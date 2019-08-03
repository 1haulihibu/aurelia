import { Constructable, PLATFORM } from '@aurelia/kernel';
import { Aurelia, CustomElement } from '@aurelia/runtime';
import { Blur, BlurManager } from '@aurelia/runtime-html';
import { assert, createSpy, eachCartesianJoin, HTMLTestContext, TestContext } from '@aurelia/testing';

describe('[UNIT] blur.spec.ts', function() {
  let target: HTMLElement;
  let sut: Blur;
  let ctx: HTMLTestContext;

  const falsyPansyValues = [false, 0, '', undefined, null];

  beforeEach(function() {
    ctx = TestContext.createHTMLTestContext();
    target = ctx.doc.body.appendChild(ctx.createElement('div'));
    sut = new Blur(target, ctx.dom);
  });

  describe('contains()', function() {
    for (const value of falsyPansyValues) {
      it(`bails when value is already falsy: "${value}"`, function() {
        const accessed: Record<string, number> = {};
        sut.value = value as unknown as boolean;
        sut.contains = (originalFn => {
          return function() {
            const proxy = new Proxy(this, {
              get(obj: Blur, propertyName: string): unknown {
                accessed[propertyName] = (accessed[propertyName] || 0) + 1;
                return obj[propertyName];
              }
            });
            return originalFn.apply(proxy, arguments);
          };
        })(sut.contains);

        const result = sut.contains(document.body);
        assert.equal(result, false);
        assert.equal(Object.keys(accessed)[0], 'value', 'It should have accessed "value"');
        assert.equal(Object.keys(accessed).length, 1, 'It should not have accessed any other properties beside "value".');
      });
    }

    it('returns true when invoked on child element', function() {
      const child = target.appendChild(ctx.createElement('div'));
      sut.value = true;
      const result = sut.contains(child);
      assert.equal(result, true);
    });

    it('returns true when invoked on the its own element', function() {
      sut.value = true;
      assert.equal(sut.contains(target), true);
    });

    it('bails when there is no thing linked and the hosting element does not contain the target', function() {
      let accessed: Record<string, number> = {};
      sut.value = true;
      sut.contains = (originalFn => {
        return function() {
          const proxy = new Proxy(this, {
            get(obj: Blur, propertyName: string): unknown {
              accessed[propertyName] = (accessed[propertyName] || 0) + 1;
              return obj[propertyName];
            }
          });
          return originalFn.apply(proxy, arguments);
        };
      })(sut.contains);

      // though the interface of Blur.contains is Element as first argument,
      // it can work with any subclass of Node
      for (const testValue of [
        document.body,
        ctx.createElement('div'),
        document.createDocumentFragment(),
        ctx.createElement('div').attachShadow({ mode: 'open' }),
        ctx.createElement('div').attachShadow({ mode: 'closed' }),
        document.createComment('asdad'),
        document.createTextNode('sdasdas'),
        document.createElementNS('http://www.w3.org/1999/xhtml', 'asdasd:sadasd'),
        document,
        document.documentElement,
        document.createAttribute('asd')
      ]) {
        const result = sut.contains(testValue as unknown as Element);
        assert.equal(result, false);
        const accessedProps = Object.keys(accessed);
        assert.equal(accessedProps.length, 3);
        assert.equal(
          accessedProps.toString(),
          ['value', 'element', 'linkedWith'].toString(),
          'It should have accessed "value", "element", "linkedWith"'
        );
        accessed = {};
      }
    });

    it('throws when given anything not a Node but also not null/undefined', function() {
      sut.value = true;
      for (const imcompatValue of [true, false, 'a', 5, Symbol(), Number, new Date(), {}, [], new Proxy({}, {})]) {
        assert.throws(() => sut.contains(imcompatValue as unknown as Element));
      }
    });
  });

  describe('.triggerBlur()', function() {
    it('sets value to false', function() {
      for (const value of [true, 'a', 5, Symbol(), Number, new Date(), null, undefined, {}, [], new Proxy({}, {})]) {
        sut.value = value as unknown as boolean;
        sut.triggerBlur();
        assert.equal(sut.value, false);
      }
    });

    it('calls onBlur() if present', function() {
      let count = 0;
      const onBlurSpy = createSpy(function() {
        count++;
      });
      sut.onBlur = onBlurSpy;
      const testValues = [true, 'a', 5, Symbol(), function() {/***/}, Number, new Date(), null, undefined, {}, [], new Proxy({}, {})];
      for (const value of testValues) {
        sut.value = value as unknown as boolean;
        sut.triggerBlur();
        assert.equal(sut.value, false);
        assert.equal(onBlurSpy.calls.length, 1);
        onBlurSpy.reset();
      }
      assert.equal(count, testValues.length);
    });

    it('does not call onBlur if value is not a function', function() {
      const testValues = [true, 'a', 5, Symbol(), new Date(), null, undefined, {}, [], new Proxy({}, {})];
      let onBlurValue: any;
      let accessCount = 0;
      sut = new Proxy(sut, {
        get($obj, propertyName) {
          if (propertyName === 'onBlur') {
            accessCount++;
          }
          return propertyName === 'onBlur' ? onBlurValue : $obj[propertyName];
        }
      });
      for (const value of testValues) {
        onBlurValue = value;
        sut.triggerBlur();
      }
      assert.equal(accessCount, testValues.length);
    });
  });

  describe('contains with [linkedWith]', function() {
    describe('object/object[] scenarios', function() {
      const doc = document;
      const fakeEl = doc.body.appendChild(doc.createElement('fake'));
      const linkedWithValues: (HasContains | HasContains[])[] = [
        doc,
        doc.documentElement,
        doc.body,
        {
          name: 'some-view-model with contains method',
          contains(el: Element) {
            return el === fakeEl;
          }
        },
        [
          {
            name: 'some-other-vm',
            contains(el: Element) {
              return el === fakeEl;
            }
          },
          {
            handle(el: Element) {
              return el === fakeEl;
            },
            contains(el: Element) {
              return this.handle(el);
            }
          }
        ]
      ];
      for (const linkedWith of linkedWithValues) {
        it('invokes contains on linkedWith object', function() {
          sut.linkedWith = linkedWith;
          assert.equal(
            sut.contains(fakeEl),
            true,
            `contains + linkedWith + ${linkedWith['name'] || typeof linkedWith}`
          );
        });
      }
    });

    describe('string/string[] scenarios', function() {
      const doc = document;
      doc.body.insertAdjacentHTML('beforeend', `
        <some-el><div data-query="some-el"></div></some-el>,
        <div class="some-css-class">
          <div data-query=".some-css-class"></div>
        </div>
        <div id="some-id">
          <div data-query="#some-id"></div>
        </div>
        <div id="some-complex-selector">
          <div class="some-nested-complex-selector">
          </div>
          <button data-query="#some-complex-selector > .some-nested-complex-selector + button">Click me</button>
        </div>
      `);
      const linkedWithValues = [
        'some-el',
        '.some-css-class',
        '#some-id',
        '#some-complex-selector > .some-nested-complex-selector + button'
      ];
      for (const linkWith of linkedWithValues) {
        it(`works when linkedWith is a string: ${linkWith}`, function() {
          sut.linkedWith = linkWith;
          const interactWith = doc.querySelector(`[data-query="${linkWith}"]`);
          assert.notEqual(
            interactWith,
            null,
            `querySelector[data-query=${linkWith}]`
          );
          assert.equal(sut.contains(interactWith), true);
        });
      }

      it('works when linkedWith is an array of string', function() {
        sut.linkedWith = linkedWithValues;
        for (const linkWith of linkedWithValues) {
          const interactWith = doc.querySelector(`[data-query="${linkWith}"]`);
          assert.notEqual(
            interactWith,
            null,
            `querySelector[data-query=${linkWith}]`
          );
          assert.equal(sut.contains(interactWith), true);
        }
      });
    });
  });

  describe('with [linkedWith] + [onBlur] + ...', function todo() {/**/});
  describe('with [linkedWith] + [linkingContext]', function todo() {/**/});
  describe('with [linkedWith] + [linkingContext] + [searchSubTree]', function todo() {/**/});
  describe('with [linkedWith] + [linkingContext] + [searchSubTree] + [linkMultiple]', function todo() {/**/});

  interface HasContains {
    contains(el: Element): boolean;
    [x: string]: any;
  }
});
