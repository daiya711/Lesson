interface Env {
  DB: D1Database;
}

// CORS ヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS リクエスト（CORS プリフライト）
export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders
  });
}

// 設計詳細取得 (GET /api/designs/:id)
export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  
  try {
    const result = await context.env.DB.prepare(
      'SELECT * FROM designs WHERE id = ?'
    ).bind(id).first();
    
    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Design not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      design: {
        ...result,
        data: JSON.parse(result.data as string)
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Design fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch design'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 設計更新 (PUT /api/designs/:id)
export async function onRequestPut(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  
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
    
    const dataString = JSON.stringify(data);
    const now = new Date().toISOString();
    
    const result = await context.env.DB.prepare(
      'UPDATE designs SET title = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(title, dataString, now, id).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Design not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      design: { id, title, updated_at: now }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Design update error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update design'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 設計削除 (DELETE /api/designs/:id)
export async function onRequestDelete(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  
  try {
    const result = await context.env.DB.prepare(
      'DELETE FROM designs WHERE id = ?'
    ).bind(id).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Design not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Design delete error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete design'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}