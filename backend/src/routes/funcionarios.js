import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAll, getById, create, update, remove } from '../store.js';
import { authMiddleware } from '../auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const data = await getAll('funcionarios', req.tenant_id);
  const semSenha = data.map(({ senha, ...rest }) => rest);
  res.json(semSenha);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const item = await getById('funcionarios', Number(req.params.id), req.tenant_id);
  if (!item) return res.status(404).json({ error: 'Funcionário não encontrado' });
  const { senha, ...rest } = item;
  res.json(rest);
});

router.post('/', authMiddleware, async (req, res) => {
  const { nome, usuario, senha, cargo, telefone, email, permissao, ativo } = req.body;
  if (!nome || !usuario || !senha) {
    return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios' });
  }

  const existentes = await getAll('funcionarios', req.tenant_id);
  if (existentes.find((f) => f.usuario === usuario)) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const item = await create('funcionarios', {
    nome,
    usuario,
    senha: senhaHash,
    cargo: cargo || '',
    telefone: telefone || '',
    email: email || '',
    permissao: permissao || 'operador',
    ativo: ativo !== undefined ? ativo : true,
  }, req.tenant_id);

  if (!item) return res.status(500).json({ error: 'Erro ao criar funcionário' });
  const { senha: _, ...rest } = item;
  res.status(201).json(rest);
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { senha, ...dados } = req.body;

  const existente = await getById('funcionarios', Number(req.params.id), req.tenant_id);
  if (!existente) return res.status(404).json({ error: 'Funcionário não encontrado' });

  if (dados.usuario && dados.usuario !== existente.usuario) {
    const todos = await getAll('funcionarios', req.tenant_id);
    if (todos.find((f) => f.usuario === dados.usuario && f.id !== Number(req.params.id))) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }
  }

  const payload = senha
    ? { ...dados, senha: await bcrypt.hash(senha, 10) }
    : dados;

  const item = await update('funcionarios', Number(req.params.id), payload, req.tenant_id);
  if (!item) return res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  const { senha: _, ...rest } = item;
  res.json(rest);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const ok = await remove('funcionarios', Number(req.params.id), req.tenant_id);
  if (!ok) return res.status(404).json({ error: 'Funcionário não encontrado' });
  res.status(204).send();
});

export default router;
