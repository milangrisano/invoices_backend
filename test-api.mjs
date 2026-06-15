/**
 * Automated API Tester for Invoices & Products Backend
 * Runs full integration checks across all endpoints and auth strategies.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HERB_API_KEY = 'herb_sec_key_v1_8cfc7a72671340a6b107e6e5898d9ba8';

async function runTests() {
  console.log('===================================================');
  console.log('🚀 STARTING COMPREHENSIVE BACKEND API TESTER');
  console.log('===================================================');

  let adminAccessToken = '';
  let adminRefreshToken = '';
  let createdProductId = '';
  let generatedApiKeyId = '';

  const results = [];

  const recordResult = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`${passed ? '✅' : '❌'} ${name} ${details ? `(${details})` : ''}`);
  };

  try {
    // -----------------------------------------------------------------
    // FASE 1: Autenticación JWT (admin@invoices.local)
    // -----------------------------------------------------------------
    console.log('\n🔑 FASE 1: Autenticación JWT');
    
    // Test 1: POST /auth/login - Credenciales válidas
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@invoices.local',
        password: 'adminSecurePassword123!',
      }),
    });
    
    if (loginRes.ok) {
      const data = await loginRes.json();
      adminAccessToken = data.accessToken;
      adminRefreshToken = data.refreshToken;
      recordResult('POST /auth/login (Credenciales Válidas)', true, 'Tokens generados');
    } else {
      recordResult('POST /auth/login (Credenciales Válidas)', false, `Status ${loginRes.status}`);
    }

    // Test 2: POST /auth/login - Credenciales inválidas
    const loginFailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@invoices.local',
        password: 'wrong_password',
      }),
    });
    recordResult('POST /auth/login (Credenciales Inválidas - Rechazo 401)', loginFailRes.status === 401);

    // Test 3: POST /auth/refresh - Rotación de Token
    if (adminRefreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: adminRefreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        adminAccessToken = data.accessToken; // Guardamos el nuevo access token rotado
        adminRefreshToken = data.refreshToken; // Guardamos el nuevo refresh token
        recordResult('POST /auth/refresh (Rotación de Token)', true);
      } else {
        recordResult('POST /auth/refresh (Rotación de Token)', false, `Status ${refreshRes.status}`);
      }
    } else {
      recordResult('POST /auth/refresh (Rotación de Token)', false, 'No se obtuvo Refresh Token');
    }

    // -----------------------------------------------------------------
    // FASE 2: Autenticación de Servicios Externos (API Key de Herb)
    // -----------------------------------------------------------------
    console.log('\n🔑 FASE 2: Integración con API Key (Herb)');

    // Test 4: GET /products - Listar productos usando API Key
    const listProductsApiKeyRes = await fetch(`${BASE_URL}/products`, {
      method: 'GET',
      headers: { 'x-api-key': HERB_API_KEY },
    });
    if (listProductsApiKeyRes.ok) {
      const data = await listProductsApiKeyRes.json();
      recordResult('GET /products (Auth: API Key - Listar Productos)', true, `${data.total} productos encontrados`);
    } else {
      recordResult('GET /products (Auth: API Key - Listar Productos)', false, `Status ${listProductsApiKeyRes.status}`);
    }

    // Test 5: POST /products - Crear producto con API Key
    const createProductRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HERB_API_KEY,
      },
      body: JSON.stringify({
        name: 'Apple iPad Pro M4',
        description: 'New iPad with ultra-thin design and tandem OLED display',
        price: 1099.99,
      }),
    });
    if (createProductRes.ok) {
      const product = await createProductRes.json();
      createdProductId = product.id;
      recordResult('POST /products (Auth: API Key - Crear Producto)', true, `UUID: ${createdProductId}`);
    } else {
      recordResult('POST /products (Auth: API Key - Crear Producto)', false, `Status ${createProductRes.status}`);
    }

    // Test 6: PATCH /products/:id - Editar producto con API Key
    if (createdProductId) {
      const patchRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': HERB_API_KEY,
        },
        body: JSON.stringify({
          name: 'Apple iPad Pro M4 (Updated)',
          price: 1049.99,
        }),
      });
      recordResult('PATCH /products/:id (Auth: API Key - Editar Producto)', patchRes.ok);
    } else {
      recordResult('PATCH /products/:id (Auth: API Key - Editar Producto)', false, 'No se pudo crear producto');
    }

    // Test 7: DELETE /products/:id - Intentar borrar producto con API Key (DEBE SER RECHAZADO)
    if (createdProductId) {
      const deleteApiKeyRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { 'x-api-key': HERB_API_KEY },
      });
      recordResult('DELETE /products/:id (Auth: API Key - Rechazo 403 por seguridad)', deleteApiKeyRes.status === 403);
    } else {
      recordResult('DELETE /products/:id (Auth: API Key - Rechazo 403 por seguridad)', false, 'No se pudo crear producto');
    }

    // -----------------------------------------------------------------
    // FASE 3: Permisos de Roles JWT e Integridad de Base de Datos
    // -----------------------------------------------------------------
    console.log('\n🔒 FASE 3: Permisos de Roles JWT e Integridad');

    // Test 8: DELETE /products/:id - Desactivación lógica con Admin JWT (DEBE FUNCIONAR)
    if (createdProductId && adminAccessToken) {
      const deleteJwtRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminAccessToken}` },
      });
      recordResult('DELETE /products/:id (Auth: Admin JWT - Desactivación Lógica)', deleteJwtRes.ok);
    } else {
      recordResult('DELETE /products/:id (Auth: Admin JWT - Desactivación Lógica)', false, 'Falta Token o ID');
    }

    // Test 9: GET /products/:id - Comprobar que el producto desactivado ya no es accesible (404)
    if (createdProductId) {
      const checkInactiveRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
        method: 'GET',
        headers: { 'x-api-key': HERB_API_KEY },
      });
      recordResult('GET /products/:id (Verificar Baja Lógica - Retorna 404)', checkInactiveRes.status === 404);
    }

    // -----------------------------------------------------------------
    // FASE 4: Gestión de API Keys (Admin JWT Only)
    // -----------------------------------------------------------------
    console.log('\n🔑 FASE 4: Gestión de API Keys (Admin Only)');

    // Test 10: POST /api-keys - Generar nueva clave de API
    if (adminAccessToken) {
      const createApiKeyRes = await fetch(`${BASE_URL}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          name: 'N8N Integration Key',
          description: 'Key generated for local n8n workflows',
          expiresIn: '90d',
        }),
      });
      if (createApiKeyRes.ok) {
        const data = await createApiKeyRes.json();
        generatedApiKeyId = data.entity.id;
        recordResult('POST /api-keys (Generar Nueva Key)', true, `ID: ${generatedApiKeyId}`);
      } else {
        recordResult('POST /api-keys (Generar Nueva Key)', false, `Status ${createApiKeyRes.status}`);
      }
    } else {
      recordResult('POST /api-keys (Generar Nueva Key)', false, 'Falta Token de Admin');
    }

    // Test 11: GET /api-keys - Listar llaves de API
    if (adminAccessToken) {
      const listKeysRes = await fetch(`${BASE_URL}/api-keys`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminAccessToken}` },
      });
      if (listKeysRes.ok) {
        const keys = await listKeysRes.json();
        const hasHash = keys.some(k => k.keyHash !== undefined);
        recordResult('GET /api-keys (Listar Keys y comprobar que NO se expone hash)', listKeysRes.ok && !hasHash);
      } else {
        recordResult('GET /api-keys (Listar Keys)', false, `Status ${listKeysRes.status}`);
      }
    }

    // Test 12: DELETE /api-keys/:id - Revocar clave de API
    if (generatedApiKeyId && adminAccessToken) {
      const deleteKeyRes = await fetch(`${BASE_URL}/api-keys/${generatedApiKeyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminAccessToken}` },
      });
      recordResult('DELETE /api-keys/:id (Revocar Key)', deleteKeyRes.ok);
    } else {
      recordResult('DELETE /api-keys/:id (Revocar Key)', false, 'Falta Token o ID');
    }

    // -----------------------------------------------------------------
    // FASE 5: Cierre de Sesión (Logout)
    // -----------------------------------------------------------------
    console.log('\n🔒 FASE 5: Cierre de Sesión (Logout)');

    if (adminRefreshToken && adminAccessToken) {
      const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({ refreshToken: adminRefreshToken }),
      });
      recordResult('POST /auth/logout (Cierre de Sesión seguro)', logoutRes.ok);
    } else {
      recordResult('POST /auth/logout (Cierre de Sesión seguro)', false, 'Falta Refresh Token');
    }

  } catch (error) {
    console.error('❌ ERROR FATAL DURANTE LAS PRUEBAS:', error.message);
  }

  // -----------------------------------------------------------------
  // REPORTE FINAL DE SCORECARD
  // -----------------------------------------------------------------
  console.log('\n===================================================');
  console.log('🏆 REPORT SCORECARD DE PRUEBAS AUTOMATIZADAS');
  console.log('===================================================');
  
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const rate = ((passed / total) * 100).toFixed(1);

  results.forEach((r, i) => {
    console.log(`${(i + 1).toString().padStart(2, ' ')}. [${r.passed ? 'PASSED' : 'FAILED'}] - ${r.name}`);
  });

  console.log('---------------------------------------------------');
  console.log(`TOTAL PRUEBAS EJECUTADAS : ${total}`);
  console.log(`TOTAL PRUEBAS PASADAS    : ${passed}`);
  console.log(`TASA DE ÉXITO            : ${rate}%`);
  console.log('===================================================');

  if (passed === total) {
    console.log('🔥 ¡FELICIDADES! ¡TODO EL BACKEND COMPILÓ Y FUNCIONA AL 100% PERFECTO!');
  } else {
    console.log('⚠️ ALGUNAS PRUEBAS FALLARON. POR FAVOR REVISA EL REPORTE SUPERIOR.');
  }
  console.log('===================================================\n');
}

runTests();
