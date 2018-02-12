# [TypeScript FSA](https://github.com/biko2/typescript-fsa-redux-saga-extended) utilities for redux-saga
## Installation

```
npm install --save typescript-fsa-redux-saga-extended
```

## API

### `bindAsyncAction(actionCreators: AsyncActionCreators): HigherOrderSaga`

Creates higher-order-saga that wraps target saga with async actions.
Resulting saga dispatches `started` action once started and `done`/`failed`
upon finish.

**Example:**

```ts
// actions.ts
import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory();

// specify parameters and result shapes as generic type arguments
export const doSomething = 
  actionCreator.async<{foo: string},   // parameter type
                      {bar: number}    // result type
                     >('DO_SOMETHING');
                      
// saga.ts
import {SagaIterator} from 'redux-saga';
import {call} from 'redux-saga/effects';
import {doSomething} from './actions';
                      
const doSomethingWorker = bindAsyncAction(doSomething)(
  function* (action): SagaIterator {
    // `params` type is `{foo: string}`
    const bar = yield call(fetchSomething, action.payload.foo);
    return {bar};
  },       
);        
           
function* watchIncrementAsync() {
    yield takeLatest(
      doSomethingWorkerActionCreator.started,
      doSomethingWorker,
    );
}
```
