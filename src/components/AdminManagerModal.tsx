import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  Trash2,
  RefreshCw,
  Bell,
  Share2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import type { AdminUser, AdminPermissions } from '../../server';
import { notifyUserWhatsAppStyle } from '../utils/seductNotification';

export const AUTHORIZED_ADMIN_EMAILS = [
  'lumaraiapedagoga@gmail.com',
  'lumaraiapedagoga@gmail',
  'luciana.15432@edu.campos.rj.gov.br',
];

export const checkIsAuthorizedSuperAdmin = (email?: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === clean);
};

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  admins: AdminUser[];
  onRefreshAdmins: () => void;
  onSyncSeduct: () => Promise<void>;
  onExportExcel: () => void;
  currentUserEmail?: string;
}

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  isOpen,
  onClose,
  admins,
  onRefreshAdmins,
  onSyncSeduct,
  onExportExcel,
  currentUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'guide' | 'actions'>('team');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSuperAdmin = checkIsAuthorizedSuperAdmin(currentUserEmail);

  // Formulário para novo administrador
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Coordenador(a) Pedagógico(a) EFEM');
  const [schoolUnit, setSchoolUnit] = useState('SEDUCT / EFEM Campos dos Goytacazes');
  const [permissions, setPermissions] = useState<AdminPermissions>({
    canUpdateCourses: true,
    canSyncSeduct: true,
    canSendAlerts: true,
    canManageAdmins: true,
    canExportReports: true,
  });

  // Formulário para transmissão de alerta estilo WhatsApp
  const [alertTitle, setAlertTitle] = useState('Nova Formação Publicada pela EFEM!');
  const [alertMessage, setAlertMessage] = useState(
    'Acesse a aba "Formações" para conferir os novos encontros formativos e garanta sua vaga.'
  );
  const [sendingAlert, setSendingAlert] = useState(false);

  if (!isOpen) return null;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMessage(
        'Acesso negado: Apenas administradoras autorizadas possuem permissão para cadastrar novos administradores.'
      );
      return;
    }

    if (!name.trim() || !email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe o nome completo e um e-mail válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail || '',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role.trim(),
          schoolUnit: schoolUnit.trim(),
          permissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar administrador.');
      }

      setAlertSuccess(`Administrador(a) "${data.admin.name}" cadastrado(a) com sucesso!`);
      setName('');
      setEmail('');
      onRefreshAdmins();
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao salvar administrador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!isSuperAdmin) {
      setErrorMessage(
        'Acesso negado: Apenas administradoras autorizadas possuem permissão para remover administradores.'
      );
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover o acesso administrativo de "${adminName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admins/${adminId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': currentUserEmail || '',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover administrador.');
      }
      setAlertSuccess(`Acesso de "${adminName}" revogado com sucesso.`);
      onRefreshAdmins();
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao remover administrador.');
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (!isSuperAdmin) {
      setErrorMessage(
        'Acesso negado: Apenas administradoras autorizadas possuem permissão para alterar status de administradores.'
      );
      return;
    }

    const nextStatus = admin.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail || '',
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        onRefreshAdmins();
      }
    } catch {
      // Ignorar
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    try {
      setSendingAlert(true);
      const res = await fetch('/api/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: alertTitle,
          message: alertMessage,
          authorEmail: currentUserEmail || 'Administrador EFEM',
        }),
      });

      if (res.ok) {
        // Dispara o som e notificação localmente para o administrador testar o som do WhatsApp
        notifyUserWhatsAppStyle(alertTitle, alertMessage);
        setAlertSuccess('Alerta lúdico transmitido com sucesso com sinal sonoro estilo WhatsApp!');
        setTimeout(() => setAlertSuccess(null), 4000);
      }
    } catch (err) {
      setErrorMessage('Erro ao disparar alerta: ' + String(err));
    } finally {
      setSendingAlert(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      await onSyncSeduct();
      setAlertSuccess('Sincronização imediata concluída com seduct.campos.rj.gov.br!');
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (err) {
      setErrorMessage('Erro ao sincronizar SEDUCT: ' + String(err));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#003865] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho Oficial do Administrador */}
        <div className="bg-[#002855] text-white px-5 sm:px-7 py-4.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8CC63F] flex items-center justify-center text-[#002855] shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-lime-300 px-2.5 py-0.5 rounded-full">
                  Administração Autorizada EFEM / SEDUCT
                </span>
                <span className="text-[11px] font-bold text-sky-200">
                  {admins.length} Administrador(es) Cadastrado(s)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Painel de Administradores & Atualizações do Aplicativo
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              aria-label="Fechar painel de administração"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificações de Sucesso ou Erro */}
        {alertSuccess && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-inner">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{alertSuccess}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-500 text-white px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-inner">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Abas de Navegação Interna */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'team'
                ? 'bg-white text-[#002855] border-t-2 border-[#8CC63F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-[#0047AB]" />
            <span>Equipe de Administradores ({admins.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-[#002855] border-t-2 border-[#8CC63F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Como Convidar no Google AI Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'actions'
                ? 'bg-white text-[#002855] border-t-2 border-[#8CC63F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Ações Rápidas de Atualização</span>
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* ABA 1: EQUIPE DE ADMINISTRADORES (CADASTRO E LISTAGEM) */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Formulário: Cadastrar Novo Administrador */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2.5 text-[#002855] font-black text-sm sm:text-base border-b border-slate-200 pb-3 mb-4">
                  <UserPlus className="w-5 h-5 text-[#8CC63F]" />
                  <h3>Inserir Novo(a) Administrador(a) no Aplicativo</h3>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Lu Maraia ou Prof. Coordenador"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#8CC63F] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail Institucional ou Google *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nome@edu.campos.rj.gov.br ou @gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#8CC63F] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cargo / Função
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#8CC63F] bg-white font-medium"
                      >
                        <option value="Coordenador(a) Pedagógico(a) EFEM">
                          Coordenador(a) Pedagógico(a) EFEM
                        </option>
                        <option value="Gestor(a) SEDUCT">Gestor(a) SEDUCT</option>
                        <option value="Formador(a) EFEM">Formador(a) EFEM</option>
                        <option value="Diretor(a) Escolar">Diretor(a) Escolar</option>
                        <option value="Administrador(a) Geral">Administrador(a) Geral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Unidade Escolar / Setor
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: SEDUCT / EFEM"
                        value={schoolUnit}
                        onChange={(e) => setSchoolUnit(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#8CC63F] bg-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Permissões Específicas do Administrador */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                      Permissões Administrativas Concedidas:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={permissions.canUpdateCourses}
                          onChange={(e) =>
                            setPermissions((p) => ({ ...p, canUpdateCourses: e.target.checked }))
                          }
                          className="rounded text-[#0047AB]"
                        />
                        <span className="font-semibold text-slate-800">Atualizar Cursos</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={permissions.canSyncSeduct}
                          onChange={(e) =>
                            setPermissions((p) => ({ ...p, canSyncSeduct: e.target.checked }))
                          }
                          className="rounded text-[#0047AB]"
                        />
                        <span className="font-semibold text-slate-800">Sincronizar SEDUCT</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={permissions.canSendAlerts}
                          onChange={(e) =>
                            setPermissions((p) => ({ ...p, canSendAlerts: e.target.checked }))
                          }
                          className="rounded text-[#0047AB]"
                        />
                        <span className="font-semibold text-slate-800">Disparar Alertas</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={permissions.canManageAdmins}
                          onChange={(e) =>
                            setPermissions((p) => ({ ...p, canManageAdmins: e.target.checked }))
                          }
                          className="rounded text-[#0047AB]"
                        />
                        <span className="font-semibold text-slate-800">Gerenciar Equipe</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={permissions.canExportReports}
                          onChange={(e) =>
                            setPermissions((p) => ({ ...p, canExportReports: e.target.checked }))
                          }
                          className="rounded text-[#0047AB]"
                        />
                        <span className="font-semibold text-slate-800">Exportar Excel</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#002855] hover:bg-[#001f42] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4 text-[#8CC63F]" />
                      <span>{isSubmitting ? 'Salvando...' : 'Cadastrar e Conceder Permissão'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Tabela de Administradores Cadastrados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    Administradores Cadastrados com Acesso de Atualização
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    Total: {admins.length} usuário(s)
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#002855] text-white">
                        <th className="py-3 px-4 font-bold">Administrador(a)</th>
                        <th className="py-3 px-4 font-bold">E-mail</th>
                        <th className="py-3 px-4 font-bold">Cargo / Setor</th>
                        <th className="py-3 px-4 font-bold">Permissões</th>
                        <th className="py-3 px-4 font-bold text-center">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {admins.map((adm) => {
                        const isProtected = checkIsAuthorizedSuperAdmin(adm.email);
                        return (
                          <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Shield className={`w-4 h-4 ${isProtected ? 'text-amber-500' : 'text-[#0047AB]'}`} />
                                <span>{adm.name}</span>
                                {isProtected && (
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    Principal
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#0047AB] font-semibold">
                              {adm.email}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <div className="font-semibold">{adm.role}</div>
                              <div className="text-[11px] text-slate-500">{adm.schoolUnit}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {adm.permissions?.canUpdateCourses && (
                                  <span className="bg-sky-100 text-[#0047AB] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Cursos
                                  </span>
                                )}
                                {adm.permissions?.canSyncSeduct && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    SEDUCT
                                  </span>
                                )}
                                {adm.permissions?.canSendAlerts && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Alertas
                                  </span>
                                )}
                                {adm.permissions?.canManageAdmins && (
                                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Equipe
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(adm)}
                                disabled={isProtected}
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                                  adm.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                                title="Clique para alternar o status"
                              >
                                {adm.status === 'active' ? 'Ativo' : 'Inativo'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {!isProtected ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                  title="Remover Administrador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-semibold italic">
                                  Protegido
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: GUIA DE COMPARTILHAMENTO E ACESSO NO GOOGLE AI STUDIO */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="bg-[#002855] text-white rounded-2xl p-6 shadow-md border-2 border-[#8CC63F]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-[#8CC63F] text-[#002855]">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Como Inserir Novos Administradores no Google AI Studio
                    </h3>
                    <p className="text-xs text-sky-200">
                      Instruções para permitir que outros membros da equipe EFEM / SEDUCT acessem e atualizem este aplicativo no Google AI Studio.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-slate-800">
                  {/* Passo 1 */}
                  <div className="bg-white rounded-xl p-4 space-y-2 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-[#0047AB] text-white font-black text-sm flex items-center justify-center">
                        1
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Passo 1</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Clique em "Share" (Compartilhar)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      No canto superior direito da tela do <strong>Google AI Studio</strong>, localize e clique no botão <strong>"Share" (Compartilhar)</strong>.
                    </p>
                  </div>

                  {/* Passo 2 */}
                  <div className="bg-white rounded-xl p-4 space-y-2 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-[#0047AB] text-white font-black text-sm flex items-center justify-center">
                        2
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Passo 2</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Adicione o E-mail Google
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Digite o e-mail Google da pessoa (ex: <code>@gmail.com</code> ou <code>@edu.campos.rj.gov.br</code>) e selecione o nível de permissão: <strong>Editor</strong>.
                    </p>
                  </div>

                  {/* Passo 3 */}
                  <div className="bg-white rounded-xl p-4 space-y-2 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-[#8CC63F] text-[#002855] font-black text-sm flex items-center justify-center">
                        3
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Passo 3</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Acesso aos Prompts e Código
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      O novo administrador receberá um e-mail com acesso instantâneo ao mesmo ambiente para fazer atualizações com a IA e publicar alterações no app.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dicas adicionais de Segurança e Gerenciamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0047AB] text-sm">
                    <Lock className="w-4 h-4" />
                    <h4>Controle Duplo de Permissões</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cadastrar o e-mail na aba <strong>"Equipe de Administradores"</strong> garante que quando o usuário acessar o aplicativo em seu celular ou computador, o app reconhecerá seus privilégios de gestão para disparar notificações e atualizar eventos sem precisar abrir o editor de código.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                    <Info className="w-4 h-4" />
                    <h4>Permissões no Google Cloud IAM</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Caso sua organização utilize o Google Cloud Console corporativo vinculado ao projeto, você também pode adicionar os membros na aba <strong>IAM & Administração</strong> com a função de <em>Vertex AI User</em> ou <em>Project Editor</em>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: AÇÕES RÁPIDAS DE ATUALIZAÇÃO */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              {/* Card 1: Forçar Sincronização SEDUCT */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#002855] font-extrabold text-sm sm:text-base">
                    <RefreshCw className="w-5 h-5 text-[#8CC63F]" />
                    <h3>Forçar Sincronização em Tempo Real com SEDUCT</h3>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Busca imediatamente as novas publicações, formações e imagens oficiais cadastradas em{' '}
                    <a
                      href="https://seduct.campos.rj.gov.br/?p=eventos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#0047AB] underline"
                    >
                      https://seduct.campos.rj.gov.br/?p=eventos
                    </a>{' '}
                    e atualiza o catálogo do aplicativo instantaneamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="px-5 py-3 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#002855] font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer shrink-0 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Sincronizando...' : 'Sincronizar SEDUCT Agora'}</span>
                </button>
              </div>

              {/* Card 2: Disparo de Alerta Geral Lúdico Estilo WhatsApp */}
              <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm sm:text-base">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <h3>Disparar Alerta / Notificação Geral aos Educadores (Estilo WhatsApp)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Envia um aviso com o <strong>sinal sonoro lúdico característico do WhatsApp</strong>, vibração no celular e notificação push para os educadores conectados ou com o atalho instalado.
                </p>

                <form onSubmit={handleBroadcastAlert} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título do Alerta *
                    </label>
                    <input
                      type="text"
                      required
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                      placeholder="Ex: Nova Formação de Alfabetização Disponível!"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mensagem / Conteúdo do Alerta *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Ex: As inscrições para a nova formação da EFEM já estão abertas no portal SEDUCT. Clique para se inscrever!"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={sendingAlert}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Bell className="w-4 h-4" />
                      <span>{sendingAlert ? 'Disparando Som & Alerta...' : 'Disparar Notificação com Som do WhatsApp'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 3: Exportação da Planilha Excel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <h3>Exportar Banco de Dados Completo para Excel (.CSV)</h3>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Baixa o relatório executivo com todos os e-mails institucionais do SIPAE, inscrições nas formações e lista de administradores cadastrados formatada para o Microsoft Excel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onExportExcel}
                  className="px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer shrink-0 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-lime-300" />
                  <span>Baixar Planilha Excel</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">
              Ambiente de Administração Conectado · EFEM SEDUCT Campos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
            >
              Fechar Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
