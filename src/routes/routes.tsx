import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Bball } from '../screens/bball';

const Routes = (props: any) => {
  return (
    <div>
      <Switch>
        <Route exact path='/' render={(props) => <Bball {...props} />} />
        <Route path='/bball' render={(props) => <Bball {...props} />} />
        <Route component={Bball} />
      </Switch>
    </div>
  );
};

export default Routes;
