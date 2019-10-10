# Sudetenwaltz

A state-management library based on RxJS and similar to Redux but with the concept of [effects](https://package.elm-lang.org/packages/elm/core/latest/Platform-Cmd) inspired by Elm.

## Effects and epics

A `LoopReducer` in Sudetenwaltz is a bit more complicated than a `Reducer` in Redux. `LoopReducer` returns a tuple, where the first element is a next state and the second is a side effect. `someEffect` is an object of a class that extends `Effect` class.

```typescript
return [nextState, someEffect];
```

All effects are then passed to the epics which execute non-pure functions. Epic is the third argument to the `createStore` function.
