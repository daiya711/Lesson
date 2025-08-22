import { Hono } from 'hono'
import { cors } from 'hono/cors'

// D1 Database型定義
interface Env {
  DB: D1Database
}

// Honoアプリケーション作成（ミドルウェアとして）
const app = new Hono<{ Bindings: Env }>()

// CORS設定（統一）
app.use('*', cors({
  origin: ['https://lesson2-apo.pages.dev', 'http://localhost:8788', 'http://localhost:8001'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// ログミドルウェア
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`)
  await next()
})

// API ルーティング - 設計データCRUD
app.get('/api/designs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, title, created_at, updated_at FROM designs ORDER BY updated_at DESC'
    ).all()
    
    return c.json({ 
      success: true, 
      designs: results 
    })
  } catch (error) {
    console.error('Designs fetch error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch designs' 
    }, 500)
  }
})

app.post('/api/designs', async (c) => {
  try {
    const { title, data } = await c.req.json()
    
    // バリデーション強化
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return c.json({ 
        success: false, 
        error: 'Valid title is required' 
      }, 400)
    }
    
    if (!data || typeof data !== 'object') {
      return c.json({ 
        success: false, 
        error: 'Valid data object is required' 
      }, 400)
    }
    
    const id = crypto.randomUUID()
    const dataString = JSON.stringify(data)
    const now = new Date().toISOString()
    
    await c.env.DB.prepare(
      'INSERT INTO designs (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, title.trim(), dataString, now, now).run()
    
    console.log(`Design saved via Hono: ${id} - ${title}`)
    
    return c.json({ 
      success: true, 
      design: { 
        id, 
        title: title.trim(), 
        created_at: now, 
        updated_at: now 
      }
    })
  } catch (error) {
    console.error('Design save error via Hono:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to save design' 
    }, 500)
  }
})

app.get('/api/designs/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM designs WHERE id = ?'
    ).bind(id).first()
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Design not found' 
      }, 404)
    }
    
    return c.json({ 
      success: true, 
      design: {
        ...result,
        data: JSON.parse(result.data as string)
      }
    })
  } catch (error) {
    console.error('Design fetch error via Hono:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch design' 
    }, 500)
  }
})

app.put('/api/designs/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const { title, data } = await c.req.json()
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return c.json({ 
        success: false, 
        error: 'Valid title is required' 
      }, 400)
    }
    
    if (!data || typeof data !== 'object') {
      return c.json({ 
        success: false, 
        error: 'Valid data object is required' 
      }, 400)
    }
    
    const dataString = JSON.stringify(data)
    const now = new Date().toISOString()
    
    const result = await c.env.DB.prepare(
      'UPDATE designs SET title = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(title.trim(), dataString, now, id).run()
    
    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Design not found' 
      }, 404)
    }
    
    console.log(`Design updated via Hono: ${id} - ${title}`)
    
    return c.json({ 
      success: true, 
      design: { 
        id, 
        title: title.trim(), 
        updated_at: now 
      }
    })
  } catch (error) {
    console.error('Design update error via Hono:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to update design' 
    }, 500)
  }
})

app.delete('/api/designs/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const result = await c.env.DB.prepare(
      'DELETE FROM designs WHERE id = ?'
    ).bind(id).run()
    
    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Design not found' 
      }, 404)
    }
    
    console.log(`Design deleted via Hono: ${id}`)
    
    return c.json({ 
      success: true 
    })
  } catch (error) {
    console.error('Design delete error via Hono:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to delete design' 
    }, 500)
  }
})

app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'shelf-designer-api-hono',
    framework: 'Hono + Cloudflare Pages Functions'
  })
})

// ルートパス（静的ファイル）処理
app.get('/', async (c) => {
  // index.htmlの内容を返す
  try {
    // Cloudflare Pages環境でのアセット取得
    const response = await c.env.ASSETS?.fetch(c.req.url)
    if (response && response.ok) {
      return response
    }
  } catch (error) {
    console.log('ASSETS fetch failed, serving fallback')
  }
  
  // フォールバック: 直接index.htmlコンテンツを返す
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>収納棚設計・デザインプラットフォーム</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    <div id="app">Loading...</div>
    <script>
        // リダイレクト処理
        window.location.href = '/index.html';
    </script>
</body>
</html>`

  return c.html(html)
})

// 静的ファイルの代理処理
app.get('/*', async (c) => {
  const pathname = new URL(c.req.url).pathname
  
  // API パスの場合は処理をスキップ
  if (pathname.startsWith('/api/')) {
    // 404を返してHonoの他のルートに任せる
    return c.notFound()
  }
  
  // 静的ファイルの取得を試行
  try {
    const response = await c.env.ASSETS?.fetch(c.req.url)
    if (response && response.ok) {
      return response
    }
  } catch (error) {
    console.log(`Static file fetch failed for ${pathname}:`, error)
  }
  
  // 静的ファイルが見つからない場合は404
  return c.notFound()
})

// エラーハンドラー
app.onError((err, c) => {
  console.error('Unhandled Hono error:', err)
  return c.json({ 
    success: false, 
    error: 'Internal server error' 
  }, 500)
})

// 404ハンドラー（改善）
app.notFound((c) => {
  const pathname = new URL(c.req.url).pathname
  
  // API パスの場合はJSON応答
  if (pathname.startsWith('/api/')) {
    return c.json({ 
      success: false, 
      error: 'API endpoint not found' 
    }, 404)
  }
  
  // 静的ファイルの場合はHTMLページを返す
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - ページが見つかりません</title>
</head>
<body>
    <h1>404 - ページが見つかりません</h1>
    <p>お探しのページは見つかりませんでした。</p>
    <a href="/">トップページに戻る</a>
</body>
</html>`
  
  return c.html(html, 404)
})

// Pages Functions ミドルウェアとしてエクスポート
export async function onRequest(context: any): Promise<Response> {
  return app.fetch(context.request, context.env)
}