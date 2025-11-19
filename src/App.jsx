import React from 'react';
import AccorCalculator from './components/AccorCalculator';

function App() {
    return (
        <div className="app-container">
            <div className="background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>
            <AccorCalculator />
        </div>
    );
}

export default App;
