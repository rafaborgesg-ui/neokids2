import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Auth middleware
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (!accessToken) {
    return c.json({ error: 'Token de acesso não fornecido' }, 401)
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user?.id) {
    return c.json({ error: 'Token inválido ou expirado' }, 401)
  }
  
  c.set('userId', user.id)
  c.set('userEmail', user.email)
  await next()
}

// Auth routes
app.post('/make-server-f78aeac5/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    })
    
    if (error) {
      console.log('Erro ao criar usuário:', error)
      return c.json({ error: error.message }, 400)
    }
    
    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Erro no signup:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Initialize demo users
app.post('/make-server-f78aeac5/init-demo', async (c) => {
  try {
    const demoUsers = [
      {
        email: 'admin@neokids.com',
        password: 'admin123',
        name: 'Administrador Neokids',
        role: 'administrador'
      },
      {
        email: 'atendente@neokids.com',
        password: 'atendente123',
        name: 'Maria Silva',
        role: 'atendente'
      },
      {
        email: 'tecnico@neokids.com',
        password: 'tecnico123',
        name: 'João Santos',
        role: 'tecnico'
      }
    ]
    
    const results = []
    
    for (const user of demoUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: { name: user.name, role: user.role },
        email_confirm: true
      })
      
      if (error && !error.message.includes('already exists')) {
        console.log(`Erro ao criar usuário ${user.email}:`, error)
      } else {
        results.push({ email: user.email, success: true })
      }
    }
    
    // Create demo services
    const demoServices = [
      {
        name: 'Hemograma Completo',
        category: 'Análises Clínicas',
        code: 'HG001',
        basePrice: 45.00,
        operationalCost: 12.00,
        estimatedTime: '2-4 horas',
        instructions: 'Não é necessário jejum. Evitar exercícios físicos intensos 24h antes.'
      },
      {
        name: 'Glicemia de Jejum',
        category: 'Análises Clínicas',
        code: 'GL001',
        basePrice: 25.00,
        operationalCost: 6.00,
        estimatedTime: '2 horas',
        instructions: 'Jejum de 8 a 12 horas. Apenas água é permitida.'
      },
      {
        name: 'Radiografia de Tórax',
        category: 'Exames de Imagem',
        code: 'RX001',
        basePrice: 120.00,
        operationalCost: 35.00,
        estimatedTime: '30 minutos',
        instructions: 'Remover objetos metálicos. Evitar roupas com metais.'
      },
      {
        name: 'Ultrassom Abdominal',
        category: 'Exames de Imagem',
        code: 'US001',
        basePrice: 180.00,
        operationalCost: 50.00,
        estimatedTime: '24 horas',
        instructions: 'Jejum de 8 horas. Beber 4 copos de água 1 hora antes do exame.'
      },
      {
        name: 'Vacina Tríplice Viral',
        category: 'Vacinas',
        code: 'VT001',
        basePrice: 85.00,
        operationalCost: 65.00,
        estimatedTime: 'Imediato',
        instructions: 'Criança deve estar saudável. Informar sobre alergias.'
      }
    ]
    
    for (const service of demoServices) {
      const serviceId = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await kv.set(`service:${serviceId}`, {
        id: serviceId,
        ...service,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      })
    }
    
    // Create demo patient
    const demoPatient = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Ana Clara Silva',
      birthDate: '2018-03-15',
      cpf: '12345678901',
      phone: '11987654321',
      email: 'ana.clara@email.com',
      address: 'Rua das Flores, 123, Vila Nova, São Paulo, SP - 01234-567',
      responsibleName: 'Maria Silva Santos',
      responsibleCpf: '98765432100',
      responsiblePhone: '11987654321',
      specialAlert: 'Alergia a penicilina',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }
    
    await kv.set(`patient:${demoPatient.id}`, demoPatient)
    await kv.set(`patient_search:${demoPatient.cpf}`, demoPatient.id)
    
    // Create demo appointment
    const demoAppointmentId = `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const demoSampleIds = [
      `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      `sample_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`
    ]
    
    const demoAppointment = {
      id: demoAppointmentId,
      patientId: demoPatient.id,
      patientName: demoPatient.name,
      services: [
        {
          id: `service_${Date.now()}_1`,
          name: 'Hemograma Completo',
          code: 'HG001',
          basePrice: 45.00,
          finalPrice: 45.00
        },
        {
          id: `service_${Date.now()}_2`,
          name: 'Glicemia de Jejum',
          code: 'GL001',
          basePrice: 25.00,
          finalPrice: 25.00
        }
      ],
      sampleIds: demoSampleIds,
      totalAmount: 70.00,
      status: 'Em Análise',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }
    
    await kv.set(`appointment:${demoAppointmentId}`, demoAppointment)
    
    // Create demo exam results
    for (let i = 0; i < demoSampleIds.length; i++) {
      const examResultId = `exam_result_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`
      await kv.set(`exam_result:${examResultId}`, {
        id: examResultId,
        appointmentId: demoAppointmentId,
        patientName: demoPatient.name,
        patientId: demoPatient.id,
        serviceId: demoAppointment.services[i].id,
        serviceName: demoAppointment.services[i].name,
        serviceCode: demoAppointment.services[i].code,
        sampleId: demoSampleIds[i],
        status: 'pending',
        resultType: 'numeric',
        results: {
          values: [],
          observation: '',
          conclusion: '',
          files: []
        },
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      })
    }
    
    // Create demo print templates
    const demoTemplates = [
      {
        id: `template_${Date.now()}_1`,
        name: 'Etiqueta de Amostra - Pequena',
        type: 'label',
        format: 'label-small',
        template: '{{patientName}}\n{{sampleId}}\n{{serviceName}}',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: `template_${Date.now()}_2`,
        name: 'Comprovante de Atendimento',
        type: 'receipt',
        format: 'thermal',
        template: 'NEOKIDS CLÍNICA\n{{patientName}}\nTotal: {{totalAmount}}',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]
    
    for (const template of demoTemplates) {
      await kv.set(`print_template:${template.id}`, template)
    }
    
    // Create demo audit entries
    const demoAuditEntries = [
      {
        id: `audit_${Date.now()}_1`,
        timestamp: new Date().toISOString(),
        userId: 'demo-user',
        userEmail: 'admin@neokids.com',
        userName: 'Administrador Neokids',
        userRole: 'administrador',
        action: 'create',
        resource: 'patient',
        resourceId: demoPatient.id,
        details: { operation: 'patient_creation' },
        status: 'success',
        severity: 'low',
        ipAddress: '127.0.0.1',
        userAgent: 'Neokids App',
        sessionId: 'demo-session'
      },
      {
        id: `audit_${Date.now()}_2`,
        timestamp: new Date().toISOString(),
        userId: 'demo-user',
        userEmail: 'admin@neokids.com',
        userName: 'Administrador Neokids',
        userRole: 'administrador',
        action: 'create',
        resource: 'appointment',
        resourceId: demoAppointmentId,
        details: { operation: 'appointment_creation' },
        status: 'success',
        severity: 'medium',
        ipAddress: '127.0.0.1',
        userAgent: 'Neokids App',
        sessionId: 'demo-session'
      }
    ]
    
    for (const auditEntry of demoAuditEntries) {
      await kv.set(`audit:${auditEntry.id}`, auditEntry)
    }
    
    return c.json({ 
      success: true, 
      message: 'Dados de demonstração criados com sucesso',
      users: results.length,
      services: demoServices.length,
      patients: 1,
      appointments: 1,
      examResults: demoSampleIds.length,
      templates: demoTemplates.length,
      auditEntries: demoAuditEntries.length
    })
  } catch (error) {
    console.log('Erro ao inicializar demo:', error)
    return c.json({ error: 'Erro ao inicializar dados de demonstração' }, 500)
  }
})

