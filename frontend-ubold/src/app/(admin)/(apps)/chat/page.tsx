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
  const currentUserId = colaborador?.id ? String(colaborador.id) : null

  // Log de depuración para currentUserId
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.error('[Chat] 👤 currentUserId establecido:', {
        currentUserId,
        colaboradorId: colaborador?.id,
        colaboradorIdType: typeof colaborador?.id,
        tieneColaborador: !!colaborador,
      })
    }
  }, [currentUserId, colaborador?.id])

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<Channel | null>(null)
  const allChannelsRef = useRef<Map<string, Channel>>(new Map())
  const currentContactRef = useRef<ContactType | null>(null)

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
            const colaboradorIdNum = colaborador.id || colaboradorData?.id
            return (
              colaboradorIdNum && 
              typeof colaboradorIdNum === 'number' &&
              colaboradorData.activo && 
              colaboradorData.persona &&
              String(colaboradorIdNum) !== currentUserId
            )
          })
          .map((colaborador: any) => {
            const colaboradorData = colaborador.attributes || colaborador
            const persona = colaboradorData.persona
            const nombre = obtenerNombrePersona(persona)
            const avatar = obtenerAvatar(persona)
            const colaboradorId = colaborador.id || colaboradorData?.id

            return {
              id: String(colaboradorId),
              name: nombre || 'Sin nombre',
              avatar: avatar || undefined,
              isOnline: false,
            }
          })

        setContacts(contactosMapeados)

        // Suscribirse a todos los canales de todos los contactos
        const pusher = getPusherClient()
        if (pusher && currentUserId) {
          const currentUserIdNum = parseInt(currentUserId, 10)
          contactosMapeados.forEach((contact) => {
            const contactIdNum = parseInt(contact.id, 10)
            if (!isNaN(currentUserIdNum) && !isNaN(contactIdNum)) {
              const idsOrdenados = [currentUserIdNum, contactIdNum].sort((a, b) => a - b)
              const channelName = `private-chat-${idsOrdenados[0]}-${idsOrdenados[1]}`
              
              // Solo suscribirse si no estamos ya suscritos
              if (!allChannelsRef.current.has(channelName)) {
                console.error('[Chat] 📡 Suscribiéndose a canal global:', channelName)
                const channel = pusher.subscribe(channelName)
                allChannelsRef.current.set(channelName, channel)

                // Escuchar nuevos mensajes en todos los canales
                // NOTA: Este handler solo escucha para mantener suscripciones activas.
                // El canal específico de la conversación actual maneja la actualización de mensajes
                // cuando estamos viendo esa conversación, para evitar duplicados.
                channel.bind('new-message', (data: any) => {
                  console.error('[Chat] 📨 Mensaje recibido en canal global (solo logging):', {
                    channelName,
                    id: data.id,
                    remitente_id: data.remitente_id,
                    cliente_id: data.cliente_id,
                    texto: data.texto?.substring(0, 30),
                    currentUserId,
                    contactId: contact.id,
                  })
                  
                  // NO procesar mensajes aquí si estamos viendo esta conversación
                  // El canal específico ya lo maneja. Esto evita duplicados.
                  // El canal global solo mantiene las suscripciones activas para recibir mensajes
                  // cuando no estamos viendo esa conversación (para notificaciones futuras).
                })
              }
            }
          })
        }
      } catch (err: any) {
        console.error('Error al cargar contactos:', err)
        setError(err.message || 'Error al cargar contactos')
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUserId) {
      cargarContactos()
    }
  }, [currentUserId])

  // Actualizar referencia a currentContact
  useEffect(() => {
    currentContactRef.current = currentContact
  }, [currentContact])

  // Cargar mensajes y configurar Pusher
  useEffect(() => {
    if (!currentContact || !currentUserId) {
      setMessages([])
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    // Cargar mensajes iniciales
    const cargarMensajes = async () => {
      try {
        const query = new URLSearchParams({
          colaborador_id: currentContact.id,
          remitente_id: currentUserId,
        })
        console.log('[Chat] 🔄 Cargando mensajes:', {
          colaborador_id: currentContact.id,
          remitente_id: currentUserId,
        })
        
        const response = await fetch(`/api/chat/mensajes?${query.toString()}`)
        if (!response.ok) {
          console.error('[Chat] ❌ Error al cargar mensajes:', response.status, response.statusText)
          return
        }

        const data = await response.json()
        const mensajesData = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : [])
        
        // Log MUY detallado de la estructura completa de los primeros mensajes
        console.error('[Chat] 📨 Mensajes recibidos del API (estructura completa):', {
          total: mensajesData.length,
          dataCompleta: JSON.stringify(data).substring(0, 500),
          primerosMensajesCompletos: mensajesData.slice(0, 3).map((m: any) => ({
            mensajeCompleto: JSON.stringify(m).substring(0, 400),
            id: m.id || m.attributes?.id,
            remitente_id_directo: m.remitente_id,
            remitente_id_attributes: m.attributes?.remitente_id,
            cliente_id_directo: m.cliente_id,
            cliente_id_attributes: m.attributes?.cliente_id,
            tieneAttributes: !!m.attributes,
            estructura: Object.keys(m),
          }))
        })

        const mensajesMapeados: MessageType[] = mensajesData.map((mensaje: any) => {
          // Extraer datos del mensaje de forma más robusta
          const mensajeAttrs = mensaje.attributes || mensaje
          const fecha = mensajeAttrs.fecha || mensaje.fecha || mensaje.createdAt || Date.now()
          const fechaObj = new Date(fecha)
          
          // Extraer remitente_id de múltiples ubicaciones posibles
          // IMPORTANTE: El remitente_id debe ser el ID de QUIEN ENVÍA el mensaje, no el currentUserId
          let remitenteIdOriginal: any = null
          
          // Intentar extraer de diferentes ubicaciones
          if (mensajeAttrs.remitente_id !== undefined && mensajeAttrs.remitente_id !== null) {
            remitenteIdOriginal = mensajeAttrs.remitente_id
          } else if (mensaje.remitente_id !== undefined && mensaje.remitente_id !== null) {
            remitenteIdOriginal = mensaje.remitente_id
          } else if (mensaje.data?.remitente_id !== undefined && mensaje.data?.remitente_id !== null) {
            remitenteIdOriginal = mensaje.data.remitente_id
          }
          
          // CRÍTICO: Si no se encuentra remitente_id, NO usar currentUserId como fallback
          // Esto causaría que todos los mensajes parezcan ser del usuario actual
          if (remitenteIdOriginal === null || remitenteIdOriginal === undefined) {
            console.error('[Chat] ⚠️⚠️⚠️ ERROR CRÍTICO: remitente_id no encontrado en mensaje:', {
              mensajeId: mensaje.id || mensajeAttrs.id,
              mensajeCompleto: JSON.stringify(mensaje).substring(0, 400),
              mensajeAttrsCompleto: JSON.stringify(mensajeAttrs).substring(0, 400),
            })
          }
          
          // Normalizar a string de forma explícita
          const remitenteIdNormalizado = remitenteIdOriginal !== null && remitenteIdOriginal !== undefined 
            ? String(remitenteIdOriginal).trim() 
            : ''

          // Log detallado para cada mensaje al mapearlo
          console.error('[Chat] 📝 Mapeando mensaje desde API:', {
            mensajeId: mensaje.id || mensajeAttrs.id,
            mensajeRaw: JSON.stringify(mensaje).substring(0, 300),
            mensajeAttrsRaw: JSON.stringify(mensajeAttrs).substring(0, 300),
            remitente_id_original: remitenteIdOriginal,
            remitente_id_tipo: typeof remitenteIdOriginal,
            remitente_id_normalizado: remitenteIdNormalizado,
            cliente_id: mensajeAttrs.cliente_id || mensaje.cliente_id || mensaje.data?.cliente_id,
            currentUserId,
            texto: (mensajeAttrs.texto || mensaje.texto || mensaje.data?.texto || '').substring(0, 30),
          })

          return {
            id: String(mensaje.id || mensajeAttrs.id || mensaje.data?.id),
            senderId: remitenteIdNormalizado,
            text: mensajeAttrs.texto || mensaje.texto || mensaje.data?.texto || '',
            time: fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          }
        })

        mensajesMapeados.sort((a, b) => {
          const idA = parseInt(a.id) || 0
          const idB = parseInt(b.id) || 0
          return idA - idB
        })

        console.log('[Chat] ✅ Mensajes mapeados y ordenados:', mensajesMapeados.length)
        setMessages(mensajesMapeados)
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } catch (err) {
        console.error('[Chat] ❌ Error al cargar mensajes:', err)
      }
    }

    cargarMensajes()

    // Configurar Pusher
    const pusher = getPusherClient()
    if (!pusher) {
      console.warn('Pusher no disponible')
      return
    }

    // Crear nombre de canal
    const remitenteIdNum = parseInt(currentUserId, 10)
    const colaboradorIdNum = parseInt(currentContact.id, 10)
    const idsOrdenados = [remitenteIdNum, colaboradorIdNum].sort((a, b) => a - b)
    const channelName = `private-chat-${idsOrdenados[0]}-${idsOrdenados[1]}`

    // Suscribirse al canal
    console.log('[Chat] 📡 Suscribiéndose a canal Pusher:', channelName)
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    // Escuchar cuando la suscripción sea exitosa
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Chat] ✅ Suscrito exitosamente a canal:', channelName)
    })

    // Escuchar errores de suscripción
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[Chat] ❌ Error al suscribirse a canal:', channelName, error)
    })

    // Escuchar nuevos mensajes
    channel.bind('new-message', (data: any) => {
      console.error('[Chat] 📨 Mensaje recibido vía Pusher:', {
        id: data.id,
        remitente_id: data.remitente_id,
        cliente_id: data.cliente_id,
        texto: data.texto?.substring(0, 30),
        currentUserId,
        currentContactId: currentContact.id,
        channelName,
      })

      // Validar que el mensaje sea para esta conversación
      const mensajeRemitenteId = parseInt(String(data.remitente_id || ''), 10)
      const mensajeClienteId = parseInt(String(data.cliente_id || ''), 10)
      const currentUserIdNum = parseInt(String(currentUserId || ''), 10)
      const currentContactIdNum = parseInt(String(currentContact.id || ''), 10)

      // Validar que el mensaje sea para esta conversación
      // El mensaje puede venir en dos direcciones:
      // 1. Usuario actual envía a contacto: remitente_id = currentUserId, cliente_id = currentContactId
      // 2. Contacto envía a usuario actual: remitente_id = currentContactId, cliente_id = currentUserId
      const esRemitente = mensajeRemitenteId === currentUserIdNum && mensajeClienteId === currentContactIdNum
      const esCliente = mensajeRemitenteId === currentContactIdNum && mensajeClienteId === currentUserIdNum
      const esParaEstaConversacion = esRemitente || esCliente

      console.error('[Chat] 🔍 Validando mensaje:', {
        mensajeRemitenteId,
        mensajeClienteId,
        currentUserIdNum,
        currentContactIdNum,
        esRemitente,
        esCliente,
        esParaEstaConversacion,
        channelName,
      })

      if (!esParaEstaConversacion) {
        console.error('[Chat] ⚠️ Mensaje ignorado - no es para esta conversación:', {
          mensajeRemitenteId,
          mensajeClienteId,
          currentUserIdNum,
          currentContactIdNum,
          esParaEstaConversacion,
        })
        return
      }

      console.error('[Chat] ✅ Mensaje válido, agregando a la conversación')

      // Normalizar remitente_id a string de forma explícita
      const remitenteIdNormalizado = String(data.remitente_id || '').trim()
      
      // Log MUY detallado del mensaje recibido vía Pusher
      console.error('[Chat] 📝 Creando nuevo mensaje desde Pusher:', {
        dataRaw: JSON.stringify(data).substring(0, 300),
        id: String(data.id),
        remitente_id_original: data.remitente_id,
        remitente_id_tipo: typeof data.remitente_id,
        remitente_id_normalizado: remitenteIdNormalizado,
        cliente_id_original: data.cliente_id,
        cliente_id_tipo: typeof data.cliente_id,
        currentUserId,
        currentUserIdType: typeof currentUserId,
        currentContactId: currentContact.id,
        esDelUsuarioActual: remitenteIdNormalizado === String(currentUserId || ''),
        comparacion: `${remitenteIdNormalizado} === ${String(currentUserId || '')} = ${remitenteIdNormalizado === String(currentUserId || '')}`,
      })

      const nuevoMensaje: MessageType = {
        id: String(data.id),
        senderId: remitenteIdNormalizado,
        text: data.texto || '',
        time: new Date(data.fecha || Date.now()).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => {
        // Evitar duplicados verificando por ID
        const existe = prev.some((m) => String(m.id) === String(nuevoMensaje.id))
        if (existe) {
          console.error('[Chat] ⚠️ Mensaje duplicado ignorado:', nuevoMensaje.id)
          return prev
        }
        
        // Crear nuevo array con el mensaje agregado
        const nuevos = [...prev, nuevoMensaje]
        
        // Ordenar por ID numérico
        nuevos.sort((a, b) => {
          const idA = parseInt(a.id) || 0
          const idB = parseInt(b.id) || 0
          return idA - idB
        })
        
        console.error('[Chat] ✅ Mensaje agregado al estado. Total mensajes:', nuevos.length, 'ID:', nuevoMensaje.id, 'Estado anterior:', prev.length)
        return nuevos
      })

      // Forzar scroll después de que React actualice el DOM
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    })

    // Cleanup solo del canal de la conversación actual
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [currentContact, currentUserId])

  // Cleanup de todos los canales cuando el componente se desmonta
  useEffect(() => {
    return () => {
      allChannelsRef.current.forEach((channel, channelName) => {
        console.error('[Chat] 🔌 Desuscribiéndose de canal global:', channelName)
        channel.unbind_all()
        channel.unsubscribe()
      })
      allChannelsRef.current.clear()
    }
  }, [])

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentContact || isSending || !currentUserId) return

    const texto = messageText.trim()
    const remitenteIdNum = parseInt(currentUserId, 10)
    const colaboradorIdNum = parseInt(currentContact.id, 10)

    if (!remitenteIdNum || !colaboradorIdNum || isNaN(remitenteIdNum) || isNaN(colaboradorIdNum)) {
      setError('Error: IDs inválidos')
      return
    }

    // Mensaje optimista
    const mensajeTemporal: MessageType = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      text: texto,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, mensajeTemporal])
    setMessageText('')
    setIsSending(true)
    setError(null)

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    try {
      console.log('[Chat] 📤 Enviando mensaje:', {
        texto: texto.substring(0, 50),
        remitente_id: remitenteIdNum,
        colaborador_id: colaboradorIdNum,
      })

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
        console.error('[Chat] ❌ Error al enviar mensaje:', response.status, errorData)
        throw new Error(errorData.error || 'Error al enviar mensaje')
      }

      const responseData = await response.json()
      console.log('[Chat] ✅ Mensaje enviado exitosamente:', responseData)

      // Remover mensaje temporal cuando llegue el real vía Pusher
      // Esperar un poco antes de remover para que Pusher tenga tiempo de emitir
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')))
      }, 500)
    } catch (err: any) {
      console.error('[Chat] ❌ Error al enviar mensaje:', err)
      setError(err.message || 'Error al enviar mensaje')
      setMessageText(texto)
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
                  // Normalizar IDs a strings para comparación consistente
                  const messageSenderId = String(message.senderId || '').trim()
                  const currentUserIdStr = (currentUserId ? String(currentUserId) : '').trim()
                  
                  // Comparación estricta de strings
                  const isFromCurrentUser = currentUserIdStr !== '' && 
                                          messageSenderId !== '' && 
                                          messageSenderId === currentUserIdStr

                  // Log MUY detallado de depuración para cada mensaje
                  if (typeof window !== 'undefined') {
                    console.error('[Chat] 🎨 Renderizando mensaje:', {
                      mensajeCompleto: JSON.stringify(message),
                      id: message.id,
                      senderId: messageSenderId,
                      senderIdOriginal: message.senderId,
                      senderIdType: typeof message.senderId,
                      currentUserId: currentUserIdStr,
                      currentUserIdOriginal: currentUserId,
                      currentUserIdType: typeof currentUserId,
                      isFromCurrentUser,
                      tieneCurrentContact: !!currentContact,
                      currentContactId: currentContact?.id,
                      texto: message.text?.substring(0, 30),
                      comparacion: `${messageSenderId} === ${currentUserIdStr} = ${messageSenderId === currentUserIdStr}`,
                      longitudSenderId: messageSenderId.length,
                      longitudCurrentUserId: currentUserIdStr.length,
                      sonIguales: messageSenderId === currentUserIdStr,
                    })
                  }

                  // SIEMPRE renderizar el mensaje - si no es del usuario actual, es del otro usuario
                  if (isFromCurrentUser) {
                    // Mensaje del usuario actual - DERECHA, AZUL
                    return (
                      <div key={message.id} className="d-flex align-items-start gap-2 my-3 text-end chat-item justify-content-end">
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
                    )
                  } else {
                    // Mensaje del otro usuario - IZQUIERDA, AMARILLO
                    return (
                      <div key={message.id} className="d-flex align-items-start gap-2 my-3 chat-item">
                        {currentContact?.avatar ? (
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
                              {currentContact?.name?.charAt(0)?.toUpperCase() || '?'}
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
                    )
                  }
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
