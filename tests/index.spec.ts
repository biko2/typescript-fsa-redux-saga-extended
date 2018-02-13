import test = require('tape');
import { Test } from 'tape';
import actionCreatorFactory, { isType } from 'typescript-fsa';
import { Action, createStore, applyMiddleware } from 'redux';
import sagaMiddlewareFactory from 'redux-saga';
import { call, race, take } from 'redux-saga/effects';
import { deferred } from 'redux-saga/utils';

import { bindAsyncAction } from '../src/index';

type Params = { foo: string };
type Result = { args: any[] };
type State = {
  done?: {
    params: Params;
    result: Result;
  };
  failed?: {
    params: Params;
    error: any;
  };
};

function createAll() {
  const actionCreator = actionCreatorFactory();

  const asyncActionCreator = actionCreator.async<Params, Result>('ASYNC');

  const dfd = deferred();

  const asyncWorker = bindAsyncAction(asyncActionCreator)(
    (action: Action, ...args: any[]) => dfd.promise.then(() => ({ args })),
  );

  const reducer = (state: State = {}, action: Action): State => {
    if (isType(action, asyncActionCreator.done)) {
      return {
        ...state,
        done: action.payload,
      };
    }

    if (isType(action, asyncActionCreator.failed)) {
      return {
        ...state,
        failed: action.payload,
      };
    }

    return state;
  };

  const sagaMiddleware = sagaMiddlewareFactory();

  const store = createStore(reducer, applyMiddleware(sagaMiddleware));

  const output: {
    result?: Result;
    cancelled?: boolean;
    error?: any;
  } = {};

  sagaMiddleware.run(function* rootSaga() {
    try {
      const { worker, cancel } = yield race({
        worker: call(
          asyncWorker,
          asyncActionCreator.started({ foo: 'bar' }),
          1,
          2,
          3,
        ),
        cancel: take('CANCEL'),
      });

      if (worker) {
        output.result = worker;
      } else {
        output.cancelled = true;
      }
    } catch (e) {
      output.error = e;
    }
  });

  return { store, dfd, output };
}

function async(fn: (assert: Test) => Promise<any>) {
  return (assert: Test) => {
    fn(assert).then(() => assert.end(), error => assert.fail(error));
  };
}

function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

test('bindAsyncAction', ({ test }: Test) => {
  test(
    'resolve',
    async(async assert => {
      const { store, dfd, output } = createAll();
      console.log('store:', store.getState());

      // await delay(50);

      assert.deepEqual(output, {});

      dfd.resolve({});

      await delay(50);

      assert.deepEqual(store.getState(), {
        done: {
          params: { foo: 'bar' },
          result: { args: [1, 2, 3] },
        },
      });

      assert.deepEqual(output, {
        result: { args: [1, 2, 3] },
      });
    }),
  );
});

test('bindAsyncAction', ({ test }: Test) => {
  test(
    'reject',
    async(async assert => {
      const { store, dfd, output } = createAll();

      assert.deepEqual(output, {});

      dfd.reject({ message: 'Error' });

      await delay(50);

      assert.deepEqual(store.getState(), {
        failed: {
          params: { foo: 'bar' },
          error: { message: 'Error' },
        },
      });
    }),
  );
});

test('bindAsyncAction', ({ test }: Test) => {
  test(
    'cancel',
    async(async assert => {
      const { store, dfd, output } = createAll();

      assert.deepEqual(output, {});

      store.dispatch({ type: 'CANCEL' });

      await delay(50);

      assert.deepEqual(store.getState(), {
        failed: {
          params: { foo: 'bar' },
          error: 'cancelled',
        },
      });
      assert.deepEqual(output, {
        cancelled: true,
      });
    }),
  );
});