// Patient routes
app.post('/make-server-f78aeac5/patients', requireAuth, async (c) => {
  try {
    const patientData = await c.req.json()
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const patient = {
      id: patientId,
      ...patientData,
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }
    
    await kv.set(`patient:${patientId}`, patient)
    await kv.set(`patient_search:${patientData.cpf}`, patientId)
    
    return c.json({ success: true, patient })
  } catch (error) {
    console.log('Erro ao criar paciente:', error)
    return c.json({ error: 'Erro ao criar paciente' }, 500)
  }
})

app.get('/make-server-f78aeac5/patients/search', requireAuth, async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase() || ''
    
    const allPatients = await kv.getByPrefix('patient:')
    const filteredPatients = allPatients.filter(({ value }: any) => {
      if (!value || typeof value !== 'object') return false
      
      const searchableText = [
        value.name,
        value.cpf,
        value.responsibleName,
        value.phone
      ].join(' ').toLowerCase()
      
      return searchableText.includes(query)
    }).map(({ value }: any) => value)
    
    return c.json({ patients: filteredPatients })
  } catch (error) {
    console.log('Erro na busca de pacientes:', error)
    return c.json({ error: 'Erro na busca de pacientes' }, 500)
  }
})

app.get('/make-server-f78aeac5/patients/:id', requireAuth, async (c) => {
  try {
    const patientId = c.req.param('id')
    const patient = await kv.get(`patient:${patientId}`)
    
    if (!patient) {
      return c.json({ error: 'Paciente não encontrado' }, 404)
    }
    
    return c.json({ patient })
  } catch (error) {
    console.log('Erro ao buscar paciente:', error)
    return c.json({ error: 'Erro ao buscar paciente' }, 500)
  }
})

