import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('*', cors({
  origin: ['https://lesson2.pages.dev', 'http://localhost:8788'],
  credentials: true,
}))

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 設計データ一覧取得
app.get('/api/designs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, title, created_at, updated_at FROM designs ORDER BY updated_at DESC'
    ).all()
    
    return c.json({ success: true, designs: results })
  } catch (error) {
    console.error('Designs fetch error:', error)
    return c.json({ success: false, error: 'Failed to fetch designs' }, 500)
  }
})

// 設計データ詳細取得
app.get('/api/designs/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM designs WHERE id = ?'
    ).bind(id).first()
    
    if (!result) {
      return c.json({ success: false, error: 'Design not found' }, 404)
    }
    
    return c.json({ 
      success: true, 
      design: {
        ...result,
        data: JSON.parse(result.data as string)
      }
    })
  } catch (error) {
    console.error('Design fetch error:', error)
    return c.json({ success: false, error: 'Failed to fetch design' }, 500)
  }
})

// 設計データ保存
app.post('/api/designs', async (c) => {
  try {
    const { title, data } = await c.req.json()
    
    if (!title || !data) {
      return c.json({ success: false, error: 'Title and data are required' }, 400)
    }
    
    const id = crypto.randomUUID()
    const dataString = JSON.stringify(data)
    const now = new Date().toISOString()
    
    await c.env.DB.prepare(
      'INSERT INTO designs (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, title, dataString, now, now).run()
    
    return c.json({ 
      success: true, 
      design: { id, title, created_at: now, updated_at: now }
    })
  } catch (error) {
    console.error('Design save error:', error)
    return c.json({ success: false, error: 'Failed to save design' }, 500)
  }
})

// 設計データ更新
app.put('/api/designs/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const { title, data } = await c.req.json()
    
    if (!title || !data) {
      return c.json({ success: false, error: 'Title and data are required' }, 400)
    }
    
    const dataString = JSON.stringify(data)
    const now = new Date().toISOString()
    
    const result = await c.env.DB.prepare(
      'UPDATE designs SET title = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(title, dataString, now, id).run()
    
    if (result.changes === 0) {
      return c.json({ success: false, error: 'Design not found' }, 404)
    }
    
    return c.json({ 
      success: true, 
      design: { id, title, updated_at: now }
    })
  } catch (error) {
    console.error('Design update error:', error)
    return c.json({ success: false, error: 'Failed to update design' }, 500)
  }
})

// 設計データ削除
app.delete('/api/designs/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const result = await c.env.DB.prepare(
      'DELETE FROM designs WHERE id = ?'
    ).bind(id).run()
    
    if (result.changes === 0) {
      return c.json({ success: false, error: 'Design not found' }, 404)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Design delete error:', error)
    return c.json({ success: false, error: 'Failed to delete design' }, 500)
  }
})

export const onRequest = app.fetch