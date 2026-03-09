import { format } from 'date-fns';

interface Props { employee: any; }

export function TabGeneralInfo({ employee }: Props) {
  const formatDate = (d: string | null) => d ? format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy') : '—';
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const sections = [
    { title: 'Dados Pessoais', items: [
      { label: 'CPF', value: employee.cpf },
      { label: 'RG', value: employee.rg },
      { label: 'Nascimento', value: formatDate(employee.birth_date) },
      { label: 'Telefone', value: employee.phone },
      { label: 'E-mail', value: employee.email },
    ]},
    { title: 'Endereço', items: [
      { label: 'CEP', value: employee.address_cep },
      { label: 'Rua', value: [employee.address_street, employee.address_number].filter(Boolean).join(', ') },
      { label: 'Complemento', value: employee.address_complement },
      { label: 'Bairro', value: employee.address_neighborhood },
      { label: 'Cidade/UF', value: [employee.address_city, employee.address_state].filter(Boolean).join('/') },
    ]},
    { title: 'Dados Contratuais', items: [
      { label: 'Admissão', value: formatDate(employee.admission_date) },
      { label: 'Salário', value: formatCurrency(Number(employee.salary) || 0) },
      { label: 'Cargo', value: employee.position },
      { label: 'Departamento', value: employee.department },
    ]},
    { title: 'Dados Bancários', items: [
      { label: 'Banco', value: employee.bank_name },
      { label: 'Agência', value: employee.bank_agency },
      { label: 'Conta', value: employee.bank_account },
    ]},
  ];

  return (
    <div className="space-y-6 py-2">
      {sections.map(section => (
        <div key={section.title}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{section.title}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {section.items.map(item => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
