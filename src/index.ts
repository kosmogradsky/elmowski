import { Subject, Observable, merge } from "rxjs";
import { filter } from "rxjs/operators";
import {
  Action,
  Reducer,
  StoreEnhancer,
  createStore as createReduxStore,
  Store
} from "redux";

export interface Effect {
  readonly type: string;
}

const typeOfBatch = "Batch";
const typeOfEmpty = "Empty";

export class Batch<E extends Effect> implements Effect {
  readonly type = typeOfBatch;

  constructor(readonly effects: (E | Batch<E> | Empty)[]) {}
}

class Empty implements Effect {
  readonly type = typeOfEmpty;
}

export const EMPTY = new Empty();

const isBatch = <E extends Effect>(effect: E | Batch<E>): effect is Batch<E> =>
  effect.type === typeOfBatch;
const isEmpty = <E extends Effect>(effect: E | Empty): effect is Empty =>
  effect.type === typeOfEmpty;

const toFlatArray = <E extends Effect>(effect: E | Empty | Batch<E>): E[] => {
  if (isEmpty(effect)) {
    return [];
  }

  if (isBatch(effect)) {
    return effect.effects.reduce<E[]>((acc, effect) => {
      return acc.concat(toFlatArray(effect));
    }, []);
  }

  return [effect];
};

export type Loop<S, E extends Effect> = [S, E | Batch<E> | Empty];
export type LoopReducer<S, A, E extends Effect> = (
  prevState: S,
  action: A
) => Loop<S, E>;
export type Epic<A> = (effect$: Observable<Effect>) => Observable<A>;

export const combineEpics = <A>(...epics: Epic<A>[]): Epic<A> => effect$ =>
  merge(...epics.map(epic => epic(effect$)));

export const ofType = <R extends Effect>(...keys: R["type"][]) => (
  source: Observable<Effect>
): Observable<R> =>
  source.pipe(filter((value): value is R => keys.includes(value.type)));

export const createStore = <
  S,
  A extends Action,
  E extends Effect,
  Ext,
  StateExt
>(
  initialLoop: Loop<S, E>,
  reducer: LoopReducer<S, A, E>,
  epic: Epic<A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<S & StateExt, A> & Ext => {
  const effectSubject = new Subject<E>();

  const liftReducer = (loopReducer: LoopReducer<S, A, E>): Reducer<S, A> => (
    state,
    action
  ) => {
    const [model, effect] =
      state === undefined ? initialLoop : loopReducer(state, action);

    toFlatArray(effect).forEach(eff => {
      effectSubject.next(eff);
    });

    return model;
  };

  const store = createReduxStore(liftReducer(reducer), enhancer);

  epic(effectSubject).subscribe(action => {
    store.dispatch(action);
  });

  return store;
};
