import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true  // required for direct browser calls
})

// Convert image file to base64
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Main scan function
export async function scanScorecard(imageFile) {
  try {
    const base64DataUrl = await imageToBase64(imageFile)

    const SYSTEM_PROMPT = `You are a golf scorecard reader.
  Extract hole-by-hole scores from the scorecard image.
  Return ONLY a valid JSON object, nothing else, no markdown, no explanation.
  
  Return this exact structure:
  {
    "success": true,
    "holes": [
      {
        "hole": 1,
        "par": 4,
        "stroke_index": 7,
        "shots": 5
      }
      // ... all 18 holes
    ],
    "total_shots": 92,
    "notes": "any observations about card quality or readability"
  }
  
  If you cannot read the card clearly, return:
  {
    "success": false,
    "reason": "explain why (too blurry, bad lighting, etc)"
  }
  
  Rules:
  - shots = 0 means the player did not complete that hole
  - Only extract scores for ONE player (the most prominent column)
  - par values are typically 3, 4, or 5
  - stroke_index values are 1 through 18
  - If par or stroke_index are not visible, use standard defaults
  `

    // Call GPT-4 Vision:
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',          // gpt-4o has best vision capability
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: base64DataUrl,
                detail: 'high'    // high detail for small scorecard text
              }
            },
            {
              type: 'text',
              text: SYSTEM_PROMPT
            }
          ]
        }
      ]
    })

    let text = response.choices[0].message.content || ''
    
    // Strip markdown formatting if present (e.g. ```json ... ```)
    if (text.startsWith('```')) {
      const startIdx = text.indexOf('\n')
      const endIdx = text.lastIndexOf('```')
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        text = text.substring(startIdx + 1, endIdx).trim()
      } else {
        text = text.replace(/```json|```/g, '').trim()
      }
    } else {
      text = text.trim()
    }

    const parsed = JSON.parse(text)
    return parsed
  } catch (error) {
    console.error('Scan error:', error)
    return { success: false, reason: error.message || 'An unexpected error occurred during scanning.' }
  }
}
