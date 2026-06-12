import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAll, create } from '../store.js';
import { generateToken } from '../auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }

  const funcionarios = await getAll('funcionarios');
  const user = funcionarios.find((f) => f.usuario === usuario);

  if (!user || !user.ativo) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
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
  const novo = await create('funcionarios', {
    nome, usuario, senha: senhaHash,
    cargo: cargo || 'Atendente',
    telefone: telefone || '',
    email: email || '',
    permissao: 'funcionario',
    ativo: true,
  });

  res.status(201).json({ message: 'Cadastro realizado com sucesso' });
});

export default router;
