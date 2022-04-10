import { customElement, ICustomElementController } from '@aurelia/runtime-html';
import { IRouterOptions, ResolutionMode, route, Route } from '@aurelia/router-lite';
import { assert } from '@aurelia/testing';

import { IHookInvocationAggregator, IHIAConfig, HookName } from './_shared/hook-invocation-tracker.js';
import { HookSpecs, TestRouteViewModelBase } from './_shared/view-models.js';
import { hookSpecsMap, verifyInvocationsEqual } from './_shared/hook-spec.js';
import { createFixture, IActivityTracker } from './_shared/create-fixture.js';

function vp(count: number): string {
  if (count === 1) {
    return `<au-viewport></au-viewport>`;
  }
  let template = '';
  for (let i = 0; i < count; ++i) {
    template = `${template}<au-viewport name="$${i}"></au-viewport>`;
  }
  return template;
}

function getDefaultHIAConfig(): IHIAConfig {
  return {
    resolveTimeoutMs: 100,
    resolveLabels: [],
  };
}
export function* prepend(
  prefix: string,
  component: string,
  ...calls: (HookName | '')[]
): Generator<string, void> {
  for (const call of calls) {
    if (call === '') {
      yield '';
    } else {
      yield `${prefix}.${component}.${call}`;
    }
  }
}

export function* prependDeferrable(
  prefix: string,
  component: string,
  resolution: ResolutionMode,
  ...calls: (HookName | '')[]
): Generator<string, void> {
  if (resolution === 'dynamic') {
    yield `${prefix}.${component}.canLoad`;
    yield `${prefix}.${component}.load`;
  }

  for (const call of calls) {
    if (call === '') {
      yield '';
    } else {
      yield `${prefix}.${component}.${call}`;
    }
  }
}

export function* interleave(
  ...generators: Generator<string, void>[]
): Generator<string, void> {
  while (generators.length > 0) {
    for (let i = 0, ii = generators.length; i < ii; ++i) {
      const gen = generators[i];
      const next = gen.next();
      if (next.done) {
        generators.splice(i, 1);
        --i;
        --ii;
      } else {
        const value = next.value as string;
        if (value) {
          yield value;
        }
      }
    }
  }
}

export interface IRouterOptionsSpec {
  resolution: ResolutionMode;
  toString(): string;
}

export interface IComponentSpec {
  kind: 'all-sync' | 'all-async';
  hookSpecs: HookSpecs;
}

export abstract class SimpleActivityTrackingVMBase {
  public readonly $controller!: ICustomElementController;

  public constructor(
    @IActivityTracker public readonly tracker: IActivityTracker,
  ) {}

  public attached(): void {
    this.tracker.setActive(this.$controller.definition.name);
  }

  public setNonActive(): void {
    this.tracker.setActive(this.$controller.definition.name);
  }
}

