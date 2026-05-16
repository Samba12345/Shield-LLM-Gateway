export async function callShieldProxy(prompt: string) {
  const response = await fetch("/api/proxy/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || err.error || "Failed to call proxy");
  }

  return await response.json();
}

export async function getAnalyticsLogs() {
  const response = await fetch("/api/analytics/logs");
  return await response.json();
}

export async function getAnalyticsSummary() {
  const response = await fetch("/api/analytics/summary");
  return await response.json();
}
