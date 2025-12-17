import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Editor from './pages/Editor';
import Canvas from './components/Canvas';
import Login from './pages/Login';
import Signin from './pages/Signin';
import Landing from './pages/Landing';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Landing} />
        <Route path="/login" exact component={Login} />
        <Route path="/signin" exact component={Signin} />
        <Route path="/editor" exact component={Editor} />
        <Route path="/canvas" component={Canvas} />
      </Switch>
    </Router>
  );
};

export default App;