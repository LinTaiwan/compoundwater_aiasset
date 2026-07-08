export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { license_key } = req.body;

  if (!license_key || license_key.trim() === '') {
    return res.status(400).json({ valid: false, message: '請輸入驗證碼' });
  }

  // 管理員bypass（從環境變數讀取，不寫死在程式碼裡）
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && license_key.trim() === adminKey) {
    return res.status(200).json({ valid: true });
  }

  try {
    const params = new URLSearchParams();
    params.append('product_id', process.env.GUMROAD_PRODUCT_ID);
    params.append('license_key', license_key.trim());
    params.append('increment_uses_count', 'true');

    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();
    console.log('Gumroad response:', JSON.stringify(data));

    if (data.success) {
      if (data.purchase && data.purchase.refunded) {
        return res.status(400).json({ valid: false, message: '此訂單已退款' });
      }
      if (data.uses > 1) {
        return res.status(400).json({ valid: false, message: '此驗證碼已使用過' });
      }
      res.status(200).json({ valid: true });
    } else {
      res.status(400).json({ 
        valid: false, 
        message: data.message || '驗證碼無效，請確認輸入正確' 
      });
    }
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ valid: false, message: '驗證服務暫時無法使用，請稍後再試' });
  }
}
