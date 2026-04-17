'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  inviteCodeId: string | null;
}

interface EditModal {
  user: User;
  email: string;
  role: 'USER' | 'ADMIN';
  password: string;
  saving: boolean;
  error: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Erro ao carregar usuários.');
      setUsers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  function openEdit(user: User) {
    setEditModal({ user, email: user.email, role: user.role, password: '', saving: false, error: '' });
  }

  async function handleSave() {
    if (!editModal) return;
    setEditModal(m => m ? { ...m, saving: true, error: '' } : m);
    try {
      const body: Record<string, string> = {};
      if (editModal.email !== editModal.user.email) body.email = editModal.email;
      if (editModal.role !== editModal.user.role) body.role = editModal.role;
      if (editModal.password) body.password = editModal.password;

      const res = await fetch(`/api/admin/users/${editModal.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setEditModal(m => m ? { ...m, saving: false, error: d.error ?? 'Erro ao salvar.' } : m);
        return;
      }
      setEditModal(null);
      fetchUsers();
    } catch {
      setEditModal(m => m ? { ...m, saving: false, error: 'Erro de conexão.' } : m);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? 'Erro ao excluir.');
        return;
      }
      fetchUsers();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Usuários</h1>
        <p className="mt-1 text-sm text-secondary">Gerencie os usuários cadastrados na plataforma</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-secondary text-sm">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Carregando...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">E-mail</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Perfil</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Cadastro</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-secondary uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-secondary text-sm">Nenhum usuário encontrado.</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-text">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' : 'bg-gray-100 text-gray-600'}`}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary text-xs">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(user)}
                        className="text-xs text-primary font-medium hover:underline">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                        className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50">
                        {deletingId === user.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text">Editar usuário</h2>

            <div>
              <label className="label">E-mail</label>
              <input type="email" value={editModal.email}
                onChange={e => setEditModal(m => m ? { ...m, email: e.target.value } : m)}
                className="input" />
            </div>

            <div>
              <label className="label">Perfil</label>
              <select value={editModal.role}
                onChange={e => setEditModal(m => m ? { ...m, role: e.target.value as 'USER' | 'ADMIN' } : m)}
                className="input">
                <option value="USER">Usuário</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Nova senha <span className="text-secondary font-normal">(deixe em branco para não alterar)</span></label>
              <input type="password" value={editModal.password}
                onChange={e => setEditModal(m => m ? { ...m, password: e.target.value } : m)}
                className="input" placeholder="Mínimo 8 caracteres" />
            </div>

            {editModal.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editModal.error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={editModal.saving} className="btn-primary flex-1">
                {editModal.saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
