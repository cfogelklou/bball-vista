import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Bball } from './screens/bball';
import { DeviceProvider } from './common/contexts/DeviceContext';
import * as serviceWorker from './serviceWorker';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <DeviceProvider>
      <Bball />
    </DeviceProvider>
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
//serviceWorker.register();
