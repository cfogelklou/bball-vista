import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import { Bball } from '../screens/bball';
import { Settings } from '../screens/settings';

const Routes = () => {
  return (
    <div>
      <RouterRoutes>
        <Route path='/' element={<Settings />} />
        <Route path='/bball' element={<Bball />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='*' element={<Settings />} />
      </RouterRoutes>
    </div>
  );
};

export default Routes;
