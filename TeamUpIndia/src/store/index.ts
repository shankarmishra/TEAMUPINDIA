import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import authReducer from './reducers/auth.reducer';
import userReducer from './reducers/user.reducer';
import coachReducer from './reducers/coach.reducer';
import teamReducer from './reducers/team.reducer';
import tournamentReducer from './reducers/tournament.reducer';
import productReducer from './reducers/product.reducer';
import orderReducer from './reducers/order.reducer';
import deliveryReducer from './reducers/delivery.reducer';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    coach: coachReducer,
    team: teamReducer,
    tournament: tournamentReducer,
    product: productReducer,
    order: orderReducer,
    delivery: deliveryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 