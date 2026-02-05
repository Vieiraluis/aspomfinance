import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { Settings as SettingsIcon, Upload, Loader2, Building2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { user } = useAuth();
  const { settings, isLoading, saveSettings, isSaving } = useReceiptSettings();
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_document: '',
    company_phone: '',
    company_email: '',
    logo_url: '',
    header_text: '',
    footer_text: '',
    city: 'Rio de Janeiro',
  });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_document: settings.company_document || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        logo_url: settings.logo_url || '',
        header_text: settings.header_text || '',
        footer_text: settings.footer_text || '',
        city: settings.city || 'Rio de Janeiro',
      });
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create bucket if it doesn't exist (will fail silently if exists)
      await supabase.storage.createBucket('logos', { public: true });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      
      toast({
        title: 'Logo carregado!',
        description: 'A imagem foi enviada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar a imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalize as informações que aparecem nos recibos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações que serão exibidas no cabeçalho dos recibos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Ex: ASPOM - Associação..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_document">CNPJ/CPF</Label>
                  <Input
                    id="company_document"
                    name="company_document"
                    value={formData.company_document}
                    onChange={handleInputChange}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Endereço Completo</Label>
                <Textarea
                  id="company_address"
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro, cidade - UF, CEP"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Telefone</Label>
                  <Input
                    id="company_phone"
                    name="company_phone"
                    value={formData.company_phone}
                    onChange={handleInputChange}
                    placeholder="(21) 0000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_email">E-mail</Label>
                  <Input
                    id="company_email"
                    name="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade (para data do recibo)</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Rio de Janeiro"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Logo da Empresa
              </CardTitle>
              <CardDescription>
                Imagem que será exibida no topo do recibo (recomendado: 800x200px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                {formData.logo_url ? (
                  <div className="border rounded-lg p-2 bg-white">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo preview" 
                      className="max-h-24 max-w-xs object-contain"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 flex items-center justify-center bg-muted/30">
                    <span className="text-muted-foreground text-sm">Nenhum logo definido</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="logo_upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUploading ? 'Enviando...' : 'Enviar Logo'}</span>
                    </div>
                    <input
                      id="logo_upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PNG, JPG, WEBP
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Ou insira a URL da imagem</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Text Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Textos Adicionais
              </CardTitle>
              <CardDescription>
                Textos personalizados para o cabeçalho e rodapé do recibo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header_text">Texto do Cabeçalho (opcional)</Label>
                <Textarea
                  id="header_text"
                  name="header_text"
                  value={formData.header_text}
                  onChange={handleInputChange}
                  placeholder="Texto adicional que aparecerá abaixo do logo..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Texto do Rodapé (opcional)</Label>
                <Textarea
                  id="footer_text"
                  name="footer_text"
                  value={formData.footer_text}
                  onChange={handleInputChange}
                  placeholder="Texto que aparecerá no final do recibo..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default Settings;
