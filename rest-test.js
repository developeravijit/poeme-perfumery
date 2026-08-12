require("dotenv").config();

async function test() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hello",
              },
            ],
          },
        ],
      }),
    }
  );

  console.log("Status:", response.status);

  const data = await response.json();

  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
