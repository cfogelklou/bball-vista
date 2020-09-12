import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Bball } from '../screens/bball';
import { Settings } from '../screens/settings';

const Routes = (props: any) => {
  return (
    <div>
      <Switch>
        <Route exact path='/' render={(props) => <Settings {...props} />} />
        <Route path='/bball' render={(props) => <Bball {...props} />} />
        <Route path='/settings' render={(props) => <Settings {...props} />} />
        <Route component={Settings} />
      </Switch>
    </div>
  );
};

export default Routes;
