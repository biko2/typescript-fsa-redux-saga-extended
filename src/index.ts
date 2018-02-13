import { isType, AsyncActionCreators, AnyAction } from 'typescript-fsa';
import { SagaIterator } from 'redux-saga';
import { put, call, cancelled } from 'redux-saga/effects';

export function bindAsyncAction<P, R>(
  actionCreators: AsyncActionCreators<P, R, any>,
): {
  (worker: (action: AnyAction) => Promise<R> | SagaIterator): (
    action: AnyAction,
  ) => SagaIterator;

  <A1>(worker: (action: AnyAction, arg1: A1) => Promise<R> | SagaIterator): (
    action: AnyAction,
    arg1: A1,
  ) => SagaIterator;

  <A1, A2>(
    worker: (
      action: AnyAction,
      arg1: A1,
      arg2: A2,
    ) => Promise<R> | SagaIterator,
  ): (action: AnyAction, arg1: A1, arg2: A2) => SagaIterator;

  <A1, A2, A3>(
    worker: (
      action: AnyAction,
      arg1: A1,
      arg2: A2,
      arg3: A3,
      ...rest: any[]
    ) => Promise<R> | SagaIterator,
  ): (
    action: AnyAction,
    arg1: A1,
    arg2: A2,
    arg3: A3,
    ...rest: any[]
  ) => SagaIterator;
};

export function bindAsyncAction<P, R>(
  actionCreator: AsyncActionCreators<P, R, any>,
) {
  return (
    worker: (action: AnyAction, ...args: any[]) => Promise<any> | SagaIterator,
  ) => {
    return function*(action: AnyAction, ...args: any[]): SagaIterator {
      if (isType(action, actionCreator.started)) {
        try {
          const result = yield (call as any)(worker, action, ...args);
          yield put(
            actionCreator.done({
              params: action.payload,
              result,
            }),
          );
          return result;
        } catch (error) {
          yield put(actionCreator.failed({ params: action.payload, error }));
          // Do not re-throw this error, becuase it will stop all sagas
          // throw error;
        } finally {
          if (yield cancelled()) {
            yield put(
              actionCreator.failed({
                params: action.payload,
                error: 'cancelled',
              }),
            );
          }
        }
      }
    };
  };
}
