/**
 * Script para configurar permisos de Strapi para intranet-chat
 * Asegura que los usuarios puedan leer y crear mensajes de chat
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.moraleja.cl'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '13ffe7b786754b89a8636b00c8ae7c968a02fd03848fee117bc20b43c820d39b946bd7e3399f4ce3e9345d698a5ed4183509a93569691a70d1dd0302bdcba694348112a70637ee73ad63db9a2e3c960bb75e949daf6385f87f0442529c70f61f6e107eede650eb506b0c1be0c6fd580dd59c8be1b8fd5ba4e7f0d9f7edb685d3'

async function getRoles() {
  // Intentar con el endpoint de admin primero
  const response = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Error al obtener roles: ${response.status} ${response.statusText}`)
    console.error(`Respuesta: ${errorText}`)
    throw new Error(`Error al obtener roles: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

async function updateRolePermissions(roleId, permissions) {
  const response = await fetch(`${STRAPI_URL}/api/users-permissions/roles/${roleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      ...permissions,
      // Asegurar que se envíe el objeto completo del rol
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Error al actualizar permisos: ${response.status} ${response.statusText}`)
    console.error(`Respuesta: ${errorText}`)
    throw new Error(`Error al actualizar permisos del rol ${roleId}: ${response.status} ${response.statusText}\n${errorText}`)
  }

  return await response.json()
}

async function main() {
  try {
    console.log('🔍 Obteniendo roles...')
    const rolesResponse = await getRoles()
    
    if (!rolesResponse || !Array.isArray(rolesResponse)) {
      throw new Error('Respuesta de roles inválida')
    }

    // La respuesta puede venir en diferentes formatos
    let roles = []
    if (Array.isArray(rolesResponse)) {
      roles = rolesResponse
    } else if (rolesResponse.data && Array.isArray(rolesResponse.data)) {
      roles = rolesResponse.data
    } else {
      throw new Error('Formato de respuesta de roles no reconocido')
    }

    console.log(`📋 Encontrados ${roles.length} roles`)
    
    // Buscar roles authenticated y public
    const rolesToUpdate = roles.filter(role => 
      role.type === 'authenticated' || role.type === 'public' || 
      role.name === 'Authenticated' || role.name === 'Public' ||
      (role.name && role.name.toLowerCase().includes('authenticated')) ||
      (role.name && role.name.toLowerCase().includes('public'))
    )

    if (rolesToUpdate.length === 0) {
      console.log('⚠️  No se encontraron roles authenticated o public')
      console.log('📋 Roles disponibles:', roles.map(r => ({ id: r.id, name: r.name, type: r.type })))
      return
    }

    for (const role of rolesToUpdate) {
      console.log(`\n📋 Configurando permisos para rol: ${role.name} (ID: ${role.id}, Tipo: ${role.type})`)
      
      // Obtener permisos actuales del rol
      const currentPermissions = role.permissions || {}
      
      // Configurar permisos para intranet-chat
      if (!currentPermissions['api::intranet-chat.intranet-chat']) {
        currentPermissions['api::intranet-chat.intranet-chat'] = {
          controllers: {
            'intranet-chat': {
              find: { enabled: true, policy: '' },
              findOne: { enabled: true, policy: '' },
              create: { enabled: true, policy: '' },
              update: { enabled: true, policy: '' },
              delete: { enabled: true, policy: '' },
            },
          },
        }
      } else {
        // Actualizar permisos existentes
        const chatPerms = currentPermissions['api::intranet-chat.intranet-chat']
        if (!chatPerms.controllers) {
          chatPerms.controllers = {}
        }
        if (!chatPerms.controllers['intranet-chat']) {
          chatPerms.controllers['intranet-chat'] = {}
        }
        
        // Habilitar todos los métodos necesarios
        chatPerms.controllers['intranet-chat'].find = { enabled: true, policy: '' }
        chatPerms.controllers['intranet-chat'].findOne = { enabled: true, policy: '' }
        chatPerms.controllers['intranet-chat'].create = { enabled: true, policy: '' }
        chatPerms.controllers['intranet-chat'].update = { enabled: true, policy: '' }
        chatPerms.controllers['intranet-chat'].delete = { enabled: true, policy: '' }
      }

      console.log('💾 Guardando permisos actualizados...')
      const result = await updateRolePermissions(role.id, currentPermissions)
      
      console.log(`✅ Permisos actualizados para rol: ${role.name}`)
    }

    console.log('\n✅ Permisos actualizados exitosamente!')
    console.log('📝 Resumen de permisos configurados:')
    console.log('   - find: Habilitado (leer mensajes)')
    console.log('   - findOne: Habilitado (leer un mensaje)')
    console.log('   - create: Habilitado (crear mensajes)')
    console.log('   - update: Habilitado (actualizar mensajes)')
    console.log('   - delete: Habilitado (eliminar mensajes)')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()

