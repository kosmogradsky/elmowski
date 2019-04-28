import { Observable } from "rxjs";

export interface ValueConstructor {
  readonly type: string;
}

export type Loop<S, E> = [S, E?];
export type Reducer<S, A> = (prevState: S, action: A) => S;
export type LoopReducer<S, A, E = never> = (prevState: S, action: A) => Loop<S, E>;
export type Epic<E, A> = (effect$: Observable<E>) => Observable<A>;