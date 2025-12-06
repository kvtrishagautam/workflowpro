import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Editor from './pages/Editor';
import Canvas from './components/Canvas';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Editor} />
        <Route path="/canvas" component={Canvas} />
      </Switch>
    </Router>
  );
};

export default App;