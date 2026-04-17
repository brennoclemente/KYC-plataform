'use client';

type OcrField = {
  value: string;
  confidence: number;
  lowConfidence: boolean;
};

interface DocumentViewerProps {
  document: {
    documentType: string;
    presignedUrl: string;
    ocrRawText: string | null;
    ocrStructuredData: Record<string, OcrField> | null;
    ocrStatus: string;
  };
}

const OCR_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
};

const OCR_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  CONTRATO_SOCIAL: 'Contrato Social',
  IDENTIDADE: 'Identidade',
  CPF: 'CPF',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
  OUTROS: 'Outros',
};

export default function DocumentViewer({ document }: DocumentViewerProps) {
  const statusLabel = OCR_STATUS_LABELS[document.ocrStatus] ?? document.ocrStatus;
  const statusColor = OCR_STATUS_COLORS[document.ocrStatus] ?? 'bg-gray-100 text-gray-800';
  const docLabel = DOC_TYPE_LABELS[document.documentType] ?? document.documentType;

  return (
    <div className="border border-secondary/20 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-secondary/10 flex items-center justify-between">
        <span className="text-sm font-medium text-text">{docLabel}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
          OCR: {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-secondary/20">
        {/* Left: document image */}
        <div className="p-4 flex items-start justify-center bg-gray-50">
          <img
            src={document.presignedUrl}
            alt={`Documento: ${docLabel}`}
            className="max-w-full max-h-96 object-contain rounded shadow"
          />
        </div>

        {/* Right: OCR data */}
        <div className="p-4 space-y-4">
          {document.ocrStructuredData && Object.keys(document.ocrStructuredData).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                Campos extraídos
              </h4>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-secondary border-b border-secondary/20">
                    <th className="pb-1 pr-2 font-medium">Campo</th>
                    <th className="pb-1 pr-2 font-medium">Valor</th>
                    <th className="pb-1 font-medium">Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(document.ocrStructuredData).map(([key, field]) => (
                    <tr
                      key={key}
                      className={`border-b border-secondary/10 ${
                        field.lowConfidence ? 'bg-amber-50' : ''
                      }`}
                    >
                      <td className="py-1 pr-2 text-text font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                        {field.lowConfidence && (
                          <span className="ml-1 text-amber-600 text-xs" title="Baixa confiança">
                            ⚠
                          </span>
                        )}
                      </td>
                      <td className="py-1 pr-2 text-text">{field.value}</td>
                      <td className={`py-1 text-xs ${field.lowConfidence ? 'text-amber-600 font-medium' : 'text-secondary'}`}>
                        {(field.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {document.ocrRawText && (
            <div>
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                Texto extraído
              </h4>
              <pre className="text-xs text-text bg-gray-50 border border-secondary/20 rounded p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {document.ocrRawText}
              </pre>
            </div>
          )}

          {!document.ocrRawText && (!document.ocrStructuredData || Object.keys(document.ocrStructuredData).length === 0) && (
            <p className="text-sm text-secondary italic">Nenhum dado OCR disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}
