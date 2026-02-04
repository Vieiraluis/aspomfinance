import { useState, useEffect } from 'react';
import { useDataMigration } from '@/hooks/useDataMigration';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, CloudUpload, X, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const MigrationBanner = () => {
  const { user } = useAuth();
  const { 
    hasLocalData, 
    getLocalDataSummary, 
    migrateData, 
    clearLocalData,
    isMigrating, 
    migrationProgress 
  } = useDataMigration();
  
  const [showBanner, setShowBanner] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof getLocalDataSummary>>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (user && hasLocalData()) {
      setShowBanner(true);
      setSummary(getLocalDataSummary());
    } else {
      setShowBanner(false);
    }
  }, [user]);

  const handleMigrate = async () => {
    const success = await migrateData();
    if (success) {
      setMigrationComplete(true);
      setTimeout(() => {
        clearLocalData();
        setShowBanner(false);
      }, 3000);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Alert className="mb-4 border-primary/50 bg-primary/5">
      <Database className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Dados locais encontrados</span>
        {!isMigrating && !migrationComplete && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {migrationComplete ? (
          <div className="flex items-center gap-2 text-success">
            <Check className="h-4 w-4" />
            Migração concluída com sucesso! Seus dados agora estão sincronizados na nuvem.
          </div>
        ) : isMigrating ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Migrando dados para a nuvem...
            </p>
            <Progress value={migrationProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {migrationProgress}%
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Encontramos dados salvos no seu navegador. Deseja migrar para a nuvem para acessar de qualquer dispositivo?
            </p>
            {summary && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {summary.suppliers > 0 && (
                  <span className="bg-muted px-2 py-1 rounded">{summary.suppliers} fornecedores</span>
                )}
                {summary.bankAccounts > 0 && (
                  <span className="bg-muted px-2 py-1 rounded">{summary.bankAccounts} contas bancárias</span>
                )}
                {summary.accounts > 0 && (
                  <span className="bg-muted px-2 py-1 rounded">{summary.accounts} contas a pagar/receber</span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleMigrate} className="gap-2">
                <CloudUpload className="h-4 w-4" />
                Migrar para a nuvem
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Ignorar
              </Button>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
