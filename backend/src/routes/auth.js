import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAll, create, update } from '../store.js';
import { generateToken, authMiddleware } from '../auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }

  const funcionarios = await getAll('funcionarios');
  const user = funcionarios.find((f) => f.usuario === usuario);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (!user.ativo) {
    return res.status(403).json({ error: 'Conta aguardando aprovação do administrador' });
  }

  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      cargo: user.cargo,
      permissao: user.permissao,
    },
  });
});

router.post('/register', async (req, res) => {
  const { nome, usuario, senha, cargo, telefone, email } = req.body;
  if (!nome || !usuario || !senha) {
    return res.status(400).json({ error: 'Nome, usuário e senha obrigatórios' });
  }

  const funcionarios = await getAll('funcionarios');
  if (funcionarios.find((f) => f.usuario === usuario)) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  await create('funcionarios', {
    nome, usuario, senha: senhaHash,
    cargo: cargo || 'Atendente',
    telefone: telefone || '',
    email: email || '',
    permissao: 'funcionario',
    ativo: false,
  });

  res.status(201).json({ message: 'Cadastro realizado! Aguarde aprovação do administrador.' });
});

router.get('/pendentes', authMiddleware, async (req, res) => {
  if (req.user.permissao !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores' });
  }
  const funcionarios = await getAll('funcionarios');
  const pendentes = funcionarios.filter((f) => !f.ativo);
  res.json(pendentes);
});

router.put('/aprovar/:id', authMiddleware, async (req, res) => {
  if (req.user.permissao !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores' });
  }
  const updated = await update('funcionarios', Number(req.params.id), { ativo: true });
  if (!updated) return res.status(404).json({ error: 'Funcionário não encontrado' });
  res.json(updated);
});

export default router;
