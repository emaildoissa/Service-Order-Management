import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ServiceOrderFlow from "./pages/ServiceOrderFlow";
import FinancialReport from "./pages/FinancialReport";
import CustomersPage from "./pages/CustomersPage";
import { AppBar, Toolbar, Button, Box } from "@mui/material";

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/">
              DASHBOARD
            </Button>
            <Button color="inherit" component={Link} to="/nova-os">
              NOVA OS
            </Button>
            <Button color="inherit" component={Link} to="/clientes">
              CLIENTES
            </Button>
            <Button color="inherit" component={Link} to="/relatorios">
              RELATÓRIOS
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nova-os" element={<ServiceOrderFlow />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/relatorios" element={<FinancialReport />} />
      </Routes>
    </Router>
  );
}

export default App;