// Services routes
app.post('/make-server-f78aeac5/services', requireAuth, async (c) => {
  try {
    const serviceData = await c.req.json()
    const serviceId = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const service = {
      id: serviceId,
      ...serviceData,
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }
    
    await kv.set(`service:${serviceId}`, service)
    
    return c.json({ success: true, service })
  } catch (error) {
    console.log('Erro ao criar serviço:', error)
    return c.json({ error: 'Erro ao criar serviço' }, 500)
  }
})

app.get('/make-server-f78aeac5/services', requireAuth, async (c) => {
  try {
    const services = await kv.getByPrefix('service:')
    const serviceList = services.map(({ value }: any) => value).filter(Boolean)
    
    return c.json({ services: serviceList })
  } catch (error) {
    console.log('Erro ao buscar serviços:', error)
    return c.json({ error: 'Erro ao buscar serviços' }, 500)
  }
})

// Appointments routes
app.post('/make-server-f78aeac5/appointments', requireAuth, async (c) => {
  try {
    const appointmentData = await c.req.json()
    const appointmentId = `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate sample IDs for each service
    const sampleIds = appointmentData.services.map(() => 
      `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    )
    
    const appointment = {
      id: appointmentId,
      ...appointmentData,
      sampleIds,
      status: 'Aguardando Coleta',
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }
    
    await kv.set(`appointment:${appointmentId}`, appointment)
    
    // Create samples tracking and exam results
    sampleIds.forEach(async (sampleId, index) => {
      await kv.set(`sample:${sampleId}`, {
        id: sampleId,
        appointmentId,
        serviceId: appointmentData.services[index].id,
        status: 'Aguardando Coleta',
        createdAt: new Date().toISOString()
      })
      
      // Create exam result for each service
      const examResultId = `exam_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await kv.set(`exam_result:${examResultId}`, {
        id: examResultId,
        appointmentId,
        patientName: appointmentData.patientName,
        patientId: appointmentData.patientId,
        serviceId: appointmentData.services[index].id,
        serviceName: appointmentData.services[index].name,
        serviceCode: appointmentData.services[index].code,
        sampleId,
        status: 'pending',
        resultType: 'numeric',
        results: {
          values: [],
          observation: '',
          conclusion: '',
          files: []
        },
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId')
      })
    })
    
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('Erro ao criar atendimento:', error)
    return c.json({ error: 'Erro ao criar atendimento' }, 500)
  }
})

app.get('/make-server-f78aeac5/appointments', requireAuth, async (c) => {
  try {
    const appointments = await kv.getByPrefix('appointment:')
    const appointmentList = appointments.map(({ value }: any) => value).filter(Boolean)
    
    return c.json({ appointments: appointmentList })
  } catch (error) {
    console.log('Erro ao buscar atendimentos:', error)
    return c.json({ error: 'Erro ao buscar atendimentos' }, 500)
  }
})

app.patch('/make-server-f78aeac5/appointments/:id/status', requireAuth, async (c) => {
  try {
    const appointmentId = c.req.param('id')
    const { status } = await c.req.json()
    
    const appointment = await kv.get(`appointment:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Atendimento não encontrado' }, 404)
    }
    
    const updatedAppointment = {
      ...appointment,
      status,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`appointment:${appointmentId}`, updatedAppointment)
    
    return c.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.log('Erro ao atualizar status:', error)
    return c.json({ error: 'Erro ao atualizar status' }, 500)
  }
})

