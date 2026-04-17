import CompanyList from '../../presentation/components/admin/CompanyList';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-secondary">Gerencie os processos de onboarding das empresas</p>
      </div>
      <CompanyList />
    </div>
  );
}
