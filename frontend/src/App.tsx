import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/chat" element={<ChatInterface />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;