// Exam Results routes
app.get('/make-server-f78aeac5/exam-results', requireAuth, async (c) => {
  try {
    const examResults = await kv.getByPrefix('exam_result:')
    const resultList = examResults.map(({ value }: any) => value).filter(Boolean)
    
    return c.json({ examResults: resultList })
  } catch (error) {
    console.log('Erro ao buscar resultados de exames:', error)
    return c.json({ error: 'Erro ao buscar resultados de exames' }, 500)
  }
})

app.patch('/make-server-f78aeac5/exam-results/:id', requireAuth, async (c) => {
  try {
    const resultId = c.req.param('id')
    const updateData = await c.req.json()
    
    const existingResult = await kv.get(`exam_result:${resultId}`)
    if (!existingResult) {
      return c.json({ error: 'Resultado não encontrado' }, 404)
    }
    
    const updatedResult = {
      ...existingResult,
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: c.get('userId')
    }
    
    await kv.set(`exam_result:${resultId}`, updatedResult)
    
    return c.json({ success: true, examResult: updatedResult })
  } catch (error) {
    console.log('Erro ao atualizar resultado:', error)
    return c.json({ error: 'Erro ao atualizar resultado' }, 500)
  }
})

app.patch('/make-server-f78aeac5/exam-results/:id/validate', requireAuth, async (c) => {
  try {
    const resultId = c.req.param('id')
    const userId = c.get('userId')
    const userEmail = c.get('userEmail')
    
    const existingResult = await kv.get(`exam_result:${resultId}`)
    if (!existingResult) {
      return c.json({ error: 'Resultado não encontrado' }, 404)
    }
    
    const updatedResult = {
      ...existingResult,
      status: 'validated',
      validatedBy: userEmail,
      validatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }
    
    await kv.set(`exam_result:${resultId}`, updatedResult)
    
    return c.json({ success: true, examResult: updatedResult })
  } catch (error) {
    console.log('Erro ao validar resultado:', error)
    return c.json({ error: 'Erro ao validar resultado' }, 500)
  }
})

app.patch('/make-server-f78aeac5/exam-results/:id/release', requireAuth, async (c) => {
  try {
    const resultId = c.req.param('id')
    const userId = c.get('userId')
    
    const existingResult = await kv.get(`exam_result:${resultId}`)
    if (!existingResult) {
      return c.json({ error: 'Resultado não encontrado' }, 404)
    }
    
    const updatedResult = {
      ...existingResult,
      status: 'released',
      releasedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }
    
    await kv.set(`exam_result:${resultId}`, updatedResult)
    
    return c.json({ success: true, examResult: updatedResult })
  } catch (error) {
    console.log('Erro ao liberar resultado:', error)
    return c.json({ error: 'Erro ao liberar resultado' }, 500)
  }
})

// Audit logging helper function
async function logAuditEvent(userId: string, userEmail: string, action: string, resource: string, resourceId: string, details: any = {}, severity: string = 'low') {
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      userName: userEmail.split('@')[0], // Extract name from email for demo
      userRole: 'user', // Would be extracted from user metadata in real app
      action,
      resource,
      resourceId,
      details,
      status: 'success',
      severity,
      ipAddress: '127.0.0.1', // Would be extracted from request in real app
      userAgent: 'Neokids App', // Would be extracted from request headers
      sessionId: `session_${userId}_${Date.now()}`
    })
  } catch (error) {
    console.log('Erro ao registrar evento de auditoria:', error)
  }
}

// Print System routes
app.get('/make-server-f78aeac5/print/jobs', requireAuth, async (c) => {
  try {
    const printJobs = await kv.getByPrefix('print_job:')
    const jobList = printJobs.map(({ value }: any) => value).filter(Boolean)
    
    // Sort by creation date descending
    jobList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return c.json({ printJobs: jobList })
  } catch (error) {
    console.log('Erro ao buscar jobs de impressão:', error)
    return c.json({ error: 'Erro ao buscar jobs de impressão' }, 500)
  }
})

