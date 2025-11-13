import { Router } from "./router";
import { AppHeader } from "./components/Layout/AppHeader";

function App() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-hidden mt-16">
        <Router />
      </main>
    </div>
  );
}

export default App;