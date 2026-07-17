'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getUser } from '../../../../lib/auth';
import api from '../../../../lib/api';
import {
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────

interface Permission {
  id: number;
  permissionKey: string;
  granted: boolean;
}

interface PermissionKeyMeta {
  key: string;
  label: string;
  category: string;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
}

interface PermissionsResponse {
  userId: number;
  name: string;
  role: string;
  isDirector: boolean;
  permissions: Permission[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Categorias — vem de GET /permissions/keys (fim do hardcode, ver groupByCategory)
// ──────────────────────────────────────────────────────────────────────────────

function groupByCategory(keys: PermissionKeyMeta[]): { label: string; items: PermissionKeyMeta[] }[] {
  const map = new Map<string, PermissionKeyMeta[]>();
  for (const k of keys) {
    if (!map.has(k.category)) map.set(k.category, []);
    map.get(k.category)!.push(k);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

const ROLE_LABEL: Record<string, string> = {
  director: 'Diretor',
  coordinator: 'Coordenador',
  secretary: 'Administrativo',
  teacher: 'Professor',
  student: 'Aluno',
};

const ROLE_COLOR: Record<string, string> = {
  director: 'bg-purple-50 dark:bg-purple-950 text-purple-700',
  coordinator: 'bg-blue-50 dark:bg-blue-950 text-blue-700',
  secretary: 'bg-blue-50 dark:bg-blue-950 text-blue-700',
  teacher: 'bg-green-50 dark:bg-green-950 text-green-700',
  student: 'bg-orange-50 dark:bg-orange-950 text-orange-700',
};

// ──────────────────────────────────────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = Number(params.id);
  const currentUser = getUser();

  const initialTab = searchParams.get('tab') === 'permissoes' ? 'permissoes' : 'dados';
  const [tab, setTab] = useState<'dados' | 'permissoes'>(initialTab);
  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [permsData, setPermsData] = useState<PermissionsResponse | null>(null);
  const [grants, setGrants] = useState<Record<string, boolean>>({});
  const [permissionKeys, setPermissionKeys] = useState<PermissionKeyMeta[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Carrega dados do usuário
  useEffect(() => {
    if (!currentUser) { router.push('/login'); return; }
    api.get(`/users/${userId}`)
      .then((r) => setUserData(r.data))
      .catch(() => router.back())
      .finally(() => setLoadingUser(false));
  }, [userId]);

  // Carrega permissões + chaves disponíveis ao trocar para aba de permissões
  const loadPermissions = useCallback(async () => {
    if (permsData) return; // já carregado
    setLoadingPerms(true);
    try {
      const [permsRes, keysRes] = await Promise.all([
        api.get(`/permissions/user/${userId}`),
        api.get('/permissions/keys'),
      ]);
      setPermsData(permsRes.data);
      setPermissionKeys(keysRes.data);
      const map: Record<string, boolean> = {};
      permsRes.data.permissions.forEach((p: Permission) => {
        map[p.permissionKey] = p.granted;
      });
      setGrants(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPerms(false);
    }
  }, [userId, permsData]);

  useEffect(() => {
    if (tab === 'permissoes') loadPermissions();
  }, [tab, loadPermissions]);

  const handleToggle = (key: string) => {
    if (permsData?.isDirector) return;
    setGrants((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      const permissions = Object.keys(grants).map((key) => ({
        permissionKey: key,
        granted: grants[key],
      }));
      await api.patch(`/permissions/user/${userId}/bulk`, { permissions });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaveError(
        err.response?.data?.message ||
        'Erro ao salvar permissões. Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {userData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white leading-tight">
                {userData.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[userData.role]}`}>
                  {ROLE_LABEL[userData.role]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${userData.isActive ? 'bg-green-50 dark:bg-green-950 text-green-700' : 'bg-red-50 dark:bg-red-950 text-red-700'}`}>
                  {userData.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 flex gap-1">
          <button
            onClick={() => setTab('dados')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'dados'
                ? 'border-[#1E3A5F] text-[#1E3A5F] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UserIcon size={15} />
            Dados
          </button>
          <button
            onClick={() => setTab('permissoes')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'permissoes'
                ? 'border-[#1E3A5F] text-[#1E3A5F] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ShieldCheck size={15} />
            Permissões
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* ── Aba Dados ───────────────────────────────────────────────────────── */}
        {tab === 'dados' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <Field label="Nome" value={userData.name} />
            <Field label="Email" value={userData.email} />
            <Field label="Telefone" value={userData.phone || '—'} />
            <Field label="Papel" value={ROLE_LABEL[userData.role]} />
          </div>
        )}

        {/* ── Aba Permissões ──────────────────────────────────────────────────── */}
        {tab === 'permissoes' && (
          <>
            {loadingPerms ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : permsData?.isDirector ? (
              /* Diretor — tudo travado em ativado */
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
                <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-purple-600" />
                </div>
                <h2 className="font-bold text-[#1E3A5F] dark:text-white mb-2">
                  Diretor — Acesso total
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Diretores têm todas as permissões ativadas permanentemente e não
                  podem ser restritos em nenhuma circunstância.
                </p>

                {/* Mostra todos como ativados e travados */}
                <div className="mt-8 space-y-6 text-left">
                  {groupByCategory(permissionKeys).map((cat) => (
                    <div key={cat.label}>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        {cat.label}
                      </p>
                      <div className="space-y-2">
                        {cat.items.map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {label}
                            </span>
                            <ToggleSwitch checked={true} locked />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Usuário normal — toggles editáveis */
              <div className="space-y-6">
                {groupByCategory(permissionKeys).map((cat) => (
                  <div
                    key={cat.label}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                      {cat.label}
                    </p>
                    <div className="space-y-2">
                      {cat.items.map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleToggle(key)}
                          className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300 text-left">
                            {label}
                          </span>
                          <ToggleSwitch checked={grants[key] ?? false} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Barra de ações fixa */}
                <div className="sticky bottom-4">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between shadow-lg">
                    <div>
                      {saved && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle2 size={16} />
                          Permissões salvas com sucesso!
                        </div>
                      )}
                      {saveError && (
                        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm">
                          <AlertCircle size={16} />
                          {saveError}
                        </div>
                      )}
                      {!saved && !saveError && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Clique em salvar para aplicar as alterações
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-[#1E3A5F] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {saving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}

function ToggleSwitch({ checked, locked }: { checked: boolean; locked?: boolean }) {
  return (
    <div
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked
          ? locked
            ? 'bg-purple-400'
            : 'bg-[#1E3A5F]'
          : 'bg-gray-200 dark:bg-gray-700'
      } ${locked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </div>
  );
}
