import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, // Importar o componente que faltava
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  LoadingSpinner,
  LoadingCard,
} from "./ui/loading-spinner";
import { useToast } from "./ui/simple-toast";
import { useDebounce } from "../hooks/useDebounce";
import { useLoadingStates } from "../hooks/useLoadingStates";
import {
  useFormValidation,
  neokidsValidationRules,
  ValidationErrors,
} from "../hooks/useFormValidation";
import { cn } from "./ui/utils";
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  Edit,
  Eye,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { usePatients, Patient, NewPatient, UpdatePatient } from "../hooks/usePatients";
import { PatientHistory } from './PatientHistory';
import { useIsMobile } from "../hooks/useIsMobile";

// = aprimorada para garantir que o conteúdo seja sempre rolável e ocupe a tela inteira em dispositivos móveis
// ====================================================================
// Componentes de Formulário Estáveis (Definições Corrigidas)
// ====================================================================

// A interface agora reflete as props diretas que o componente recebe
interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  label: string;
  error?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const ValidatedInput = React.memo(({ label, required, error, ...props }: ValidatedInputProps) => {
  const hasError = !!error;
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="flex items-center space-x-1">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          className={cn(
            hasError && "border-red-500 focus:ring-red-500",
            props.value && !hasError && "border-green-500"
          )}
          {...props}
        />
        {props.value && !hasError && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
      </div>
      {hasError && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
    label: string;
    error?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const ValidatedTextarea = React.memo(({ label, required, error, ...props }: ValidatedTextareaProps) => {
    const hasError = !!error;
    return (
        <div className="space-y-2">
            <Label htmlFor={props.id} className="flex items-center space-x-1">
                <span>{label}</span>
                {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
                <Textarea
                    className={cn(
                        hasError && "border-red-500 focus:ring-red-500",
                        props.value && !hasError && "border-green-500"
                    )}
                    {...props}
                />
                {props.value && !hasError && (
                    <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                )}
            </div>
            {hasError && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
});


// ====================================================================
// Componente do Formulário (Extraído para Performance)
// ====================================================================
interface PatientFormProps {
  isEditing: boolean;
  values: Record<string, string>;
  errors: ValidationErrors;
  isValid: boolean;
  patientsLoading: boolean;
  setValue: (field: string, value: string) => void;
  handleBlur: (field: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const PatientForm = React.memo(({
  isEditing,
  values,
  errors,
  isValid,
  patientsLoading,
  setValue,
  handleBlur,
  onSubmit,
  onCancel,
}: PatientFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          id="name"
          label="Nome Completo"
          placeholder="Nome do paciente"
          required
          value={values.name}
          onChange={e => setValue("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          error={errors.name}
        />
        <ValidatedInput
          id="birthDate"
          label="Data de Nascimento"
          type="date"
          required
          value={values.birthDate}
          onChange={e => setValue("birthDate", e.target.value)}
          onBlur={() => handleBlur("birthDate")}
          error={errors.birthDate}
        />
        <ValidatedInput
          id="cpf"
          label="CPF"
          placeholder="000.000.000-00"
          required
          value={values.cpf}
          onChange={e => setValue("cpf", e.target.value)}
          onBlur={() => handleBlur("cpf")}
          error={errors.cpf}
        />
        <ValidatedInput
          id="phone"
          label="Telefone"
          placeholder="(11) 99999-9999"
          required
          value={values.phone}
          onChange={e => setValue("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          error={errors.phone}
        />
      </div>

      <ValidatedInput
        id="email"
        label="Email"
        type="email"
        placeholder="email@exemplo.com"
        value={values.email}
        onChange={e => setValue("email", e.target.value)}
        onBlur={() => handleBlur("email")}
        error={errors.email}
      />

      <ValidatedTextarea
        id="address"
        label="Endereço Completo"
        placeholder="Rua, número, bairro, cidade, CEP"
        required
        value={values.address}
        onChange={e => setValue("address", e.target.value)}
        onBlur={() => handleBlur("address")}
        error={errors.address}
      />

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-4">
          Dados do Responsável
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedInput
            id="responsibleName"
            label="Nome do Responsável"
            placeholder="Nome do responsável"
            required
            value={values.responsibleName}
            onChange={e => setValue("responsibleName", e.target.value)}
            onBlur={() => handleBlur("responsibleName")}
            error={errors.responsibleName}
          />
          <ValidatedInput
            id="responsibleCpf"
            label="CPF do Responsável"
            placeholder="000.000.000-00"
            required
            value={values.responsibleCpf}
            onChange={e => setValue("responsibleCpf", e.target.value)}
            onBlur={() => handleBlur("responsibleCpf")}
            error={errors.responsibleCpf}
          />
          <div className="md:col-span-2">
            <ValidatedInput
              id="responsiblePhone"
              label="Telefone do Responsável"
              placeholder="(11) 99999-9999"
              required
              value={values.responsiblePhone}
              onChange={e => setValue("responsiblePhone", e.target.value)}
              onBlur={() => handleBlur("responsiblePhone")}
              error={errors.responsiblePhone}
            />
          </div>
        </div>
      </div>

      <ValidatedTextarea
        id="specialAlert"
        label="Alertas Especiais"
        placeholder="Alergias, condições especiais, observações importantes..."
        value={values.specialAlert}
        onChange={e => setValue("specialAlert", e.target.value)}
        onBlur={() => handleBlur("specialAlert")}
        error={errors.specialAlert}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={patientsLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={patientsLoading || !isValid}
          className="min-w-[120px]"
        >
          {patientsLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Salvando..." : "Criando..."}
            </>
          ) : (
            isEditing ? "Salvar Alterações" : "Criar Paciente"
          )}
        </Button>
      </div>
    </div>
  );
});


// ====================================================================
// Componente Principal
// ====================================================================

interface PatientManagementProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const PatientManagement = ({
  userRole,
  onNavigate,
}: PatientManagementProps) => {
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'history'>('list'); // Estado para controlar a visualização
  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    fetchPatients,
    createPatient: createPatientInDb,
    updatePatient: updatePatientInDb, // Importar a função de update
  } = usePatients();

  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);

  // O hook useLoadingStates pode ser simplificado ou substituído pelo 'patientsLoading'
  const { isLoading, withLoading } = useLoadingStates();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { addToast } = useToast();

  // Form validation for new patient
  const {
    values,
    errors,
    isValid,
    setValue,
    handleBlur,
    validateForm,
    resetForm,
  } = useFormValidation(
    {
      name: "",
      birthDate: "",
      cpf: "",
      phone: "",
      email: "",
      address: "",
      responsibleName: "",
      responsibleCpf: "",
      responsiblePhone: "",
      specialAlert: "",
    },
    neokidsValidationRules
  );

  // Efeito para limpar o formulário ao abrir o modal de novo paciente
  useEffect(() => {
    if (isNewPatientOpen) {
      resetForm();
    }
  }, [isNewPatientOpen, resetForm]);

  // Efeito para preencher o formulário ao abrir o modo de edição
  useEffect(() => {
    if (view === 'edit' && editingPatient) {
      setValue("name", editingPatient.name);
      setValue("birthDate", editingPatient.birth_date);
      setValue("cpf", editingPatient.cpf);
      setValue("phone", editingPatient.phone);
      setValue("email", editingPatient.email || "");
      setValue("address", editingPatient.address);
      setValue("responsibleName", editingPatient.responsible_name);
      setValue("responsibleCpf", editingPatient.responsible_cpf);
      setValue("responsiblePhone", editingPatient.responsible_phone);
      setValue("specialAlert", editingPatient.special_alert || "");
    }
  }, [view, editingPatient, setValue]);

  // Efeito de busca refatorado
  useEffect(() => {
    fetchPatients(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchPatients]);

  // Função de criar paciente refatorada
  const handleCreatePatient = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      addToast({
        type: "error",
        title: "Erro no formulário",
        description: "Por favor, corrija os erros no formulário",
      });
      return;
    }

    addToast({
      type: "info",
      title: "Cadastrando paciente...",
    });

    // Mapear os nomes dos campos do formulário (camelCase) para os nomes das colunas do DB (snake_case)
    const newPatientData: NewPatient = {
      name: values.name,
      birth_date: values.birthDate,
      cpf: values.cpf,
      phone: values.phone,
      email: values.email,
      address: values.address,
      responsible_name: values.responsibleName,
      responsible_cpf: values.responsibleCpf,
      responsible_phone: values.responsiblePhone,
      special_alert: values.specialAlert,
    };

    const newPatient = await createPatientInDb(newPatientData);

    if (newPatient) {
      setIsNewPatientOpen(false);
      resetForm();
      addToast({
        type: "success",
        title: "Paciente cadastrado",
        description: `${newPatient.name} foi cadastrado com sucesso!`,
      });
    } else {
      addToast({
        type: "error",
        title: "Erro ao cadastrar paciente",
        description: patientsError?.message || "Ocorreu um erro. Tente novamente.",
      });
    }
  };

  // Função para ATUALIZAR um paciente
  const handleUpdatePatient = async () => {
    if (!editingPatient) return;

    const isValid = await validateForm();
    if (!isValid) {
      addToast({
        type: "error",
        title: "Erro no formulário",
        description: "Por favor, corrija os erros no formulário",
      });
      return;
    }

    addToast({
      type: "info",
      title: "Atualizando paciente...",
    });

    const updatedPatientData: UpdatePatient = {
      name: values.name,
      birth_date: values.birthDate,
      cpf: values.cpf,
      phone: values.phone,
      email: values.email,
      address: values.address,
      responsible_name: values.responsibleName,
      responsible_cpf: values.responsibleCpf,
      responsible_phone: values.responsiblePhone,
      special_alert: values.specialAlert,
    };

    const updatedPatient = await updatePatientInDb(editingPatient.id, updatedPatientData);

    if (updatedPatient) {
      setIsEditPatientOpen(false);
      setEditingPatient(null);
      resetForm();
      addToast({
        type: "success",
        title: "Paciente atualizado",
        description: `${updatedPatient.name} foi atualizado com sucesso!`,
      });
    } else {
      addToast({
        type: "error",
        title: "Erro ao atualizar paciente",
        description: patientsError?.message || "Ocorreu um erro. Tente novamente.",
      });
    }
  };

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setView('edit');
  };

  const handleOpenHistoryModal = (patient: Patient) => {
    setHistoryPatient(patient);
    setView('history');
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingPatient(null);
    setHistoryPatient(null);
    resetForm();
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;

    if (age === 0) {
      return `${months} ${months === 1 ? "mês" : "meses"}`;
    } else if (age < 2) {
      return `${age} ano${age > 1 ? "s" : ""} ${months > 0 ? `, ${months} ${months === 1 ? "mês" : "meses"}` : ""}`;
    } else {
      return `${age} anos`;
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4",
    );
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  if (view === 'new' || view === 'edit') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{view === 'new' ? 'Cadastrar Novo Paciente' : 'Editar Paciente'}</CardTitle>
          <CardDescription>
            {view === 'new' ? 'Preencha os dados do novo paciente.' : 'Altere os dados do paciente.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm 
            isEditing={view === 'edit'}
            values={values}
            errors={errors}
            isValid={isValid}
            patientsLoading={patientsLoading}
            setValue={setValue}
            handleBlur={field => handleBlur(field)}
            onSubmit={view === 'new' ? handleCreatePatient : handleUpdatePatient}
            onCancel={handleCancelForm}
          />
        </CardContent>
      </Card>
    );
  }

  if (view === 'history' && historyPatient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{`Histórico de ${historyPatient.name}`}</CardTitle>
          <CardDescription>Lista de todos os atendimentos anteriores do paciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientHistory patientId={historyPatient.id} patientName={historyPatient.name} />
          <Button variant="outline" className="mt-4" onClick={handleCancelForm}>Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Gestão de Pacientes
        </h2>
        <Button className="flex items-center space-x-2" onClick={() => setView('new')}>
          <Plus className="w-4 h-4" />
          <span>Novo Paciente</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Busca Inteligente de Pacientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              className="pl-10"
              placeholder="Buscar por nome, CPF, telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            {searchQuery.length > 0 &&
              searchQuery.length < 2 && (
                <p className="text-sm text-gray-500">
                  Digite pelo menos 2 caracteres para buscar
                </p>
              )}
            {patientsLoading && ( // Usar o estado de loading do hook
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Buscando...</span>
              </div>
            )}
            {debouncedSearchQuery.length >= 2 &&
              !patientsLoading && ( // Usar o estado de loading do hook
                <p className="text-sm text-gray-500">
                  {patients.length}{" "}
                  {patients.length === 1
                    ? "resultado encontrado"
                    : "resultados encontrados"}
                </p>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {patientsLoading && ( // Usar o estado de loading do hook
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      )}

      {patients.length > 0 && !patientsLoading && ( // Usar o estado de loading do hook
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {patients.map((patient) => (
            <Card
              key={patient.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {calculateAge(patient.birth_date)} • {/* Ajustar para snake_case */}
                        {formatCPF(patient.cpf)}
                      </p>
                    </div>
                  </div>

                  {patient.special_alert && ( /* Ajustar para snake_case */
                    <Badge
                      variant="destructive"
                      className="flex items-center space-x-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Alerta</span>
                    </Badge>
                  )}
                </div>

                {patient.special_alert && ( /* Ajustar para snake_case */
                  <Alert className="mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      {patient.special_alert} {/* Ajustar para snake_case */}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{formatPhone(patient.phone)}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {patient.address}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    Responsável:
                  </p>
                  <p className="font-medium">
                    {patient.responsible_name} {/* Ajustar para snake_case */}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPhone(patient.responsible_phone)} • {/* Ajustar para snake_case */}
                    {formatCPF(patient.responsible_cpf)} {/* Ajustar para snake_case */}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleOpenHistoryModal(patient)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Histórico
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(patient)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {debouncedSearchQuery.length >= 2 &&
        patients.length === 0 &&
        !patientsLoading && ( // Usar o estado de loading do hook
          <Card>
            <CardContent className="p-6 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhum paciente encontrado
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Tente buscar com outros termos ou cadastre um
                novo paciente
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};