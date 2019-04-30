import { Observable, merge } from "rxjs";
import { filter } from "rxjs/operators";
import { ValueConstructor, Epic } from "../types";

export const combineEpics = <A>(...epics: Epic<A>[]): Epic<A> => effect$ => merge(
  ...epics.map(epic => epic(effect$))
)

export const ofType = <R extends ValueConstructor>(...keys: R['type'][]) =>
  (source: Observable<ValueConstructor>): Observable<R> =>
    source.pipe(filter((value): value is R => keys.includes(value.type)));