app.post('/make-server-f78aeac5/print/jobs', requireAuth, async (c) => {
  try {
    const jobData = await c.req.json()
    const jobId = `print_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const printJob = {
      id: jobId,
      status: 'pending',
      priority: 'normal',
      copies: 1,
      format: 'A4',
      ...jobData,
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }
    
    await kv.set(`print_job:${jobId}`, printJob)
    
    return c.json({ success: true, printJob })
  } catch (error) {
    console.log('Erro ao criar job de impressão:', error)
    return c.json({ error: 'Erro ao criar job de impressão' }, 500)
  }
})

app.post('/make-server-f78aeac5/print/jobs/:id/print', requireAuth, async (c) => {
  try {
    const jobId = c.req.param('id')
    
    const existingJob = await kv.get(`print_job:${jobId}`)
    if (!existingJob) {
      return c.json({ error: 'Job de impressão não encontrado' }, 404)
    }
    
    // Simulate printing process
    const updatedJob = {
      ...existingJob,
      status: 'completed',
      printedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: c.get('userId')
    }
    
    await kv.set(`print_job:${jobId}`, updatedJob)
    
    return c.json({ success: true, printJob: updatedJob })
  } catch (error) {
    console.log('Erro ao imprimir job:', error)
    return c.json({ error: 'Erro ao imprimir job' }, 500)
  }
})

app.get('/make-server-f78aeac5/print/templates', requireAuth, async (c) => {
  try {
    const templates = await kv.getByPrefix('print_template:')
    const templateList = templates.map(({ value }: any) => value).filter(Boolean)
    
    return c.json({ templates: templateList })
  } catch (error) {
    console.log('Erro ao buscar templates:', error)
    return c.json({ error: 'Erro ao buscar templates' }, 500)
  }
})

// Audit routes
app.get('/make-server-f78aeac5/audit/log', requireAuth, async (c) => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    
    const auditEntries = await kv.getByPrefix('audit:')
    let filteredEntries = auditEntries.map(({ value }: any) => value).filter(Boolean)
    
    if (startDate && endDate) {
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = entry.timestamp.split('T')[0]
        return entryDate >= startDate && entryDate <= endDate
      })
    }
    
    // Sort by timestamp descending
    filteredEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return c.json({ auditEntries: filteredEntries })
  } catch (error) {
    console.log('Erro ao buscar log de auditoria:', error)
    return c.json({ error: 'Erro ao buscar log de auditoria' }, 500)
  }
})

app.post('/make-server-f78aeac5/audit/export', requireAuth, async (c) => {
  try {
    const { dateRange, filters } = await c.req.json()
    
    const auditEntries = await kv.getByPrefix('audit:')
    let filteredEntries = auditEntries.map(({ value }: any) => value).filter(Boolean)
    
    if (dateRange?.startDate && dateRange?.endDate) {
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = entry.timestamp.split('T')[0]
        return entryDate >= dateRange.startDate && entryDate <= dateRange.endDate
      })
    }
    
    // Apply additional filters
    if (filters?.action && filters.action !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.action === filters.action)
    }
    
    if (filters?.severity && filters.severity !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.severity === filters.severity)
    }
    
    // Generate CSV content
    const headers = ['Timestamp', 'Usuario', 'Email', 'Acao', 'Recurso', 'ID_Recurso', 'Status', 'Severidade', 'IP']
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.timestamp,
        entry.userName,
        entry.userEmail,
        entry.action,
        entry.resource,
        entry.resourceId,
        entry.status,
        entry.severity,
        entry.ipAddress || ''
      ].join(','))
    ].join('\n')
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_log_${dateRange.startDate}_${dateRange.endDate}.csv"`
      }
    })
  } catch (error) {
    console.log('Erro ao exportar log de auditoria:', error)
    return c.json({ error: 'Erro ao exportar log de auditoria' }, 500)
  }
})