describe('router config', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  describe.skip('monomorphic timings', function () {
    const routerOptionsSpecs: IRouterOptionsSpec[] = ([
      'dynamic',
      'static',
    ] as const).map((resolution) => ({ resolution, toString() { return `resolution:'${resolution}'`; } }));

    const componentSpecs: IComponentSpec[] = [
      {
        kind: 'all-sync',
        hookSpecs: HookSpecs.create({
          binding: hookSpecsMap.binding.sync,
          bound: hookSpecsMap.bound.sync,
          attaching: hookSpecsMap.attaching.sync,
          attached: hookSpecsMap.attached.sync,

          detaching: hookSpecsMap.detaching.sync,
          unbinding: hookSpecsMap.unbinding.sync,

          canLoad: hookSpecsMap.canLoad.sync,
          load: hookSpecsMap.load.sync,
          canUnload: hookSpecsMap.canUnload.sync,
          unload: hookSpecsMap.unload.sync,
        }),
      },
      {
        kind: 'all-async',
        hookSpecs: getAllAsyncSpecs(1),
      },
    ];

    for (const componentSpec of componentSpecs) {
      const { kind, hookSpecs } = componentSpec;

      @customElement({ name: 'a01', template: null })
      class A01 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a02', template: null })
      class A02 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a03', template: null })
      class A03 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a04', template: null })
      class A04 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }

      const A0 = [A01, A02, A03, A04];

      @customElement({ name: 'root1', template: vp(1) })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Root1 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a11', template: vp(1) })
      class A11 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a12', template: vp(1) })
      class A12 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a13', template: vp(1) })
      class A13 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a14', template: vp(1) })
      class A14 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }

      const A1 = [A11, A12, A13, A14];

      @customElement({ name: 'root2', template: vp(2) })
      class Root2 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a21', template: vp(2) })
      class A21 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }
      @customElement({ name: 'a22', template: vp(2) })
      class A22 extends TestRouteViewModelBase {
        public constructor(@IHookInvocationAggregator hia: IHookInvocationAggregator) { super(hia, hookSpecs); }
      }

      const A2 = [A21, A22];

      const A = [...A0, ...A1, ...A2];

      describe(`componentSpec.kind:'${kind}'`, function () {
        for (const routerOptionsSpec of routerOptionsSpecs) {
          const getRouterOptions = (): IRouterOptions => routerOptionsSpec;

          describe(`${routerOptionsSpec}`, function () {
            describe('single', function () {
              interface ISpec {
                t1: [string, string];
                t2: [string, string];
                t3: [string, string];
                t4: [string, string];
                configure(): void;
              }

              function runTest(spec: ISpec) {
                const { t1: [t1, t1c], t2: [t2, t2c], t3: [t3, t3c], t4: [t4, t4c] } = spec;
                spec.configure();
                it(`'${t1}' -> '${t2}' -> '${t3}' -> '${t4}'`, async function () {
                  const { router, hia, tearDown } = await createFixture(Root2, A, getDefaultHIAConfig, getRouterOptions);

                  const phase1 = `('' -> '${t1}')#1`;
                  const phase2 = `('${t1}' -> '${t2}')#2`;
                  const phase3 = `('${t2}' -> '${t3}')#3`;
                  const phase4 = `('${t3}' -> '${t4}')#4`;

                  hia.setPhase(phase1);
                  await router.load(t1);

                  hia.setPhase(phase2);
                  await router.load(t2);

                  hia.setPhase(phase3);
                  await router.load(t3);

                  hia.setPhase(phase4);
                  await router.load(t4);

                  await tearDown();

                  const expected = [...(function* () {
                    yield `start.root2.binding`;
                    yield `start.root2.bound`;
                    yield `start.root2.attaching`;
                    yield `start.root2.attached`;

                    yield* prepend(phase1, t1, 'canLoad', 'load', 'binding', 'bound', 'attaching', 'attached');

                    for (const [phase, { $t1c, $t2c }] of [
                      [phase2, { $t1c: t1c, $t2c: t2c }],
                      [phase3, { $t1c: t2c, $t2c: t3c }],
                      [phase4, { $t1c: t3c, $t2c: t4c }],
                    ] as const) {
                      yield `${phase}.${$t1c}.canUnload`;
                      yield `${phase}.${$t2c}.canLoad`;
                      yield `${phase}.${$t1c}.unload`;
                      yield `${phase}.${$t2c}.load`;

                      yield* prepend(phase, $t1c, 'detaching', 'unbinding', 'dispose');
                      yield* prepend(phase, $t2c, 'binding', 'bound', 'attaching', 'attached');
                    }

                    yield `stop.root2.detaching`;
                    yield `stop.root2.unbinding`;

                    yield* prepend('stop', t4, 'detaching', 'unbinding');
                  })()];
                  verifyInvocationsEqual(hia.notifyHistory, expected);

                  hia.dispose();
                });
              }

              const specs: ISpec[] = [
                {
                  t1: ['1', 'a01'],
                  t2: ['2', 'a02'],
                  t3: ['1', 'a01'],
                  t4: ['2', 'a02'],
                  configure() {
                    Route.configure({
                      routes: [
                        {
                          path: '1',
                          component: A01,
                        },
                        {
                          path: '2',
                          component: A02,
                        },
                      ],
                    }, Root2);
                  },
                },
              ];

              for (const spec of specs) {
                runTest(spec);
              }
            });
          });
        }
      });
    }
  });

  for (const inDependencies of [true, false]) {
    describe(`inDependencies: ${inDependencies}`, function () {
      it(`can load a configured child route with direct path and explicit component`, async function () {
        @customElement({ name: 'a01', template: null })
        class A01 extends SimpleActivityTrackingVMBase {}

        @route({ routes: [{ path: 'a', component: A01 }] })
        @customElement({ name: 'root', template: vp(1), dependencies: inDependencies ? [A01] : [] })
        class Root extends SimpleActivityTrackingVMBase {}

        const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig);

        await router.load('a');

        verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
      });

      it(`can load a configured child route with indirect path and explicit component`, async function () {
        @route({ path: 'a' })
        @customElement({ name: 'a01', template: null })
        class A01 extends SimpleActivityTrackingVMBase {}

        @route({ routes: [A01] })
        @customElement({ name: 'root', template: vp(1), dependencies: inDependencies ? [A01] : [] })
        class Root extends SimpleActivityTrackingVMBase {}

        const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig);

        await router.load('a');

        verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
      });
    });
  }

  it(`can load a configured child route by name`, async function () {
    @customElement({ name: 'a01', template: null })
    class A01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [A01] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig);

    await router.load('a01');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
  });

  it(`works with single multi segment static path`, async function () {
    @customElement({ name: 'a01', template: null })
    class A01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'a/x', component: A01 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('a/x');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
  });

  it(`works with single multi segment dynamic path`, async function () {
    @customElement({ name: 'a01', template: null })
    class A01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'a/:x', component: A01 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('a/1');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
  });

  it(`works with single multi segment static path with single child`, async function () {
    @customElement({ name: 'b01', template: null })
    class B01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'b', component: B01 }] })
    @customElement({ name: 'a11', template: vp(1) })
    class A11 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'a/x', component: A11 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('a/x/b');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a11', 'b01']);
  });

  it(`works with single multi segment static path with single multi segment static child`, async function () {
    @customElement({ name: 'b01', template: null })
    class B01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'b/x', component: B01 }] })
    @customElement({ name: 'a11', template: vp(1) })
    class A11 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'a/x', component: A11 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('a/x/b/x');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a11', 'b01']);
  });

  it(`works with single static path with single multi segment static child`, async function () {
    @customElement({ name: 'b01', template: null })
    class B01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'b/x', component: B01 }] })
    @customElement({ name: 'a11', template: vp(1) })
    class A11 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'a', component: A11 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('a/b/x');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a11', 'b01']);
  });

  it(`works with single empty static path redirect`, async function () {
    @customElement({ name: 'a01', template: null })
    class A01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: '', redirectTo: 'a' }, { path: 'a', component: A01 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
  });

  it(`works with single static path redirect`, async function () {
    @customElement({ name: 'a01', template: null })
    class A01 extends SimpleActivityTrackingVMBase {}

    @route({ routes: [{ path: 'x', redirectTo: 'a' }, { path: 'a', component: A01 }] })
    @customElement({ name: 'root', template: vp(1) })
    class Root extends SimpleActivityTrackingVMBase {}

    const { router, activityTracker } = await createFixture(Root, [], getDefaultHIAConfig, () => ({}));

    await router.load('x');

    verifyInvocationsEqual(activityTracker.activeVMs, ['root', 'a01']);
  });

  describe(`throw error when`, function () {
    function getErrorMsg({
      isRegistered,
      instruction,
      parent,
      parentPath,
    }: {
      isRegistered: boolean;
      instruction: string;
      parent: string;
      parentPath: string;
    }) {
      if (isRegistered) {
        return `'${instruction}' did not match any configured route, but it does match a registered component name at '${parentPath}' - did you forget to add a @route({ path: '${instruction}' }) decorator to '${instruction}' or unintentionally set routingMode to 'configured-only'?`;
      } else {
        return `'${instruction}' did not match any configured route or registered component name at '${parentPath}' - did you forget to add '${instruction}' to the routes list of the route decorator of '${parent}'?`;
      }
    }

    it(`load a configured child route with indirect path by name`, async function () {
      @route({ path: 'a' })
      @customElement({ name: 'a01', template: null })
      class A01 extends SimpleActivityTrackingVMBase {}

      @route({ routes: [A01] })
      @customElement({ name: 'root', template: vp(1) })
      class Root extends SimpleActivityTrackingVMBase {}

      const { router } = await createFixture(Root, [], getDefaultHIAConfig);

      let e: Error | null = null;
      try {
        await router.load('a01');
      } catch (err) {
        e = err;
      }

      assert.notStrictEqual(e, null);
      assert.strictEqual(e.message, getErrorMsg({
        isRegistered: false,
        instruction: 'a01',
        parent: 'root',
        parentPath: 'root',
      }));
    });
  });
});

function getAllAsyncSpecs(count: number): HookSpecs {
  return HookSpecs.create({
    binding: hookSpecsMap.binding.async(count),
    bound: hookSpecsMap.bound.async(count),
    attaching: hookSpecsMap.attaching.async(count),
    attached: hookSpecsMap.attached.async(count),

    detaching: hookSpecsMap.detaching.async(count),
    unbinding: hookSpecsMap.unbinding.async(count),

    canLoad: hookSpecsMap.canLoad.async(count),
    load: hookSpecsMap.load.async(count),
    canUnload: hookSpecsMap.canUnload.async(count),
    unload: hookSpecsMap.unload.async(count),
  });
}

