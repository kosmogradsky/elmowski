import { Action, AnyAction } from "redux";
import { ajax } from "rxjs/ajax";
import { groupBy, map, mergeMap, switchMap } from "rxjs/operators";
import { ofType, Effect, Epic } from "./Loop";

const defaultTracker = Symbol("defaultTracker");

// EFFECTS

export class Get<A extends Action> implements Effect<A> {
  readonly type = "Http/Get";

  constructor(
    readonly url: string,
    readonly onResponse: (payload: any) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): Get<B> {
    return new Get(this.url, p => mapper(this.onResponse(p)));
  }
}

// EPIC
export const epic: Epic<Action, AnyAction> = effect$ =>
  effect$.pipe(
    ofType<Get<Action>>("Http/Get"),
    groupBy(action => action.tracker || defaultTracker),
    mergeMap(group =>
      group.pipe(
        switchMap(action =>
          ajax
            .get(action.url)
            .pipe(map(({ response }) => action.onResponse(response)))
        )
      )
    )
  );