// Reports routes
app.get('/make-server-f78aeac5/reports/data', requireAuth, async (c) => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    
    // Fetch all data needed for reports
    const [appointments, services, patients, examResults] = await Promise.all([
      kv.getByPrefix('appointment:'),
      kv.getByPrefix('service:'),
      kv.getByPrefix('patient:'),
      kv.getByPrefix('exam_result:')
    ])
    
    // Filter appointments by date range if provided
    let filteredAppointments = appointments.map(({ value }: any) => value).filter(Boolean)
    
    if (startDate && endDate) {
      filteredAppointments = filteredAppointments.filter(apt => {
        const aptDate = apt.createdAt.split('T')[0]
        return aptDate >= startDate && aptDate <= endDate
      })
    }
    
    return c.json({
      appointments: filteredAppointments,
      services: services.map(({ value }: any) => value).filter(Boolean),
      patients: patients.map(({ value }: any) => value).filter(Boolean),
      examResults: examResults.map(({ value }: any) => value).filter(Boolean),
      period: { startDate, endDate }
    })
  } catch (error) {
    console.log('Erro ao buscar dados do relatório:', error)
    return c.json({ error: 'Erro ao buscar dados do relatório' }, 500)
  }
})

app.post('/make-server-f78aeac5/reports/generate', requireAuth, async (c) => {
  try {
    const { type, format, dateRange, selectedServices, includeCharts } = await c.req.json()
    
    // Get report data
    const [appointments, services] = await Promise.all([
      kv.getByPrefix('appointment:'),
      kv.getByPrefix('service:')
    ])
    
    let filteredAppointments = appointments.map(({ value }: any) => value).filter(Boolean)
    
    if (dateRange?.startDate && dateRange?.endDate) {
      filteredAppointments = filteredAppointments.filter(apt => {
        const aptDate = apt.createdAt.split('T')[0]
        return aptDate >= dateRange.startDate && aptDate <= dateRange.endDate
      })
    }
    
    // Generate simple report content (in a real system, you would use a PDF generation library)
    const reportContent = {
      title: `Relatório ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      period: `${dateRange.startDate} a ${dateRange.endDate}`,
      summary: {
        totalAppointments: filteredAppointments.length,
        totalRevenue: filteredAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0),
        avgTicket: filteredAppointments.length > 0 ? 
          filteredAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0) / filteredAppointments.length : 0
      },
      data: filteredAppointments
    }
    
    // For demonstration, return a simple text response
    // In production, you would generate actual PDF/Excel files
    const textContent = `
RELATÓRIO GERENCIAL NEOKIDS
${reportContent.title}
Período: ${reportContent.period}

RESUMO EXECUTIVO
Total de Atendimentos: ${reportContent.summary.totalAppointments}
Receita Total: R$ ${reportContent.summary.totalRevenue.toFixed(2)}
Ticket Médio: R$ ${reportContent.summary.avgTicket.toFixed(2)}

DETALHAMENTO DOS ATENDIMENTOS
${filteredAppointments.map(apt => 
  `- ${apt.patientName} | ${apt.status} | R$ ${apt.totalAmount || 0}`
).join('\n')}
    `
    
    return new Response(textContent, {
      headers: {
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="relatorio_${type}_${dateRange.startDate}_${dateRange.endDate}.${format === 'pdf' ? 'txt' : 'txt'}"`
      }
    })
  } catch (error) {
    console.log('Erro ao gerar relatório:', error)
    return c.json({ error: 'Erro ao gerar relatório' }, 500)
  }
})

// Dashboard/Analytics routes
app.get('/make-server-f78aeac5/dashboard/stats', requireAuth, async (c) => {
  try {
    const appointments = await kv.getByPrefix('appointment:')
    const appointmentList = appointments.map(({ value }: any) => value).filter(Boolean)
    
    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = appointmentList.filter(apt => 
      apt.createdAt?.startsWith(today)
    )
    
    const totalRevenue = appointmentList.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0)
    const todayRevenue = todayAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0)
    
    const statusCounts = appointmentList.reduce((counts, apt) => {
      counts[apt.status] = (counts[apt.status] || 0) + 1
      return counts
    }, {})
    
    return c.json({
      totalAppointments: appointmentList.length,
      todayAppointments: todayAppointments.length,
      totalRevenue,
      todayRevenue,
      statusCounts
    })
  } catch (error) {
    console.log('Erro ao buscar estatísticas:', error)
    return c.json({ error: 'Erro ao buscar estatísticas' }, 500)
  }
})

