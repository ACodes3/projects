import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="app__content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;