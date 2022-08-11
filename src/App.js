import React, {Fragment} from 'react';
import Header from '@anz/header'
import Summary from './Summary';
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter basename='/fixathon/semver-dashboard'>
      <Fragment>
        <div className="App">
          <Header />
          <div className="Content">
            <Routes>
              <Route exact path="/" element={<Summary />} />
            </Routes>
          </div>
        </div>
      </Fragment>
    </BrowserRouter>
  );
}

export default App;
