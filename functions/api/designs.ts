interface Env {
  DB: D1Database;
}

// CORS ヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS リクエスト（CORS プリフライト）
export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders
  });
}

// 設計一覧取得 (GET /api/designs)
export async function onRequestGet(context: { env: Env }) {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT id, title, created_at, updated_at FROM designs ORDER BY updated_at DESC'
    ).all();
    
    return new Response(JSON.stringify({
      success: true,
      designs: results
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Designs fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch designs'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 設計保存 (POST /api/designs)
export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { title, data } = await context.request.json();
    
    if (!title || !data) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title and data are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const id = crypto.randomUUID();
    const dataString = JSON.stringify(data);
    const now = new Date().toISOString();
    
    await context.env.DB.prepare(
      'INSERT INTO designs (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, title, dataString, now, now).run();
    
    return new Response(JSON.stringify({
      success: true,
      design: { id, title, created_at: now, updated_at: now }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Design save error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save design'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}