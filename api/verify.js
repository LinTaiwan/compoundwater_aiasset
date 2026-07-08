export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { license_key } = req.body;

  if (!license_key) {
    return res.status(400).json({ valid: false, message: '請輸入驗證碼' });
  }

  const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      product_permalink: process.env.GUMROAD_PRODUCT_ID,
      license_key: license_key,
      increment_uses_count: 'true'
    })
  });

  const data = await response.json();

  if (data.success) {
    if (data.uses > 1) {
      return res.status(400).json({ valid: false, message: '此驗證碼已使用過' });
    }
    res.status(200).json({ valid: true });
  } else {
    res.status(400).json({ valid: false, message: '驗證碼無效，請確認輸入正確' });
  }
}
