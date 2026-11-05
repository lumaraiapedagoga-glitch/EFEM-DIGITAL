import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Sparkles } from 'lucide-react';

interface Calendar2027Props {
  onQuickEnrollAlignment: (title: string, dateStr: string, category: string) => void;
}

type DayMarkerType =
  | 'none'
  | 'green-full'      // Fev 08 a 12: bolinha e número na cor verde (Ensino Fundamental anos finais)
  | 'orange-dot'      // Fev 22 a 26: bolinha laranja (Ensino Fundamental anos iniciais)
  | 'lightblue-dot'   // Mar 08 a 12: bolinha azul claro em cada número/data (EJA)
  | 'orange-full'     // Mar 15 a 19: bolinhas e cada número/data na cor laranja (Ensino Fundamental anos iniciais)
  | 'split-blue-green'; // Mar 22 a 26: bolinha metade azul claro e metade verde claro em cada número/data

interface MonthConfig {
  monthIndex: number; // 0 = Jan, 1 = Fev, 2 = Mar...
  name: string;
  daysInMonth: number;
  startWeekday: number; // 0 = Dom, 1 = Seg, ..., 6 = Sáb (em 2027)
}

// Calendário real do ano de 2027 (2027 começa numa Sexta-feira, index 5)
const MONTHS_2027: MonthConfig[] = [
  { monthIndex: 0, name: 'Janeiro 2027', daysInMonth: 31, startWeekday: 5 },
  { monthIndex: 1, name: 'Fevereiro 2027', daysInMonth: 28, startWeekday: 1 },
  { monthIndex: 2, name: 'Março 2027', daysInMonth: 31, startWeekday: 1 },
  { monthIndex: 3, name: 'Abril 2027', daysInMonth: 30, startWeekday: 4 },
  { monthIndex: 4, name: 'Maio 2027', daysInMonth: 31, startWeekday: 6 },
  { monthIndex: 5, name: 'Junho 2027', daysInMonth: 30, startWeekday: 2 },
  { monthIndex: 6, name: 'Julho 2027', daysInMonth: 31, startWeekday: 4 },
  { monthIndex: 7, name: 'Agosto 2027', daysInMonth: 31, startWeekday: 0 },
  { monthIndex: 8, name: 'Setembro 2027', daysInMonth: 30, startWeekday: 3 },
  { monthIndex: 9, name: 'Outubro 2027', daysInMonth: 31, startWeekday: 5 },
  { monthIndex: 10, name: 'Novembro 2027', daysInMonth: 30, startWeekday: 1 },
  { monthIndex: 11, name: 'Dezembro 2027', daysInMonth: 31, startWeekday: 3 },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDayMarker(monthIndex: number, day: number): {
  type: DayMarkerType;
  label: string;
  segment: string;
} {
  // Fevereiro (monthIndex === 1)
  if (monthIndex === 1) {
    if (day >= 8 && day <= 12) {
      return {
        type: 'green-full',
        label: '08 a 12 de Fevereiro: Alinhamento Ensino Fundamental Anos Finais (Verde)',
        segment: 'Ensino Fundamental anos finais',
      };
    }
    if (day >= 22 && day <= 26) {
      return {
        type: 'orange-dot',
        label: '22 a 26 de Fevereiro: Alinhamento Ensino Fundamental Anos Iniciais (Laranja)',
        segment: 'Ensino Fundamental anos iniciais',
      };
    }
  }

  // Março (monthIndex === 2)
  if (monthIndex === 2) {
    if (day >= 8 && day <= 12) {
      return {
        type: 'lightblue-dot',
        label: '08 a 12 de Março: Formação e Alinhamento EJA (Azul Claro)',
        segment: 'EJA',
      };
    }
    if (day >= 15 && day <= 19) {
      return {
        type: 'orange-full',
        label: '15 a 19 de Março: Formação e Alinhamento Ensino Fundamental Anos Iniciais (Laranja)',
        segment: 'Ensino Fundamental anos iniciais',
      };
    }
    if (day >= 22 && day <= 26) {
      return {
        type: 'split-blue-green',
        label: '22 a 26 de Março: Formação Integrada EJA (Azul Claro) + Ensino Fundamental Anos Finais (Verde Claro)',
        segment: 'EJA & Ensino Fundamental anos finais',
      };
    }
  }

  return { type: 'none', label: '', segment: '' };
}

export const Calendar2027: React.FC<Calendar2027Props> = ({ onQuickEnrollAlignment }) => {
  const [selectedEventInfo, setSelectedEventInfo] = useState<{
    dateStr: string;
    label: string;
    segment: string;
  } | null>({
    dateStr: '2027-02-08',
    label: '08 a 12 de Fevereiro de 2027: Alinhamento Ensino Fundamental Anos Finais',
    segment: 'Ensino Fundamental anos finais',
  });
  const [viewMode, setViewMode] = useState<'destaque' | 'completo'>('completo');

  const monthsToShow =
    viewMode === 'destaque'
      ? MONTHS_2027.filter((m) => m.monthIndex === 1 || m.monthIndex === 2)
      : MONTHS_2027;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Aba Formação e Alinhamento 2027 */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#004b87] font-bold text-sm">
              <CalendarIcon className="w-5 h-5" />
              <span>CRONOGRAMA OFICIAL EFEM · SEDUCT CAMPOS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Calendário de Formação e Alinhamento — Ano 2027
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Consulte as semanas de alinhamento pedagógico por segmento e clique em qualquer data destacada para agendar seu lembrete automático (24h e 1h antes).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode('destaque')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                viewMode === 'destaque'
                  ? 'bg-[#004b87] text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Focar Fev/Mar 2027
            </button>
            <button
              onClick={() => setViewMode('completo')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                viewMode === 'completo'
                  ? 'bg-[#004b87] text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ano 2027 Completo (12 Meses)
            </button>
          </div>
        </div>

        {/* LEGENDA OFICIAL COM BOLINHAS DAS CORES EXATAS SOLICITADAS */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            Legenda Oficial por Segmento:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Bolinha Azul: Educação Infantil */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <span
                className="w-5 h-5 rounded-full bg-blue-700 shrink-0 shadow-xs border border-blue-900/20"
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">
                Educação Infantil <span className="font-normal text-slate-500">(Azul)</span>
              </span>
            </div>

            {/* Bolinha Laranja: Ensino Fundamental anos iniciais */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <span
                className="w-5 h-5 rounded-full bg-orange-500 shrink-0 shadow-xs border border-orange-700/20"
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">
                Ensino Fundamental anos iniciais <span className="font-normal text-slate-500">(Laranja)</span>
              </span>
            </div>

            {/* Bolinha Verde: Ensino Fundamental anos finais */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <span
                className="w-5 h-5 rounded-full bg-green-600 shrink-0 shadow-xs border border-green-800/20"
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">
                Ensino Fundamental anos finais <span className="font-normal text-slate-500">(Verde)</span>
              </span>
            </div>

            {/* Bolinha Azul Claro: EJA */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <span
                className="w-5 h-5 rounded-full bg-sky-400 shrink-0 shadow-xs border border-sky-600/20"
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">
                EJA <span className="font-normal text-slate-500">(Azul Claro)</span>
              </span>
            </div>

            {/* Bolinha Vermelha: Pedagogos (atualizada conforme solicitação final) */}
            <div className="flex items-center gap-3 bg-red-50/70 px-3.5 py-2.5 rounded-xl border border-red-200">
              <span
                className="w-5 h-5 rounded-full bg-red-600 shrink-0 shadow-xs border border-red-800/20"
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-900">
                Pedagogos <span className="font-semibold text-red-700">(Vermelho)</span>
              </span>
            </div>

            {/* Bolinha Bicolor (22 a 26 de Março: metade azul claro e metade verde claro) */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <span
                className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-slate-400/40"
                style={{
                  background: 'linear-gradient(90deg, #38bdf8 50%, #4ade80 50%)',
                }}
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">
                22 a 26/Março <span className="font-normal text-slate-500">(Azul Claro + Verde Claro)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Inscrição Rápida na Data Clicada */}
      {selectedEventInfo && (
        <div className="bg-[#003865] text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-8 border-[#8CC63F]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-300">
              <Sparkles className="w-4 h-4" />
              <span>Período de Alinhamento Selecionado</span>
            </div>
            <p className="text-base sm:text-lg font-bold">{selectedEventInfo.label}</p>
            <p className="text-xs sm:text-sm text-sky-200">
              Ao confirmar presença, o aplicativo adiciona automaticamente à sua Agenda Inteligente com lembrete no celular 24h e 1h antes.
            </p>
          </div>
          <button
            onClick={() =>
              onQuickEnrollAlignment(
                selectedEventInfo.label,
                selectedEventInfo.dateStr,
                selectedEventInfo.segment
              )
            }
            className="px-5 py-3 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#002855] font-extrabold text-sm flex items-center gap-2 shadow-md transition-colors shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Inscrever e Criar Lembrete</span>
          </button>
        </div>
      )}

      {/* Resumo Explicativo de Fevereiro e Março 2027 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/95 rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-base font-extrabold text-[#004b87] mb-2">
            Destaques de Fevereiro 2027
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-green-600 shrink-0" />
              <span>
                <strong className="text-green-700">Dias 08 até 12 de Fevereiro:</strong> Bolinhas e cada número/data na cor <strong>verde</strong> (Ensino Fundamental anos finais).
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
              <span>
                <strong className="text-orange-600">Dias 22 até 26 de Fevereiro:</strong> Bolinha na cor <strong>laranja</strong> (Ensino Fundamental anos iniciais).
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white/95 rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-base font-extrabold text-[#004b87] mb-2">
            Destaques de Março 2027
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-400 shrink-0" />
              <span>
                <strong className="text-sky-600">Dias 08 até 12 de Março:</strong> Bolinhas em cada número/data da cor <strong>azul claro</strong> (EJA).
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
              <span>
                <strong className="text-orange-600">Dias 15 até 19 de Março:</strong> Bolinhas e cada número/data na cor <strong>laranja</strong> (Ensino Fundamental anos iniciais).
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ background: 'linear-gradient(90deg, #38bdf8 50%, #4ade80 50%)' }}
              />
              <span>
                <strong>Dias 22 até 26 de Março:</strong> Bolinhas metade <strong>azul claro</strong> e metade <strong>verde claro</strong> em cada número/data.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Grade dos Meses de 2027 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {monthsToShow.map((month) => {
          const blanks = Array.from({ length: month.startWeekday }, (_, i) => i);
          const days = Array.from({ length: month.daysInMonth }, (_, i) => i + 1);
          const isHighlightMonth = month.monthIndex === 1 || month.monthIndex === 2;

          return (
            <div
              key={month.name}
              className={`bg-white/95 rounded-2xl p-5 shadow-md border-2 transition-all ${
                isHighlightMonth ? 'border-[#004b87] ring-2 ring-[#004b87]/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <h3 className="text-lg font-extrabold text-[#003865]">{month.name}</h3>
                {isHighlightMonth && (
                  <span className="text-xs font-bold text-[#004b87] bg-sky-50 px-2.5 py-0.5 rounded">
                    Alinhamento Ativo
                  </span>
                )}
              </div>

              {/* Cabeçalho dos dias da semana */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-xs font-bold text-slate-500 py-1">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1.5 text-center font-mono-tabular">
                {blanks.map((b) => (
                  <div key={`blank-${b}`} className="h-11" />
                ))}

                {days.map((day) => {
                  const marker = getDayMarker(month.monthIndex, day);
                  const mm = String(month.monthIndex + 1).padStart(2, '0');
                  const dd = String(day).padStart(2, '0');
                  const isoDate = `2027-${mm}-${dd}`;

                  // Estilização específica de acordo com a regra de cores pedida pelo usuário:
                  let numberColorClass = 'text-slate-800 font-semibold';
                  let bgClass = 'hover:bg-slate-100';

                  if (marker.type === 'green-full') {
                    // Fev 08 a 12: bolinhas e cada número/data na cor verde
                    numberColorClass = 'text-green-700 font-black';
                    bgClass = 'bg-green-50 hover:bg-green-100 border border-green-300 cursor-pointer';
                  } else if (marker.type === 'orange-dot') {
                    // Fev 22 a 26: bolinha laranja
                    numberColorClass = 'text-slate-900 font-extrabold';
                    bgClass = 'bg-orange-50/70 hover:bg-orange-100 border border-orange-200 cursor-pointer';
                  } else if (marker.type === 'lightblue-dot') {
                    // Mar 08 a 12: bolinhas em cada número/data da cor azul claro
                    numberColorClass = 'text-sky-600 font-black';
                    bgClass = 'bg-sky-50 hover:bg-sky-100 border border-sky-300 cursor-pointer';
                  } else if (marker.type === 'orange-full') {
                    // Mar 15 a 19: bolinhas e cada número/data da cor laranja
                    numberColorClass = 'text-orange-600 font-black';
                    bgClass = 'bg-orange-50 hover:bg-orange-100 border border-orange-300 cursor-pointer';
                  } else if (marker.type === 'split-blue-green') {
                    // Mar 22 a 26: metade da bolinha azul claro e outra verde claro em cada número/data
                    numberColorClass = 'text-teal-900 font-black';
                    bgClass = 'bg-gradient-to-r from-sky-50 to-green-50 hover:from-sky-100 hover:to-green-100 border border-sky-300 cursor-pointer';
                  }

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (marker.type !== 'none') {
                          setSelectedEventInfo({
                            dateStr: isoDate,
                            label: marker.label,
                            segment: marker.segment,
                          });
                        }
                      }}
                      title={marker.label || `${day} de ${month.name}`}
                      className={`h-11 rounded-lg flex flex-col items-center justify-center relative transition-colors ${bgClass}`}
                    >
                      <span className={`text-sm leading-none ${numberColorClass}`}>{day}</span>

                      {/* Renderização da Bolinha correspondente */}
                      {marker.type === 'green-full' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-green-600 mt-1 shadow-2xs"
                          aria-label="Bolinha verde"
                        />
                      )}
                      {marker.type === 'orange-dot' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 shadow-2xs"
                          aria-label="Bolinha laranja"
                        />
                      )}
                      {marker.type === 'lightblue-dot' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-sky-400 mt-1 shadow-2xs"
                          aria-label="Bolinha azul claro"
                        />
                      )}
                      {marker.type === 'orange-full' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 shadow-2xs"
                          aria-label="Bolinha laranja"
                        />
                      )}
                      {marker.type === 'split-blue-green' && (
                        <span
                          className="w-3 h-3 rounded-full mt-1 shadow-2xs border border-slate-400/40"
                          style={{
                            background: 'linear-gradient(90deg, #38bdf8 50%, #4ade80 50%)',
                          }}
                          aria-label="Bolinha metade azul claro e metade verde claro"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
