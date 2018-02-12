import { isType, Action, AsyncActionCreators } from "typescript-fsa";
import { SagaIterator } from "redux-saga";
import { put, call, cancelled } from "redux-saga/effects";

export function bindAsyncAction<P, R>(
  actionCreators: AsyncActionCreators<P, R, any>,
): {
    (worker: (action: Action<typeof actionCreators.started>)
      => Promise<R> | SagaIterator):
      (action: Action<typeof actionCreators.started>) => SagaIterator;

    <A1>(worker: (action: Action<typeof actionCreators.started>, arg1: A1)
      => Promise<R> | SagaIterator):
      (action: Action<typeof actionCreators.started>, arg1: A1) => SagaIterator;

    <A1, A2>(worker: (action: Action<typeof actionCreators.started>, arg1: A1,
      arg2: A2) => Promise<R> | SagaIterator):
      (action: Action<typeof actionCreators.started>, arg1: A1, arg2: A2)
        => SagaIterator;

    <A1, A2, A3>(
      worker: (action: Action<typeof actionCreators.started>,
        arg1: A1, arg2: A2, arg3: A3,
        ...rest: any[]) => Promise<R> | SagaIterator):
      (action: Action<typeof actionCreators.started>,
        arg1: A1, arg2: A2, arg3: A3, ...rest: any[]) => SagaIterator;
  };

export function bindAsyncAction<P, R>(
  actionCreator: AsyncActionCreators<P, R, any>,
) {
  return (worker: (action: Action<typeof actionCreator.started>,
    ...args: any[]) => Promise<any> | SagaIterator) => {
    return function* (
      action: Action<typeof actionCreator.started>,
      ...args: any[],
    ): SagaIterator {
      if (isType(action, actionCreator.started)) {
        try {
          const result = yield (call as any)(worker, action, ...args);
          yield put(actionCreator.done({
            params: action.payload,
            result,
          }));
        } catch (error) {
          yield put(actionCreator.failed({ params: action.payload, error }));
        } finally {
          if (yield cancelled()) {
            yield put(actionCreator.failed({
              params: action.payload,
              error: 'cancelled',
            }));
          }
        }
      }
    };

  };
}
