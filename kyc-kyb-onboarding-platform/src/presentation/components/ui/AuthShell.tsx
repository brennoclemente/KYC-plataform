import Link from 'next/link';
import Image from 'next/image';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  appName?: string;
  logoUrl?: string | null;
}

export default function AuthShell({ children, title, subtitle, appName = 'KYC/KYB Platform', logoUrl }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt={appName} width={100} height={28} className="h-7 w-auto object-contain" />
            ) : (
              <span className="font-semibold text-text">{appName}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-secondary">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-secondary/60">
        © {new Date().getFullYear()} {appName}
      </footer>
    </div>
  );
}
