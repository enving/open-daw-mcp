import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DAWInterface from './components/DAWInterface';
import './App.css';
function App() {
    return (<Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<DAWInterface />}/>
        </Routes>
      </div>
    </Router>);
}
export default App;
