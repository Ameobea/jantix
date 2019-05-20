/**
 * MAIN GOAL:
 *
 * Everything will exist at the level of the action type.  That may make things easier to pair up and type.
 */

type ValueOf<T> = T[keyof T];

interface ActionGroup<
  ActionType extends string | number | symbol,
  Action extends { type: ActionType; [key: string]: any },
  ActionCreator extends (...args: any[]) => Action,
  State,
  SubReducer extends (state: State, action: Action) => State
> {
  actionCreator: ActionCreator;
  subReducer: SubReducer;
}

const buildActionGroup = <
  ActionType extends string,
  Action extends { type: ActionType; [key: string]: any },
  ActionCreator extends (...args: any[]) => Action,
  State,
  SubReducer extends (state: State, action: Action) => State
>(
  actionCreator: ActionCreator,
  subReducer: SubReducer
): ActionGroup<ActionType, Action, ActionCreator, State, SubReducer> => ({
  actionCreator,
  subReducer,
});

const buildReduxModule = <
  State,
  AllActionTypes extends string,
  AllActions extends { type: string; [key: string]: any },
  AllActionCreators extends (...args: any[]) => { type: string; [key: string]: any },
  AllSubReducers extends (state: State, action: AllActions) => State
>(
  initialState: State,
  actions: {
    [K in AllActionTypes]: ActionGroup<
      K,
      Extract<AllActions, { type: K; [key: string]: any }>,
      Extract<
        AllActionCreators,
        (...args: any[]) => Extract<AllActions, { type: K; [key: string]: any }>
      >,
      State,
      Extract<
        AllSubReducers,
        (state: State, action: Extract<AllActions, { type: K; [key: string]: any }>) => State
      >
    >
  }
) => {
  return {
    initialState,
    actions,
  };
};

type AllActionTypesOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
    };
  }
> = { [K in keyof T]: ReturnType<T[K]['actionCreator']>['type'] };

type AllActionsOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
    };
  }
> = { [K in keyof T]: ReturnType<T[K]['actionCreator']> };

type AllActionCreatorsOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
    };
  }
> = { [K in keyof T]: T[K]['actionCreator'] };

type AllSubReducersOf<
  T extends {
    [type: string]: {
      subReducer: (state: any, action: { type: string; [key: string]: any }) => any;
    };
  }
> = { [K in keyof T]: T[K]['subReducer'] };

const manuallyTypedModule = {
  DELETE_VALUE: buildActionGroup<
    'DELETE_VALUE',
    { type: 'DELETE_VALUE'; key: string },
    (key: string) => { type: 'DELETE_VALUE'; key: string },
    { [key: string]: string },
    (
      state: { [key: string]: string },
      action: { type: 'DELETE_VALUE'; key: string }
    ) => { [key: string]: string }
  >(
    (key: string) => ({ type: 'DELETE_VALUE', key }),
    (state: { [key: string]: string }, { key }) => ({ ...state, [key]: undefined })
  ),
  SET_VALUE: buildActionGroup<
    'SET_VALUE',
    { type: 'SET_VALUE'; key: string; value: string },
    (key: string, value: string) => { type: 'SET_VALUE'; key: string; value: string },
    { [key: string]: string },
    (
      state: { [key: string]: string },
      action: { type: 'SET_VALUE'; key: string; value: string }
    ) => { [key: string]: string }
  >(
    (key: string, value: string) => ({ type: 'SET_VALUE', key, value }),
    (state: { [key: string]: string }, { key, value }) => ({ ...state, [key]: value })
  ),
};

const autoTypedModule = {
  DELETE_VALUE: buildActionGroup(
    (key: string) => ({ type: 'DELETE_VALUE', key }),
    (state: { [key: string]: string }, { key }: { key: string; type: 'DELETE_VALUE' }) => ({
      ...state,
      [key]: undefined,
    })
  ),
  SET_VALUE: buildActionGroup(
    (key: string, value: string) => ({ type: 'SET_VALUE', key, value }),
    (
      state: { [key: string]: string },
      { key, value }: { type: 'SET_VALUE'; key: string; value: string }
    ) => ({ ...state, [key]: value })
  ),
};

const buildModuleOuter = <
  State,
  Actions extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
      subReducer: (state: State, action: { type: string; [key: string]: any }) => State;
    };
  }
>(
  initialState: State,
  actions: Extract<
    Actions,
    {
      [K in keyof Actions]: ActionGroup<
        K,
        Extract<ValueOf<AllActionsOf<Actions>>, { type: K; [key: string]: any }>,
        Extract<
          ValueOf<AllActionCreatorsOf<Actions>>,
          (
            ...args: any[]
          ) => Extract<ValueOf<AllActionsOf<Actions>>, { type: K; [key: string]: any }>
        >,
        State,
        Extract<
          ValueOf<AllSubReducersOf<Actions>>,
          (
            state: State,
            action: Extract<ValueOf<AllActionsOf<Actions>>, { type: K; [key: string]: any }>
          ) => State
        >
      >
    }
  >
) => {
  // type OurAllActionTypes = ValueOf<AllActionTypesOf<Actions>>;
  type OurAllActionTypes = keyof Actions;
  type OurAllActions = ValueOf<AllActionsOf<Actions>>;
  type OurAllActionCreators = ValueOf<AllActionCreatorsOf<Actions>>;
  type OurAllSubReducers = ValueOf<AllSubReducersOf<Actions>>;

  const builtModule = buildReduxModule<
    State,
    string,
    OurAllActions,
    OurAllActionCreators,
    OurAllSubReducers
  >(initialState, actions);

  const dispatch = (action: OurAllActions): void => (window as any).store.dispatch(action);

  let ourAllActionTypes: OurAllActionTypes;
  let ourAllActions: OurAllActions;
  let ourAllActionCreators: OurAllActionCreators;
  let ourAllSubReducers: OurAllSubReducers;

  return {
    dispatch,
    ourAllActionTypes,
    ourAllActions,
    ourAllActionCreators,
    ourAllSubReducers,
    refinedActions,
  };
};

const {
  dispatch,
  ourAllActionTypes,
  ourAllActions,
  ourAllActionCreators,
  ourAllSubReducers,
  refinedActions,
} = buildModuleOuter<{ [key: string]: string }, typeof autoTypedModule>({}, autoTypedModule);
