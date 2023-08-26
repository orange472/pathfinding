import React from "react";

import "./App.css";
import Pathfinding from "./components/pathfinding";

function App() {
  return (
    <div className="body">
      <h1 className="header">
        A<sup>&#11088;</sup> Pathfinding Algorithm
      </h1>

      <Pathfinding />
    </div>
  );
}

export default App;
