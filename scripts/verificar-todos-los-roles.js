/**
 * Script para verificar y actualizar permisos de chat en todos los roles
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
    return null
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
    // Probar roles comunes (1 = Authenticated, 2 = Public)
    const roleIds = [1, 2]
    
    for (const roleId of roleIds) {
      console.log(`\n🔍 Verificando rol ID: ${roleId}...`)
      const roleResponse = await getRole(roleId)
      
      if (!roleResponse || !roleResponse.role) {
        console.log(`   ⚠️  Rol ${roleId} no existe, saltando...`)
        continue
      }

      const role = roleResponse.role
      console.log(`   ✅ Rol: ${role.name} (Tipo: ${role.type})`)

      const currentChatPerms = role.permissions?.['api::intranet-chat']?.controllers?.['intranet-chat']
      const needsUpdate = !currentChatPerms || 
        !currentChatPerms.find?.enabled || 
        !currentChatPerms.findOne?.enabled || 
        !currentChatPerms.create?.enabled

      if (needsUpdate) {
        console.log(`   📝 Actualizando permisos de intranet-chat...`)
        
        if (!role.permissions) role.permissions = {}
        if (!role.permissions['api::intranet-chat']) role.permissions['api::intranet-chat'] = { controllers: {} }
        if (!role.permissions['api::intranet-chat'].controllers) role.permissions['api::intranet-chat'].controllers = {}
        
        role.permissions['api::intranet-chat'].controllers['intranet-chat'] = {
          find: { enabled: true, policy: '' },
          findOne: { enabled: true, policy: '' },
          create: { enabled: true, policy: '' },
          update: { enabled: true, policy: '' },
          delete: { enabled: true, policy: '' },
        }

        await updateRole(role.id, {
          name: role.name,
          description: role.description,
          type: role.type,
          permissions: role.permissions,
        })

        console.log(`   ✅ Permisos actualizados para ${role.name}`)
      } else {
        console.log(`   ✅ Permisos de intranet-chat ya están habilitados`)
      }
    }

    console.log('\n🎉 Verificación completada!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()

