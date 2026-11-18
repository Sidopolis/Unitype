import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import VenuePage from "./pages/VenuePage";
import ArtistPage from "./pages/ArtistPage";
import BookingPage from "./pages/BookingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/venue/:id" component={VenuePage} />
      <Route path="/artist/:id" component={ArtistPage} />
      <Route path="/event/birthday-25" component={BookingPage} />
      <Route path="/availability/birthday-25" component={BookingPage} />
      <Route path="/quote/rz-2411" component={BookingPage} />
      <Route path="/payment/rz-2411" component={BookingPage} />
      <Route path="/confirmation/rz-2411" component={BookingPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
