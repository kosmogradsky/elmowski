import * as H from "history";

export interface Location<S = H.LocationState> {
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

export type LocationDescriptor<S = H.LocationState> =
  | H.Path
  | LocationDescriptorObject<S>;

export type LocationListener<S = H.LocationState> = (
  location: Location<S>,
  action: H.Action
) => void;

export interface History<S = H.LocationState> {
  length: number;
  action: H.Action;
  getLocation(): Location<S>;
  push(location: LocationDescriptorObject<S>): void;
  replace(location: LocationDescriptorObject<S>): void;
  go(n: number): void;
  goBack(): void;
  goForward(): void;
  listen(listener: LocationListener<S>): H.UnregisterCallback;
  createHref(location: LocationDescriptorObject<S>): H.Href;
}

const adaptLocationFrom = <S>(location: H.Location<S>): Location<S> => {
  const { pathname, ...rest } = location;
  return {
    paths: pathname.split("/").slice(1),
    ...rest
  };
};

export const adaptLocationTo = <S>({
  paths,
  ...rest
}: Location<S>): H.Location<S> => ({
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
    getLocation(): Location<S> {
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

export const createLocation = <S = H.LocationState>(
  path: LocationDescriptor<S>,
  state?: S,
  key?: H.LocationKey,
  maybeCurrentLocation?: Location<S>
): Location<S> => {
  const locationDescriptor =
    typeof path === "string" ? path : adaptLocationDescriptorTo(path);
  const currentLocation =
    maybeCurrentLocation && adaptLocationTo(maybeCurrentLocation);

  return adaptLocationFrom(
    H.createLocation(locationDescriptor, state, key, currentLocation)
  );
};
