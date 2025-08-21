export async function calculateTokens(model: string, text: string) {
  const res = await fetch("http://127.0.0.1:8000/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, text }),
  });

  if (!res.ok) {
    throw new Error("Failed to calculate tokens");
  }

  return res.json();
}
