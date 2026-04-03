import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Perfil } from './pages/Perfil';
import { Login } from './pages/Login';
import { BuscaGeral } from './pages/BuscaGeral';
import { GeradorProposta } from './pages/GeradorProposta';
import { Dashboard } from './pages/Dashboard'; // <-- Importando o Dashboard

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas (Dentro do Layout) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="busca" element={<BuscaGeral />} />
          <Route path="proposta" element={<GeradorProposta />} /> 
          <Route path="dashboard" element={<Dashboard />} /> {/* <-- Nova Rota adicionada! */}
        </Route>

        {/* Qualquer outra URL não mapeada cai aqui e vai pro Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;