// System Settings routes
app.get('/make-server-f78aeac5/settings/configs', requireAuth, async (c) => {
  try {
    // Demo configurations
    const configs = [
      {
        id: '1', category: 'clinic', key: 'clinic_name', value: 'Clínica Neokids',
        type: 'text', description: 'Nome da clínica exibido no sistema',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      },
      {
        id: '2', category: 'clinic', key: 'clinic_address', value: 'Rua das Crianças, 123 - São Paulo, SP',
        type: 'text', description: 'Endereço da clínica',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      },
      {
        id: '3', category: 'clinic', key: 'clinic_phone', value: '(11) 1234-5678',
        type: 'text', description: 'Telefone principal da clínica',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      },
      {
        id: '4', category: 'notifications', key: 'enable_email_notifications', value: true,
        type: 'boolean', description: 'Ativar notificações por email',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      },
      {
        id: '5', category: 'security', key: 'session_timeout', value: 480,
        type: 'number', description: 'Tempo limite da sessão em minutos',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      },
      {
        id: '6', category: 'scheduling', key: 'max_appointments_per_day', value: 50,
        type: 'number', description: 'Número máximo de atendimentos por dia',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      },
      {
        id: '7', category: 'billing', key: 'default_currency', value: 'BRL',
        type: 'select', options: ['BRL', 'USD', 'EUR'], description: 'Moeda padrão do sistema',
        updatedAt: new Date().toISOString(), updatedBy: 'admin@neokids.com'
      }
    ]
    
    return c.json(configs)
  } catch (error) {
    console.log('Erro ao buscar configurações:', error)
    return c.json({ error: 'Erro ao buscar configurações' }, 500)
  }
})

app.put('/make-server-f78aeac5/settings/configs/:id', requireAuth, async (c) => {
  try {
    const configId = c.req.param('id')
    const { value } = await c.req.json()
    
    // Simulate update
    return c.json({ success: true })
  } catch (error) {
    console.log('Erro ao atualizar configuração:', error)
    return c.json({ error: 'Erro ao atualizar configuração' }, 500)
  }
})

// Notifications routes
app.get('/make-server-f78aeac5/notifications', requireAuth, async (c) => {
  try {
    const notifications = [
      {
        id: '1', title: 'Estoque baixo detectado', 
        message: 'O item "Tubos de coleta" está com estoque crítico (5 unidades restantes)',
        type: 'warning', category: 'system', priority: 'high', read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        actionUrl: 'inventory'
      },
      {
        id: '2', title: 'Resultado de exame pendente',
        message: 'O exame de João Silva está aguardando liberação médica há 2 horas',
        type: 'info', category: 'result', priority: 'medium', read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        actionUrl: 'exam-results'
      },
      {
        id: '3', title: 'Backup realizado com sucesso',
        message: 'Backup automático dos dados foi concluído sem erros',
        type: 'success', category: 'system', priority: 'low', read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        id: '4', title: 'Agendamento cancelado',
        message: 'O paciente Maria Santos cancelou o agendamento para hoje às 14:00',
        type: 'info', category: 'appointment', priority: 'medium', read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
        actionUrl: 'appointments'
      },
      {
        id: '5', title: 'Equipamento requer manutenção',
        message: 'O analisador hematológico está programado para manutenção preventiva amanhã',
        type: 'warning', category: 'laboratory', priority: 'medium', read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        actionUrl: 'laboratory'
      }
    ]
    
    return c.json(notifications)
  } catch (error) {
    console.log('Erro ao buscar notificações:', error)
    return c.json({ error: 'Erro ao buscar notificações' }, 500)
  }
})

app.patch('/make-server-f78aeac5/notifications/:id/read', requireAuth, async (c) => {
  try {
    const notificationId = c.req.param('id')
    // Simulate marking as read
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Erro ao marcar notificação como lida' }, 500)
  }
})

