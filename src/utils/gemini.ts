// Gemini OCR assistance utility
// Reads the raw OCR text extracted from PDF.js and sends it to the Google Gemini API
// for correction / cleaning. The API key is stored in the Vite env variable VITE_GEMINI_API_KEY.

/**
 * Refines OCR‑extracted text using Google Gemini.
 * @param rawText The raw text extracted from a PDF.
 * @returns Cleaned / corrected text.
 */
export async function refineExtractedText(rawText: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    if (!apiKey) {
      console.warn('Gemini API key not set; returning raw OCR text.');
      return rawText;
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Please correct and clean up the following OCR‑extracted grade table text. Return only the cleaned plain text (no explanations).\n\n${rawText}`
            }
          ]
        }
      ]
    };
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      console.error('Gemini API request failed:', resp.status, resp.statusText);
      return rawText;
    }
    const data = await resp.json();
    const refined = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return refined ?? rawText;
  } catch (e) {
    console.error('Error refining OCR text with Gemini:', e);
    return rawText;
  }
}
