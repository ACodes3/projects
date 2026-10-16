import { Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="app">

      <Navbar />

      <main className="app__content">
        <Outlet />
      </main>

      <Footer />

    </div>
  );
}

export default App;