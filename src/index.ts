import { applyMiddleware, compose, createStore, combineReducers } from 'redux';

type ValueOf<T> = T[keyof T];

type ActionCreators = { [name: string]: (...args: any[]) => { type: string; [key: string]: any } };

type StrictActionCreators<ActionTypes extends string> = {
  [name: string]: (...args: any[]) => { type: ActionTypes; [key: string]: any };
};

type ActionValuesOf<T extends { [name: string]: (...args: any[]) => any }> = ValueOf<
  { [K in keyof T]: ReturnType<T[K]> }
>;

type GlobalState = { [name: string]: any };

type SubReducersOf<State extends GlobalState, OurActionCreators extends ActionCreators> = {
  [T in ActionValuesOf<OurActionCreators>['type']]: (
    state: State,
    action: Extract<ActionValuesOf<OurActionCreators>, { type: T }>
  ) => State
};

type ActionTypesOf<T> = T extends {
  actionCreators: { [name: string]: (...args: any[]) => { type: infer R; [key: string]: any } };
}
  ? R
  : never;

type AllActionTypesOf<T> = T extends {
  [stateKey: string]: {
    actionCreators: { [name: string]: (...args: any[]) => { type: infer R; [key: string]: any } };
  };
}
  ? R
  : never;

const buildReducerFromSubReducers = <OurActionCreators extends ActionCreators, State>(
  initialState: State,
  subReducers: SubReducersOf<State, OurActionCreators>
) => {
  const reducer = (state = initialState, action: ValueOf<ActionValuesOf<OurActionCreators>>) => {
    const subReducer = subReducers[action.type];
    return subReducer ? subReducer(state) : state;
  };

  return reducer;
};

const modules = {
  moduleA: {
    actionCreators: {
      setFoo: (value: number): { type: 'SET_FOO'; value: number } => ({ type: 'SET_FOO', value }),
    },
    subReducers: {
      SET_FOOZ: (state, action) => ({ ...state, foo: action.value }),
    },
    initialState: {
      foo: 0,
    },
  },
  moduleB: {
    actionCreators: {
      setBar: (value: string): { type: 'SET_BAR'; value: typeof value } => ({
        type: 'SET_BAR',
        value,
      }),
    },
    subReducers: {
      SET_BAR: (state, action) => ({ ...state, bar: action.value }),
    },
    initialState: {
      bar: 0,
    },
  },
};

type ActionsOf<T> = T extends {
  actionCreators: { [name: string]: (...args: any[]) => infer R };
}
  ? R
  : never;

type AllActionsOf<T> = T extends {
  [name: string]: {
    actionCreators: { [name: string]: (...args: any[]) => infer R };
  };
}
  ? R
  : never;

type FullStateOfModules<T> = T extends {
  [stateKey: string]: {
    actionCreators: ActionCreators;
    initialState: infer FullState;
  };
}
  ? FullState
  : never;

type BaseModules = {
  [name: string]: {
    actionCreators: { [name: string]: (...args: any[]) => { type: string; [key: string]: any } };
    initialState: any;
    subReducers: {
      [K in keyof ActionCreators]: (state: any, action: { type: string; [key: string]: any }) => any
    };
  };
};

type RealModulesOf<T> = T extends BaseModules
  ? {
      [Name in keyof T]: {
        actionCreators: T[Name]['actionCreators'];
        initialState: T[Name]['initialState'];
        subReducers: {
          [K2 in keyof T[Name]['actionCreators']]: (
            state: T[Name]['initialState'],
            action: {
              // type: ReturnType<T[Name]['actionCreators'][K2]>['type'];
              [K3 in keyof ReturnType<T[Name]['actionCreators'][K2]>]: {}
            }
          ) => T[Name]['initialState']
        };
      }
    }
  : never;

type X = RealModulesOf<typeof modules>;

export const buildStore = <Modules extends BaseModules, RealModules extends RealModulesOf<Modules>>(
  modules: Modules,
  middleware?: any
) => {
  const reducers = Object.keys(modules).reduce((acc, name) => {
    const { initialState, subReducers } = modules[name];
    const reducer = buildReducerFromSubReducers(initialState, subReducers);

    return { ...acc, [name]: reducer };
  }, {});

  type AllActions = AllActionsOf<RealModules>;

  const composeEnhancers: typeof compose =
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  // <State, Actions>
  const store = createStore(
    combineReducers(reducers),
    composeEnhancers(applyMiddleware(middleware))
  );

  const dispatch = (action: AllActions): void => {
    store.dispatch(action as any);
  };

  let u: RealModules;

  return { dispatch, reducers, u };
};

const { dispatch, reducers, u } = buildStore(modules);

dispatch({ type: 'SET_FOO', value: 3 });
