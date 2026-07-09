export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { prompt } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ result: '錯誤：API Key 未設定' });
    }

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
        response_mime_type: 'application/json',
        response_schema: {
          type: 'OBJECT',
          properties: {
            type: { type: 'STRING' },
            nickname: { type: 'STRING' },
            type_reason: { type: 'STRING' },
            risk_score: { type: 'NUMBER' },
            core_advice: { type: 'STRING' },
            allocation: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  label: { type: 'STRING' },
                  percent: { type: 'NUMBER' },
                  color: { type: 'STRING' },
                  advice: { type: 'STRING' }
                },
                required: ['label', 'percent', 'color', 'advice']
              }
            },
            key_message: { type: 'STRING' }
          },
          required: ['type', 'nickname', 'type_reason', 'risk_score', 'core_advice', 'allocation', 'key_message']
        }
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    console.log('Gemini response status:', response.status);

    if (data.error) {
      return res.status(500).json({ result: `Gemini錯誤：${data.error.message}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Empty response:', JSON.stringify(data));
      return res.status(500).json({ result: '回傳結果為空，請稍後再試' });
    }

    // JSON Mode 保證回傳是合法 JSON，直接解析
    const parsed = JSON.parse(text);
    res.status(200).json({ result: parsed });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ result: `錯誤：${err.message}` });
  }
}
