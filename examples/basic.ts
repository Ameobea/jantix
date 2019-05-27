import { buildModule, buildStore, buildActionGroup } from '../src/index';

const counter = {
  INCREMENT: buildActionGroup({
    actionCreator: () => ({ type: 'INCREMENT' }),
    subReducer: ({ count }: { count: number }, _action) => ({ count: count + 1 }),
  }),
  DECREMENT: buildActionGroup({
    actionCreator: () => ({ type: 'DECREMENT' }),
    subReducer: ({ count }: { count: number }, _action) => ({ count: count - 1 }),
  }),
};

const array = {
  PUSH: buildActionGroup({
    actionCreator: (val: number) => ({ type: 'PUSH', val }),
    subReducer: (state: number[], action) => [...state, action.val],
  }),
};

const map = {
  DELETE_VALUE: buildActionGroup({
    actionCreator: (key: string) => ({ type: 'DELETE_VALUE', key }),
    subReducer: (state: { [key: string]: string }, action) =>
      Object.entries(state).reduce((acc, [key, val]) => (key === action.key ? acc : { ...acc, [key]: val }), {}),
  }),
  SET_VALUE: buildActionGroup({
    actionCreator: (key: string, value: string) => ({ type: 'SET_VALUE', key, value }),
    subReducer: (state: { [key: string]: string }, { key, value }) => ({ ...state, [key]: value }),
  }),
};

// Invalid modules will fail to type-check
//
// const invalidModule = {
//   FOO: buildActionGroup({
//     actionCreator: () => ({ type: 'BAR' }), // <-- Triggers an error in `buildModule` because `type` doesn't match the key
//     subReducer: (state: number, _action) => state + 1,
//   }),
// };
// const invalid = buildModule<number, typeof invalidModule>(0, invalidModule);

const storeDefinition = {
  counter: buildModule<{ count: number }, typeof counter>({ count: 0 }, counter),
  array: buildModule<number[], typeof array>([], array),
  map: buildModule<{ [key: string]: string }, typeof map>({}, map),
};

const customReducers = {
  storekey: (state: string = '', _action: { type: 'CUSTOM'; val: string }) => state,
};

const { actionCreators, dispatch, getState } = buildStore<typeof storeDefinition, typeof customReducers>(
  storeDefinition,
  undefined,
  customReducers
);

console.log(getState());

dispatch(actionCreators.array.PUSH(3));
dispatch(actionCreators.map.SET_VALUE('key', 'val'));
dispatch({ type: 'CUSTOM', val: 'newState' });

// Invalid actions will fail to type check
//
// dispatch({type: 'SET_VALUE', key: "test", value: 1}) // <-- Triggers a type error due to a wrong type for `value`

console.log(getState());
