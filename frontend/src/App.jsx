import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Play from "./pages/Play";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-in/*" element={<Auth mode="sign-in" />} />
      <Route path="/sign-up/*" element={<Auth mode="sign-up" />} />
      <Route
        path="/play"
        element={
          <RequireAuth>
            <Play />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
