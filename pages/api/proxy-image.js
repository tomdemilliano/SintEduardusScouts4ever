// pages/api/proxy-image.js
// Haalt een afbeelding server-side op en geeft ze terug met een CORS-vriendelijke
// header. Nodig omdat de browser de ruwe pixels van een Firebase Storage-URL
// niet zomaar in een canvas mag inlezen (nodig om een foto te draaien) zonder
// dat de bucket daar apart voor geconfigureerd is. Door de afbeelding via onze
// eigen server-route te laten lopen, wordt ze voor de browser "same-origin".

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Ontbrekende url-parameter' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Ongeldige url' });
  }

  // Enkel Firebase Storage-URL's toelaten, zodat deze route niet als open
  // proxy voor eender welke website misbruikt kan worden.
  if (parsed.hostname !== 'firebasestorage.googleapis.com') {
    return res.status(400).json({ error: "Enkel Firebase Storage-URL's zijn toegestaan" });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Ophalen van de afbeelding is mislukt' });
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Er ging iets mis bij het ophalen van de afbeelding' });
  }
}
