import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAll } from '../store.js';
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

export default router;
