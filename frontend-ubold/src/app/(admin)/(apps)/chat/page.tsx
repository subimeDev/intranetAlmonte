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

const Page = () => {
  const { colaborador, persona } = useAuth()
  const currentUserId = colaborador?.id ? String(colaborador.id) : null

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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Cargar mensajes y polling
  useEffect(() => {
    if (!currentContact || !currentUserId) {
      setMessages([])
      setLastMessageDate(null)
      return
    }

    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    const cargarMensajes = async (soloNuevos: boolean = false) => {
      try {
        const query = new URLSearchParams({
          colaborador_id: currentContact.id,
          remitente_id: currentUserId,
        })

        if (soloNuevos && lastMessageDate) {
          // Aumentar margen a 10 segundos para asegurar que se capturen mensajes nuevos
          // Esto es crítico para que los mensajes aparezcan entre cuentas diferentes
          const fechaConMargen = new Date(new Date(lastMessageDate).getTime() - 10000).toISOString()
          query.append('ultima_fecha', fechaConMargen)
        }

        const response = await fetch(`/api/chat/mensajes?${query.toString()}`)
        if (!response.ok) {
          if (response.status === 404 || response.status === 502 || response.status === 504) {
            return
          }
          throw new Error('Error al cargar mensajes')
        }

        const data = await response.json()
        const mensajesData = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : [])

        // Mapear mensajes manteniendo referencia a los datos originales para ordenar por fecha
        const mensajesConFecha = mensajesData.map((mensaje: any) => {
          const texto = mensaje.texto || mensaje.attributes?.texto || ''
          const remitenteId = mensaje.remitente_id || mensaje.attributes?.remitente_id || 1
          const fecha = mensaje.fecha || mensaje.attributes?.fecha || mensaje.createdAt || Date.now()
          const fechaObj = new Date(fecha)

          return {
            id: String(mensaje.id || mensaje.attributes?.id || ''),
            senderId: String(remitenteId),
            text: texto,
            time: fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            fechaOriginal: fecha, // Guardar fecha original para ordenar
          }
        })

        // Ordenar por fecha (más confiable que por ID)
        mensajesConFecha.sort((a, b) => {
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
            todos.sort((a, b) => {
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

        // Actualizar última fecha siempre (incluso si no hay mensajes nuevos)
        // Esto asegura que el polling funcione correctamente
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
          }
        } else if (!soloNuevos && lastMessageDate) {
          // Si no hay mensajes y es carga inicial, mantener la fecha anterior
          // Esto evita que el polling se rompa
        } else if (!lastMessageDate) {
          // Si nunca ha habido una fecha, usar la fecha actual menos 1 minuto para asegurar que se capturen mensajes recientes
          const fechaInicial = new Date(Date.now() - 60000).toISOString()
          setLastMessageDate(fechaInicial)
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

    // Cargar mensajes iniciales sin filtro de fecha
    cargarMensajes(false)
    
    // Configurar polling cada 2 segundos para mejor sincronización entre cuentas
    // Esto es crítico para que los mensajes aparezcan rápidamente en ambas cuentas
    pollingIntervalRef.current = setInterval(() => {
      cargarMensajes(true)
    }, 2000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [currentContact, currentUserId]) // Removido lastMessageDate de dependencias para evitar loops

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentContact || isSending || !currentUserId) return

    const texto = messageText.trim()
    const textoOriginal = messageText // Guardar para restaurar en caso de error
    const remitenteIdNum = parseInt(currentUserId, 10)
    const colaboradorIdNum = parseInt(currentContact.id, 10)
    
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
      
      // Obtener el ID del mensaje guardado
      let mensajeGuardado: any = null
      if (responseData.data) {
        const data = Array.isArray(responseData.data) ? responseData.data[0] : responseData.data
        mensajeGuardado = data?.attributes || data || null
      }
      
      // Forzar recarga inmediata de mensajes para obtener el mensaje real y asegurar sincronización
      // Esto es crítico para que el mensaje aparezca en ambas cuentas
      try {
        const query = new URLSearchParams({
          colaborador_id: currentContact.id,
          remitente_id: currentUserId,
        })
        
        const reloadResponse = await fetch(`/api/chat/mensajes?${query.toString()}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const mensajesData = Array.isArray(reloadData.data) ? reloadData.data : (reloadData.data ? [reloadData.data] : [])
          
          const mensajesMapeados: MessageType[] = mensajesData.map((mensaje: any) => {
            const textoMsg = mensaje.texto || ''
            const remitenteIdMsg = mensaje.remitente_id || 1
            const fecha = mensaje.fecha ? new Date(mensaje.fecha) : new Date(mensaje.createdAt || Date.now())
            
            return {
              id: String(mensaje.id),
              senderId: String(remitenteIdMsg),
              text: textoMsg,
              time: fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            }
          })
          
          // Ordenar por fecha (más confiable que por ID)
          mensajesMapeados.sort((a, b) => {
            // Buscar la fecha en los mensajes originales
            const msgA = mensajesData.find((m: any) => String(m.id || m.attributes?.id) === a.id)
            const msgB = mensajesData.find((m: any) => String(m.id || m.attributes?.id) === b.id)
            const fechaA = msgA?.fecha || msgA?.createdAt || msgA?.attributes?.fecha || '0'
            const fechaB = msgB?.fecha || msgB?.createdAt || msgB?.attributes?.fecha || '0'
            return new Date(fechaA).getTime() - new Date(fechaB).getTime()
          })
          
          // Remover mensajes temporales y actualizar con los reales
          setMessages(mensajesMapeados.filter(m => !m.id.startsWith('temp-')))
          
            // Actualizar última fecha para el polling (usar el mensaje más reciente por fecha)
            if (mensajesMapeados.length > 0) {
              // Encontrar el mensaje más reciente
              let mensajeMasReciente = mensajesData[0]
              let fechaMasReciente = new Date(mensajeMasReciente?.fecha || mensajeMasReciente?.createdAt || mensajeMasReciente?.attributes?.fecha || 0).getTime()
              
              mensajesData.forEach((msg: any) => {
                const fecha = new Date(msg?.fecha || msg?.createdAt || msg?.attributes?.fecha || 0).getTime()
                if (fecha > fechaMasReciente) {
                  fechaMasReciente = fecha
                  mensajeMasReciente = msg
                }
              })
              
              const ultimaFecha = mensajeMasReciente?.fecha || mensajeMasReciente?.createdAt || mensajeMasReciente?.attributes?.fecha
              if (ultimaFecha) {
                setLastMessageDate(ultimaFecha)
              }
            }
          
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      } catch (reloadErr) {
        console.error('Error al recargar mensajes después de enviar:', reloadErr)
        // Si falla, el polling capturará el mensaje en los próximos 3 segundos
      }
      
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
