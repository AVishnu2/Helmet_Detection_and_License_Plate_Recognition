import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Re-create FormData to ensure proper multipart encoding
    const backendForm = new FormData()
    backendForm.append('file', file, file.name)

    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      body: backendForm,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend. Make sure the backend is running on port 8000.' },
      { status: 502 }
    )
  }
}
