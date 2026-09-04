// Saves updated settings.json / home.json content back to GitHub.
// Requires the correct ADMIN_PASSWORD. Netlify auto-redeploys the site once this commits.

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: "Wrong password" }) };
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const { file, content, sha } = body;

    if (!file || !content || !sha) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing file, content, or sha" }) };
    }

    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update ${file} via admin panel`,
        content: encoded,
        sha: sha,
        branch: branch,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub save failed: ${res.status} ${errText}`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
