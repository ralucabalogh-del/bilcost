import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ComparePage } from "@/pages/Compare";
import { MethodologyPage } from "@/pages/Methodology";

function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink-800">
        Siden findes ikke
      </h1>
      <p className="text-ink-500 mt-2">
        Vi kunne ikke finde det du leder efter.
      </p>
    </div>
  );
}

function Routes() {
  return (
    <Switch>
      <Route path="/" component={ComparePage} />
      <Route path="/saadan-regner-vi" component={MethodologyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes />
          </main>
          <Footer />
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
