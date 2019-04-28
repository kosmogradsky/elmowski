import { Observable, merge } from "rxjs";
import { filter } from "rxjs/operators";
import { ValueConstructor, Epic } from "../types";

export const combineEpics = <E, A>(...epics: Epic<E, A>[]): Epic<E, A> => effect$ => merge(
  ...epics.map(epic => epic(effect$))
)

export const ofType = <T extends ValueConstructor, R extends T>(...keys: R['type'][]) =>
  (source: Observable<T>): Observable<R> =>
    source.pipe(filter((value): value is R => keys.includes(value.type)));