// pages/api/extract.js
// Ontvangt een base64-gecodeerde scan (afbeelding of pdf) en laat Claude
// de handgeschreven velden herkennen en als JSON teruggeven.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64Data, mimeType } = req.body || {};

  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: 'base64Data en mimeType zijn verplicht' });
  }

  const isPdf = mimeType === 'application/pdf';

  const contentBlock = isPdf
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: base64Data },
      };

  const prompt = `Dit is een ingescand, handgeschreven formulier van een oud-scoutslid dat meedeed aan een reünie.
Het formulier bevat deze velden (in het Nederlands, sommige met drukletters vooraf gedrukt):
- NAAM (achternaam + voornaam)
- GEBOORTEJAAR
- TOTEMNAAM
- Ik was lid in deze periode (ongeveer) -> een jaartallenrange zoals "1952-1955"
- Het plezantste spel of de strafste activiteit tijdens mijn scoutscarrière
- Dit was voor mij de beste kampplaats ooit
- Het lekkerste kamp-eten was voor mij -> kan één of meerdere gerechten bevatten

Lees het handschrift zo nauwkeurig mogelijk. Als een veld leeg is gelaten, geef dan een lege string (of lege array voor lekkersteEten) terug.
Corrigeer voor de hand liggende spellingsfouten niet, transcribeer wat er letterlijk staat, maar corrigeer wel evidente OCR-achtige leesfouten in eigen namen als de context dat logisch maakt.

Voor "lekkersteEten": dit is vaak één samengesteld gerecht (bv. "stoofvlees met frieten"), soms een opsomming van meerdere losse gerechten (bv. gescheiden door "en", een komma, of nieuwe regel). Geef elk apart gerecht als los element in een array terug — voeg woorden die samen één gerecht vormen NIET los van elkaar toe (bv. "stoofvlees met frieten" is één element, niet drie).

Geef ALLEEN geldige JSON terug, zonder uitleg, zonder markdown-codeblok, in exact dit formaat:
{
  "naam": "",
  "geboortejaar": "",
  "totemnaam": "",
  "periode": "",
  "leuksteActiviteit": "",
  "besteKampplaats": "",
  "lekkersteEten": []
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [contentBlock, { type: 'text', text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Herkenning is mislukt, probeer opnieuw.' });
    }

    const data = await response.json();
    const textBlock = data.content?.find((b) => b.type === 'text');
    const raw = (textBlock?.text || '').trim();
    const cleaned = raw.replace(/^```json\s*|```$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Kon JSON niet parsen:', cleaned);
      return res.status(502).json({ error: 'Herkenning gaf geen leesbaar resultaat terug.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('extract.js error:', err);
    return res.status(500).json({ error: 'Er ging iets mis bij de herkenning.' });
  }
}
