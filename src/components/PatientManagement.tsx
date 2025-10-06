import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { usePatients, Patient, NewPatient } from "../hooks/usePatients"; // Importar o hook e os tipos

// A interface foi movida para usePatients.ts, mas podemos redefinir ou ajustar se necessário.
// A interface do hook já usa snake_case, então vamos ajustar o componente para usar o mesmo.

interface PatientManagementProps {
  accessToken: string;
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const PatientManagement = ({
  accessToken, // accessToken e userRole podem não ser mais necessários se o RLS cuidar de tudo
  userRole,
  onNavigate,
}: PatientManagementProps) => {
  // Usar o nosso novo hook
  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    fetchPatients,
    createPatient: createPatientInDb,
  } = usePatients();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);
  const [isNewPatientOpen, setIsNewPatientOpen] =
    useState(false);

  // O hook useLoadingStates pode ser simplificado ou substituído pelo 'patientsLoading'
  const { isLoading, withLoading } = useLoadingStates();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { addToast } = useToast();

  // Form validation for new patient
  const {
    values: formValues,
    errors: formErrors,
    isValid: isFormValid,
    getFieldProps,
    resetForm,
    validateForm,
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
    {
      name: neokidsValidationRules.name,
      cpf: neokidsValidationRules.cpf,
      phone: neokidsValidationRules.phone,
      address: neokidsValidationRules.address,
      birthDate: neokidsValidationRules.birthDate,
      email: neokidsValidationRules.email,
      responsibleName: neokidsValidationRules.name,
      responsibleCpf: neokidsValidationRules.cpf,
      responsiblePhone: neokidsValidationRules.phone,
    },
  );

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
      name: formValues.name,
      birth_date: formValues.birthDate,
      cpf: formValues.cpf,
      phone: formValues.phone,
      email: formValues.email,
      address: formValues.address,
      responsible_name: formValues.responsibleName,
      responsible_cpf: formValues.responsibleCpf,
      responsible_phone: formValues.responsiblePhone,
      special_alert: formValues.specialAlert,
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

  // Input component with validation styling
  const ValidatedInput = ({
    field,
    label,
    type = "text",
    required = false,
    placeholder = "",
    ...props
  }: {
    field: string;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    [key: string]: any;
  }) => {
    const fieldProps = getFieldProps(field);
    const hasError = !!formErrors[field];

    return (
      <div className="space-y-2">
        <Label
          htmlFor={field}
          className="flex items-center space-x-1"
        >
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
          <Input
            id={field}
            type={type}
            placeholder={placeholder}
            className={cn(
              hasError && "border-red-500 focus:ring-red-500",
              fieldProps.value &&
                !hasError &&
                "border-green-500",
            )}
            {...fieldProps}
            {...props}
          />
          {fieldProps.value && !hasError && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
        {hasError && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertTriangle className="w-4 h-4" />
            <span>{formErrors[field]}</span>
          </p>
        )}
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Gestão de Pacientes
        </h2>

        <Dialog
          open={isNewPatientOpen}
          onOpenChange={setIsNewPatientOpen}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo paciente para
                cadastrá-lo no sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  field="name"
                  label="Nome Completo"
                  placeholder="Nome do paciente"
                  required
                />

                <ValidatedInput
                  field="birthDate"
                  label="Data de Nascimento"
                  type="date"
                  required
                />

                <ValidatedInput
                  field="cpf"
                  label="CPF"
                  placeholder="000.000.000-00"
                  required
                />

                <ValidatedInput
                  field="phone"
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <ValidatedInput
                field="email"
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
              />

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="flex items-center space-x-1"
                >
                  <span>Endereço Completo</span>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="address"
                    placeholder="Rua, número, bairro, cidade, CEP"
                    className={cn(
                      formErrors.address &&
                        "border-red-500 focus:ring-red-500",
                      formValues.address &&
                        !formErrors.address &&
                        "border-green-500",
                    )}
                    {...getFieldProps("address")}
                  />
                  {formValues.address &&
                    !formErrors.address && (
                      <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                    )}
                </div>
                {formErrors.address && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{formErrors.address}</span>
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  Dados do Responsável
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    field="responsibleName"
                    label="Nome do Responsável"
                    placeholder="Nome do responsável"
                    required
                  />

                  <ValidatedInput
                    field="responsibleCpf"
                    label="CPF do Responsável"
                    placeholder="000.000.000-00"
                    required
                  />

                  <div className="md:col-span-2">
                    <ValidatedInput
                      field="responsiblePhone"
                      label="Telefone do Responsável"
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialAlert">
                  Alertas Especiais
                </Label>
                <Textarea
                  id="specialAlert"
                  placeholder="Alergias, condições especiais, observações importantes..."
                  {...getFieldProps("specialAlert")}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewPatientOpen(false);
                    resetForm();
                  }}
                  disabled={patientsLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePatient} // Usar a nova função
                  disabled={patientsLoading || !isFormValid}
                  className="min-w-[120px]"
                >
                  {patientsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Paciente"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Histórico
                  </Button>
                  <Button variant="outline" size="sm">
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