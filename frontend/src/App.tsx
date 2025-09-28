import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import ChatInterface from './components/ChatInterface';
import DataSourcesPanel from './components/DataSourcesPanel';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App flex">
          <Sidebar />
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chat/:id" element={<ChatInterface />} />
            <Route path="/data-sources" element={<DataSourcesPanel />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;