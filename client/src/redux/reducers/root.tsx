import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authReducer';
import companyReducer from './companyReducer';
import driverReducer from './driverReducer';
import pickingSearchReducer from './pickingSearchReducer';

const combinedReducer = combineReducers({
  auth: authReducer,
  companies: companyReducer,
  drivers: driverReducer,
  pickingSearch: pickingSearchReducer,
});

export const rootReducer = (state: any, action: any) => {
  if (action.type === 'logout') {
    try {
      sessionStorage.removeItem('pickingSearchState');
    } catch {
      // Ignore
    }
    state = undefined;
  }
  return combinedReducer(state, action);
};
