'use client'
import ContactList from '@/app/(admin)/(apps)/chat/components/ContactList'
import { ContactType, MessageType } from '@/app/(admin)/(apps)/chat/types'
import SimplebarClient from '@/components/client-wrapper/SimplebarClient'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  Container,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  FormControl,
  Offcanvas,
  OverlayTrigger,
  Tooltip,
  Alert,
  Spinner,
} from 'react-bootstrap'
import { LuMessageSquare } from 'react-icons/lu'
import {
  TbBellOff,
  TbCircleFilled,
  TbClock,
  TbDotsVertical,
  TbMenu2,
  TbMessageCircleOff,
  TbPhone,
  TbSend2,
  TbTrash,
  TbUser,
  TbVideo,
} from 'react-icons/tb'
import { useAuth } from '@/hooks/useAuth'
import getPusherClient from '@/lib/pusher/client'
import type { Channel } from 'pusher-js'

const Page = () => {
  const { colaborador, persona } = useAuth()
  // Usar id o documentId según lo que esté disponible (Strapi puede usar cualquiera)
  // CRÍTICO: Normalizar el ID a número para asegurar consistencia con Strapi
  const currentUserIdRaw = colaborador 
    ? (colaborador.id || colaborador.documentId || colaborador.attributes?.id || null)
    : null
  const currentUserId = currentUserIdRaw ? String(currentUserIdRaw) : null
  
  // Log para debugging (solo en desarrollo o cuando hay problemas)
  useEffect(() => {
    if (currentUserId) {
      console.error('[Chat] 👤 Usuario actual identificado:', {
        currentUserId,
        colaboradorId: colaborador?.id,
        colaboradorDocumentId: colaborador?.documentId,
        colaboradorAttributesId: colaborador?.attributes?.id,
        colaboradorRaw: colaborador,
      })
    }
  }, [currentUserId, colaborador])

  const currentUserData = {
    id: currentUserId || '1',
    name: persona ? (persona.nombre_completo || `${persona.nombres || ''} ${persona.primer_apellido || ''}`.trim() || 'Usuario') : 'Usuario',
    avatar: persona?.imagen?.url 
      ? { src: `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}${persona.imagen.url}` }
      : undefined,
  }

  const [show, setShow] = useState(false)
  const [contacts, setContacts] = useState<ContactType[]>([])
  const [currentContact, setCurrentContact] = useState<ContactType | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMessageDate, setLastMessageDate] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pusherChannelRef = useRef<Channel | null>(null)

  // Cargar contactos
  useEffect(() => {
    const cargarContactos = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/chat/colaboradores')
        if (!response.ok) throw new Error('Error al cargar colaboradores')
        const data = await response.json()

        if (!data.data || (Array.isArray(data.data) && data.data.length === 0)) {
          setContacts([])
          return
        }

        const colaboradoresArray = Array.isArray(data.data) ? data.data : [data.data]

        const obtenerNombrePersona = (persona: any): string => {
          if (!persona) return ''
          if (persona.nombre_completo) return persona.nombre_completo
          const partes = []
          if (persona.nombres) partes.push(persona.nombres)
          if (persona.primer_apellido) partes.push(persona.primer_apellido)
          if (persona.segundo_apellido) partes.push(persona.segundo_apellido)
          return partes.length > 0 ? partes.join(' ') : persona.rut || ''
        }

        const obtenerAvatar = (persona: any): string | null => {
          if (!persona?.imagen?.url) return null
          return `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}${persona.imagen.url}`
        }

        const contactosMapeados: ContactType[] = colaboradoresArray
          .filter((colaborador: any) => {
            const colaboradorData = colaborador.attributes || colaborador
            // Filtrar usuario actual y solo mostrar activos con persona
            return (
              colaborador?.id && 
              colaboradorData.activo && 
              colaboradorData.persona &&
              String(colaborador.id) !== currentUserId // Excluir al usuario actual
            )
          })
          .map((colaborador: any) => {
            const colaboradorData = colaborador.attributes || colaborador
            const persona = colaboradorData.persona
            const nombre = obtenerNombrePersona(persona)
            const avatar = obtenerAvatar(persona)

            return {
              id: String(colaborador.id),
              name: nombre.trim(),
              isOnline: false,
              avatar: avatar ? { src: avatar } : undefined,
            }
          })
          .filter((c: ContactType | null) => c !== null) as ContactType[]

        setContacts(contactosMapeados)
        if (contactosMapeados.length > 0 && !currentContact) {
          setCurrentContact(contactosMapeados[0])
        }
      } catch (err: any) {
        console.error('Error al cargar contactos:', err)
        setError(err.message || 'Error al cargar contactos')
      } finally {
        setIsLoading(false)
      }
    }

    cargarContactos()
  }, [currentUserId]) // Agregar currentUserId como dependencia

  // Cargar mensajes iniciales y configurar Pusher
  useEffect(() => {
    if (!currentContact || !currentUserId) {
      setMessages([])
      setLastMessageDate(null)
      // Desuscribirse del canal si existe
      if (pusherChannelRef.current) {
        pusherChannelRef.current.unbind_all()
        pusherChannelRef.current.unsubscribe()
        pusherChannelRef.current = null
      }
      return
    }

    // Limpiar suscripción anterior si existe
    if (pusherChannelRef.current) {
      pusherChannelRef.current.unbind_all()
      pusherChannelRef.current.unsubscribe()
      pusherChannelRef.current = null
    }

    const cargarMensajes = async (soloNuevos: boolean = false) => {
      try {
        // Log para debugging (usar error para que siempre se vea)
        console.error('[Chat] 🔄 Cargando mensajes:', {
          soloNuevos,
          currentUserId,
          currentContactId: currentContact.id,
          lastMessageDate,
        })

        const query = new URLSearchParams({
          colaborador_id: currentContact.id,
          remitente_id: currentUserId,
        })

        // IMPORTANTE: Solo aplicar filtro de fecha en polling Y si tenemos una fecha válida
        // El margen de 30 segundos asegura que no se pierdan mensajes por diferencias de tiempo entre servidor y cliente
        // PERO: Si es la primera carga o no hay lastMessageDate, cargar TODOS los mensajes (sin filtro)
        if (soloNuevos && lastMessageDate) {
          try {
            const fechaLastMessage = new Date(lastMessageDate)
            if (!isNaN(fechaLastMessage.getTime())) {
              // Margen de 120 segundos (aumentado de 60) para asegurar que no se pierdan mensajes
              // Esto es crítico cuando hay diferencias de tiempo entre servidor y cliente o cuando los mensajes tienen timestamps ligeramente diferentes
              const fechaConMargen = new Date(fechaLastMessage.getTime() - 120000).toISOString()
              query.append('ultima_fecha', fechaConMargen)
              console.error('[Chat] ⏰ Filtro de fecha aplicado:', { 
                lastMessageDate, 
                fechaConMargen,
                diferenciaSegundos: (fechaLastMessage.getTime() - new Date(fechaConMargen).getTime()) / 1000
              })
            } else {
              console.error('[Chat] ⚠️ lastMessageDate inválida, sin filtro:', lastMessageDate)
            }
          } catch (e) {
            console.error('[Chat] ⚠️ Error al procesar lastMessageDate, sin filtro:', e)
          }
        } else if (soloNuevos) {
          console.error('[Chat] ⚠️ Polling sin lastMessageDate - cargando todos los mensajes')
        }

        const url = `/api/chat/mensajes?${query.toString()}`
        const response = await fetch(url)
        
        if (!response.ok) {
          if (response.status === 404 || response.status === 502 || response.status === 504) {
            return
          }
          const errorText = await response.text().catch(() => '')
          console.error('[Chat] ❌ Error al cargar mensajes:', { status: response.status, url, error: errorText.substring(0, 200) })
          return
        }

        const data = await response.json()
        const mensajesData = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : [])

        console.error('[Chat] 📨 Mensajes recibidos del API:', {
          total: mensajesData.length,
          primeros: mensajesData.slice(0, 3).map((m: any) => ({
            id: m.id || m.attributes?.id,
            remitente_id: m.remitente_id || m.attributes?.remitente_id,
            cliente_id: m.cliente_id || m.attributes?.cliente_id,
            texto: (m.texto || m.attributes?.texto || '').substring(0, 30),
          }))
        })
        
        // Validar que tenemos IDs válidos
        if (!currentUserId || !currentContact.id) {
          console.error('[Chat] ❌ ERROR: IDs inválidos', { currentUserId, currentContactId: currentContact.id })
          return
        }

        // Mapear mensajes manteniendo referencia a los datos originales para ordenar por fecha
        interface MensajeConFecha extends MessageType {
          fechaOriginal: string
        }
        
        const mensajesConFecha: MensajeConFecha[] = mensajesData.map((mensaje: any) => {
          // Extraer datos - pueden venir en attributes o directamente
          const mensajeAttrs = mensaje.attributes || mensaje
          const texto = mensajeAttrs.texto || mensaje.texto || ''
          const remitenteId = mensajeAttrs.remitente_id || mensaje.remitente_id || 1
          const clienteId = mensajeAttrs.cliente_id || mensaje.cliente_id
          const fecha = mensajeAttrs.fecha || mensaje.fecha || mensaje.createdAt || Date.now()
          const fechaObj = new Date(fecha)
          const mensajeId = mensaje.id || mensajeAttrs.id

          return {
            id: String(mensajeId),
            senderId: String(remitenteId),
            text: texto,
            time: fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            fechaOriginal: fecha, // Guardar fecha original para ordenar
          }
        })

        // Ordenar por fecha (más confiable que por ID)
        mensajesConFecha.sort((a: MensajeConFecha, b: MensajeConFecha) => {
          const fechaA = new Date(a.fechaOriginal).getTime()
          const fechaB = new Date(b.fechaOriginal).getTime()
          return fechaA - fechaB
        })

        // Remover fechaOriginal antes de guardar
        const mensajesMapeados: MessageType[] = mensajesConFecha.map(({ fechaOriginal, ...msg }) => msg)

        if (soloNuevos) {
          setMessages((prev) => {
            // Remover mensajes temporales y duplicados
            const idsExistentes = new Set(prev.map((m) => m.id))
            const nuevos = mensajesMapeados.filter((m) => !idsExistentes.has(m.id) && !m.id.startsWith('temp-'))
            
            if (nuevos.length === 0) {
              // Aún así, remover temporales si existen
              const sinTemporales = prev.filter((m) => !m.id.startsWith('temp-'))
              return sinTemporales.length !== prev.length ? sinTemporales : prev
            }
            
            // Combinar: mantener prev sin temporales, agregar nuevos
            const prevSinTemporales = prev.filter((m) => !m.id.startsWith('temp-'))
            const todos = [...prevSinTemporales, ...nuevos]
            
            // Ordenar por fecha usando los datos originales
            todos.sort((a: MessageType, b: MessageType) => {
              const msgA = mensajesConFecha.find((m) => m.id === a.id)
              const msgB = mensajesConFecha.find((m) => m.id === b.id)
              if (msgA && msgB) {
                return new Date(msgA.fechaOriginal).getTime() - new Date(msgB.fechaOriginal).getTime()
              }
              // Fallback a orden por ID
              const idA = parseInt(a.id) || 0
              const idB = parseInt(b.id) || 0
              return idA - idB
            })
            
            return todos
          })
        } else {
          // Remover mensajes temporales en carga inicial
          const sinTemporales = mensajesMapeados.filter((m) => !m.id.startsWith('temp-'))
          setMessages(sinTemporales)
        }

        // Actualizar última fecha SIEMPRE si hay mensajes
        // Esto es crítico para que el polling funcione correctamente
        if (mensajesMapeados.length > 0) {
          // Encontrar el mensaje más reciente por fecha
          const mensajeMasReciente = mensajesConFecha.reduce((masReciente, actual) => {
            const fechaMasReciente = new Date(masReciente.fechaOriginal).getTime()
            const fechaActual = new Date(actual.fechaOriginal).getTime()
            return fechaActual > fechaMasReciente ? actual : masReciente
          })
          
          const ultimaFecha = mensajeMasReciente.fechaOriginal
          if (ultimaFecha) {
            setLastMessageDate(ultimaFecha)
            console.error('[Chat] ✅ lastMessageDate actualizada:', {
              nuevaFecha: ultimaFecha,
              mensajesRecibidos: mensajesMapeados.length,
              soloNuevos
            })
          }
        } else {
          if (soloNuevos) {
            // En polling, si no hay mensajes nuevos, mantener el lastMessageDate existente
            // Los mensajes existentes se mantienen en el estado
            console.error('[Chat] ⚠️ Polling sin mensajes nuevos, manteniendo mensajes existentes')
          } else {
            // Si es carga inicial y no hay mensajes, establecer fecha actual para que el polling capture mensajes nuevos
            // Esto asegura que cuando llegue el primer mensaje, se capture correctamente
            setLastMessageDate(new Date().toISOString())
            console.error('[Chat] ⚠️ Carga inicial sin mensajes, estableciendo fecha actual')
          }
        }

        // Scroll solo si hay cambios
        if (mensajesMapeados.length > 0) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      } catch (err: any) {
        if (err.status !== 404 && err.status !== 502 && err.status !== 504) {
          console.error('Error al cargar mensajes:', err)
        }
      }
    }

    // Cargar mensajes iniciales SIN filtro de fecha (cargar todos)
    cargarMensajes(false)
    
    // Configurar Pusher para recibir mensajes en tiempo real
    const pusher = getPusherClient()
    if (pusher) {
      // Crear nombre de canal único para esta conversación (ordenado para que ambos usuarios usen el mismo)
      const remitenteIdNum = parseInt(String(currentUserId), 10)
      const colaboradorIdNum = parseInt(String(currentContact.id), 10)
      const idsOrdenados = [remitenteIdNum, colaboradorIdNum].sort((a, b) => a - b)
      const channelName = `private-chat-${idsOrdenados[0]}-${idsOrdenados[1]}`
      
      console.error('[Chat] 📡 Suscribiéndose a canal Pusher:', channelName)
      
      // Suscribirse al canal privado
      const channel = pusher.subscribe(channelName)
      pusherChannelRef.current = channel
      
      // Escuchar cuando la suscripción sea exitosa
      channel.bind('pusher:subscription_succeeded', () => {
        console.error('[Chat] ✅ Suscrito exitosamente a canal Pusher:', channelName)
      })
      
      // Escuchar nuevos mensajes en tiempo real
      channel.bind('new-message', (data: any) => {
        console.error('[Chat] 📨 Nuevo mensaje recibido vía Pusher:', {
          id: data.id,
          remitente_id: data.remitente_id,
          cliente_id: data.cliente_id,
          texto: data.texto?.substring(0, 30),
          currentUserId,
          currentContactId: currentContact.id,
        })
        
        // Validar que el mensaje sea para esta conversación
        // Normalizar todos los IDs a números para comparación
        const mensajeRemitenteId = parseInt(String(data.remitente_id || ''), 10)
        const mensajeClienteId = parseInt(String(data.cliente_id || ''), 10)
        const currentUserIdNum = parseInt(String(currentUserId || ''), 10)
        const currentContactIdNum = parseInt(String(currentContact.id || ''), 10)
        
        console.error('[Chat] 🔍 Validando mensaje:', {
          mensajeRemitenteId,
          mensajeClienteId,
          currentUserIdNum,
          currentContactIdNum,
        })
        
        const esParaEstaConversacion = 
          (mensajeRemitenteId === currentUserIdNum && mensajeClienteId === currentContactIdNum) ||
          (mensajeRemitenteId === currentContactIdNum && mensajeClienteId === currentUserIdNum)
        
        if (!esParaEstaConversacion) {
          console.error('[Chat] ⚠️ Mensaje recibido no es para esta conversación, ignorando:', {
            mensajeRemitenteId,
            mensajeClienteId,
            currentUserIdNum,
            currentContactIdNum,
            esParaEstaConversacion,
          })
          return
        }
        
        console.error('[Chat] ✅ Mensaje validado correctamente, agregando a la conversación')
        
        // Convertir el mensaje al formato esperado
        const fecha = data.fecha || new Date().toISOString()
        const fechaObj = new Date(fecha)
        
        const nuevoMensaje: MessageType = {
          id: String(data.id),
          senderId: String(data.remitente_id),
          text: data.texto || '',
          time: fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        }
        
        // Agregar mensaje al estado (evitando duplicados y removiendo temporales)
        setMessages((prev) => {
          // Verificar si el mensaje ya existe
          const existe = prev.some((m) => m.id === nuevoMensaje.id)
          if (existe) {
            console.error('[Chat] ⚠️ Mensaje duplicado ignorado:', nuevoMensaje.id)
            // Aún así, remover temporales
            return prev.filter((m) => !m.id.startsWith('temp-'))
          }
          
          // Remover mensajes temporales y agregar el nuevo
          const prevSinTemporales = prev.filter((m) => !m.id.startsWith('temp-'))
          const todos = [...prevSinTemporales, nuevoMensaje]
          
          // Ordenar por ID (que debería ser por fecha de creación)
          todos.sort((a, b) => {
            const idA = parseInt(a.id) || 0
            const idB = parseInt(b.id) || 0
            return idA - idB
          })
          
          return todos
        })
        
        // Actualizar última fecha
        if (fecha) {
          setLastMessageDate(fecha)
        }
        
        // Scroll al final
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
      
      // Manejar errores de suscripción
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[Chat] ❌ Error al suscribirse a canal Pusher:', error)
      })
    } else {
      console.error('[Chat] ⚠️ Pusher no disponible, usando polling como fallback')
      // Fallback a polling si Pusher no está disponible
      const pollingInterval = setInterval(() => {
        cargarMensajes(true)
      }, 2000)
      
      return () => {
        clearInterval(pollingInterval)
      }
    }

    return () => {
      // Limpiar suscripción de Pusher
      if (pusherChannelRef.current) {
        pusherChannelRef.current.unbind_all()
        pusherChannelRef.current.unsubscribe()
        pusherChannelRef.current = null
      }
    }
  }, [currentContact, currentUserId]) // Removido lastMessageDate de dependencias para evitar loops

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentContact || isSending || !currentUserId) return

    const texto = messageText.trim()
    const textoOriginal = messageText // Guardar para restaurar en caso de error
    
    // CRÍTICO: Normalizar IDs asegurando que sean números válidos
    const remitenteIdStr = String(currentUserId || '')
    const colaboradorIdStr = String(currentContact.id || '')
    const remitenteIdNum = parseInt(remitenteIdStr, 10)
    const colaboradorIdNum = parseInt(colaboradorIdStr, 10)
    
    // Log para debugging (usar error para que siempre se vea)
    console.error('[Chat] 📤 Enviando mensaje desde frontend:', {
      texto: texto.substring(0, 50),
      remitenteId_original: currentUserId,
      colaboradorId_original: currentContact.id,
      remitenteId_normalizado: remitenteIdNum,
      colaboradorId_normalizado: colaboradorIdNum,
    })
    
    // Validar IDs normalizados
    if (!remitenteIdNum || !colaboradorIdNum || isNaN(remitenteIdNum) || isNaN(colaboradorIdNum)) {
      console.error('[Chat] ❌ ERROR: IDs inválidos después de normalización', { 
        remitenteIdStr, 
        colaboradorIdStr,
        remitenteIdNum, 
        colaboradorIdNum, 
        currentUserId, 
        currentContactId: currentContact.id 
      })
      setError('Error: IDs inválidos. Por favor, recarga la página.')
      return
    }
    
    // Crear mensaje temporal (optimistic update)
    const mensajeTemporal: MessageType = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      text: texto,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    }
    
    // Agregar mensaje temporal al estado inmediatamente
    setMessages((prev) => [...prev, mensajeTemporal])
    setMessageText('')
    setIsSending(true)
    setError(null)

    // Scroll inmediato
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    try {
      const response = await fetch('/api/chat/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto,
          colaborador_id: colaboradorIdNum,
          remitente_id: remitenteIdNum,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al enviar mensaje')
      }

      const responseData = await response.json()
      
      console.error('[Chat] ✅ Mensaje enviado exitosamente, Pusher notificará automáticamente')
      
      // El mensaje temporal se reemplazará automáticamente cuando Pusher emita el evento 'new-message'
      // No necesitamos recargar manualmente, Pusher lo hace en tiempo real
      
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err)
      setError(err.message || 'Error al enviar mensaje')
      setMessageText(textoOriginal) // Restaurar texto en caso de error
      
      // Remover mensaje temporal en caso de error
      setMessages((prev) => prev.filter((m) => m.id !== mensajeTemporal.id))
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading && contacts.length === 0) {
    return (
      <Container fluid>
        <PageBreadcrumb title="Chat" subtitle="Apps" />
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" variant="primary" />
          <span className="ms-2">Cargando contactos...</span>
        </div>
      </Container>
    )
  }

  if (error && contacts.length === 0) {
    return (
      <Container fluid>
        <PageBreadcrumb title="Chat" subtitle="Apps" />
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      </Container>
    )
  }

  if (contacts.length === 0) {
    return (
      <Container fluid>
        <PageBreadcrumb title="Chat" subtitle="Apps" />
        <Alert variant="info">
          No hay colaboradores disponibles.
        </Alert>
      </Container>
    )
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Chat" subtitle="Apps" />

      <div className="outlook-box gap-1">
        <Offcanvas responsive="lg" show={show} onHide={() => setShow(!show)} className="outlook-left-menu outlook-left-menu-lg">
          <ContactList contacts={contacts} setContact={setCurrentContact} />
        </Offcanvas>

        <Card className="h-100 mb-0 rounded-start-0 flex-grow-1">
          <CardHeader className="card-bg">
            <div className="d-lg-none d-inline-flex gap-2">
              <button className="btn btn-default btn-icon" type="button" onClick={() => setShow(!show)}>
                <TbMenu2 className="fs-lg" />
              </button>
            </div>

            {currentContact && (
              <>
                <div className="flex-grow-1">
                  <h5 className="mb-1 lh-base fs-lg">
                    <Link href="/users/profile" className="link-reset">
                      {currentContact.name}
                    </Link>
                  </h5>
                  <p className="mb-0 lh-sm text-muted" style={{ paddingTop: '1px' }}>
                    <TbCircleFilled className={`me-1 ${currentContact.isOnline ? 'text-success' : 'text-danger'}`} />{' '}
                    {currentContact.isOnline ? 'Activo' : 'Desconectado'}
                  </p>
                </div>

                <div className="d-flex align-items-center gap-1">
                  <OverlayTrigger placement="top" overlay={<Tooltip>Video Call</Tooltip>}>
                    <button type="button" className="btn btn-default btn-icon">
                      <TbVideo className="fs-lg" />
                    </button>
                  </OverlayTrigger>

                  <OverlayTrigger placement="top" overlay={<Tooltip>Audio Call</Tooltip>}>
                    <button type="button" className="btn btn-default btn-icon">
                      <TbPhone className="fs-lg" />
                    </button>
                  </OverlayTrigger>

                  <Dropdown align="end">
                    <DropdownToggle as={'button'} className="btn btn-default btn-icon drop-arrow-none">
                      <TbDotsVertical className="fs-lg" />
                    </DropdownToggle>

                    <DropdownMenu>
                      <DropdownItem>
                        <TbUser className="me-2" /> Ver Perfil
                      </DropdownItem>
                      <DropdownItem>
                        <TbBellOff className="me-2" /> Silenciar Notificaciones
                      </DropdownItem>
                      <DropdownItem>
                        <TbTrash className="me-2" /> Eliminar Chat
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </>
            )}
          </CardHeader>

          <SimplebarClient className="card-body pt-0 mb-5 pb-2" style={{ maxHeight: 'calc(100vh - 317px)' }}>
            {messages.length > 0 ? (
              <>
                {messages.map((message) => {
                  const messageSenderId = String(message.senderId)
                  const currentUserIdStr = currentUserId ? String(currentUserId) : null
                  const isFromCurrentUser = currentUserIdStr !== null && messageSenderId === currentUserIdStr

                  return (
                    <Fragment key={message.id}>
                      {/* Mensaje del otro usuario - IZQUIERDA, AMARILLO */}
                      {currentContact && currentUserIdStr && !isFromCurrentUser && (
                        <div className="d-flex align-items-start gap-2 my-3 chat-item">
                          {currentContact.avatar ? (
                            <Image 
                              src={typeof currentContact.avatar === 'object' && 'src' in currentContact.avatar 
                                ? currentContact.avatar.src 
                                : String(currentContact.avatar)} 
                              width={36} 
                              height={36} 
                              className="avatar-md rounded-circle" 
                              alt="User" 
                            />
                          ) : (
                            <span className="avatar-sm flex-shrink-0">
                              <span className="avatar-title text-bg-primary fw-bold rounded-circle">
                                {currentContact.name.charAt(0).toUpperCase()}
                              </span>
                            </span>
                          )}
                          <div>
                            <div className="chat-message py-2 px-3 bg-warning-subtle rounded">{message.text}</div>
                            <div className="text-muted d-inline-flex align-items-center gap-1 fs-xs mt-1">
                              {message.time}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mensaje del usuario actual - DERECHA, AZUL */}
                      {isFromCurrentUser && (
                        <div className="d-flex align-items-start gap-2 my-3 text-end chat-item justify-content-end">
                          <div>
                            <div className="chat-message py-2 px-3 bg-info-subtle rounded">{message.text}</div>
                            <div className="text-muted d-inline-flex align-items-center gap-1 fs-xs mt-1">
                              {message.time}
                            </div>
                          </div>
                          {currentUserData.avatar ? (
                            <Image src={currentUserData.avatar.src} width={36} height={36} className="avatar-md rounded-circle" alt="User" />
                          ) : (
                            <span className="avatar-sm flex-shrink-0">
                              <span className="avatar-title text-bg-primary fw-bold rounded-circle w-25 h-25">
                                {currentUserData.name.charAt(0).toUpperCase()}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </Fragment>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center my-5">
                <TbMessageCircleOff size={18} className="text-muted me-1" />
                <span>No hay mensajes. Comienza la conversación.</span>
              </div>
            )}
          </SimplebarClient>

          <CardFooter className="bg-body-secondary border-top border-dashed border-bottom-0 position-absolute bottom-0 w-100">
            <div className="d-flex gap-2">
              <div className="app-search flex-grow-1">
                <FormControl
                  type="text"
                  className="py-2 bg-light-subtle border-light"
                  placeholder="Escribe un mensaje..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!currentContact || isSending || !currentUserId}
                />
                <LuMessageSquare className="app-search-icon text-muted" />
              </div>
              <Button variant="primary" onClick={handleSendMessage} disabled={!currentContact || isSending || !messageText.trim() || !currentUserId}>
                {isSending ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar <TbSend2 className="ms-1 fs-xl" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Container>
  )
}

export default Page
