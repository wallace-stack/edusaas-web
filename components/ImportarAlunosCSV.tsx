'use client';

import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import api from '@/app/lib/api';
import {
  Upload, FileText, Download, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, X, Loader2,
} from 'lucide-react';

interface AlunoRow {
  name: string;
  email: string;
  className: string;
  phone?: string;
  document?: string;
  birthDate?: string;
  guardianName?: string;
  guardianPhone?: string;
}

interface ImportError {
  linha: number;
  email: string;
  erro: string;
}

interface ImportResult {
  total: number;
  success: number;
  errors: ImportError[];
}

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  classes?: Array<{ id: number; name: string; year?: number }>;
}

function downloadTemplate(classes?: Array<{ id: number; name: string; year?: number }>) {
  const BOM = '\uFEFF';
  const cabecalho  = 'nome,email,turma,telefone,cpf,data_nascimento,responsavel,telefone_responsavel';

  let linhasExemplo: string[];
  if (classes && classes.length > 0) {
    const turma1 = classes[0]?.name ?? '1º Ano A';
    const turma2 = classes[1]?.name ?? turma1;
    const turma3 = classes[2]?.name ?? turma1;
    linhasExemplo = [
      `João Silva,joao.silva@escola.com,${turma1},(11)99999-0001,111.222.333-01,15/03/2012,Maria Silva,(11)98888-0001`,
      `Ana Costa,ana.costa@escola.com,${turma2},(11)99999-0002,,22/07/2011,,`,
      `Carlos Souza,carlos.souza@escola.com,${turma3},,,,,`,
    ];
  } else {
    linhasExemplo = [
      'João Silva,joao.silva@escola.com,1º Ano A,(11)99999-0001,111.222.333-01,15/03/2012,Maria Silva,(11)98888-0001',
      'Ana Costa,ana.costa@escola.com,1º Ano A,(11)99999-0002,,22/07/2011,,',
      'Carlos Souza,carlos.souza@escola.com,2º Ano B,,,,,',
    ];
  }

  const csvContent = BOM + [cabecalho, ...linhasExemplo].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_alunos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseDateBR(val?: string): string | undefined {
  if (!val) return undefined;
  // Aceita DD/MM/YYYY ou YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/');
    return `${y}-${m}-${d}`;
  }
  return val;
}

