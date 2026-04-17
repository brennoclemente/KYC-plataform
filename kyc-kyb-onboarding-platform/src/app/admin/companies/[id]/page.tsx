import Link from 'next/link';
import CompanyDetail from '../../../../presentation/components/admin/CompanyDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-secondary">
        <Link href="/admin" className="hover:text-primary transition-colors">
          Painel Admin
        </Link>
        <span>/</span>
        <span className="text-text">Detalhe da Empresa</span>
      </div>

      <CompanyDetail companyId={id} />
    </div>
  );
}
