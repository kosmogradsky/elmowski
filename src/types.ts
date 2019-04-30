import { Observable } from "rxjs";

export interface ValueConstructor {
  readonly type: string;
}

export type AnyEffect = ValueConstructor;

export type Loop<S> = [S, AnyEffect?];
export type Reducer<S, A> = (prevState: S, action: A) => S;
export type LoopReducer<S, A> = (prevState: S, action: A) => Loop<S>;
export type Epic<A> = (effect$: Observable<AnyEffect>) => Observable<A>;