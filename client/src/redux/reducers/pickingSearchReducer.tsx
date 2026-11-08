import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Picking } from '../../interface/picking';

interface PickingSearchState {
  searchTerm: string;
  pickings: Picking[];
  hasMore: boolean;
}

const getSavedState = (): PickingSearchState => {
  try {
    const saved = sessionStorage.getItem('pickingSearchState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse error
  }
  return {
    searchTerm: '',
    pickings: [],
    hasMore: false,
  };
};

const initialState: PickingSearchState = getSavedState();

export const pickingSearchSlice = createSlice({
  name: 'pickingSearch',
  initialState,
  reducers: {
    setPickingSearchResults: (
      state,
      action: PayloadAction<{ searchTerm: string; pickings: Picking[]; hasMore: boolean }>
    ) => {
      state.searchTerm = action.payload.searchTerm;
      state.pickings = action.payload.pickings;
      state.hasMore = action.payload.hasMore;
      try {
        sessionStorage.setItem('pickingSearchState', JSON.stringify(state));
      } catch {
        // Ignore storage error
      }
    },
    appendPickingSearchResults: (
      state,
      action: PayloadAction<{ pickings: Picking[]; hasMore: boolean }>
    ) => {
      state.pickings = [...state.pickings, ...action.payload.pickings];
      state.hasMore = action.payload.hasMore;
      try {
        sessionStorage.setItem('pickingSearchState', JSON.stringify(state));
      } catch {
        // Ignore storage error
      }
    },
    clearPickingSearchResults: (state) => {
      state.searchTerm = '';
      state.pickings = [];
      state.hasMore = false;
      try {
        sessionStorage.removeItem('pickingSearchState');
      } catch {
        // Ignore storage error
      }
    },
  },
});

export const {
  setPickingSearchResults,
  appendPickingSearchResults,
  clearPickingSearchResults,
} = pickingSearchSlice.actions;

export default pickingSearchSlice.reducer;

