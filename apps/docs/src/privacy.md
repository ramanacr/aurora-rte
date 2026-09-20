# Privacy Statement

**Last updated: September 2026**

This Privacy Statement explains how Aurora Editor ("Aurora", "we", "our") handles information in relation to the Aurora Editor open-source project, its documentation site, and the interactive playground at [ramanacr.github.io/aurora-rte](https://ramanacr.github.io/aurora-rte).

---

## 1. Who This Statement Applies To

This statement applies to:

- **Visitors** to the Aurora Editor documentation site and playground.
- **Developers** who download, install, or evaluate the Aurora Editor npm packages.
- **Organizations** that embed Aurora Editor in their own products.

---

## 2. What Aurora Editor Itself Does NOT Collect

Aurora Editor is a **client-side only library**. The editor core (`@aurora/editor`) and all framework adapters operate entirely inside the user's browser and:

- ❌ Do **not** transmit document content, keystrokes, or selection state to any Aurora-controlled server.
- ❌ Do **not** call any Aurora-operated analytics, telemetry, or tracking endpoints.
- ❌ Do **not** store user content in browser `localStorage`, `sessionStorage`, or `IndexedDB` unless the **host application** explicitly configures a persistence adapter.
- ❌ Do **not** use cookies, fingerprinting, or device identifiers.
- ❌ Do **not** load third-party tracking scripts.

> **Important for host application developers:** You are responsible for your own application's privacy practices when embedding Aurora Editor. Aurora's upload adapters (`HostUploadAdapter`), collaboration backends, and mention adapters are host-supplied — Aurora passes data to them only when your code configures them. Your application's privacy policy must disclose how you handle editor content.

---

## 3. Playground & Documentation Site

The interactive playground ([ramanacr.github.io/aurora-rte](https://ramanacr.github.io/aurora-rte)) is hosted on **GitHub Pages**.

### 3.1 GitHub Pages

The playground is served by GitHub Pages (operated by GitHub, Inc. / Microsoft). GitHub Pages may collect standard web server logs including:

- IP addresses
- Browser user-agent strings
- Referring pages
- Timestamps of page requests

This data is processed under [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement). Aurora does not control or have access to these logs.

### 3.2 Content You Type in the Playground

Text you type into the playground editor exists **only in your browser's memory** during your session. It is not sent to any server. If you close or refresh the tab, the content is lost.

### 3.3 BroadcastChannel / Multi-Tab Testing

The playground uses the browser's built-in `BroadcastChannel` API for local multi-tab collaboration testing. This API communicates **only between tabs in the same browser on the same device** — no data leaves your machine.

### 3.4 WebSocket (Optional Real-Time Collaboration Demo)

If a WebSocket server is running locally (e.g., via `docker-compose`), the playground may connect to it for real-time sync testing. This connection is **local to your machine** and does not transmit data to external servers.

---

## 4. Third-Party Images in the Playground

The playground loads demo images from **Unsplash** (unsplash.com). When these images load, your browser makes a network request to Unsplash's CDN, which may log your IP address per [Unsplash's Privacy Policy](https://unsplash.com/privacy). These images are for demonstration only and are not required for editor functionality.

---

## 5. npm Package Downloads

When you install Aurora Editor packages from GitHub Packages (`npm install @aurora/editor`), the download is processed by **GitHub Packages**. GitHub may log the download event per their standard infrastructure logging. Aurora does not receive personally identifiable information from package downloads.

---

## 6. Open-Source Contribution & GitHub

If you contribute to Aurora Editor on GitHub (issues, pull requests, discussions), your GitHub username and contribution history become part of the public repository. This data is governed by [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

---

## 7. Cookies

The Aurora documentation site and playground do **not** set any cookies of their own.

GitHub Pages infrastructure may set cookies as part of its own operations — see [GitHub's Cookie Statement](https://docs.github.com/en/site-policy/privacy-policies/github-cookies).

---

## 8. Children's Privacy

Aurora Editor is a developer tool intended for adults and is not directed at children under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal data from children.

---

## 9. Security of the Library

Aurora Editor implements the following security controls to protect content processed within the editor. These are not data privacy measures per se, but are relevant to understanding what the library does with user-authored HTML:

- **Strict allow-list HTML parser** — strips `<script>`, `<style>`, `on*` event handlers, and unknown elements before they enter the document model.
- **URL scheme allowlisting** — only `http:`, `https:`, `mailto:`, and `tel:` are permitted.
- **No implicit network access** — the core editor never initiates outbound requests.

For full details, see the [Security & Sanitization Guide](./security.md).

---

## 10. Changes to This Statement

We may update this Privacy Statement to reflect changes in the project, hosting infrastructure, or applicable law. When we make material changes, we will update the "Last updated" date at the top of this page. The history of this file is tracked in the [Aurora GitHub repository](https://github.com/ramanacr/aurora-rte).

---

## 11. Contact

Aurora Editor is an open-source project maintained by **Ramana Reddy Chamakura**.

For privacy-related questions, please open an issue on the [GitHub repository](https://github.com/ramanacr/aurora-rte/issues) and label it `privacy`.

---

*Aurora Editor is provided "as is" under the [MIT License](../../../LICENSE). This privacy statement describes the project's own data practices and does not constitute legal advice.*
