# [TypeScript FSA](https://github.com/biko2/typescript-fsa-redux-saga-extended) utilities for redux-saga

## Installation

```
npm install --save typescript-fsa-redux-saga-extended
```

## API

### `bindAsyncAction(actionCreators: AsyncActionCreators): HigherOrderSaga`

Creates higher-order-saga that wraps target saga with async actions, mainly based on [typescript-fsa-redux-saga](https://www.npmjs.com/package/typescript-fsa-redux-saga).

Main differences with[typescript-fsa-redux-saga](https://www.npmjs.com/package/typescript-fsa-redux-saga):

* It is designed to work with `takeLatest/takeEvery`
* Accepts an action instead of a `{params}` object
* Does not throw any error (which would stop all sagas)
* Does not dispatch an `started` action. This avoids the need for a `trigger` action, because instead of having another dummy action just for triggering, you can use that `started` action as a trigger.
* Resulting saga dispatches only `done`/`failed` upon finish.

**Example:**

```ts
// actions.ts
import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory();

// specify parameters and result shapes as generic type arguments
export const doSomething = actionCreator.async<
  { foo: string }, // parameter type
  { bar: number } // result type
>('DO_SOMETHING');

// saga.ts
import { SagaIterator } from 'redux-saga';
import { call } from 'redux-saga/effects';
import { doSomething } from './actions';

const doSomethingWorker = bindAsyncAction(doSomething)(function*(
  action,
): SagaIterator {
  const bar = yield call(fetchSomething, action.payload.foo);
  return { bar };
});

function* watchIncrementAsync() {
  yield takeLatest(doSomethingWorkerActionCreator.started, doSomethingWorker);
}
```
