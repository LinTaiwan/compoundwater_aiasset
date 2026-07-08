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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 3000 }
        })
      }
    );

    const data = await response.json();
    
    // 印出完整回傳內容
    console.log('Full Gemini response:', JSON.stringify(data));

    // 檢查錯誤
    if (data.error) {
      return res.status(500).json({ result: `Gemini錯誤：${data.error.message}` });
    }

    // 安全取值
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return res.status(500).json({ 
        result: `回傳格式異常：${JSON.stringify(data).substring(0, 200)}` 
      });
    }

    res.status(200).json({ result });
  } catch (err) {
    console.error('Catch error:', err.message);
    res.status(500).json({ result: `錯誤：${err.message}` });
  }
}
