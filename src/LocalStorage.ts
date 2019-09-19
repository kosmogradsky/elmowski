import { Action, AnyAction } from "redux";
import { ignoreElements, map, tap } from "rxjs/operators";
import { combineEpics, ofType, Effect, Epic, SilentEff } from "./Loop";

// EFFECTS

export class GetItem<A extends Action> implements Effect<A> {
  readonly type = "LocalStorage/GetItem";

  constructor(
    readonly key: string,
    readonly onReturn: (value: string | null) => A
  ) {}

  map<B extends Action>(mapper: (from: A) => B): GetItem<B> {
    return new GetItem(this.key, p => mapper(this.onReturn(p)));
  }
}

export class SetItem extends SilentEff {
  readonly type = "LocalStorage/SetItem";

  constructor(readonly key: string, readonly value: string) {
    super();
  }
}

// EPIC

const getItemEpic: Epic<Action, AnyAction> = effect$ =>
  effect$.pipe(
    ofType<GetItem<Action>>("LocalStorage/GetItem"),
    map(({ key, onReturn }) => {
      const value = localStorage.getItem(key);

      return onReturn(value);
    })
  );

const setItemEpic: Epic<Action, never> = effect$ =>
  effect$.pipe(
    ofType<SetItem>("LocalStorage/SetItem"),
    tap(({ key, value }) => {
      localStorage.setItem(key, value);
    }),
    ignoreElements()
  );

export const epic = combineEpics(getItemEpic, setItemEpic);
