import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Perfil } from './pages/Perfil';
import { Login } from './pages/Login';
import { BuscaGeral } from './pages/BuscaGeral';
import { GeradorProposta } from './pages/GeradorProposta'; // <-- Importe aqui

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="busca" element={<BuscaGeral />} />
          <Route path="proposta" element={<GeradorProposta />} /> {/* <-- Rota adicionada */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;