export default function ImportarAlunosCSV({ onClose, onSuccess, classes }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName]     = useState('');
  const [alunos, setAlunos]         = useState<AlunoRow[]>([]);
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState<ImportResult | null>(null);
  const [errExpanded, setErrExpanded] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [parseError, setParseError] = useState('');

  const parseFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setParseError('Apenas arquivos .csv são aceitos.');
      return;
    }
    setParseError('');
    setFileName(file.name);
    setResult(null);
    setAlunos([]);

    const tryParse = (delimiter: string, encoding: string) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding,
        delimiter,
        transformHeader: (header: string, index: number) => {
          const normalized = header.trim().toLowerCase().replace(/\s+/g, '_');
          return normalized || `col_${index}`;
        },
        complete: (res) => {
          const headers = res.meta.fields ?? [];

          // Se só tem 1 coluna com delimitador vírgula, tenta ponto-e-vírgula
          if (headers.length <= 1 && delimiter === ',') {
            tryParse(';', encoding);
            return;
          }

          // Se ainda tem 1 coluna, arquivo está mal formatado
          if (headers.length <= 1) {
            setParseError('Arquivo não reconhecido. Use "Salvar como → CSV UTF-8 (delimitado por vírgulas)" no Excel, ou use o Google Sheets.');
            return;
          }

          const rows = (res.data as any[])
            .filter((row: any) => {
              const firstVal = String(Object.values(row)[0] ?? '');
              return !firstVal.startsWith('#') && firstVal.trim() !== '';
            })
            .map((row): AlunoRow => ({
              name:          (row.nome        || row.name          || row['nome_']        || '').trim(),
              email:         (row.email       || row['e-mail']     || '').trim().toLowerCase(),
              className:     (row.turma       || row.class         || row.turma_          || '').trim(),
              phone:         (row.telefone    || row.phone         || row.fone            || '').trim() || undefined,
              document:      (row.cpf         || row.document      || '').trim() || undefined,
              birthDate:     parseDateBR(row.data_nascimento || row.data || row.birthDate || row.nascimento),
              guardianName:  (row.responsavel || row.guardianName  || row.responsavel_    || '').trim() || undefined,
              guardianPhone: (row.telefone_responsavel || row.guardianPhone || row.tel_responsavel || '').trim() || undefined,
            }));

          console.log('Parsed com delimiter:', JSON.stringify(delimiter), '| Rows:', rows.length, '| Headers:', headers);

          if (rows.length === 0) {
            setParseError('Nenhum aluno encontrado no arquivo. Verifique se o arquivo tem dados além do cabeçalho.');
            return;
          }

          setAlunos(rows);
        },
        error: () => setParseError('Erro ao ler o arquivo CSV.'),
      });
    };

    // Começa tentando vírgula
    tryParse(',', 'UTF-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    if (!alunos.length) return;
    setImporting(true);
    setResult(null);
    try {
      const { data } = await api.post<ImportResult>('/secretary/students/import', alunos);
      setResult(data);
      if (data.success > 0) onSuccess?.();
    } catch (e: any) {
      setParseError(e?.response?.data?.message || 'Erro ao importar. Tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  const previewRows = alunos.slice(0, 5);
  const hasIssues   = alunos.some(a => !a.name || !a.email || !a.className);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl
                      max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Importar alunos via CSV</h2>
            <p className="text-xs text-gray-400 mt-0.5">Importe até centenas de alunos de uma vez</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Botão template + aviso + turmas disponíveis */}
          <div className="space-y-1.5">
            <button
              onClick={() => downloadTemplate(classes)}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              <Download size={15} />
              Baixar template CSV
            </button>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ O nome da turma deve ser exatamente igual ao cadastrado (ex: &apos;1º Ano A&apos;, não &apos;1 Ano A&apos;)
            </p>
            {classes && classes.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
                  Turmas disponíveis nesta escola:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {classes.map(c => (
                    <span key={c.id} className="text-xs bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 px-2 py-0.5 rounded-full font-mono">
                      {c.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                  Use o nome exato como aparece acima, incluindo acentos e espaços.
                </p>
              </div>
            )}
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-base shrink-0">⚠️</span>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Use apenas o template de importação.</strong> O arquivo exportado (com 16 colunas) não é compatível com a importação. Baixe o template acima para preencher.
              </p>
            </div>
          </div>

          {/* Dica Excel */}
          <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <span className="text-gray-400 text-base shrink-0">💡</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Usuários do Excel:</strong> ao salvar, escolha <em>&quot;CSV UTF-8 (delimitado por vírgulas)&quot;</em>. Evite &quot;CSV (separado por ponto e vírgula)&quot; — o sistema não reconhece esse formato.
            </p>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: dragOver ? '#6366f1' : 'rgba(0,0,0,0.1)', background: dragOver ? 'rgba(99,102,241,0.04)' : undefined }}
            >
              <Upload size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{fileName}</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Arraste o arquivo CSV aqui ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Apenas arquivos .csv · Codificação UTF-8</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            </div>
          )}

          {/* Erro de parse */}
          {parseError && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="shrink-0" />
              {parseError}
            </div>
          )}

          {/* Preview da tabela */}
          {alunos.length > 0 && !result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Prévia — {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} detectado{alunos.length !== 1 ? 's' : ''}
                  {alunos.length > 5 && <span className="ml-1 font-normal">(mostrando 5)</span>}
                </p>
                {hasIssues && (
                  <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                    <AlertTriangle size={12} /> Dados incompletos detectados
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {['Nome', 'E-mail', 'Turma', 'Telefone'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((a, i) => {
                      const missing = !a.name || !a.email || !a.className;
                      return (
                        <tr key={i} className={`border-t border-gray-50 dark:border-gray-800 ${missing ? 'bg-orange-50 dark:bg-orange-950/30' : ''}`}>
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                            {a.name || <span className="text-orange-500">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {a.email || <span className="text-orange-500">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {a.className || <span className="text-orange-500">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-400">{a.phone || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botão importar */}
              <button
                onClick={handleImport}
                disabled={importing}
                className="mt-4 w-full py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <><Loader2 size={16} className="animate-spin" /> Importando{alunos.length > 50 ? ' (pode levar alguns segundos)' : ''}…</>
                ) : (
                  <>Importar {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} →</>
                )}
              </button>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-4">
              {/* Sucesso */}
              {result.success > 0 && (
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-4">
                  <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {result.success} aluno{result.success !== 1 ? 's' : ''} importado{result.success !== 1 ? 's' : ''} com sucesso
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      {result.total - result.success === 0
                        ? 'Todos os registros foram processados.'
                        : `${result.total - result.success} registro${result.total - result.success !== 1 ? 's' : ''} com erro.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Erros */}
              {result.errors.length > 0 && (
                <div className="border border-orange-200 dark:border-orange-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setErrExpanded(e => !e)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-950 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-300">
                      <AlertTriangle size={15} />
                      {result.errors.length} erro{result.errors.length !== 1 ? 's' : ''} encontrado{result.errors.length !== 1 ? 's' : ''}
                    </span>
                    {errExpanded ? <ChevronUp size={16} className="text-orange-400" /> : <ChevronDown size={16} className="text-orange-400" />}
                  </button>
                  {errExpanded && (
                    <div className="divide-y divide-orange-100 dark:divide-orange-900 max-h-48 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="text-xs font-bold text-orange-400 shrink-0 mt-0.5">L{err.linha}</span>
                          <div>
                            <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">{err.email || '(sem e-mail)'}</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400">{err.erro}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ações pós-importação */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setResult(null); setAlunos([]); setFileName(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Importar outro arquivo
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
