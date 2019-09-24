import {
  Action,
  Reducer,
  StoreEnhancer,
  Store,
  createStore as createReduxStore
} from "redux";
import { asapScheduler, merge, Observable, Subject } from "rxjs";
import { filter, observeOn } from "rxjs/operators";

export interface Effect<A extends Action> {
  readonly type: string;

  map<B extends Action>(mapper: (from: A) => B): Effect<B>;
}

export abstract class SilentEff implements Effect<never> {
  abstract readonly type: string;

  map() {
    return this;
  }
}

const typeOfBatch = "Core/Batch";

export class Batch<A extends Action> implements Effect<A> {
  readonly type = typeOfBatch;

  constructor(readonly effects: Array<Effect<A>>) {}

  map<B extends Action>(mapper: (from: A) => B): Batch<B> {
    const effects = this.effects.map((effect: Effect<A>) => effect.map(mapper));

    return new Batch(effects);
  }
}

export const EMPTY = new Batch<never>([]);

const isBatch = <A extends Action>(effect: Effect<A>): effect is Batch<A> =>
  effect.type === typeOfBatch;

const toFlatArray = <A extends Action>(effect: Effect<A>): Array<Effect<A>> => {
  if (isBatch(effect)) {
    return effect.effects.reduce<Array<Effect<A>>>((acc, effect) => {
      return acc.concat(toFlatArray(effect));
    }, []);
  }

  return [effect];
};

export type Loop<S, A extends Action> = [S, Effect<A>];
export type LoopReducer<S, A extends Action> = (
  prevState: S,
  action: A
) => Loop<S, A>;
export type Epic<I extends Action, O extends Action = I> = (
  effect$: Observable<Effect<I>>
) => Observable<O>;

export const combineEpics = <I extends Action, O extends Action = I>(
  ...epics: Array<Epic<I, O>>
): Epic<I, O> => effect$ => merge(...epics.map(epic => epic(effect$)));

export const ofType = <R extends Effect<Action>>(...keys: Array<R["type"]>) => (
  source: Observable<Effect<Action>>
): Observable<R> =>
  source.pipe(filter((value): value is R => keys.includes(value.type)));

export const createStore = <S, A extends Action, Ext, StateExt>(
  initialLoop: Loop<S, A>,
  reducer: LoopReducer<S, A>,
  epic: Epic<A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<S & StateExt, A> & Ext => {
  const effectSubject = new Subject<Effect<A>>();

  epic(effectSubject.pipe(observeOn(asapScheduler))).subscribe(action => {
    store.dispatch(action);
  });

  const liftReducer = (loopReducer: LoopReducer<S, A>): Reducer<S, A> => (
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

  return store;
};

// LOOP HELPERS

export const getEffect = <S, A extends Action>(loop: Loop<S, A>): Effect<A> => {
  return loop[1];
};

export const getModel = <S, A extends Action>(loop: Loop<S, A>): S => {
  return loop[0];
};

export const mapModel = <SA, SB, A extends Action>(
  loopToMap: Loop<SA, A>,
  mapper: (from: SA) => SB
): Loop<SB, A> => {
  return [mapper(getModel(loopToMap)), getEffect(loopToMap)];
};

export const mapEffect = <S, AA extends Action, AB extends Action>(
  loopToMap: Loop<S, AA>,
  mapper: (from: AA) => AB
): Loop<S, AB> => {
  return [getModel(loopToMap), getEffect(loopToMap).map(mapper)];
};

export const mapLoop = <SA, SB, AA extends Action, AB extends Action>(
  loopToMap: Loop<SA, AA>,
  modelMapper: (from: SA) => SB,
  actionMapper: (from: AA) => AB
): Loop<SB, AB> => {
  return [
    modelMapper(getModel(loopToMap)),
    getEffect(loopToMap).map(actionMapper)
  ];
};

export const flattenLoop = <S, A extends Action>(
  loops: Array<Loop<S, A>>
): Loop<Array<S>, A> => {
  const states = loops.map(loop => getModel(loop));
  const effects = loops.map(loop => getEffect(loop));

  return [states, new Batch(effects)];
};
