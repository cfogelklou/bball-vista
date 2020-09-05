import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { createBrowserHistory } from "history";
import { Router } from "react-router-dom";
import Routes from "./routes/routes";
import WebNavigator from "./web/web_navigator";
import * as AppStore from "./redux/redux";
import { Provider } from "react-redux";
import Avatar, { ConfigProvider } from "react-avatar";
import { darkColors } from "./services/random_names";

const store = AppStore.store;
const history = createBrowserHistory();
const navigation = WebNavigator.getInst();
navigation.setHistory(history);

ReactDOM.render(
  <ConfigProvider colors={darkColors}>
    <Provider store={store}>
      <Router history={history}>
        <Routes />
      </Router>
    </Provider>
  </ConfigProvider>,
  document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
