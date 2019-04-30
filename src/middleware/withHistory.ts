import { History, Location } from "history";
import { Store } from "../store";

export const withHistory = <A>(
  history: History,
  onUrlChange: (location: Location) => A
) =>
  <S extends Store<unknown, A>>(store: S): S => {
    const unregisterHistoryListener = history.listen((toLocation) => {
      store.dispatch(onUrlChange(toLocation));
    });

    return {
      ...store,
      destroy: () => {
        unregisterHistoryListener();
        store.destroy();
      }
    }
  }