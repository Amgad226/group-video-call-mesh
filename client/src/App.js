import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import { ConfigProvider } from "antd";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#01989F",
            colorError: "#CC4C4C",
          },
        }}
      >
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/room/:roomID/:userName" component={Room} />
        </Switch>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
