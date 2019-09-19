import * as H from "history";

export interface HistoryLocation<S = H.LocationState> {
  paths: string[];
  search: H.Search;
  state: S;
  hash: H.Hash;
  key?: H.LocationKey;
}

export interface LocationDescriptorObject<S = H.LocationState> {
  paths?: string[];
  search?: H.Search;
  state?: S;
  hash?: H.Hash;
  key?: H.LocationKey;
}

export type LocationListener<S = H.LocationState> = (
  location: HistoryLocation<S>,
  action: H.Action
) => void;

export interface History<S = H.LocationState> {
  length: number;
  action: H.Action;
  getLocation(): HistoryLocation<S>;
  push(location: LocationDescriptorObject<S>): void;
  replace(location: LocationDescriptorObject<S>): void;
  go(n: number): void;
  goBack(): void;
  goForward(): void;
  listen(listener: LocationListener<S>): H.UnregisterCallback;
  createHref(location: LocationDescriptorObject<S>): H.Href;
}

const adaptLocationFrom = <S>(location: H.Location<S>): HistoryLocation<S> => {
  const { pathname, ...rest } = location;
  return {
    paths: pathname.split("/").slice(1),
    ...rest
  };
};

export const adaptLocationTo = <S>({
  paths,
  ...rest
}: HistoryLocation<S>): H.Location<S> => ({
  ...rest,
  pathname: "/" + paths.join("/")
});

export const adaptLocationDescriptorTo = <S>({
  paths,
  ...rest
}: LocationDescriptorObject<S>): H.LocationDescriptorObject<S> => ({
  ...rest,
  pathname: paths && "/" + paths.join("/")
});

export const createBrowserHistory = <S = H.LocationState>(
  options?: H.BrowserHistoryBuildOptions
): History<S> => {
  const history = H.createBrowserHistory(options);

  return {
    length: history.length,
    action: history.action,
    getLocation(): HistoryLocation<S> {
      return adaptLocationFrom(history.location);
    },
    push(location: LocationDescriptorObject<S>) {
      history.push(adaptLocationDescriptorTo(location));
    },
    replace(location: LocationDescriptorObject<S>) {
      history.replace(adaptLocationDescriptorTo(location));
    },
    go: history.go,
    goBack: history.goBack,
    goForward: history.goForward,
    listen(listener) {
      return history.listen((location, action) =>
        listener(adaptLocationFrom(location), action)
      );
    },
    createHref(location) {
      return history.createHref(adaptLocationDescriptorTo(location));
    }
  };
};
