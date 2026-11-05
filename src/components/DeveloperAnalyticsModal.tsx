import React from 'react';
import { Download, Database, Users, CheckSquare, Activity, X, PlusCircle, ShieldCheck } from 'lucide-react';
import type { AccessLog, SipaeLoginRecord, EnrollmentRecord, AdminUser } from '../../server';

interface DeveloperAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessLogs: AccessLog[];
  sipaeLogins: SipaeLoginRecord[];
  enrollments: EnrollmentRecord[];
  admins?: AdminUser[];
  onRegisterSipaeModal: () => void;
  onOpenAdminManager?: () => void;
}

/**
 * Painel de Análise do Desenvolvedor (Oculto para usuários comuns, acessível na área restrita de Análise):
 * - Informações organizadas sobre acessos
 * - E-mails institucionais logados no SIPAE (https://seduct.campos.rj.gov.br/)
 * - Quantidade de inscrições pelo https://seduct.campos.rj.gov.br/ nas formações e alinhamento
 * - Exportação direta para Planilha do Excel (.xls / .csv compatível com Microsoft Excel)
 */
export const DeveloperAnalyticsModal: React.FC<DeveloperAnalyticsModalProps> = ({
  isOpen,
  onClose,
  accessLogs,
  sipaeLogins,
  enrollments,
  admins = [],
  onRegisterSipaeModal,
  onOpenAdminManager,
}) => {
  if (!isOpen) return null;

  const exportToExcel = () => {
    // Gera arquivo CSV com BOM UTF-8 que abre nativamente no Microsoft Excel com colunas perfeitas
    const sep = ';';
    const lines: string[] = [];

    lines.push('RELATORIO DE ANALISE DO DESENVOLVEDOR - EFEM / SEDUCT CAMPOS DOS GOYTACAZES');
    lines.push(`Data de Exportacao${sep}${new Date().toLocaleString('pt-BR')}`);
    lines.push(`Portal Integrado${sep}https://seduct.campos.rj.gov.br/`);
    lines.push('');

    lines.push('1. RESUMO DE INDICADORES');
    lines.push(`Total de Acessos Registrados${sep}${accessLogs.length}`);
    lines.push(`Total de E-mails Institucionais Logados no SIPAE${sep}${sipaeLogins.length}`);
    lines.push(`Total de Inscricoes em Formacoes e Alinhamento SEDUCT${sep}${enrollments.length}`);
    lines.push('');

    lines.push('2. E-MAILS INSTITUCIONAIS LOGADOS NO SIPAE (https://seduct.campos.rj.gov.br/)');
    lines.push(`ID${sep}E-mail Institucional SIPAE${sep}Nome do Educador${sep}Cargo/Segmento${sep}Unidade Escolar${sep}Data/Hora Login`);
    sipaeLogins.forEach((s) => {
      lines.push(
        `${s.id}${sep}${s.email}${sep}${s.name}${sep}${s.role}${sep}${s.schoolUnit}${sep}${new Date(
          s.loggedAt
        ).toLocaleString('pt-BR')}`
      );
    });
    lines.push('');

    lines.push('3. INSCRICOES NAS FORMACOES E ALINHAMENTO PELO PORTAL SEDUCT');
    lines.push(`ID${sep}Codigo Evento${sep}Formacao / Alinhamento${sep}Segmento${sep}Educador${sep}E-mail SIPAE${sep}Data do Evento${sep}Link Oficial SEDUCT`);
    enrollments.forEach((e) => {
      lines.push(
        `${e.id}${sep}${e.courseId}${sep}${e.courseTitle}${sep}${e.category}${sep}${e.participantName}${sep}${e.sipaeEmail}${sep}${e.eventDate}${sep}${e.seductUrl}`
      );
    });
    lines.push('');

    lines.push('4. HISTORICO DE ACESSOS AO APLICATIVO');
    lines.push(`ID${sep}Data/Hora${sep}Aba/Pagina Acessada${sep}E-mail Vinculado${sep}Dispositivo`);
    accessLogs.forEach((a) => {
      lines.push(
        `${a.id}${sep}${new Date(a.timestamp).toLocaleString('pt-BR')}${sep}${a.page}${sep}${
          a.sipaeEmail || 'Visitante'
        }${sep}"${(a.userAgent || '').replace(/"/g, "'")}"`
      );
    });
    lines.push('');

    lines.push('5. ADMINISTRADORES DO SISTEMA E GOOGLE AI STUDIO');
    lines.push(`ID${sep}Nome${sep}E-mail${sep}Cargo${sep}Unidade${sep}Status${sep}Data Cadastro`);
    admins.forEach((adm) => {
      lines.push(
        `${adm.id}${sep}${adm.name}${sep}${adm.email}${sep}${adm.role}${sep}${adm.schoolUnit}${sep}${adm.status}${sep}${adm.createdAt}`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_BancoDeDados_EFEM_SEDUCT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#003865] overflow-hidden">
        {/* Cabeçalho do Banco de Dados do Desenvolvedor */}
        <div className="bg-[#003865] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-[#8CC63F]" />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold">
                Painel de Análise do Desenvolvedor · Banco de Dados EFEM / SIPAE
              </h2>
              <p className="text-xs text-sky-200">
                Monitoramento de acessos, logins institucionais SIPAE e inscrições em https://seduct.campos.rj.gov.br/
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Fechar painel do desenvolvedor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Botões de Ação e Exportação Excel */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 gap-4 flex-1 min-w-[260px]">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Activity className="w-4 h-4 text-[#004b87]" />
                  <span>Total de Acessos</span>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono-tabular mt-1">
                  {accessLogs.length}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>E-mails SIPAE Logados</span>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono-tabular mt-1">
                  {sipaeLogins.length}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  <span>Inscrições SEDUCT</span>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono-tabular mt-1">
                  {enrollments.length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenAdminManager && (
                <button
                  onClick={onOpenAdminManager}
                  className="px-4 py-2.5 rounded-xl bg-[#002855] hover:bg-[#001c3d] text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-[#8CC63F]/40 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[#8CC63F]" />
                  <span>Gerenciar Administradores</span>
                </button>
              )}
              <button
                onClick={onRegisterSipaeModal}
                className="px-4 py-2.5 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simular Novo Login SIPAE</span>
              </button>
              <button
                onClick={exportToExcel}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Converter e Baixar Planilha Excel (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Tabela 1: E-mails Institucionais Logados no SIPAE */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#003865] mb-2">
              1. E-mails Institucionais Logados no SIPAE (https://seduct.campos.rj.gov.br/)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">E-mail Institucional</th>
                    <th className="py-2.5 px-3 font-bold">Educador(a)</th>
                    <th className="py-2.5 px-3 font-bold">Segmento / Função</th>
                    <th className="py-2.5 px-3 font-bold">Unidade Escolar</th>
                    <th className="py-2.5 px-3 font-bold">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono-tabular">
                  {sipaeLogins.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-[#004b87]">{item.email}</td>
                      <td className="py-2 px-3 text-slate-800">{item.name}</td>
                      <td className="py-2 px-3 text-slate-600">{item.role}</td>
                      <td className="py-2 px-3 text-slate-600">{item.schoolUnit}</td>
                      <td className="py-2 px-3 text-slate-500">
                        {new Date(item.loggedAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela 2: Inscrições nas Formações e Alinhamento pelo Portal SEDUCT */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#003865] mb-2">
              2. Inscrições nas Formações e Alinhamento (https://seduct.campos.rj.gov.br/)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Evento / Formação</th>
                    <th className="py-2.5 px-3 font-bold">Sub-aba / Segmento</th>
                    <th className="py-2.5 px-3 font-bold">Participante</th>
                    <th className="py-2.5 px-3 font-bold">E-mail SIPAE</th>
                    <th className="py-2.5 px-3 font-bold">Data do Evento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono-tabular">
                  {enrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{enr.courseTitle}</td>
                      <td className="py-2 px-3 text-[#004b87] font-bold">{enr.category}</td>
                      <td className="py-2 px-3 text-slate-700">{enr.participantName}</td>
                      <td className="py-2 px-3 text-slate-600">{enr.sipaeEmail}</td>
                      <td className="py-2 px-3 text-slate-600">{enr.eventDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
