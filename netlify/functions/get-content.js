// Loads the current settings.json and home.json content from GitHub.
// Requires the correct ADMIN_PASSWORD to be sent in the request.

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: "Wrong password" }) };
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";

    async function getFile(path) {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`,
        { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { json: JSON.parse(content), sha: data.sha };
    }

    const settings = await getFile("content/settings.json");
    const home = await getFile("content/home.json");

    return {
      statusCode: 200,
      body: JSON.stringify({
        settings: settings.json,
        settingsSha: settings.sha,
        home: home.json,
        homeSha: home.sha,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
