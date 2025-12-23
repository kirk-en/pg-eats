const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreGxzc2N5Zmpqc3hzenZncW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjQ5ODQsImV4cCI6MjA3NDk0MDk4NH0.B0VnT7zEN2SV4xF-Yq4CRzFCDQbcfVzs9kcvhjclS5M";
const SUPABASE_URL =
  "https://pkxlsscyfjjsxszvgqmh.supabase.co/rest/v1/rpc/process_tip";

export const tipSnackCzar = async (
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<void> => {
  if (!toUserId || amount <= 0) {
    // No czar or no coins to send
    return;
  }

  try {
    const response = await fetch(SUPABASE_URL, {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        apikey: SUPABASE_API_KEY,
        "content-profile": "public",
      },
      body: JSON.stringify({
        _from_user_id: fromUserId,
        _to_user_id: toUserId,
        _amount: amount,
      }),
    });

    if (!response.ok) {
      console.error(
        "Failed to send tip to czar:",
        response.status,
        await response.text()
      );
    } else {
      console.log(`Tipped ${amount} coins to czar (${toUserId})`);
    }
  } catch (error) {
    console.error("Error sending tip to czar:", error);
    // Don't throw - we don't want a failed tip to break the voting experience
  }
};
