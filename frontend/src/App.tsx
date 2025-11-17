import { Router } from "./router";
import { AppHeader } from "./components/Layout/AppHeader";

function App() {
  return (
    <div className="h-full flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto mt-16">
        <Router />
      </main>
    </div>
  );
}

export default App;