// Inventory routes
app.get('/make-server-f78aeac5/inventory/items', requireAuth, async (c) => {
  try {
    const items = [
      {
        id: '1', name: 'Tubos de coleta EDTA', code: 'TUB-001', category: 'Material de Coleta',
        supplier: 'MedSupply Ltda', currentStock: 5, minStock: 10, maxStock: 100,
        unit: 'un', unitCost: 2.50, totalValue: 12.50, status: 'active',
        location: 'Almoxarifado A1', expirationDate: '2025-12-31',
        lastUpdated: new Date().toISOString(),
        description: 'Tubos de coleta a vácuo com EDTA para hemogramas'
      },
      {
        id: '2', name: 'Seringas 5ml', code: 'SER-005', category: 'Material de Coleta',
        supplier: 'Descartáveis Med', currentStock: 45, minStock: 20, maxStock: 200,
        unit: 'un', unitCost: 0.75, totalValue: 33.75, status: 'active',
        location: 'Almoxarifado B2', expirationDate: '2026-08-15',
        lastUpdated: new Date().toISOString(),
        description: 'Seringas descartáveis estéreis de 5ml'
      },
      {
        id: '3', name: 'Reagente Hemoglobina', code: 'REA-HGB', category: 'Reagentes',
        supplier: 'BioReagentes S.A.', currentStock: 3, minStock: 5, maxStock: 20,
        unit: 'frasco', unitCost: 85.00, totalValue: 255.00, status: 'active',
        location: 'Refrigerador R1', expirationDate: '2025-03-20',
        lastUpdated: new Date().toISOString(),
        description: 'Reagente para dosagem de hemoglobina'
      },
      {
        id: '4', name: 'Luvas de Procedimento', code: 'LUV-PROC', category: 'EPI',
        supplier: 'ProteEPI', currentStock: 150, minStock: 50, maxStock: 500,
        unit: 'par', unitCost: 0.45, totalValue: 67.50, status: 'active',
        location: 'Almoxarifado C1', expirationDate: '2027-01-10',
        lastUpdated: new Date().toISOString(),
        description: 'Luvas de procedimento não cirúrgico, tamanho M'
      },
      {
        id: '5', name: 'Lâminas para Microscopia', code: 'LAM-MICRO', category: 'Material Laboratorial',
        supplier: 'LabGlass', currentStock: 8, minStock: 15, maxStock: 100,
        unit: 'cx', unitCost: 12.00, totalValue: 96.00, status: 'active',
        location: 'Prateleira P3', expirationDate: null,
        lastUpdated: new Date().toISOString(),
        description: 'Lâminas de vidro para microscopia, caixa com 50 unidades'
      }
    ]
    
    return c.json(items)
  } catch (error) {
    console.log('Erro ao buscar itens do estoque:', error)
    return c.json({ error: 'Erro ao buscar itens do estoque' }, 500)
  }
})

app.get('/make-server-f78aeac5/inventory/movements', requireAuth, async (c) => {
  try {
    const movements = [
      {
        id: '1', itemId: '1', itemName: 'Tubos de coleta EDTA',
        type: 'exit', quantity: 15, reason: 'Uso em coletas do dia',
        responsibleUser: 'João Santos', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: '2', itemId: '2', itemName: 'Seringas 5ml',
        type: 'entry', quantity: 100, reason: 'Compra de reposição',
        responsibleUser: 'Maria Silva', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: '3', itemId: '3', itemName: 'Reagente Hemoglobina',
        type: 'exit', quantity: 2, reason: 'Vencimento próximo',
        responsibleUser: 'João Santos', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: '4', itemId: '4', itemName: 'Luvas de Procedimento',
        type: 'adjustment', quantity: -10, reason: 'Ajuste por inventário',
        responsibleUser: 'Administrador Neokids', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
      }
    ]
    
    return c.json(movements)
  } catch (error) {
    console.log('Erro ao buscar movimentações:', error)
    return c.json({ error: 'Erro ao buscar movimentações' }, 500)
  }
})

app.post('/make-server-f78aeac5/inventory/items', requireAuth, async (c) => {
  try {
    const itemData = await c.req.json()
    const newItem = {
      id: Date.now().toString(),
      ...itemData,
      lastUpdated: new Date().toISOString(),
      totalValue: itemData.currentStock * itemData.unitCost
    }
    
    // Simulate saving to storage
    return c.json({ success: true, item: newItem })
  } catch (error) {
    console.log('Erro ao criar item:', error)
    return c.json({ error: 'Erro ao criar item' }, 500)
  }
})

app.post('/make-server-f78aeac5/inventory/movements', requireAuth, async (c) => {
  try {
    const movementData = await c.req.json()
    const newMovement = {
      id: Date.now().toString(),
      ...movementData,
      responsibleUser: c.get('userEmail'),
      createdAt: new Date().toISOString()
    }
    
    // Simulate saving to storage
    return c.json({ success: true, movement: newMovement })
  } catch (error) {
    console.log('Erro ao criar movimentação:', error)
    return c.json({ error: 'Erro ao criar movimentação' }, 500)
  }
})

Deno.serve(app.fetch)