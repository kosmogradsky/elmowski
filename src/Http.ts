import { ajax } from "rxjs/ajax";
import { map } from "rxjs/operators";
import { ofType, Effect, Epic, Action, AnyAction, SilentEff } from "./Loop";
import { groupByTracker } from "./Utils";

// EFFECTS

export class Get<A extends Action> implements Effect<A> {
  readonly type = "Http/Get";

  constructor(
    readonly url: string,
    readonly onResponse: (payload: any) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): Get<B> {
    return new Get(this.url, p => mapper(this.onResponse(p)), this.tracker);
  }
}

export class CancelRequest extends SilentEff {
  readonly type = "Http/CancelRequest";

  constructor(readonly tracker: string) {
    super();
  }
}

// EPIC
export const epic: Epic<AnyAction> = effect$ =>
  effect$.pipe(
    ofType<Get<Action>>("Http/Get"),
    groupByTracker(
      (effect: Get<Action>) =>
        ajax
          .get(effect.url)
          .pipe(map(({ response }) => effect.onResponse(response))),
      effect$.pipe(
        ofType<CancelRequest>("Http/CancelRequest"),
        map(effect => effect.tracker)
      )
    )
  );
