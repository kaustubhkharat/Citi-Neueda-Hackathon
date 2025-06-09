import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Mood from './components/Mood';
import Poll from './components/Poll';
import Shame from './components/Shame';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(''); // Store the logged-in username
  const [activeComponent, setActiveComponent] = useState('mood'); // Default to Mood after login

  const handleLogin = (loggedInUsername) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername); // Set the logged-in username
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'mood':
        return <Mood username={username} />;
      case 'poll':
        return <Poll username={username} />;
      case 'shame':
        return <Shame username={username} />;
      default:
        return <Mood username={username} />;
    }
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div>
          <header className="App-header">
            <nav>
              <button onClick={() => setActiveComponent('mood')}>Mood</button>
              <button onClick={() => setActiveComponent('poll')}>Poll</button>
              <button onClick={() => setActiveComponent('shame')}>Shame</button>
              <button onClick={() => setIsLoggedIn(false)}>Logout</button>
            </nav>
          </header>
          <main>{renderComponent()}</main>
        </div>
      )}
    </div>
  );
}

export default App;