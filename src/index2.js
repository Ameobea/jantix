/**
 * MAIN GOAL:
 *
 * Everything will exist at the level of the action type.  That may make things easier to pair up and type.
 */
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var buildActionGroup = function (actionCreator, subReducer) { return ({
    actionCreator: actionCreator,
    subReducer: subReducer
}); };
// type CombinedTypesOf<T extends {[type: string]: {}}> = T extends {
//   [type: infer AllTypes]: { actionCreator: (...args: any[]) => infer Actions };
// }
//   ? { types: AllTypes; actions: Actions }
//   : never;
var buildReduxModule = function (initialState, actions) {
    return {
        initialState: initialState,
        actions: actions
    };
};
var manuallyTypedModule = {
    DELETE_VALUE: buildActionGroup(function (key) { return ({ type: 'DELETE_VALUE', key: key }); }, function (state, _a) {
        var key = _a.key;
        var _b;
        return (__assign({}, state, (_b = {}, _b[key] = undefined, _b)));
    }),
    SET_VALUE: buildActionGroup(function (key, value) { return ({ type: 'SET_VALUE', key: key, value: value }); }, function (state, _a) {
        var key = _a.key, value = _a.value;
        var _b;
        return (__assign({}, state, (_b = {}, _b[key] = value, _b)));
    })
};
var autoTypedModule = {
    DELETE_VALUE: buildActionGroup(function (key) { return ({ type: 'DELETE_VALUE', key: key }); }, function (state, _a) {
        var key = _a.key;
        var _b;
        return (__assign({}, state, (_b = {}, _b[key] = undefined, _b)));
    }),
    SET_VALUE: buildActionGroup(function (key, value) { return ({ type: 'SET_VALUE', key: key, value: value }); }, function (state, _a) {
        var key = _a.key, value = _a.value;
        var _b;
        return (__assign({}, state, (_b = {}, _b[key] = value, _b)));
    })
};
var buildModuleOuter = function (
// actions: {
//   [K in AllActionTypesOf<Actions>]: {
//     actionCreator: ValueOf<AllActionCreatorsOf<AllActionTypesOf<Actions>, Actions>>;
//     subReducer: (
//       state: State,
//       action: { type: AllActionTypesOf<Actions>; [key: string]: any }
//     ) => State;
//   }
// }
actions) {
    var builtModule = buildReduxModule({}, actions);
    var dispatch = function (action) { return window.store.dispatch(action); };
    var ourAllActionTypes;
    var ourAllActions;
    var ourAllActionCreators;
    var ourAllSubReducers;
    return { dispatch: dispatch, ourAllActionTypes: ourAllActionTypes, ourAllActions: ourAllActions, ourAllActionCreators: ourAllActionCreators, ourAllSubReducers: ourAllSubReducers };
};
var _a = buildModuleOuter(autoTypedModule), dispatch = _a.dispatch, ourAllActionTypes = _a.ourAllActionTypes, ourAllActions = _a.ourAllActions, ourAllActionCreators = _a.ourAllActionCreators, ourAllSubReducers = _a.ourAllSubReducers;
