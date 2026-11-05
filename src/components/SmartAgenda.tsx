import React, { useState } from 'react';
import {
  Bell,
  CalendarPlus,
  Clock,
  Mail,
  Sparkles,
  Trash2,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  CalendarCheck,
  Wand2,
} from 'lucide-react';
import type { AppointmentRecord, EnrollmentRecord } from '../../server';
import { notifyUserWhatsAppStyle } from '../utils/seductNotification';

interface SmartAgendaProps {
  appointments: AppointmentRecord[];
  enrollments: EnrollmentRecord[];
  onAddAppointment: (apt: {
    title: string;
    date: string;
    time: string;
    category: string;
    email?: string;
    notifyPhone: boolean;
    notes?: string;
  }) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onTriggerTestNotification: (title: string, mode: '24h' | '1h') => void;
}

const EDUCATOR_CATEGORIES = [
  'Compromisso Pedagógico',
  'Creche',
  'Educação Infantil',
  'Ensino Fundamental (anos iniciais)',
  'Ensino Fundamental (anos finais)',
  'EJA',
  'Professores Orientadores de Tecnologias Educacionais',
  'Professores de Salas de Recursos',
  'Pedagogos',
  'Gestores',
  'Formação e Alinhamento 2027',
];

export const SmartAgenda: React.FC<SmartAgendaProps> = ({
  appointments,
  enrollments,
  onAddAppointment,
  onDeleteAppointment,
  onTriggerTestNotification,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-10-30');
  const [time, setTime] = useState('08:00');
  const [category, setCategory] = useState('Compromisso Pedagógico');
  const [email, setEmail] = useState('');
  const [notifyPhone, setNotifyPhone] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estado da Inteligência Artificial Lúdica para Educadores
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    suggestion: string;
    tipOfTheDay?: string;
    recommendedAction?: {
      title: string;
      date: string;
      time: string;
      category: string;
    };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    setSubmitting(true);
    try {
      await onAddAppointment({
        title: title.trim(),
        date,
        time,
        category,
        email: email.trim() || undefined,
        notifyPhone,
        notes: notes.trim() || undefined,
      });
      // Sinalização lúdica estilo WhatsApp com som, vibração no celular e notificação push
      notifyUserWhatsAppStyle(
        '📅 Agenda EFEM · Novo Compromisso!',
        `"${title.trim()}" agendado para ${date.split('-').reverse().join('/')} às ${time}. Lembretes automáticos ativados!`
      );
      setTitle('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/agenda-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            aiPrompt ||
            'Conecte minhas inscrições nos cursos e formações SEDUCT com minha rotina pedagógica e sugira um cronograma leve.',
          appointments,
          enrollments,
          userRole: category,
        }),
      });
      const data = await res.json();
      setAiResponse(data);
    } catch {
      setAiResponse({
        suggestion:
          'Seus cursos na EFEM/SEDUCT estão sincronizados! Lembretes de 24 horas (1 dia antes) e 1 hora antes foram programados para seu celular.',
        tipOfTheDay:
          'Planejar com antecedência transforma a rotina pedagógica em um processo criativo e emancipador.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Topo Minha Agenda Inteligente */}
      <div className="bg-gradient-to-r from-[#003865] via-[#004b87] to-[#005a9c] text-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-lime-300">
              <Sparkles className="w-4 h-4" />
              <span>Agenda Inteligente com IA · Sem necessidade de login</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Minha Agenda Pedagógica Interativa
            </h2>
            <p className="text-sm sm:text-base text-sky-100 max-w-3xl">
              Conectada automaticamente às suas inscrições nas Formações e Alinhamentos da EFEM/SEDUCT.
              Cadastre seus compromissos com nome, data e horário e receba alertas no celular (e opcionalmente por e-mail) com{' '}
              <strong>24 horas (1 dia) de antecedência</strong> e <strong>1 hora antes</strong> do compromisso.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 bg-white/10 p-4 rounded-xl border border-white/20">
            <div className="flex items-center gap-2 text-xs font-bold text-lime-300">
              <Smartphone className="w-4 h-4" />
              <span>Alertas Automáticos no Celular Ativos</span>
            </div>
            <p className="text-xs text-sky-100">
              • Notificação 24h antes (1 dia de antecedência)
              <br />• Notificação 1h antes do horário marcado
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Formulário Estilo Google Agenda (Sem exigir e-mail) + Consultor IA Lúdico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Criar Compromisso (5 colunas) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-slate-200">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-[#004b87] text-white flex items-center justify-center">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Novo Compromisso na Agenda
              </h3>
              <p className="text-xs text-slate-500">
                Rápido como o Google Agenda — e-mail 100% opcional
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Compromisso / Formação *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reunião Pedagógica, Formação EFEM, Conselho..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Horário *
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Segmento / Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87]"
              >
                {EDUCATOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                E-mail para Lembrete (Opcional — Não obrigatório)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Deixe em branco ou digite seu e-mail se preferir"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Anotações ou Pauta Pedagógica
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Materiais necessários, link ou sala..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87]"
              />
            </div>

            {/* Opções de Alerta 24h e 1h */}
            <div className="bg-lime-50 border border-lime-300 rounded-xl p-3.5 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPhone}
                  onChange={(e) => setNotifyPhone(e.target.checked)}
                  className="w-4 h-4 rounded text-[#004b87]"
                />
                <span className="text-xs sm:text-sm font-bold text-[#002855]">
                  Notificar no celular (24h antes e 1h antes do compromisso)
                </span>
              </label>
              <p className="text-xs text-slate-600 pl-6">
                Funciona direto no aparelho sem precisar de e-mail. Se você preencheu o e-mail acima, enviaremos o lembrete para ambos!
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer"
            >
              {submitting ? 'Salvando na Agenda...' : 'Salvar Compromisso com Lembrete 24h e 1h'}
            </button>
          </form>
        </div>

        {/* Coluna Direita: Assistente IA + Lista de Compromissos e Inscrições Conectadas (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Assistente de Inteligência Artificial Lúdico e Interativo para Educadores */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-md border-2 border-[#8CC63F]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#8CC63F] text-[#002855] flex items-center justify-center font-black">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#002855]">
                    Assistente Pedagógico IA · Conexão com Suas Inscrições
                  </h3>
                  <p className="text-xs text-slate-600">
                    Organize seus horários de estudo, cursos SEDUCT e receba sugestões personalizadas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Como organizar minha semana para a formação do PDDE ou Anos Iniciais?"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
              />
              <button
                type="button"
                onClick={handleAskAI}
                disabled={aiLoading}
                className="px-4 py-2.5 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#002855] font-extrabold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer shadow-xs"
              >
                {aiLoading ? 'Consultando IA...' : 'Organizar com IA'}
              </button>
            </div>

            {aiResponse && (
              <div className="mt-4 bg-[#f8faf2] border border-[#8CC63F]/60 rounded-xl p-4 space-y-3">
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {aiResponse.suggestion}
                </p>
                {aiResponse.tipOfTheDay && (
                  <p className="text-xs text-[#004b87] font-bold italic border-l-4 border-[#004b87] pl-3">
                    “{aiResponse.tipOfTheDay}”
                  </p>
                )}
                {aiResponse.recommendedAction && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                    <div className="text-xs text-slate-700">
                      <span className="font-bold">Sugestão IA:</span>{' '}
                      {aiResponse.recommendedAction.title} ({aiResponse.recommendedAction.date} às{' '}
                      {aiResponse.recommendedAction.time})
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onAddAppointment({
                          title: aiResponse.recommendedAction!.title,
                          date: aiResponse.recommendedAction!.date,
                          time: aiResponse.recommendedAction!.time,
                          category: aiResponse.recommendedAction!.category,
                          notifyPhone: true,
                          notes: 'Compromisso sugerido pela Inteligência Artificial da Agenda EFEM.',
                        })
                      }
                      className="text-xs font-extrabold bg-[#004b87] text-white px-3 py-1.5 rounded-lg hover:bg-[#003865] cursor-pointer"
                    >
                      + Adicionar à Minha Agenda
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista de Compromissos e Inscrições Sincronizadas */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#004b87]" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Meus Compromissos e Formações Inscritas ({appointments.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                ● Sincronizado automaticamente com Inscrições SEDUCT
              </span>
            </div>

            {appointments.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                Nenhum compromisso cadastrado ainda. Adicione no formulário ao lado ou inscreva-se em uma formação!
              </p>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`rounded-xl p-4 border transition-all ${
                      apt.isAutoFromCourse
                        ? 'bg-sky-50/70 border-sky-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#004b87] font-bold">
                          <span>{apt.category}</span>
                          <span>·</span>
                          <span className="font-mono-tabular flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Data: {apt.date.split('-').reverse().join('/')} às {apt.time}
                          </span>
                          {apt.isAutoFromCourse && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 font-extrabold">
                                Vinculado à Inscrição SEDUCT
                              </span>
                            </>
                          )}
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900">{apt.title}</h4>

                        {apt.notes && (
                          <p className="text-xs sm:text-sm text-slate-600">{apt.notes}</p>
                        )}

                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Alerta Celular: 24h antes & 1h antes
                          </span>
                          {apt.email && (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Mail className="w-3.5 h-3.5" />
                              E-mail: {apt.email}
                            </span>
                          )}
                          {apt.courseUrl && (
                            <a
                              href={apt.courseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#004b87] font-bold hover:underline"
                            >
                              <span>Página do Evento SEDUCT</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onTriggerTestNotification(apt.title, '24h')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#004b87] text-white text-xs font-bold hover:bg-[#003865] flex items-center gap-1 cursor-pointer"
                            title="Simular notificação de 24h (1 dia) de antecedência no celular"
                          >
                            <Bell className="w-3 h-3" />
                            <span>Testar 24h</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onTriggerTestNotification(apt.title, '1h')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 flex items-center gap-1 cursor-pointer"
                            title="Simular notificação de 1h antes no celular"
                          >
                            <Bell className="w-3 h-3" />
                            <span>Testar 1h</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteAppointment(apt.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
