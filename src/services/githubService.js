/**
 * Service to interact with GitHub API
 */

const BASE_URL = 'https://api.github.com';

export const githubService = {
  /**
   * Fetches the list of files in a repository directory
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} path 
   * @param {string} token 
   */
  async fetchFiles(owner, repo, path = '', token) {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Fetches the content of a specific file
   * @param {string} url 
   * @param {string} token 
   */
  async fetchFileContent(url, token) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });


    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Updates a file in the repository
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} path 
   * @param {string} content (Object)
   * @param {string} sha 
   * @param {string} token 
   */
  async updateFile(owner, repo, path, content, sha, token) {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update note: ${path}`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
        sha: sha
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub Update Error: ${error.message}`);
    }

    return await response.json();
  }
};

