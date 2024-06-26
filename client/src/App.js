import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import { ConfigProvider } from "antd";
import NetworkProvider from "./NetworkProvider";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#01989F",
              colorError: "#CC4C4C",
            },
          }}
        >
          <NetworkProvider>
            <Route path="/" exact component={CreateRoom} />
            <Route path="/room/:roomID/:userName" component={Room} />
          </NetworkProvider>
        </ConfigProvider>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
