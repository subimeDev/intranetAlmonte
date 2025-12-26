/**
 * Script para actualizar permisos de chat directamente usando el endpoint que funciona
 * Usa /api/users-permissions/roles/{id} en lugar de /api/users-permissions/roles
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.moraleja.cl'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '13ffe7b786754b89a8636b00c8ae7c968a02fd03848fee117bc20b43c820d39b946bd7e3399f4ce3e9345d698a5ed4183509a93569691a70d1dd0302bdcba694348112a70637ee73ad63db9a2e3c960bb75e949daf6385f87f0442529c70f61f6e107eede650eb506b0c1be0c6fd580dd59c8be1b8fd5ba4e7f0d9f7edb685d3'

async function getRole(roleId) {
  const response = await fetch(`${STRAPI_URL}/api/users-permissions/roles/${roleId}`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al obtener rol ${roleId}: ${response.status} ${response.statusText}\n${errorText}`)
  }

  return await response.json()
}

async function updateRole(roleId, roleData) {
  const response = await fetch(`${STRAPI_URL}/api/users-permissions/roles/${roleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roleData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al actualizar rol ${roleId}: ${response.status} ${response.statusText}\n${errorText}`)
  }

  return await response.json()
}

async function main() {
  try {
    console.log('🔍 Obteniendo rol Authenticated (ID: 1)...')
    const roleResponse = await getRole(1)
    const role = roleResponse.role

    if (!role) {
      throw new Error('No se encontró el rol')
    }

    console.log(`✅ Rol obtenido: ${role.name} (ID: ${role.id})`)
    console.log(`📋 Permisos actuales de intranet-chat:`)
    
    const currentChatPerms = role.permissions?.['api::intranet-chat']?.controllers?.['intranet-chat']
    if (currentChatPerms) {
      console.log('   find:', currentChatPerms.find?.enabled ? '✅' : '❌')
      console.log('   findOne:', currentChatPerms.findOne?.enabled ? '✅' : '❌')
      console.log('   create:', currentChatPerms.create?.enabled ? '✅' : '❌')
      console.log('   update:', currentChatPerms.update?.enabled ? '✅' : '❌')
      console.log('   delete:', currentChatPerms.delete?.enabled ? '✅' : '❌')
    } else {
      console.log('   ⚠️  No se encontraron permisos de intranet-chat')
    }

    // Asegurar que los permisos de intranet-chat estén habilitados
    if (!role.permissions) {
      role.permissions = {}
    }
    if (!role.permissions['api::intranet-chat']) {
      role.permissions['api::intranet-chat'] = { controllers: {} }
    }
    if (!role.permissions['api::intranet-chat'].controllers) {
      role.permissions['api::intranet-chat'].controllers = {}
    }
    if (!role.permissions['api::intranet-chat'].controllers['intranet-chat']) {
      role.permissions['api::intranet-chat'].controllers['intranet-chat'] = {}
    }

    // Habilitar todos los permisos necesarios
    role.permissions['api::intranet-chat'].controllers['intranet-chat'] = {
      find: { enabled: true, policy: '' },
      findOne: { enabled: true, policy: '' },
      create: { enabled: true, policy: '' },
      update: { enabled: true, policy: '' },
      delete: { enabled: true, policy: '' },
    }

    console.log('\n💾 Actualizando permisos...')
    const updated = await updateRole(role.id, {
      name: role.name,
      description: role.description,
      type: role.type,
      permissions: role.permissions,
    })

    console.log('✅ Permisos actualizados exitosamente!')
    console.log('\n📝 Permisos de intranet-chat ahora están:')
    const updatedChatPerms = updated.role?.permissions?.['api::intranet-chat']?.controllers?.['intranet-chat']
    if (updatedChatPerms) {
      console.log('   find:', updatedChatPerms.find?.enabled ? '✅ HABILITADO' : '❌ DESHABILITADO')
      console.log('   findOne:', updatedChatPerms.findOne?.enabled ? '✅ HABILITADO' : '❌ DESHABILITADO')
      console.log('   create:', updatedChatPerms.create?.enabled ? '✅ HABILITADO' : '❌ DESHABILITADO')
      console.log('   update:', updatedChatPerms.update?.enabled ? '✅ HABILITADO' : '❌ DESHABILITADO')
      console.log('   delete:', updatedChatPerms.delete?.enabled ? '✅ HABILITADO' : '❌ DESHABILITADO')
    }

    console.log('\n🎉 ¡Listo! Los usuarios autenticados ahora pueden usar el chat.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()

